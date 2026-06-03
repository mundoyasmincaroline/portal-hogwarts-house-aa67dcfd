import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Lock, Sparkles, Calendar, Trophy, Gift, ShieldCheck } from "lucide-react";

interface Pass {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
}
interface Reward {
  id: string;
  level_required: number;
  is_premium: boolean;
  reward_type: string;
  reward_value: any;
}
interface Progress {
  current_level: number;
  current_xp: number;
  claimed_rewards: string[];
}

const REWARD_META: Record<string, { icon: string; label: (v: any) => string }> = {
  xp: { icon: "✨", label: (v) => `+${v?.amount ?? 0} XP` },
  galeons: { icon: "🪙", label: (v) => `+${v?.amount ?? 0} Galeões` },
  badge: { icon: "🏅", label: (v) => v?.badge_name ?? "Badge" },
  streak_freeze: { icon: "❄️", label: (v) => `${v?.amount ?? 1} Cápsula(s) do Tempo` },
};

export default function BattlePass() {
  const { user, profile } = useAuth();
  const [pass, setPass] = useState<Pass | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from("battle_passes")
      .select("*")
      .eq("active", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!p) { setLoading(false); return; }
    setPass(p as any);

    const [{ data: r }, { data: prog }, { data: vip }] = await Promise.all([
      supabase.from("battle_pass_rewards").select("*").eq("pass_id", p.id).order("level_required"),
      supabase
        .from("user_battle_pass_progress")
        .select("current_level,current_xp,claimed_rewards")
        .eq("pass_id", p.id)
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("vip_subscriptions")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1),
    ]);

    setRewards((r as any) ?? []);
    setProgress(
      (prog as any) ?? {
        current_level: profile?.level ?? 1,
        current_xp: profile?.xp ?? 0,
        claimed_rewards: [],
      }
    );
    setIsVip((vip ?? []).length > 0);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const claim = async (reward: Reward) => {
    if (!pass) return;
    setClaiming(reward.id);
    const { data, error } = await supabase.rpc("claim_battle_pass_reward", {
      p_pass_id: pass.id,
      p_reward_id: reward.id,
    });
    setClaiming(null);
    if (error) { toast.error(error.message); return; }
    const res: any = data;
    toast.success(
      res?.xp ? `+${res.xp} XP reivindicados!` : res?.galeons ? `+${res.galeons} Galeões!` : "Recompensa desbloqueada!"
    );
    await load();
  };

  if (loading) return <div className="text-center py-10 font-serif italic">Convocando o pacto sazonal...</div>;
  if (!pass)
    return (
      <div className="max-w-3xl mx-auto py-20 text-center glass rounded-3xl p-10 border border-white/10">
        <Trophy className="w-12 h-12 mx-auto text-white/30 mb-4" />
        <p className="font-serif italic text-muted-foreground">Nenhuma temporada de Pacto Mágico ativa no momento.</p>
      </div>
    );

  const levels = Array.from(new Set(rewards.map((r) => r.level_required))).sort((a, b) => a - b);
  const claimedSet = new Set((progress?.claimed_rewards as any[])?.map(String) ?? []);
  const currentLevel = progress?.current_level ?? 1;
  const maxLevel = Math.max(...levels, 1);
  const pct = Math.min(100, Math.round((currentLevel / maxLevel) * 100));
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(pass.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0 pb-20 space-y-8">
      {/* HERO */}
      <header className="relative glass rounded-2xl sm:rounded-[3rem] overflow-hidden border border-primary/30 shadow-[0_0_80px_rgba(212,175,55,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-black to-indigo-950/30" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        <div className="relative z-10 p-6 sm:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-heading uppercase tracking-widest text-primary">Pacto Mágico Sazonal</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl text-gold-gradient">{pass.season_name}</h1>
            <p className="text-sm font-serif italic text-white/70 max-w-xl">
              Suba de nível no portal e reivindique recompensas crescentes. Ative o <strong className="text-primary">Pacto Premium</strong> e
              destrave a trilha dourada — ouro, XP e badges exclusivas da temporada.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs flex items-center gap-2 text-white/70">
                <Calendar className="w-3 h-3" /> {daysLeft} dias restantes
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs flex items-center gap-2 text-white/70">
                <Trophy className="w-3 h-3" /> Nível atual {currentLevel}/{maxLevel}
              </span>
              {isVip ? (
                <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-xs flex items-center gap-2 text-primary font-heading uppercase tracking-widest">
                  <Crown className="w-3 h-3" /> Premium Ativo
                </span>
              ) : (
                <Link to="/dashboard/store">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs flex items-center gap-2 text-amber-300 font-heading uppercase tracking-widest hover:bg-amber-500/30 transition">
                    <Crown className="w-3 h-3" /> Desbloquear Premium
                  </span>
                </Link>
              )}
            </div>
          </div>

          <div className="md:w-72 w-full glass rounded-2xl p-6 border border-primary/30 bg-black/40 text-center space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-primary/80">Progresso da Temporada</p>
            <p className="font-heading text-5xl text-gold-gradient">{pct}%</p>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-yellow-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-serif italic">
              Suba de nível através de XP em qualquer atividade do portal.
            </p>
          </div>
        </div>
      </header>

      {/* TRACKS */}
      <div className="space-y-4">
        {/* legend */}
        <div className="grid grid-cols-[60px_1fr_1fr] gap-3 px-2 text-[10px] font-heading uppercase tracking-widest">
          <span className="text-muted-foreground text-center">Nível</span>
          <span className="text-white/60 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Trilha Gratuita
          </span>
          <span className="text-primary flex items-center gap-2">
            <Crown className="w-3 h-3" /> Trilha Premium
          </span>
        </div>

        {levels.map((lvl) => {
          const free = rewards.find((r) => r.level_required === lvl && !r.is_premium);
          const premium = rewards.find((r) => r.level_required === lvl && r.is_premium);
          const unlocked = currentLevel >= lvl;

          return (
            <div
              key={lvl}
              className={`grid grid-cols-[60px_1fr_1fr] gap-3 items-stretch p-2 rounded-2xl border transition-all ${
                unlocked ? "border-primary/30 bg-primary/5" : "border-white/5 bg-white/[0.01] opacity-80"
              }`}
            >
              {/* Level chip */}
              <div className="flex items-center justify-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading text-lg ${
                    unlocked
                      ? "bg-gradient-to-br from-primary to-yellow-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  {lvl}
                </div>
              </div>

              {/* Free */}
              <RewardCell
                reward={free}
                unlocked={unlocked}
                claimed={free ? claimedSet.has(free.id) : false}
                onClaim={() => free && claim(free)}
                disabled={claiming === free?.id}
                premiumGate={false}
                isVip={isVip}
              />
              {/* Premium */}
              <RewardCell
                reward={premium}
                unlocked={unlocked}
                claimed={premium ? claimedSet.has(premium.id) : false}
                onClaim={() => premium && claim(premium)}
                disabled={claiming === premium?.id}
                premiumGate={true}
                isVip={isVip}
              />
            </div>
          );
        })}
      </div>

      {!isVip && (
        <Link
          to="/dashboard/store"
          className="block glass rounded-2xl p-6 border border-amber-400/40 bg-gradient-to-br from-amber-950/30 to-black hover:border-amber-300 transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-xl text-amber-300">Ative o Pacto Premium</h3>
              <p className="text-sm font-serif italic text-white/70">
                Destrave todas as {rewards.filter((r) => r.is_premium).length} recompensas douradas desta temporada.
              </p>
            </div>
            <Button variant="magical" size="lg">
              <Gift className="w-4 h-4 mr-1" /> Ativar
            </Button>
          </div>
        </Link>
      )}
    </div>
  );
}

