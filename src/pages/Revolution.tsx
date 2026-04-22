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
  Rocket
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
      if (text.includes('meta')) return "Paulo, a meta de R$ 10.000 é nossa prioridade. Deus abençoe sua visão.";
      return "Estou aqui para apoiar sua missão, Arquiteto.";
    } else {
      if (text.includes('venda')) return "Au au! Farejando o lucro por aqui! 🐾";
      return "Vigilância total nos logs, Arquiteto! Rrrr!";
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
    }, 1000);
  }, [input, activeAI, getAIResponse, speak, setTranscript]);

  useEffect(() => {
    if (transcript && !isListening) {
      handleSend();
    }
  }, [isListening, transcript, handleSend]);

  useEffect(() => {
    setMessages([
      { sender: 'helo', text: "Paulo, estou em oração pela sua escala hoje. Como posso apoiar?" },
      { sender: 'thotty', text: "Au au! Farejando o tráfego... tudo sob controle! 🐾" }
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="min-h-screen bg-[#0a0a05] text-amber-500 font-heading p-4 md:p-8 relative overflow-hidden">
      <MatrixRain color="#d97706" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-amber-500/20 pb-8 gap-6">
           <div>
              <p className="text-[10px] text-amber-500/40 uppercase tracking-[0.5em] mb-2 font-bold flex items-center gap-2">
                <Rocket size={12} className="animate-bounce" /> NÚCLEO REVOLUTION ATIVO
              </p>
              <h1 className="text-5xl md:text-7xl font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600">
                Revolução
              </h1>
           </div>
           <div className="flex gap-4">
              <div className="bg-amber-500/10 px-6 py-4 rounded-2xl border border-amber-500/20 text-center">
                <p className="text-[8px] uppercase tracking-widest text-amber-500/40">Status</p>
                <p className="text-xl font-bold text-emerald-500">ESTÁVEL</p>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col bg-zinc-950/80 backdrop-blur-3xl border border-amber-500/20 rounded-[3rem] overflow-hidden shadow-2xl h-[600px]">
            <div className="p-6 border-b border-amber-500/20 flex gap-4">
                <button 
                  onClick={() => setActiveAI('helo')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeAI === 'helo' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40'}`}
                >
                  HELÔ
                </button>
                <button 
                  onClick={() => setActiveAI('thotty')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${activeAI === 'thotty' ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40'}`}
                >
                  THOTTY
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-6 rounded-[2.5rem] border ${
                    msg.sender === 'user' ? 'bg-amber-500/10 border-amber-500/30 text-amber-50' : 'bg-black/60 border-amber-500/20 text-amber-400 italic'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] animate-pulse">Processando comando...</div>}
            </div>

            <form onSubmit={handleSend} className="p-6 border-t border-amber-500/20">
              <div className="flex gap-4">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Comande ${activeAI === 'helo' ? 'a Helô' : 'o Thotty'}...`}
                  className="flex-1 bg-black border border-amber-500/20 rounded-2xl px-6 py-4 text-amber-50 outline-none"
                />
                <Button type="button" onClick={startListening} variant="ghost" className={isListening ? 'bg-red-500 text-white' : ''}>
                  {isListening ? <MicOff /> : <Mic />}
                </Button>
                <Button type="submit">Escalar</Button>
              </div>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-zinc-950/80 backdrop-blur-3xl border border-amber-500/20 p-8 rounded-[3rem] shadow-2xl">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-6">Métricas de Escala</h3>
              <div className="space-y-4">
                 <div className="flex justify-between"><span>Vendas (24h)</span><span className="text-emerald-400">R$ 1.250</span></div>
                 <div className="flex justify-between"><span>Meta 48h</span><span className="text-amber-400">R$ 10.000</span></div>
                 <Button onClick={() => navigate('/dashboard/store')} className="w-full h-14 rounded-2xl">Beco Diagonal</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-500/5 p-6 rounded-[2rem] flex justify-between opacity-60 text-[10px] uppercase font-bold">
           <div className="flex items-center gap-4"><ShieldCheck size={16} /> Protocolo de Integridade Ativo</div>
           <div>Versão: 8.1.0-REV-ULTRA</div>
        </div>
      </div>
    </div>
  );
}
