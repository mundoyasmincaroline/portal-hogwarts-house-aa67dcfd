import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Dog, Bone, Bell } from "lucide-react";
import { toast } from "sonner";

/**
 * ThottyPresence: O Fiel Lhasa Apso da Família (Preto e Branco).
 * Persona: Ranzinza, fiel, gosta de petiscos e avisar sobre tráfego.
 */
export default function ThottyPresence() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Thotty é visível para toda a família (Morpheus, Yasmin, Carol)
  const username = profile?.username?.toLowerCase() || '';
  const isFamily = username === 'morpheus' || username.includes('yasmin') || username.includes('carol');
  
  useEffect(() => {
    if (!isFamily) return;

    const dogThoughts = [
      "Au! Alguém deixou o portão da Gringotes aberto? Farejei Galeões novos!",
      "Rrrr... intruso detectado no chat! Brincadeira, é só um bruxo novo. Au!",
      "Cadê meu petisco de sapo de chocolate? Já fiz meu trabalho de sentinela hoje.",
      "Au au! O tráfego está aumentando! Sinto cheiro de viral no ar!",
      "Vou tirar um cochilo na Matrix. Me chamem se o faturamento bater a meta."
    ];

    const interval = setInterval(() => {
      const thought = dogThoughts[Math.floor(Math.random() * dogThoughts.length)];
      
      toast(
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/dashboard/revolution")}>
          <div className="relative">
             <div className="w-12 h-12 rounded-full border-2 border-zinc-400 overflow-hidden shadow-[0_0_15px_rgba(161,161,170,0.4)]">
                <img src="/thotty_dog.png" className="w-full h-full object-cover" alt="Thotty" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-zinc-800 rounded-full p-1 border border-white/20">
                <Bell size={8} className="text-white" />
             </div>
          </div>
          <div>
            <p className="font-heading text-xs text-zinc-400 font-bold uppercase tracking-widest">Thotty (Sentinela)</p>
            <p className="text-[10px] text-white/70 italic leading-tight mt-1">{thought}</p>
          </div>
        </div>,
        { duration: 6000 }
      );
    }, 450000); // A cada 7.5 minutos

    return () => clearInterval(interval);
  }, [isFamily, navigate]);

  if (!isFamily) return null;

  return (
    <div className="fixed bottom-64 right-6 z-50 flex flex-col items-end gap-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-500">
      {isOpen && (
        <div className="glass bg-black/80 border-zinc-500/30 p-4 rounded-2xl max-w-[200px] mb-2 animate-in zoom-in duration-300">
           <p className="text-[10px] text-white/80 leading-relaxed italic">
             "Au au! Tudo sob controle aqui no tapete da Matrix. Ganhei carinho?"
           </p>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-500 to-black rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-16 h-16 rounded-full border-2 border-zinc-500 overflow-hidden shadow-2xl bg-black">
           <img src="/thotty_dog.png" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all" alt="Thotty" />
        </div>
        <div className="absolute -top-1 -right-1 bg-zinc-700 text-white p-1 rounded-full border-2 border-black">
           <Dog size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
