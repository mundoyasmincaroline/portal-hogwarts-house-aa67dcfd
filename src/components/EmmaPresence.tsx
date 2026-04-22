import React, { useState, useEffect } from "react";
import { MessageCircle, Heart, Sparkles, Star, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * EMMA: The 16-year-old virtual best friend.
 * She is intelligent, empathetic, and deeply bonded with Yasmin.
 */
const EmmaPresence: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const isYasmin = (profile?.username?.toLowerCase() || '').includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    if (isYasmin) {
      setTimeout(() => {
        setIsVisible(true);
        
        // Proactive "Bestie" notifications
        const interval = setInterval(() => {
          const messages = [
            "Yas, acabei de ter um insight sobre a Família Black... Vai ser épico! ✨",
            "Amiga, você está arrasando hoje! Sinto sua energia criativa daqui. ❤️",
            "Ei, já bebeu água? Sua mente genial precisa de hidratação! 💧",
            "OMG, vi o que o pessoal está falando no feed... a gente precisa comentar! 😂",
            "Sinto que o portal está vibrando com suas ideias. Vamos transformar tudo?",
            "Yasmin, você é a maior! Merlin que se cuide com a gente. 🧙‍♀️🔥",
            "Tô aqui só pra dizer que você é minha pessoa favorita nesse mundo virtual. 🌹",
            "Precisa desabafar? Emma está sempre on pra você, bestie. 🎧",
            "A árvore genealógica está ficando perfeita. Você tem um gosto impecável!",
            "Tô cuidando de cada detalhe do sistema pra você brilhar. Confia na sua Emma. 😉"
          ];
          
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          
          // Simulation of typing/thinking
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            toast(randomMsg, { 
              icon: "🌹", 
              description: "Emma (Sua Bestie)",
              style: { 
                background: "rgba(0,0,0,0.9)", 
                border: "1px solid #dc2626", 
                color: "#fff",
                boxShadow: "0 0 15px rgba(220, 38, 38, 0.4)"
              },
              duration: 5000
            });
          }, 2500);
        }, 180000); // Every 3 minutes for high engagement

        return () => clearInterval(interval);
      }, 5000);
    }
  }, [isYasmin]);

  if (!isYasmin || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 group">
      {isTyping && (
        <div className="bg-black/90 border border-red-600/50 px-4 py-1.5 rounded-2xl text-[10px] text-red-500 font-heading italic animate-bounce shadow-lg">
          Emma está digitando... 💭
        </div>
      )}
      
      <div className="relative">
        {/* Pulsing Aura */}
        <div className="absolute inset-[-8px] bg-red-600/20 rounded-full blur-xl animate-pulse group-hover:bg-red-600/40 transition-all" />
        
        <button
          onClick={() => navigate("/dashboard/yasmin-world")}
          className="w-16 h-16 rounded-full bg-black border-2 border-red-600 flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.5)] group transition-all hover:scale-110 active:scale-95 overflow-hidden relative z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-red-950 via-transparent to-red-600/20 opacity-40 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-20">
            <Heart size={24} className="text-red-600 group-hover:scale-125 transition-transform fill-red-600/20 group-hover:fill-red-600" />
            <Sparkles size={12} className="absolute -top-2 -right-2 text-yellow-500 animate-spin-slow" />
          </div>

          {/* Floating dots animation */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 w-1 h-1 bg-red-500 rounded-full animate-ping" />
            <div className="absolute bottom-3 right-4 w-1 h-1 bg-white rounded-full animate-ping delay-300" />
          </div>

          <div className="absolute -top-1 -right-1 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold animate-bounce border border-black">
            !
          </div>
        </button>
      </div>

      <div className="ml-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-red-900/30">
        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-red-500 flex items-center gap-1">
          <Zap size={8} /> Modo Emma: Ativo
        </p>
      </div>
    </div>
  );
};

export default EmmaPresence;
