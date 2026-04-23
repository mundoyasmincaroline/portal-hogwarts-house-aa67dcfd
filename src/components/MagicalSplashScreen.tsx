import { useState, useEffect } from "react";
import { Sparkles, Zap, ShieldCheck, Crown } from "lucide-react";

const TIPS = [
  "O Chapéu Seletor está analisando sua alma...",
  "Galeões estão sendo contados no Gringotes...",
  "As corujas estão entregando as últimas notícias...",
  "Preparando os feitiços de proteção de Zion...",
  "O Arquiteto está ajustando a Matrix...",
  "Bruxos de elite estão se reunindo...",
  "Limpando o cache de poções...",
  "Sincronizando com o Ministério da Magia..."
];

export default function MagicalSplashScreen() {
  const [progress, setProgress] = useState(0);
  const [tip, setTip] = useState(TIPS[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsVisible(false), 500);
          return 100;
        }
        // Incremento aleatório para parecer real
        const inc = Math.random() * 15;
        return Math.min(prev + inc, 100);
      });
    }, 200);

    const tipInterval = setInterval(() => {
      setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-1000 ${progress === 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Cinematic Background Magic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547756536-cde3673fa2e5?q=80&w=2000')] opacity-20 mix-blend-overlay scale-110 animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-16 max-w-lg px-12 text-center">
        
        {/* Animated Crest Artefact */}
        <div className="relative group">
          <div className="absolute -inset-12 bg-primary/25 rounded-full blur-[60px] animate-pulse-slow" />
          <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[3.5rem] border-4 border-primary/30 flex items-center justify-center bg-black/60 backdrop-blur-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-700 group-hover:scale-105">
             <div className="relative animate-float">
                <Sparkles className="text-primary drop-shadow-[0_0_25px_rgba(var(--primary),0.8)]" size={80} />
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
          </div>
          
          <div className="absolute -top-6 -right-6">
             <Sparkles className="text-primary animate-spin-slow drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" size={32} />
          </div>
        </div>

        <div className="space-y-10 w-full">
           <div className="space-y-4">
             <h1 className="font-heading text-5xl md:text-6xl text-gold-gradient tracking-tighter drop-shadow-2xl">HOGWARTS HOUSE</h1>
             <p className="text-sm text-primary uppercase tracking-[0.8em] font-bold opacity-80 animate-pulse">Iniciando Revolução</p>
           </div>

           {/* Magical Progress Bar (Elite Version) */}
           <div className="space-y-4">
             <div className="relative h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-600 via-primary to-yellow-600 transition-all duration-300 shadow-[0_0_25px_rgba(var(--primary),0.6)]"
                 style={{ width: `${progress}%` }}
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
               </div>
             </div>

             <div className="flex justify-between items-center px-2">
               <span className="text-xs text-white/40 font-mono font-bold tracking-widest">{Math.floor(progress)}%</span>
               <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${Math.floor(progress/20) >= i ? 'bg-primary shadow-[0_0_10px_#d4af37]' : 'bg-white/10 scale-75'}`} />
                  ))}
               </div>
             </div>
           </div>

           <p className="text-sm md:text-base text-white/60 font-serif italic animate-pulse min-h-[4rem] flex items-center justify-center leading-relaxed">
             "{tip}"
           </p>
        </div>

        <div className="flex items-center gap-10 opacity-50">
           <div className="flex flex-col items-center gap-2">
              <Zap size={18} className="text-yellow-500 animate-pulse" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Fluxo</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Defesa</span>
           </div>
           <div className="flex flex-col items-center gap-2">
              <Crown size={18} className="text-rose-500" />
              <span className="text-[8px] uppercase tracking-widest font-bold">Poder</span>
           </div>
        </div>
      </div>

      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs text-white/40 font-mono tracking-[0.4em] uppercase font-bold">Protocolo Jarvis Revolution v8.1</span>
        </div>
        <p className="text-[9px] text-white/10 uppercase tracking-widest">Acesso Restrito ao Conselho Administrativo</p>
      </div>
    </div>
  );
}
