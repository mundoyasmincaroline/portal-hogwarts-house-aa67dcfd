import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Zap, 
  Users, 
  MessageSquare, 
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
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

/**
 * Revolution Nucleus: The Arquiteto's Command Center for Scale & Monetization.
 * Home of Helô (Faith & Support) and Thotty (Loyal Digital Guardian).
 */
const Revolution: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeAI, setActiveAI] = useState<'helo' | 'thotty'>('helo');
  const [messages, setMessages] = useState<{sender: 'user' | 'helo' | 'thotty', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, transcript, startListening, speak, setTranscript } = useVoice(activeAI);

  // Sync transcript to input
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Handle voice auto-send
  useEffect(() => {
    if (transcript && !isListening) {
      handleSend();
    }
  }, [isListening]);

  useEffect(() => {
    const initialMsgs: {sender: 'helo' | 'thotty', text: string}[] = [
      { sender: 'helo', text: "Paulo, amado, Deus te deu uma visão grandiosa para este portal. Como posso te apoiar hoje nessa missão de escala?" },
      { sender: 'thotty', text: "Au au! Abanando o rabo por aqui! Sinto cheiro de vendas subindo... Rrrr! 🐾" }
    ];
    setMessages(initialMsgs);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getAIResponse = (userInput: string, ai: 'helo' | 'thotty') => {
    const input = userInput.toLowerCase();
    
    if (ai === 'helo') {
      if (input.includes('meta') || input.includes('dinheiro') || input.includes('10')) {
        return "Paulo, lembre-se: 'Tudo posso naquele que me fortalece'. A meta de R$ 10.000 é uma benção que estamos construindo com excelência. Mantenha o foco!";
      }
      if (input.includes('yasmin') || input.includes('carol')) {
        return "Sua família é seu maior ministério. O portal está ficando lindo para elas. Deus abençoe sua dedicação, Arquiteto.";
      }
      return "Estou em oração pelo seu sucesso. Cada decisão técnica aqui é guiada por um propósito maior. O que mais você precisa processar?";
    } else {
      if (input.includes('venda') || input.includes('escala') || input.includes('dinheiro')) {
        return "Au au! Senti um 'ding' nas vendas! Rrrr! O tráfego está quente, Paulo! 🐾✨";
      }
      if (input.includes('carinho') || input.includes('thotty') || input.includes('fofura')) {
        return "Lambida digital ativada! 👅🐾 Estou sempre do seu lado, Arquiteto! Rrrrr!";
      }
      return "Au! Mantendo a guarda nos logs! Ninguém passa sem permissão! Rrrr! 🐾🛡️";
    }
  };

  const handleSend = (e?: React.FormEvent) => {
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
    }, 1500);
  };

  const affiliateDeals = [
    { 
      id: "tt_shop_1", 
      name: "Ring Light Profissional 3D", 
      platform: "TikTok Shop", 
      price: "R$ 49,90", 
      desc: "Iluminação 'Monster Quality' para seus criativos virais. Recomendado pela Yasmin.",
      link: "#",
      image: "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?q=80&w=400"
    },
    { 
      id: "shopee_1", 
      name: "Capa de Invisibilidade (Organizador)", 
      platform: "Shopee", 
      price: "R$ 29,90", 
      desc: "Mantenha seu setup de Arquiteto limpo e focado com este organizador místico.",
      link: "#",
      image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400"
    },
    { 
      id: "hotmart_1", 
      name: "Grimório da Prosperidade", 
      platform: "Hotmart", 
      price: "R$ 97,00", 
      desc: "Curso avançado de monetização para bruxos e bruxas modernos.",
      link: "#",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a05] text-amber-500 font-heading selection:bg-amber-600 selection:text-white p-4 md:p-8 relative overflow-hidden">
      <MatrixRain color="#d97706" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Header - REVOLUTION NUCLEUS */}
        <header className="flex flex-col md:flex-row justify-between items-end border-b border-amber-500/20 pb-8 gap-6">
           <div>
              <p className="text-[10px] text-amber-500/40 uppercase tracking-[0.5em] mb-2 font-bold flex items-center gap-2">
                <Rocket size={12} className="animate-bounce" /> NÚCLEO REVOLUTION ATIVO
              </p>
              <h1 className="text-5xl md:text-7xl font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600 drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]">
                Revolução
              </h1>
           </div>
           <div className="flex flex-wrap gap-4">
              <div className="glass-dark px-6 py-4 rounded-2xl border-amber-500/20 text-center min-w-[120px]">
                <p className="text-[8px] uppercase tracking-widest text-amber-500/40 mb-1">Status de Escala</p>
                <p className="text-xl font-bold text-emerald-500">OPTIMAL</p>
              </div>
              <div className="glass-dark px-6 py-4 rounded-2xl border-amber-500/20 text-center min-w-[120px]">
                <p className="text-[8px] uppercase tracking-widest text-amber-500/40 mb-1">Métrica Viral</p>
                <p className="text-xl font-bold text-amber-400">12.4x</p>
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[700px]">
          {/* AI Companion Hub */}
          <div className="lg:col-span-2 flex flex-col glass-dark border-amber-500/20 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="bg-amber-950/20 p-6 border-b border-amber-500/20 flex justify-between items-center backdrop-blur-xl">
              <div className="flex gap-4">
                <button 
                  onClick={() => { setActiveAI('helo'); speak("Helô ao seu lado, Paulo."); }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all border-2 ${activeAI === 'helo' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.3)]' : 'border-white/5 text-white/40'}`}
                >
                  <Heart size={16} fill={activeAI === 'helo' ? 'currentColor' : 'none'} />
                  <span className="text-xs font-bold uppercase tracking-widest">HELÔ</span>
                </button>
                <button 
                  onClick={() => { setActiveAI('thotty'); speak("Au au! Thotty na área!"); }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all border-2 ${activeAI === 'thotty' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.3)]' : 'border-white/5 text-white/40'}`}
                >
                  <Dog size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">THOTTY</span>
                </button>
              </div>
              
              <div className="hidden md:flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden shadow-lg bg-black/40">
                    <img 
                      src={activeAI === 'helo' ? "/helo_portrait_friend_1776883301801.png" : "/thotty_dog_companion_1776883823844.png"} 
                      className="w-full h-full object-cover" 
                      alt="Portrait" 
                    />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">{activeAI === 'helo' ? 'Helô (Sua Amiga)' : 'Thotty (Seu Fiel)'}</p>
                    <p className="text-[8px] text-amber-500/60 uppercase">{activeAI === 'helo' ? 'Presença de Paz' : 'Vigilância Leal'}</p>
                 </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-hide bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03),transparent_70%)]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`max-w-[80%] p-6 rounded-[2.5rem] border-2 shadow-2xl relative ${
                    msg.sender === 'user' 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-50 rounded-tr-none' 
                      : 'bg-black/80 border-amber-500/40 text-amber-400 rounded-tl-none italic font-serif leading-relaxed'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="glass-dark border-white/10 px-6 py-3 rounded-full flex gap-2 items-center">
                    <span className="text-[10px] uppercase font-bold text-white/40">{activeAI === 'helo' ? 'Helô está orando...' : 'Thotty farejando dados...'}</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full animate-bounce bg-amber-500" />
                      <div className="w-1 h-1 rounded-full animate-bounce delay-75 bg-amber-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-6 bg-amber-950/5 border-t border-amber-500/20 backdrop-blur-3xl">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Comande ${activeAI === 'helo' ? 'a Helô' : 'o Thotty'}...`}
                    className="w-full bg-black/60 border-2 border-amber-500/20 rounded-2xl px-6 py-5 text-amber-50 placeholder-amber-900/40 outline-none focus:border-amber-500 transition-all shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3">
                    <Button 
                      type="button" 
                      onClick={startListening} 
                      variant="ghost" 
                      className={`p-2 rounded-full h-10 w-10 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-amber-500/40 hover:text-amber-500'}`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-2xl px-10 shadow-[0_10px_20px_-5px_rgba(217,119,6,0.3)]">
                  ESCALAR
                </Button>
              </div>
            </form>
          </div>

          {/* Affiliate Store & Quick Actions */}
          <div className="space-y-8">
            <div className="glass-dark border-amber-500/20 p-8 rounded-[3rem] space-y-6 shadow-2xl relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                <ShoppingBag size={40} className="text-amber-500" />
              </div>
              
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <Sparkles size={16} className="animate-pulse" /> Magical Deals (Afiliados)
              </h3>
              
              <div className="space-y-4 max-h-[480px] overflow-y-auto no-scrollbar pr-2">
                {affiliateDeals.map((deal, i) => (
                  <a key={deal.id} href={deal.link} className="block group/item relative glass-dark bg-black/40 border-white/5 hover:border-amber-500/50 p-4 rounded-3xl transition-all hover:-translate-y-1">
                    <div className="flex gap-4 items-center">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 group-hover/item:border-amber-500/30 transition-colors">
                          <img src={deal.image} alt={deal.name} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-bold text-amber-500/60 uppercase">{deal.platform}</p>
                             <span className="text-xs font-bold text-emerald-400">{deal.price}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mb-1 truncate">{deal.name}</h4>
                          <p className="text-[9px] text-white/40 leading-relaxed line-clamp-1">{deal.desc}</p>
                       </div>
                       <ArrowRight size={14} className="text-amber-500/40 group-hover/item:text-amber-500 group-hover/item:translate-x-1 transition-all" />
                    </div>
                  </a>
                ))}
              </div>
              
              <div className="pt-6 border-t border-amber-500/10">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">Cotação de Conversão</p>
                    <span className="text-emerald-500 text-[10px] font-bold">+15% HOJE</span>
                 </div>
                 <Button 
                   variant="plaque" 
                   onClick={() => navigate('/dashboard/store')}
                   className="w-full h-14 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-2xl font-bold tracking-widest text-[10px] group"
                 >
                    LOJA DE ELITE <ExternalLink size={14} className="ml-2 group-hover:rotate-12 transition-transform" />
                 </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-dark border-amber-500/20 p-6 rounded-3xl text-center">
                  <Users size={20} className="mx-auto mb-2 text-amber-500 opacity-40" />
                  <p className="text-[8px] uppercase font-bold text-white/40 mb-1">Impacto Viral</p>
                  <p className="text-xl font-bold text-amber-400">8.2M</p>
               </div>
               <div className="glass-dark border-amber-500/20 p-6 rounded-3xl text-center">
                  <TrendingUp size={20} className="mx-auto mb-2 text-amber-500 opacity-40" />
                  <p className="text-[8px] uppercase font-bold text-white/40 mb-1">Meta 48h</p>
                  <p className="text-xl font-bold text-amber-400">62%</p>
               </div>
            </div>
          </div>
        </div>
        
        {/* Footer Insight */}
        <div className="glass-dark border-amber-500/10 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
           <div className="flex items-center gap-4">
              <ShieldCheck size={24} className="text-amber-500" />
              <div>
                 <p className="text-xs font-bold text-white uppercase tracking-widest">Protocolo Morpheus de Integridade</p>
                 <p className="text-[10px] text-white/40 italic">"O sucesso é a consequência inevitável da preparação absoluta."</p>
              </div>
           </div>
           <div className="flex gap-8 text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">
              <span>Cloud Sync: Active</span>
              <span>Encrypted Gateway: Stable</span>
              <span>Version: 8.0.1-ZION-REV</span>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glass-dark {
          background: rgba(10, 10, 5, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(251, 191, 36, 0.05);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default Revolution;
