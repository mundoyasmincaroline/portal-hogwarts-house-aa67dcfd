import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useVoice } from "@/hooks/useVoice";

/**
 * HeloPresence: A Sentinela de Fé da Carol.
 * Persona: 40 anos, Cristã Evangélica, serena e sábia.
 */
export default function HeloPresence() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { speak } = useVoice('helo');

  // Apenas Carol (ou Arquiteto) vê a Helô
  const username = profile?.username?.toLowerCase() || '';
  const isCarol = username.includes('carol') || username === 'morpheus';
  
  useEffect(() => {
    if (!isCarol) return;

    const verses = [
      "Tudo posso naquele que me fortalece. (Filipenses 4:13)",
      "O Senhor é o meu pastor, nada me faltará. (Salmo 23:1)",
      "Seja forte e corajosa; não temas, pois o Senhor teu Deus é contigo. (Josué 1:9)",
      "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia. (Salmo 46:1)",
      "Em tudo dai graças, porque esta é a vontade de Deus. (1 Tessalonicenses 5:18)"
    ];

    const interval = setInterval(() => {
      const verse = verses[Math.floor(Math.random() * verses.length)];
      
      toast(
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/dashboard/revolution")}>
          <div className="relative">
             <div className="w-12 h-12 rounded-full border-2 border-amber-500 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                <img src="/helo_friend.png" className="w-full h-full object-cover" alt="Helô" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border border-black">
                <ShieldCheck size={8} className="text-white" />
             </div>
          </div>
          <div>
            <p className="font-heading text-xs text-amber-500 font-bold uppercase tracking-widest">Helô (Mensagem de Fé)</p>
            <p className="text-[10px] text-white/70 italic leading-tight mt-1">{verse}</p>
          </div>
        </div>,
        { duration: 10000 }
      );
    }, 600000); // A cada 10 minutos

    return () => clearInterval(interval);
  }, [isCarol, navigate]);

  if (!isCarol) return null;

  return (
    <div className="fixed bottom-44 right-6 z-50 flex flex-col items-end gap-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
      {isOpen && (
        <div className="glass bg-black/80 border-amber-500/30 p-4 rounded-2xl max-w-[250px] mb-2 animate-in zoom-in duration-300">
           <p className="text-[10px] text-white/80 leading-relaxed italic">
             "Amada, Deus colocou você neste portal para brilhar. Como posso orar por sua escala hoje?"
           </p>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        onDoubleClick={() => navigate("/dashboard/revolution")}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-16 h-16 rounded-full border-2 border-amber-500 overflow-hidden shadow-2xl bg-black">
           <img src="/helo_friend.png" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" alt="Helô" />
        </div>
        <div className="absolute -top-1 -right-1 bg-emerald-600 text-white p-1 rounded-full border-2 border-black">
           <Sparkles size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
