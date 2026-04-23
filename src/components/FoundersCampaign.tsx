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
    <div className="relative overflow-hidden rounded-[3.5rem] border-4 border-yellow-500/20 bg-gradient-to-br from-amber-950 via-zinc-950 to-black mb-10 shadow-[0_30px_80px_-15px_rgba(234,179,8,0.2)] animate-in fade-in zoom-in duration-1000 group/founders">
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-amber-600/5 blur-[100px] -z-10" />
      
      {/* Animated Shine Sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/founders:translate-x-full transition-transform duration-1000 pointer-events-none" />

      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-8 right-8 z-30 p-3 rounded-full bg-black/60 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all backdrop-blur-xl border border-white/5 shadow-2xl active:scale-90"
      >
        <X size={20} />
      </button>

      <div className="p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        
        {/* Left Side: The Sacred Relic */}
        <div className="relative shrink-0 perspective-1000">
          <div className="absolute inset-0 bg-yellow-400/10 blur-[80px] rounded-full animate-pulse-slow group-hover/founders:bg-yellow-400/20 transition-all" />
          <div className="relative z-10 w-56 h-56 md:w-64 md:h-64 rounded-[3.5rem] bg-gradient-to-b from-yellow-500/10 via-black/40 to-transparent flex items-center justify-center border-2 border-yellow-500/40 shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-1000 group-hover/founders:rotate-y-12 group-hover/founders:scale-105">
             <Crown size={120} className="text-yellow-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.9)] animate-float" />
             
             <div className="absolute -bottom-6 inset-x-0 w-fit mx-auto bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 text-black text-[11px] font-bold border-2 border-white/30 px-8 py-3 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] uppercase tracking-[0.3em] font-heading">
                Status Imperial
             </div>
          </div>
        </div>

        {/* Right Side: Content & Call to Action */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-5 py-2">
              <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.4em]">Protocolo de Legado Ativado</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-heading text-gold-gradient drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] leading-[0.9] tracking-tighter">
              Torne-se um <span className="text-white">Fundador</span>
            </h2>
            <p className="text-yellow-100/60 text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed">
              {username ? `${username.split(" ")[0]}, ` : ""}seu nome merece ser entalhado nas paredes deste castelo. O Conselho de Fundadores aguarda sua ascensão.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: <Crown size={16} />, text: "Aura Permanente", sub: "Status 👑 Eterno" },
              { icon: <MagicalGaleon size="sm" />, text: "Tesouro Mensal", sub: "+500 Galeões" },
              { icon: <ShieldCheck size={16} />, text: "Voz no Conselho", sub: "Poder de Voto" },
            ].map((item, i) => (
              <div key={i} className="glass bg-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center lg:items-start gap-3 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-500 group/item">
                <div className="text-yellow-500 group-hover/item:scale-110 transition-transform">{item.icon}</div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{item.text}</p>
                  <p className="text-[10px] text-yellow-500/40 uppercase tracking-widest font-bold mt-1 group-hover/item:text-yellow-500/60 transition-colors">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-10 pt-6">
            <div className="w-full sm:w-auto relative group/btn">
              <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <Button 
                onClick={handleBecomeFounder}
                variant="plaque" 
                className="relative w-full sm:w-auto h-20 px-14 text-xl rounded-2xl bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 border-none shadow-[0_20px_50px_rgba(234,179,8,0.5)] active:scale-95 transition-all"
              >
                REIVINDICAR MEU LEGADO <Zap size={22} className="ml-3 animate-pulse" />
              </Button>
            </div>
            
            <div className="flex flex-col items-center lg:items-start opacity-70">
               <div className="flex -space-x-3 mb-2">
                 {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-gradient-to-b from-zinc-800 to-black flex items-center justify-center text-[10px] font-bold text-yellow-500 shadow-xl ring-2 ring-yellow-500/20">👑</div>
                 ))}
                 <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400 shadow-xl ring-2 ring-yellow-500/20">+42</div>
               </div>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Linhagens já fundadas no castelo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
