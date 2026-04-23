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
    <div className={`fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-1000 ${progress === 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Magic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12 max-w-sm px-8 text-center">
        
        {/* Animated Crest Placeholder */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[3rem] border-2 border-primary/30 flex items-center justify-center bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
             <img src="/favicon.ico" alt="Hogwarts" className="w-20 h-20 md:w-24 md:h-24 object-contain animate-float" />
             <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          </div>
          
          <div className="absolute -top-4 -right-4">
             <Sparkles className="text-primary animate-spin-slow" size={24} />
          </div>
        </div>

        <div className="space-y-6 w-full">
           <div className="space-y-2">
             <h2 className="font-heading text-3xl text-gold-gradient tracking-tighter">Hogwarts House</h2>
             <p className="text-[10px] text-primary/40 uppercase tracking-[0.5em] font-bold">Iniciando Revolução</p>
           </div>

           {/* Magical Progress Bar */}
           <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
             <div 
               className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/40 via-primary to-primary/40 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.5)]"
               style={{ width: `${progress}%` }}
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
             </div>
           </div>

           <div className="flex justify-between items-center px-1">
             <span className="text-[9px] text-white/20 font-mono">{Math.floor(progress)}%</span>
             <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-colors duration-500 ${Math.floor(progress/33) >= i ? 'bg-primary' : 'bg-white/5'}`} />
                ))}
             </div>
           </div>

           <p className="text-xs text-white/50 font-serif italic animate-pulse min-h-[3rem] flex items-center justify-center">
             "{tip}"
           </p>
        </div>

        <div className="pt-12 flex items-center gap-6 opacity-30">
           <Zap size={14} className="text-yellow-500" />
           <ShieldCheck size={14} className="text-emerald-500" />
           <Crown size={14} className="text-rose-500" />
        </div>
      </div>

      <div className="absolute bottom-12 text-[10px] text-white/10 font-mono tracking-widest uppercase">
        Protocolo Jarvis Revolution v8.1
      </div>
    </div>
  );
}
