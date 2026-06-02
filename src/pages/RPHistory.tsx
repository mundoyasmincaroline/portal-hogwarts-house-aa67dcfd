import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, MessageSquare, Sparkles, Flame, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Row = {
  id: string;
  claim_date: string;
  claimed_at: string;
  last_active_at: string;
  messages_count: number;
  xp_earned: number;
  character_id: string;
  character?: { full_name: string; avatar_url: string | null } | null;
};

type StreakReward = {
  id: string;
  claim_date: string;
  streak_day: number;
  milestone: number | null;
  xp_bonus: number;
  galeons_bonus: number;
  label: string | null;
};

export default function RPHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [rewards, setRewards] = useState<StreakReward[]>([]);
  const [streak, setStreak] = useState<{ current: number; best: number }>({ current: 0, best: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [{ data: claims }, { data: rewardRows }, { data: profile }] = await Promise.all([
        (supabase as any)
          .from("rp_daily_claims")
          .select("*, character:characters(full_name, avatar_url)")
          .eq("user_id", user.id)
          .order("claim_date", { ascending: false })
          .limit(60),
        (supabase as any)
          .from("rp_streak_rewards")
          .select("*")
          .eq("user_id", user.id)
          .order("claim_date", { ascending: false })
          .limit(60),
        (supabase as any)
          .from("profiles")
          .select("rp_streak_current, rp_streak_best")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setRows((claims as Row[]) ?? []);
      setRewards((rewardRows as StreakReward[]) ?? []);
      setStreak({
        current: profile?.rp_streak_current ?? 0,
        best: profile?.rp_streak_best ?? 0,
      });
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="touch-target inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="font-heading text-3xl text-gold-gradient">Histórico de RP</h1>
        <p className="text-sm text-muted-foreground">
          Cada linha representa um dia em que você assumiu seu personagem. A vaga é única por dia (fuso de Brasília) e o contador registra as mensagens enviadas no chat e nas salas de roleplay.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
          <Flame className="text-orange-400" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Sequência atual</p>
            <p className="font-heading text-2xl text-foreground">{streak.current} <span className="text-xs text-muted-foreground">{streak.current === 1 ? "dia" : "dias"}</span></p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-primary/20 flex items-center gap-3">
          <Trophy className="text-primary" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Melhor sequência</p>
            <p className="font-heading text-2xl text-foreground">{streak.best} <span className="text-xs text-muted-foreground">{streak.best === 1 ? "dia" : "dias"}</span></p>
          </div>
        </div>
      </section>

      {rewards.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-heading text-lg text-foreground/90 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" /> Recompensas recentes
          </h2>
          <ul className="space-y-2">
            {rewards.slice(0, 10).map((r) => (
              <li key={r.id} className="glass rounded-xl px-3 py-2 border border-border/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {r.label ?? "Presença diária"}{" "}
                    {r.milestone && (
                      <span className="text-[10px] uppercase tracking-widest text-primary ml-1">marco</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Dia {r.streak_day} · {new Date(r.claim_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right text-[11px] text-foreground/85 whitespace-nowrap">
                  +{r.xp_bonus} XP
                  {r.galeons_bonus > 0 && <span className="text-primary"> · +{r.galeons_bonus}🪙</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Lendo registros…</p>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl p-6 border border-primary/15 text-center text-sm text-muted-foreground">
          Você ainda não reivindicou nenhuma vaga. Volte para o painel e comece hoje!
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="glass rounded-2xl p-3 sm:p-4 border border-border/40 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border/40">
                {r.character?.avatar_url ? (
                  <img src={r.character.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">🧙</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-heading truncate text-foreground">
                  {r.character?.full_name ?? "Personagem removido"}
                </p>
                <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={11} />
                    {new Date(r.claim_date + "T12:00:00").toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={11} /> {r.messages_count} msg
                  </span>
                  {r.xp_earned > 0 && (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Sparkles size={11} /> +{r.xp_earned} XP
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}