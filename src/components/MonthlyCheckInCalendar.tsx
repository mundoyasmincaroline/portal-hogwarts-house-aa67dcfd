import { useEffect, useState } from "react";
import { Flame, Gift, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/core-utils";

type Milestone = { milestone: number; xp_reward: number; galeons_reward: number; label: string | null };

function spDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

export default function MonthlyCheckInCalendar() {
  const { user } = useAuth();
  const [claimedDays, setClaimedDays] = useState<Set<number>>(new Set());
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const now = spDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
      const [{ data: claims }, { data: m }, { data: p }] = await Promise.all([
        (supabase as any).from("rp_daily_claims").select("claim_date").eq("user_id", user.id).gte("claim_date", start).lte("claim_date", end),
        (supabase as any).from("rp_streak_milestones").select("milestone, xp_reward, galeons_reward, label").eq("active", true).order("milestone"),
        (supabase as any).from("profiles").select("rp_streak_current").eq("user_id", user.id).maybeSingle(),
      ]);
      const set = new Set<number>();
      (claims ?? []).forEach((c: any) => set.add(Number(c.claim_date.split("-")[2])));
      setClaimedDays(set);
      setMilestones((m ?? []) as Milestone[]);
      setStreak(p?.rp_streak_current ?? 0);
      setLoading(false);
    })();
  }, [user?.id, year, month, daysInMonth]);

  const milestoneByDay = new Map<number, Milestone>();
  milestones.forEach((m) => {
    if (m.milestone <= daysInMonth) milestoneByDay.set(m.milestone, m);
  });

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="glass rounded-2xl border border-primary/20 p-5">
      <header className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80">Calendário mágico</p>
          <h3 className="font-heading text-xl text-gold-gradient capitalize">{monthName} {year}</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30">
          <Flame size={14} className="text-orange-400" />
          <span className="text-xs font-bold text-orange-300">{streak} dias</span>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-xs text-muted-foreground py-8">Carregando jornada…</div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const claimed = claimedDays.has(day);
            const isToday = day === today;
            const isFuture = day > today;
            const milestone = milestoneByDay.get(day);

            return (
              <div
                key={day}
                className={cn(
                  "relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs border transition-all",
                  claimed && "bg-primary/15 border-primary/50 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.25)]",
                  !claimed && isToday && "border-primary border-dashed animate-pulse text-primary",
                  !claimed && !isToday && !isFuture && "bg-destructive/10 border-destructive/30 text-destructive/70",
                  isFuture && "border-border/40 text-foreground/40",
                  milestone && !claimed && "ring-1 ring-amber-400/40"
                )}
                title={milestone ? `Marco: ${milestone.label ?? milestone.milestone + " dias"} (+${milestone.xp_reward} XP, +${milestone.galeons_reward} G)` : undefined}
              >
                <span className="font-bold">{day}</span>
                {milestone && (
                  <Gift size={10} className={cn("absolute -top-1 -right-1", claimed ? "text-amber-300" : "text-amber-400/80")} />
                )}
                {isFuture && milestone && (
                  <Lock size={8} className="absolute bottom-0.5 text-foreground/30" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {milestones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {milestones.slice(0, 5).map((m) => (
            <div
              key={m.milestone}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border",
                streak >= m.milestone
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "border-border text-foreground/60"
              )}
            >
              {m.milestone}d · +{m.xp_reward}xp +{m.galeons_reward}g
            </div>
          ))}
        </div>
      )}
    </div>
  );
}