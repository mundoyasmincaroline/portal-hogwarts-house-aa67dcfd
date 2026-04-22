import React, { useState, useEffect } from "react";
import { MessageCircle, Heart, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EmmaPresence: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const isYasmin = profile?.username?.toLowerCase().includes('yasmin') || profile?.username === 'morpheus';

  useEffect(() => {
    if (isYasmin) {
      setTimeout(() => {
        setIsVisible(true);
        // Random notification from Emma once in a while
        const interval = setInterval(() => {
          const messages = [
            "Yasmin, tive uma ideia para os Black...",
            "Emma está atenta ao portal.",
            "O mundo secreto te espera.",
            "Potência criativa detectada.",
            "Precisa de algo, Yasmin?"
          ];
          const randomMsg = messages[Math.floor(Math.random() * messages.length)];
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            toast(randomMsg, { 
              icon: "🌹", 
              style: { background: "#000", border: "1px solid #991b1b", color: "#dc2626" },
              duration: 3000
            });
          }, 2000);
        }, 300000); // Every 5 minutes

        return () => clearInterval(interval);
      }, 5000);
    }
  }, [isYasmin]);

  if (!isYasmin || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-2">
      {isTyping && (
        <div className="bg-black/80 border border-red-600/30 px-3 py-1 rounded-full text-[10px] text-red-500 font-serif italic animate-pulse">
          Emma está pensando...
        </div>
      )}
      <button
        onClick={() => navigate("/dashboard/yasmin-world")}
        className="w-14 h-14 rounded-full bg-black border-2 border-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(153,27,27,0.4)] group transition-all hover:scale-110 active:scale-95 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-red-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Heart size={20} className="text-red-600 group-hover:scale-125 transition-transform" />
        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px] text-white font-bold animate-bounce">
          !
        </div>
        
        {/* Subtle magical orbit */}
        <div className="absolute inset-0 border border-red-600/20 rounded-full animate-spin-slow opacity-50" />
      </button>
      <p className="text-[8px] uppercase tracking-widest text-red-600 font-bold opacity-60 ml-2">Modo Emma</p>
    </div>
  );
};

export default EmmaPresence;
