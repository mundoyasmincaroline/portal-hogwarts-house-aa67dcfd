import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Gift, Star, Coins, Zap, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STREAK_REWARDS = [
  { day: 1, xp: 50, galeons: 5, img: "/medalha_ouro.png" },
  { day: 2, xp: 75, galeons: 10, img: "/medalha_ouro.png" },
  { day: 3, xp: 100, galeons: 15, img: "/medalha_ouro.png" },
  { day: 4, xp: 150, galeons: 20, img: "/medalha_ouro.png" },
  { day: 5, xp: 200, galeons: 30, img: "/legendary_chest_3d.png" },
  { day: 6, xp: 300, galeons: 50, img: "/legendary_chest_3d.png" },
  { day: 7, xp: 1000, galeons: 200, img: "/legendary_chest_3d.png", special: "Baú Lendário" },
];

export default function DailyRewardSystem() {
  const { user, profile, fetchProfile } = useAuth();
  const [streak, setStreak] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) checkStreak();
  }, [user]);

  const checkStreak = async () => {
    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    if (error && error.code !== "PGRST116") {
      setLoading(false);
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (!data) {
      // Primeiro login
      setStreak(0);
      setCanClaim(true);
      setShowModal(true);
    } else {
      const lastClaim = new Date(data.last_claim);
      const lastClaimStr = lastClaim.toISOString().split('T')[0];
      
      const diffDays = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));
      
      if (todayStr === lastClaimStr) {
        setStreak(data.streak_count);
        setCanClaim(false);
      } else if (diffDays === 1) {
        setStreak(data.streak_count >= 7 ? 0 : data.streak_count);
        setCanClaim(true);
        setShowModal(true);
      } else {
        // Streak quebrada
        setStreak(0);
        setCanClaim(true);
        setShowModal(true);
      }
    }
    setLoading(false);
  };

  const claimReward = async () => {
    if (!user || !profile) return;
    setLoading(true);
    
    const nextStreak = streak + 1;
    const reward = STREAK_REWARDS[nextStreak - 1];
    const today = new Date().toISOString();

    try {
      // Upsert streak
      const { error: streakErr } = await supabase
        .from("user_streaks")
        .upsert({ 
          user_id: user.id, 
          last_claim: today, 
          streak_count: nextStreak 
        } as never);
      
      if (streakErr) throw streakErr;

      // Award Rewards
      await supabase.rpc("award_xp_action", { _action: "daily_login", _user_id: user.id, _xp: reward.xp });
      
      const { error: galErr } = await supabase.from("profiles").update({ 
        galeons: (profile.galeons || 0) + reward.galeons 
      } as never).eq("user_id", user.id);
      
      if (galErr) throw galErr;

      toast.success(`🎁 Recompensa do Dia ${nextStreak} resgatada!`, {
        description: `+${reward.xp} XP e +${reward.galeons}🪙 Galeões adicionados.`,
      });
      
      setStreak(nextStreak);
      setCanClaim(false);
      fetchProfile(user.id);
      setTimeout(() => setShowModal(false), 2000);
    } catch (e: any) {
      toast.error("Erro ao resgatar recompensa: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="glass w-full max-w-2xl rounded-[3rem] p-8 md:p-12 border border-primary/30 relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
            <div className="inline-flex p-4 bg-primary/20 rounded-full text-primary mb-4 animate-bounce">
                <Gift size={40} />
            </div>
            
            <h2 className="text-4xl font-heading text-gold-gradient">Presente do Dia</h2>
            <p className="text-muted-foreground">Volte todos os dias para desbloquear recompensas maiores e baús lendários!</p>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {STREAK_REWARDS.map((r, i) => {
                    const isCompleted = streak >= r.day;
                    const isNext = streak + 1 === r.day && canClaim;
                    const isLocked = r.day > streak + (canClaim ? 1 : 0);

                    return (
                        <div key={r.day} className={`flex flex-col items-center gap-2 transition-all ${isNext ? "scale-110" : ""}`}>
                            <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
                                isCompleted ? "bg-green-500/20 border-green-500/50 text-green-500" :
                                isNext ? "bg-primary/30 border-primary animate-pulse shadow-[0_0_15px_hsl(var(--primary)/0.5)]" :
                                "bg-secondary/40 border-border/50 opacity-40"
                            }`}>
                                {isCompleted ? <CheckCircle2 size={20} /> : <img src={r.img} className="w-full h-full object-contain" alt="recompensa" />}
                            </div>
                            <span className={`text-[10px] font-heading uppercase ${isNext ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                Dia {r.day}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-center justify-between">
                <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase font-heading">Recompensa de Hoje:</p>
                    <div className="flex gap-4 mt-1">
                        <span className="flex items-center gap-1 text-primary font-bold"><Zap size={14} /> +{STREAK_REWARDS[streak]?.xp || 50} XP</span>
                        <span className="flex items-center gap-1 text-yellow-500 font-bold"><Coins size={14} /> +{STREAK_REWARDS[streak]?.galeons || 5} Galeões</span>
                    </div>
                </div>
                <Button 
                    disabled={!canClaim || loading} 
                    variant="magical" 
                    onClick={claimReward}
                    className="px-8 rounded-xl h-12 shadow-lg"
                >
                    {canClaim ? "Resgatar Agora ✨" : "Resgatado ✅"}
                </Button>
            </div>

            <button 
                onClick={() => setShowModal(false)}
                className="text-xs text-muted-foreground hover:text-white underline transition-colors"
            >
                Talvez depois, agora não.
            </button>
        </div>
      </div>
    </div>
  );
}
