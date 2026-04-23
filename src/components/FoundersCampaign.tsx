import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Sparkles, Zap, X, ChevronRight, Check, Star, ShieldCheck } from "lucide-react";
import MagicalIcon from "./MagicalIcon";
import MagicalEmoji from "./MagicalEmoji";
import MagicalGaleon from "./MagicalGaleon";
import { Button } from "./ui/button";

interface Props {
  currentVip?: string | null;
  username?: string;
}

export default function FoundersCampaign({ currentVip, username }: Props) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("founders_campaign_dismissed") === "true"
  );

  // Não mostrar para quem já é Fundador ou se foi dispensado
  if (currentVip === "founder" || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("founders_campaign_dismissed", "true");
    setDismissed(true);
  };

  const handleBecomeFounder = () => {
    navigate("/dashboard/store?tab=vip");
  };

  return (
    <div className="relative overflow-hidden rounded-[3rem] border-2 border-yellow-500/30 bg-gradient-to-br from-amber-950 via-black to-yellow-950/40 mb-8 shadow-[0_20px_60px_-15px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in duration-1000">
      
      {/* Cinematic Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618501275376-7eb3e284f3cc?q=80&w=2000')] opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 blur-[120px] -z-10 animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-600/10 blur-[100px] -z-10" />
      
      {/* Animated Shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer pointer-events-none" />

      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-black/40 hover:bg-white/10 text-white/40 hover:text-white transition-all backdrop-blur-md border border-white/5"
      >
        <X size={18} />
      </button>

      <div className="p-8 md:p-12 flex flex-col lg:flex-row items-center gap-10">
        
        {/* Left Side: Visual & Badge */}
        <div className="relative shrink-0 group">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full animate-pulse group-hover:bg-yellow-400/30 transition-all" />
          <div className="relative z-10 w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-gradient-to-b from-yellow-500/20 to-transparent flex items-center justify-center border-2 border-yellow-500/30 shadow-2xl backdrop-blur-sm transition-transform duration-700 group-hover:scale-105 group-hover:rotate-3">
             <Crown size={100} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] animate-float" />
             
             <div className="absolute -bottom-4 inset-x-0 w-fit mx-auto bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[10px] font-bold border-2 border-white/20 px-6 py-2 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] uppercase tracking-[0.2em]">
                Status Lendário
             </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1">
              <Sparkles size={12} className="text-yellow-500 animate-spin-slow" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Oportunidade Única de Lançamento</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading text-gold-gradient drop-shadow-lg leading-tight">
              Torne-se um <span className="text-white">Fundador</span> de Hogwarts
            </h2>
            <p className="text-yellow-100/60 text-lg font-serif italic max-w-2xl leading-relaxed">
              {username ? `${username.split(" ")[0]}, ` : ""}você foi selecionado para integrar o Conselho de Fundadores. Deixe seu nome marcado na história do portal para sempre.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: <Crown size={14} />, text: "Título Permanente", sub: "Status 👑 Eterno" },
              { icon: <MagicalGaleon size="xs" />, text: "Mesada Real", sub: "+500 Galeões/mês" },
              { icon: <ShieldCheck size={14} />, text: "Conselho Secreto", sub: "Decisões do Portal" },
            ].map((item, i) => (
              <div key={i} className="glass bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center lg:items-start gap-2 hover:bg-white/10 transition-colors">
                <div className="text-yellow-400">{item.icon}</div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{item.text}</p>
                  <p className="text-[9px] text-yellow-500/50 uppercase tracking-wider font-bold mt-1">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
            <Button 
              onClick={handleBecomeFounder}
              variant="plaque" 
              className="w-full sm:w-auto h-16 px-12 text-lg rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 border-none shadow-[0_15px_40px_rgba(234,179,8,0.4)] group"
            >
              ATIVAR MEU STATUS DE FUNDADOR <Zap size={20} className="ml-2 animate-pulse" />
            </Button>
            
            <div className="flex flex-col items-center lg:items-start">
               <div className="flex -space-x-2 mb-1">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full border border-black bg-slate-800 flex items-center justify-center text-[8px] font-bold text-yellow-500 shadow-lg">👑</div>
                 ))}
                 <div className="w-6 h-6 rounded-full border border-black bg-yellow-500/20 flex items-center justify-center text-[8px] font-bold text-yellow-400 shadow-lg">+42</div>
               </div>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Bruxos já se tornaram fundadores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
