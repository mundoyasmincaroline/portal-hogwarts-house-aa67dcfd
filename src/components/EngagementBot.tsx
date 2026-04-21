import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Bot, Sparkles, X } from "lucide-react";

const MESSAGES = [
  "🧹 Filch está limpando os corredores... melhor não fazer bagunça!",
  "🦉 Uma coruja acabou de passar com o Profeta Diário.",
  "✨ A magia está forte hoje! Complete uma missão para ganhar mais XP.",
  "🏰 O Chapéu Seletor tem sussurrado coisas estranhas...",
  "🏆 Lembre-se: Cada ponto conta para a Taça das Casas!",
  "🧙‍♂️ Dumbledore sempre diz: 'A felicidade pode ser encontrada mesmo nas horas mais sombrias.'",
  "⚡ Não se esqueça de olhar a aba de Missões!",
  "🔮 A Professora Trelawney previu que você ganhará muito XP hoje.",
];

export default function EngagementBot() {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const showMessage = () => {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setCurrentMessage(msg);
      setIsVisible(true);

      // Auto hide after 8 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 8000);
    };

    // Show first message after 30 seconds
    const initialTimeout = setTimeout(showMessage, 30000);

    // Show a random message every 4-6 minutes
    const interval = setInterval(showMessage, Math.random() * 120000 + 240000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user]);

  if (!currentMessage || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-full max-w-[320px] animate-in slide-in-from-right-10 duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-black/40 to-black/60 backdrop-blur-2xl border border-primary/30 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
        
        <div className="relative z-10 flex gap-4">
          <div className="shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center bg-primary/20 rounded-2xl border border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
               <Bot size={24} className="text-primary animate-float" />
               <div className="absolute -top-1 -right-1">
                  <Sparkles size={12} className="text-yellow-400 animate-pulse" />
               </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-heading text-primary uppercase tracking-[0.2em]">Morpheus Diz:</span>
               <button onClick={() => setIsVisible(false)} className="text-white/20 hover:text-white transition-colors">
                  <X size={12} />
               </button>
            </div>
            <p className="text-xs text-white/90 font-serif leading-relaxed italic">
              "{currentMessage}"
            </p>
          </div>
        </div>

        {/* Progress Bar (Timer) */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-primary/40 w-full">
           <div className="h-full bg-primary animate-[shimmer_8s_linear_infinite] origin-left" style={{ animationDuration: '8s' }} />
        </div>
      </div>
    </div>
  );
}
