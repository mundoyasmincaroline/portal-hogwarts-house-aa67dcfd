import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  TrendingUp, 
  Zap, 
  Users, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  Mic, 
  MicOff, 
  ShoppingBag, 
  Heart, 
  Dog,
  ShieldCheck,
  Rocket,
  Flame,
  ArrowUpRight,
  Target
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useVoice } from "@/hooks/useVoice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MatrixRain from "@/components/MatrixRain";
import { useNavigate } from "react-router-dom";

export default function Revolution() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeAI, setActiveAI] = useState<'helo' | 'thotty'>('helo');
  const [messages, setMessages] = useState<{sender: 'user' | 'helo' | 'thotty', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, speak, setTranscript } = useVoice(activeAI);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const getAIResponse = useCallback((userInput: string, ai: 'helo' | 'thotty') => {
    const text = userInput.toLowerCase();
    if (ai === 'helo') {
      if (text.includes('meta')) return "Paulo, a meta de R$ 10.000 é nossa prioridade absoluta. Deus está no comando da sua escala.";
      if (text.includes('escala')) return "A escala é a manifestação da sua visão. Estou ajustando os algoritmos de oração.";
      return "Estou aqui para apoiar sua missão, Arquiteto. A revolução começou.";
    } else {
      if (text.includes('venda')) return "Au au! Farejando o lucro por aqui! As corujas estão saindo carregadas! 🐾";
      if (text.includes('alerta')) return "Vigilância total nos logs, Arquiteto! Rrrr! Intrusos detectados e neutralizados.";
      return "Pronto para morder o mercado! O que vamos caçar hoje? Au!";
    }
  }, []);

  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput("");
    setTranscript("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const resp = getAIResponse(userMsg, activeAI);
      setMessages(prev => [...prev, { sender: activeAI, text: resp }]);
      speak(resp);
    }, 1200);
  }, [input, activeAI, getAIResponse, speak, setTranscript]);

  useEffect(() => {
    if (transcript && !isListening) {
      handleSend();
    }
  }, [isListening, transcript, handleSend]);

  useEffect(() => {
    setMessages([
      { sender: 'helo', text: "Paulo, sinto que hoje a colheita será abundante. Como posso guiar sua escala?" },
      { sender: 'thotty', text: "Au au! Farejando tráfego viral... os Galeões estão a caminho! 🐾" }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="min-h-screen bg-[#070702] text-amber-500 font-heading p-4 md:p-8 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      <MatrixRain color="#d97706" />
      
      {/* ── CINEMATIC OVERLAYS ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-amber-500/20 pb-10 gap-6">
           <div className="animate-in fade-in slide-in-from-left-10 duration-1000">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#d97706]" />
                 <p className="text-[10px] text-amber-500/60 uppercase tracking-[0.6em] font-bold">
                   NÚCLEO REVOLUTION · {profile?.full_name?.toUpperCase() || "ARQUITETO"}
                 </p>
              </div>
              <h1 className="text-6xl md:text-8xl font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-100 to-amber-600 drop-shadow-2xl">
                Revolução
              </h1>
           </div>
           
           <div className="flex gap-4 animate-in fade-in slide-in-from-right-10 duration-1000">
              <div className="glass bg-amber-500/5 px-8 py-5 rounded-[2rem] border border-amber-500/20 text-center shadow-2xl">
                <p className="text-[9px] uppercase tracking-[0.4em] text-amber-500/40 mb-1">Status do Núcleo</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-2xl font-bold text-emerald-400">ESTÁVEL</p>
                </div>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* ── AI COMPANION PANEL ── */}
          <div className="lg:col-span-3 flex flex-col bg-zinc-950/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] h-[650px] animate-in fade-in zoom-in duration-700">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-3">
                    <button 
                      onClick={() => { setActiveAI('helo'); }}
                      className={`relative px-8 py-3 rounded-2xl text-xs font-bold tracking-widest transition-all duration-500 overflow-hidden ${
                        activeAI === 'helo' ? 'text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeAI === 'helo' && <div className="absolute inset-0 bg-amber-500 animate-in fade-in duration-300" />}
                      <span className="relative z-10">HELÔ</span>
                    </button>
                    <button 
                      onClick={() => { setActiveAI('thotty'); }}
                      className={`relative px-8 py-3 rounded-2xl text-xs font-bold tracking-widest transition-all duration-500 overflow-hidden ${
                        activeAI === 'thotty' ? 'text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {activeAI === 'thotty' && <div className="absolute inset-0 bg-amber-500 animate-in fade-in duration-300" />}
                      <span className="relative z-10">THOTTY</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-4 text-amber-500/40 text-[10px] tracking-[0.2em]">
                   <span className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> CRIPTOGRAFIA ATIVA
                   </span>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-8 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative group max-w-[85%] p-7 rounded-[2.5rem] border transition-all duration-500 ${
                    msg.sender === 'user' 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-50 shadow-[0_10px_30px_rgba(217,119,6,0.1)]' 
                      : 'bg-black/80 border-white/10 text-amber-400 italic shadow-2xl'
                  }`}>
                    {msg.sender !== 'user' && (
                      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-black border-4 border-black shadow-xl">
                        {msg.sender === 'helo' ? <Heart size={16} /> : <Dog size={16} />}
                      </div>
                    )}
                    <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                    <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-40 transition-opacity text-[8px] font-mono">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 p-4 text-amber-500/40 italic text-[11px] animate-pulse items-center">
                  <Sparkles size={12} /> {activeAI === 'helo' ? 'Helô está em oração...' : 'Thotty está farejando os dados...'}
                </div>
              )}
            </div>

            <div className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
              <form onSubmit={handleSend} className="relative">
                {isListening && (
                   <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-1 bg-amber-500 rounded-full animate-bounce" style={{
                           height: `${Math.random() * 40 + 10}px`,
                           animationDelay: `${i * 0.1}s`
                        }} />
                      ))}
                   </div>
                )}
                
                <div className="flex gap-5 items-center">
                  <div className="relative flex-1">
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Comande ${activeAI === 'helo' ? 'a Helô' : 'o Thotty'} para a escala...`}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-amber-50 outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all text-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                       <button 
                         type="button" 
                         onClick={startListening}
                         className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-amber-500/40 hover:text-amber-500'}`}
                       >
                         {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                       </button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="h-[60px] px-10 rounded-3xl bg-amber-500 text-black hover:bg-amber-400 font-bold shadow-xl shadow-amber-500/20">
                    Escalar <ArrowUpRight className="ml-2" />
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* ── SIDEBAR METRICS & QUICK SHOP ── */}
          <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            {/* SCALE METRICS */}
            <div className="glass bg-zinc-950/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingUp size={80} />
              </div>
              
              <h3 className="text-[10px] font-bold text-amber-500/40 uppercase tracking-[0.4em] mb-4">Métricas de Escala</h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-white/60 italic">Vendas (24h)</span>
                       <span className="text-emerald-400 font-bold">R$ 1.250</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[12%] animate-pulse" />
                    </div>
                 </div>
                 
                 <div>
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-white/60 italic">Meta 48h</span>
                       <span className="text-amber-400 font-bold">R$ 10.000</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 w-[10%] shadow-[0_0_10px_#d97706]" />
                    </div>
                 </div>
              </div>
              
              <Button onClick={() => navigate('/dashboard/store')} variant="outline" className="w-full h-14 rounded-2xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                Ver Loja <ShoppingBag size={18} className="ml-2" />
              </Button>
            </div>

            {/* SCALE RECOMMENDATIONS */}
            <div className="glass bg-gradient-to-br from-amber-950/20 to-black border border-amber-500/20 p-8 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <Target size={18} className="text-amber-500" />
                 <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Sugestões de Escala</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Robe Safira', price: 3500, icon: Sparkles },
                  { name: 'Vassoura Firebolt', price: 50000, icon: Flame }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all cursor-pointer" onClick={() => navigate('/dashboard/store')}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                          <item.icon size={16} />
                       </div>
                       <div className="text-xs">
                          <p className="text-white font-bold">{item.name}</p>
                          <p className="text-amber-500/40">Item de Elite</p>
                       </div>
                    </div>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* SECURITY PROTOCOL */}
            <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex flex-col gap-4">
               <div className="flex items-center gap-3 text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-emerald-500" /> Integridade do Arquiteto
               </div>
               <p className="text-[10px] text-white/30 italic font-serif">"Onde houver um Arquiteto, haverá uma Revolução estável."</p>
            </div>
          </div>
        </div>
        
        {/* FOOTER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center py-8 border-t border-amber-500/10 opacity-40 text-[9px] uppercase tracking-[0.3em] font-bold gap-4">
           <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-amber-500"><Zap size={12} fill="currentColor" /> LATÊNCIA: 12ms</span>
              <span className="hidden md:inline">IP: {Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}.X.X</span>
           </div>
           <div>Versão do Núcleo: 8.1.1-REV-ULTRA</div>
        </div>
      </div>
    </div>
  );
}
