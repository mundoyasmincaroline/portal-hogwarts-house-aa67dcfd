import { useState } from "react";
import { getSeasonalEvent } from "@/lib/seasonal";
import { Sparkles, X } from "lucide-react";

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const season = getSeasonalEvent();
  
  if (!season || !isVisible) return null;

  return (
    <div className={`w-full relative overflow-hidden bg-gradient-to-r ${season.bannerColor} backdrop-blur-xl border-b border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-[100] animate-in slide-in-from-top duration-700`}>
      {/* 3D Glass Shimmers */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-white/30"></div>
      
      <div className="relative z-10 flex items-center justify-between gap-4 max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative shrink-0">
             <div className="absolute inset-0 bg-white/40 blur-xl rounded-full animate-pulse" />
             <span className="text-3xl relative z-10 animate-float drop-shadow-2xl">{season.icon}</span>
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2 mb-0.5">
               <Sparkles size={10} className="text-white/60 animate-spin-slow" />
               <h3 className="font-heading text-sm md:text-lg text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                 {season.name.toUpperCase()}
               </h3>
            </div>
            <p className="text-[10px] md:text-xs text-white/80 font-serif italic drop-shadow-sm max-w-2xl line-clamp-1 md:line-clamp-none">
              {season.description}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all shadow-inner border border-white/5"
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Animated Gloss */}
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_5s_infinite] pointer-events-none" />
    </div>
  );
}