function RewardCell({
  reward,
  unlocked,
  claimed,
  onClaim,
  disabled,
  premiumGate,
  isVip,
}: {
  reward: Reward | undefined;
  unlocked: boolean;
  claimed: boolean;
  onClaim: () => void;
  disabled: boolean;
  premiumGate: boolean;
  isVip: boolean;
}) {
  if (!reward) {
    return <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01]" />;
  }
  const meta = REWARD_META[reward.reward_type] ?? { icon: "🎁", label: () => reward.reward_type };
  const locked = premiumGate && !isVip;

  return (
    <div
      className={`rounded-xl p-3 flex items-center gap-3 border transition ${
        claimed
          ? "bg-green-500/5 border-green-500/30"
          : locked
          ? "bg-amber-950/10 border-amber-400/20"
          : unlocked
          ? premiumGate
            ? "bg-gradient-to-br from-amber-500/10 to-amber-900/10 border-primary/30"
            : "bg-white/5 border-white/20"
          : "bg-white/[0.02] border-white/10"
      }`}
    >
      <div className="text-2xl shrink-0">{meta.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-heading truncate ${premiumGate ? "text-primary" : "text-white"}`}>
          {meta.label(reward.reward_value)}
        </p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{reward.reward_type}</p>
      </div>
      {claimed ? (
        <span className="text-[10px] font-heading uppercase tracking-widest text-green-400">Recebido</span>
      ) : locked ? (
        <Lock className="w-4 h-4 text-amber-300/70" />
      ) : !unlocked ? (
        <Lock className="w-4 h-4 text-white/30" />
      ) : (
        <Button size="sm" variant={premiumGate ? "magical" : "secondary"} onClick={onClaim} disabled={disabled}>
          {disabled ? "..." : "Resgatar"}
        </Button>
      )}
    </div>
  );
}