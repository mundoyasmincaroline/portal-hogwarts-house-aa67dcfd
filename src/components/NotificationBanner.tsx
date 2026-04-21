import { useState } from "react";
import { getSeasonalEvent } from "@/lib/seasonal";
import { Sparkles, X } from "lucide-react";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const season = getSeasonalEvent();
  
  if (!season || !isVisible) return null;

  return (
    <div className={`w-full relative overflow-hidden bg-gradient-to-r ${season.bannerColor} backdrop-blur-3xl border-b border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[100] animate-in slide-in-from-top duration-1000`}>
      {/* Monster 3D Glass Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
      
      {/* Light Beams */}
      <div className="absolute top-0 left-1/4 w-64 h-full bg-white/5 blur-[80px] -skew-x-12 animate-pulse" />
      <div className="absolute top-0 right-1/4 w-32 h-full bg-white/5 blur-[60px] skew-x-12 animate-pulse delay-700" />
      
      <div className="relative z-10 flex items-center justify-between gap-6 max-w-7xl mx-auto px-6 py-5 md:py-6">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative shrink-0 group">
             <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-white/10 border border-white/20 backdrop-blur-3xl flex items-center justify-center shadow-2xl relative z-10 group-hover:scale-110 transition-transform duration-500">
                <span className="text-3xl md:text-4xl animate-float drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{season.icon}</span>
             </div>
          </div>
          
          <div className="text-left space-y-1">
            <div className="flex items-center gap-3">
               <Sparkles size={12} className="text-white/40 animate-spin-slow" />
               <h3 className="font-heading text-lg md:text-2xl text-white tracking-tighter drop-shadow-2xl leading-none">
                 {season.name.toUpperCase()}
               </h3>
            </div>
            <p className="text-[10px] md:text-sm text-white/60 font-serif italic max-w-3xl line-clamp-1 md:line-clamp-none tracking-wide">
              "{season.description}"
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-white/10 rounded-2xl text-white/20 hover:text-white transition-all border border-white/5 flex items-center justify-center shadow-inner group"
          title="Fechar"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* Animated Gloss Streak */}
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_4s_infinite] pointer-events-none" />
    </div>
  );
}
