import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CalendarCheck2, History, Loader2, Flame, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCharacters } from "@/hooks/features/useCharacters";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Claim = {
  id: string;
  character_id: string;
  claim_date: string;
  claimed_at: string;
  last_active_at: string;
  messages_count: number;
  xp_earned: number;
};

type StreakInfo = {
  current: number;
  best: number;
  lastDate: string | null;
};

type LatestReward = {
  xp_bonus: number;
  galeons_bonus: number;
  label: string | null;
  milestone: number | null;
  streak_day: number;
} | null;

function todayInSP(): string {
  // YYYY-MM-DD em America/Sao_Paulo
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export default function DailyRPSlot() {
  const { user } = useAuth();
  const { characters, loadCharacters, activeId } = useCharacters();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [streak, setStreak] = useState<StreakInfo>({ current: 0, best: 0, lastDate: null });
  const [latestReward, setLatestReward] = useState<LatestReward>(null);

  const fetchToday = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const today = todayInSP();
    const [{ data: claimData }, { data: profileData }, { data: rewardData }] = await Promise.all([
      (supabase as any)
        .from("rp_daily_claims")
        .select("*")
        .eq("user_id", user.id)
        .eq("claim_date", today)
        .maybeSingle(),
      (supabase as any)
        .from("profiles")
        .select("rp_streak_current, rp_streak_best, rp_last_claim_date")
        .eq("user_id", user.id)
        .maybeSingle(),
      (supabase as any)
        .from("rp_streak_rewards")
        .select("xp_bonus, galeons_bonus, label, milestone, streak_day")
        .eq("user_id", user.id)
        .eq("claim_date", today)
        .maybeSingle(),
    ]);
    setClaim(claimData ?? null);
    setStreak({
      current: profileData?.rp_streak_current ?? 0,
      best: profileData?.rp_streak_best ?? 0,
      lastDate: profileData?.rp_last_claim_date ?? null,
    });
    setLatestReward(rewardData ?? null);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchToday();
    loadCharacters();
  }, [fetchToday, loadCharacters]);

  const handleClaim = async (characterId: string) => {
    setClaiming(true);
    const { data, error } = await (supabase as any).rpc("claim_rp_slot", {
      p_character_id: characterId,
    });
    setClaiming(false);
    if (error) {
      toast.error(error.message || "Não foi possível reivindicar a vaga.");
      return;
    }
    setClaim(data as Claim);
    // Buscar recompensa registrada (o RPC garante anti-duplicidade)
    const today = todayInSP();
    const { data: reward } = await (supabase as any)
      .from("rp_streak_rewards")
      .select("xp_bonus, galeons_bonus, label, milestone, streak_day")
      .eq("user_id", user!.id)
      .eq("claim_date", today)
      .maybeSingle();

    if (reward) {
      const parts: string[] = [];
      if (reward.xp_bonus) parts.push(`+${reward.xp_bonus} XP`);
      if (reward.galeons_bonus) parts.push(`+${reward.galeons_bonus}🪙`);
      toast.success(
        `${reward.label ?? "Check-in feito"} · Dia ${reward.streak_day}${reward.milestone ? " · MARCO!" : ""}`,
        { description: parts.join(" · "), duration: 4500 }
      );
    } else {
      toast.success("Check-in já registrado hoje ✨");
    }
    fetchToday();
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-4 border border-primary/15 flex items-center gap-3 text-xs text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={16} />
        Conferindo seu registro do dia…
      </div>
    );
  }

  const activeCharacter = characters.find((c) => c.id === claim?.character_id);

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 border border-primary/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="text-[10px] font-heading uppercase tracking-[0.25em] text-primary/80">
              Vaga Diária de RP
            </p>
            <p className="text-sm text-foreground/85">
              {claim ? "Você já assumiu seu personagem hoje" : "Reivindique sua vaga e comece a jogar"}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/rp-history"
          className="touch-target inline-flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary"
          title="Ver histórico"
        >
          <History size={14} /> Histórico
        </Link>
      </div>

      {/* Streak banner */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/10 to-transparent px-3 py-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className={streak.current > 0 ? "text-orange-400" : "text-muted-foreground"} />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Sequência</p>
            <p className="text-sm font-heading text-foreground">
              {streak.current} {streak.current === 1 ? "dia" : "dias"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Trophy size={12} className="text-primary/80" />
          Recorde: <span className="text-foreground/85">{streak.best}</span>
        </div>
      </div>

      {latestReward && (latestReward.xp_bonus > 0 || latestReward.galeons_bonus > 0) && (
        <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-foreground/85">
          <span className="font-heading text-primary">{latestReward.label ?? "Recompensa diária"}</span>{" "}
          — +{latestReward.xp_bonus} XP{latestReward.galeons_bonus ? ` e +${latestReward.galeons_bonus}🪙` : ""}
          {latestReward.milestone ? ` · Marco de ${latestReward.milestone} dias!` : ""}
        </div>
      )}

      {claim && activeCharacter ? (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border/40">
            {activeCharacter.avatar_url ? (
              <img src={activeCharacter.avatar_url} alt={activeCharacter.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><EmojiIcon e="🧙" /></div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-heading truncate text-foreground flex items-center gap-1">
              <CalendarCheck2 size={12} className="text-primary" />
              {activeCharacter.full_name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mensagens hoje: <span className="text-foreground/80">{claim.messages_count}</span>
            </p>
          </div>
        </div>
      ) : characters.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Crie um personagem para poder reivindicar sua vaga diária.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Cada bruxo só pode assumir <strong className="text-foreground/80">um personagem por dia</strong>. A escolha vale até a meia-noite (horário de Brasília).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => handleClaim(c.id)}
                disabled={claiming}
                className={`touch-target flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                  c.id === activeId
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/40 hover:border-primary/40 hover:bg-primary/5"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary shrink-0">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm"><EmojiIcon e="🧙" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-heading truncate text-foreground">{c.full_name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                    Nv {c.level ?? 1}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}