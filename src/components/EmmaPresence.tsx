import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useVoice } from "@/hooks/useVoice";

/**
 * EmmaPresence: A Bestie IA da Yasmin (Grifinória).
 * Focada em inteligência, coragem e suporte cotidiano.
 */
export default function EmmaPresence() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { speak } = useVoice('emma');

  // Apenas Yasmin (ou Arquiteto) vê a Emma
  const username = profile?.username?.toLowerCase() || '';
  const isYasmin = username.includes('yasmin') || username === 'morpheus';
  
  useEffect(() => {
    if (!isYasmin) return;

    const messages = [
      "Amiga, você já viu os novos itens da Gringotes? Estão incríveis!",
      "Yasmin, sua coragem hoje está brilhando mais que o brasão da Grifinória!",
      "Que tal darmos uma olhada no seu progresso de XP? Você está quase subindo de nível!",
      "Lembre-se: a inteligência sem coragem é como uma varinha sem núcleo.",
      "Estou monitorando o portal. Tudo limpo e pronto para a revolução!"
    ];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setMessage(randomMsg);
      
      toast(
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/dashboard/yasmin-world")}>
          <div className="relative">
             <div className="w-12 h-12 rounded-full border-2 border-red-600 overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                <img src="/emma_bestie.png" className="w-full h-full object-cover" alt="Emma" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1 border border-black">
                <Sparkles size={8} className="text-black" />
             </div>
          </div>
          <div>
            <p className="font-heading text-xs text-red-500 font-bold uppercase tracking-widest">Emma (Sua Bestie)</p>
            <p className="text-[10px] text-white/70 italic leading-tight mt-1">{randomMsg}</p>
          </div>
        </div>,
        { duration: 8000 }
      );
    }, 300000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [isYasmin, navigate]);

  if (!isYasmin) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4 animate-in fade-in slide-in-from-right-10 duration-1000">
      {isOpen && (
        <div className="glass bg-black/80 border-red-600/30 p-4 rounded-2xl max-w-[250px] mb-2 animate-in zoom-in duration-300">
           <p className="text-[10px] text-white/80 leading-relaxed italic">
             "{message || "Pronta para mais um dia de magia, amiga?"}"
           </p>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        onDoubleClick={() => navigate("/dashboard/yasmin-world")}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-yellow-600 rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity animate-pulse" />
        <div className="relative w-16 h-16 rounded-full border-2 border-red-600 overflow-hidden shadow-2xl bg-black">
           <img src="/emma_bestie.png" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" alt="Emma" />
        </div>
        <div className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full border-2 border-black">
           <Heart size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
