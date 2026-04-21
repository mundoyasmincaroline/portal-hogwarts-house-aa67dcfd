import { useEffect } from "react";
import { toast } from "sonner";
import { ShoppingBag, Zap, Crown, Sparkles } from "lucide-react";

const RECENT_PURCHASES = [
  { name: "Ana Beatriz", item: "Baú de Galeões", icon: <ShoppingBag size={14} className="text-yellow-400" /> },
  { name: "Marcos Vinicius", item: "Estudante Premium", icon: <Zap size={14} className="text-blue-400" /> },
  { name: "Julia Rodrigues", item: "Pacote de Figurinhas", icon: <Sparkles size={14} className="text-purple-400" /> },
  { name: "Pedro Henrique", item: "Auror VIP", icon: <Crown size={14} className="text-amber-400" /> },
  { name: "Leticia Silva", item: "Varinha das Varinhas", icon: <ShoppingBag size={14} className="text-yellow-500" /> },
  { name: "Gabriel Souza", item: "Manto da Invisibilidade", icon: <Sparkles size={14} className="text-slate-400" /> },
  { name: "Mariana Costa", item: "Tesouro de Gringotts", icon: <ShoppingBag size={14} className="text-amber-600" /> },
];

export default function SocialProofWatcher() {
  useEffect(() => {
    const showRandomToast = () => {
      // Chance de mostrar a cada intervalo
      if (Math.random() > 0.4) {
        const purchase = RECENT_PURCHASES[Math.floor(Math.random() * RECENT_PURCHASES.length)];
        
        toast.custom((t) => (
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl animate-in slide-in-from-right-10 duration-500 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
               {purchase.icon}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-heading text-white/40 uppercase tracking-widest mb-0.5">Atividade Recente</p>
              <p className="text-xs text-white leading-tight">
                <span className="text-primary font-bold">{purchase.name}</span> acaba de adquirir <span className="text-yellow-400 font-bold">{purchase.item}</span>!
              </p>
            </div>
          </div>
        ), {
          duration: 4000,
          position: "bottom-right",
        });
      }
    };

    // Primeira notificação após 10 segundos
    const initialTimer = setTimeout(showRandomToast, 10000);
    
    // Intervalo de verificação (a cada 45-90 segundos)
    const interval = setInterval(() => {
      showRandomToast();
    }, 45000 + Math.random() * 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return null; // Componente invisível (apenas lógica de toast)
}
