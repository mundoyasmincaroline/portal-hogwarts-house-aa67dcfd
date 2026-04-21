import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Timer, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TimedMysteryChest() {
  const { user, fetchProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Lógica: Aparece nos minutos 0 a 15 de cada hora par (ex: 14:00 às 14:15)
    const checkVisibility = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const isWindow = hour % 2 === 0 && minute < 15;
      
      setIsVisible(isWindow);

      if (isWindow) {
        const remaining = 15 - minute;
        setTimeLeft(`${remaining}m`);
      }
    };

    checkVisibility();
    const interval = setInterval(checkVisibility, 60000);
    return () => clearInterval(interval);
  }, []);

  const openChest = async () => {
    setIsOpening(true);
    // Simular animação mágica
    setTimeout(async () => {
        const rewards = [
            { xp: 50, galeons: 10, msg: "Poção de Agilidade!" },
            { xp: 100, galeons: 20, msg: "Mapa de um corredor secreto!" },
            { xp: 200, galeons: 50, msg: "Pena de Fênix Rara!" },
        ];
        const prize = rewards[Math.floor(Math.random() * rewards.length)];
        
        await supabase.rpc("award_xp_action", { _action: "timed_chest", _user_id: user?.id, _xp: prize.xp });
        await supabase.rpc("award_galeons", { _user_id: user?.id, _amount: prize.galeons, _reason: "timed_chest" });
        
        toast.success(`✨ Você abriu o Baú do Tempo! Recebeu: ${prize.msg} (+${prize.xp} XP)`, {
            description: "Volte na próxima hora par para mais prêmios!",
            duration: 6000
        });

        fetchProfile(user?.id);
        setIsVisible(false);
        setIsOpening(false);
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-8 z-[100] animate-in slide-in-from-right-10 duration-500">
        <div className="relative group">
            <div className="relative group cursor-pointer" onClick={openChest}>
                <img src="/legendary_chest_3d.png" alt="Baú Lendário" className="w-32 h-32 object-contain animate-float drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            </div>

            <div className="relative glass rounded-[2.5rem] p-6 border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center gap-3 w-48 text-center bg-gradient-to-b from-amber-950/40 to-transparent backdrop-blur-md">
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center text-white text-[10px] hover:scale-110 transition-transform"
                >
                    <X size={12} />
                </button>

                <div className={`w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500 mb-2 ${isOpening ? "animate-bounce" : "animate-float"}`}>
                    <Gift size={40} />
                </div>

                <div className="space-y-1">
                    <h4 className="font-heading text-sm text-yellow-400">Baú Místico</h4>
                    <p className="text-[10px] text-muted-foreground uppercase flex items-center justify-center gap-1 font-bold">
                        <Timer size={10} className="text-primary" /> Expira em: <span className="text-white">{timeLeft}</span>
                    </p>
                </div>

                <Button 
                    variant="magical" 
                    size="sm" 
                    className="w-full rounded-xl py-5 group overflow-hidden relative"
                    onClick={openChest}
                    disabled={isOpening}
                >
                    <span className="relative z-10">{isOpening ? "Conjurando..." : "Abrir Agora ✨"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
            </div>
            
            {/* Sparkles */}
            <div className="absolute -top-2 -left-2 text-yellow-400 animate-pulse"><Sparkles size={20} /></div>
            <div className="absolute -bottom-2 -right-2 text-yellow-400 animate-pulse delay-700"><Sparkles size={16} /></div>
        </div>

        <style>{`
            @keyframes float {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
            }
            .animate-float {
                animation: float 3s ease-in-out infinite;
            }
        `}</style>
    </div>
  );
}
