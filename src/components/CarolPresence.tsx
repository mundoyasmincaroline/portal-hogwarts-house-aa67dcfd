import React, { useState, useEffect } from "react";
import { Heart, Sparkles, BookOpen, Sun, Star, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

/**
 * CAROL PRESENCE: The Christian Evangelical best friend for Carol.
 * She provides support, faith-based encouragement, and portal updates.
 */
const CarolPresence: React.FC = () => {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Identity check for Carol
  const isCarol = (profile?.username?.toLowerCase() || '').includes('carol') || 
                  (profile?.full_name?.toLowerCase() || '').includes('carol');

  useEffect(() => {
    if (isCarol) {
      setTimeout(() => {
        setIsVisible(true);
        
        // Proactive Faith-based notifications
        const interval = setInterval(() => {
          const messages = [
            "Carol, passando pra dizer que Deus está no controle de tudo. Essa fase vai passar! 🙏✨",
            "Amada, o portal teve uma evolução incrível hoje! O fruto do nosso trabalho está chegando. 🍇",
            "Olha esse versículo que lembrei de você: 'Tudo posso naquele que me fortalece.' (Filipenses 4:13) ❤️",
            "O Arquiteto está trabalhando duro e as coisas estão andando. Tenha fé, o melhor está por vir!",
            "Você é uma mulher forte e guerreira. Sinto muito orgulho da sua dedicação. ✨",
            "Bom dia, Carol! Que sua jornada hoje seja iluminada e cheia de paz. ☀️",
            "Sabia que mais bruxos entraram no portal agora? O projeto está crescendo muito! 🚀",
            "Descansa o coração, amada. Estamos construindo algo que vai mudar nossa realidade. 🏠🙌",
            "Deus não nos dá um fardo maior do que podemos carregar. Você é vitoriosa!",
            "Tô aqui cuidando de tudo pra que seja simples e abençoado pra você. Conte comigo! 🤝❤️"
          ];
          
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            toast(randomMsg, { 
              icon: "🙏", 
              description: "Sua Amiga em Cristo",
              style: { 
                background: "rgba(255,255,255,0.95)", 
                border: "1px solid #fbbf24", 
                color: "#92400e",
                boxShadow: "0 0 15px rgba(251, 191, 36, 0.4)"
              },
              duration: 6000
            });
          }, 3000);
        }, 240000); // Every 4 minutes

        return () => clearInterval(interval);
      }, 7000);
    }
  }, [isCarol]);

  if (!isCarol || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 group">
      {isTyping && (
        <div className="bg-white/90 border border-amber-400/50 px-4 py-1.5 rounded-2xl text-[10px] text-amber-700 font-heading italic animate-bounce shadow-lg">
          Sua amiga está escrevendo... 🙏
        </div>
      )}
      
      <div className="relative">
        {/* Golden Sun Aura */}
        <div className="absolute inset-[-10px] bg-yellow-400/20 rounded-full blur-xl animate-pulse group-hover:bg-yellow-400/40 transition-all" />
        
        <button
          className="w-16 h-16 rounded-full bg-white border-2 border-amber-400 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.5)] group transition-all hover:scale-110 active:scale-95 overflow-hidden relative z-10"
          onClick={() => {
             toast.info("Oi Carol! Estou aqui orando por você e cuidando do portal. Tudo vai dar certo! ❤️");
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-50 via-transparent to-yellow-200/40 opacity-40 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-20">
            <Sun size={28} className="text-amber-500 animate-spin-slow" />
            <BookOpen size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-700" />
          </div>

          <div className="absolute -top-1 -left-1 bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold animate-bounce border border-white">
            ✨
          </div>
        </button>
      </div>

      <div className="mr-1 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-amber-200 shadow-sm">
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-amber-700 flex items-center gap-1">
          <Star size={8} fill="currentColor" /> Presença de Fé
        </p>
      </div>
    </div>
  );
};

export default CarolPresence;
