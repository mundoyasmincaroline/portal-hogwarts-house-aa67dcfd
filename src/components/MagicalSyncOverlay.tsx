import React from "react";
import { Sparkles, Zap, RefreshCw } from "lucide-react";

interface MagicalSyncOverlayProps {
  message?: string;
  submessage?: string;
}

const MagicalSyncOverlay: React.FC<MagicalSyncOverlayProps> = ({ 
  message = "Sincronizando Realidade...", 
  submessage = "Zion está atualizando os decretos mágicos para sua melhor experiência."
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Cinematic Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
      </div>

      <div className="relative z-10 space-y-8 animate-in fade-in duration-1000">
        <div className="relative">
          <div className="w-24 h-24 bg-primary/10 rounded-full border border-primary/30 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(212,175,55,0.2)] animate-float">
            <RefreshCw size={48} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div className="absolute -top-2 -right-2">
             <Sparkles className="text-primary animate-pulse" size={24} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl md:text-5xl font-heading text-gold-gradient tracking-tighter drop-shadow-2xl">
            {message}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          <p className="text-muted-foreground font-serif italic text-sm md:text-base max-w-sm mx-auto leading-relaxed">
            "{submessage}"
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <p className="text-[10px] text-primary/40 uppercase tracking-[0.4em] font-bold">
            Protocolo Revolution Sync v7.2
          </p>
        </div>
      </div>

      {/* Decorative Matrix Lines */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/10 to-transparent opacity-20" />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MagicalSyncOverlay;
