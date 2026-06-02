import { useEffect, useState, useCallback } from "react";
import { Scroll, Check, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useImmersion } from "@/hooks/core/useImmersion";
import { toast } from "sonner";
import { cn } from "@/lib/core-utils";

type Mission = {
  id: string;
  mission_id: string;
  progress: number;
  completed: boolean;
  catalog: {
    title: string;
    description: string;
    icon: string;
    goal: number;
    xp_reward: number;
    galeons_reward: number;
    action_type: string;
  };
};

export default function DailyMissionsPanel() {
  const { user } = useAuth();
  const { cast } = useImmersion();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    // Garantir atribuição de hoje
    await (supabase as any).rpc("assign_daily_missions");
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const { data } = await (supabase as any)
      .from("user_daily_missions")
      .select("id, mission_id, progress, completed, catalog:daily_missions_catalog(title, description, icon, goal, xp_reward, galeons_reward, action_type)")
      .eq("user_id", user.id)
      .eq("assigned_date", today)
      .order("completed");
    setMissions((data ?? []) as Mission[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const claim = async (m: Mission) => {
    if (m.completed || claiming) return;
    setClaiming(m.mission_id);
    const { error } = await (supabase as any).rpc("complete_daily_mission", { p_mission_id: m.mission_id });
    setClaiming(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    cast("coin");
    toast.success(`+${m.catalog.xp_reward} XP · +${m.catalog.galeons_reward} G`);
    fetchMissions();
  };

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="glass rounded-2xl border border-primary/20 p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scroll className="text-primary" size={18} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80">Pergaminhos do dia</p>
            <h3 className="font-heading text-lg text-gold-gradient">Missões Diárias</h3>
          </div>
        </div>
        <span className="text-xs font-bold text-foreground/70">{completedCount}/{missions.length}</span>
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={20} />
        </div>
      ) : missions.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-6">Nenhuma missão disponível hoje.</p>
      ) : (
        <ul className="space-y-2">
          {missions.map((m) => (
            <li
              key={m.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                m.completed
                  ? "bg-primary/10 border-primary/30"
                  : "bg-secondary/30 border-border/60 hover:border-primary/40"
              )}
            >
              <div className="text-2xl">{m.catalog.icon}</div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", m.completed && "line-through text-foreground/60")}>
                  {m.catalog.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{m.catalog.description}</p>
                <p className="text-[10px] text-primary/80 mt-0.5">
                  +{m.catalog.xp_reward} XP · +{m.catalog.galeons_reward} G
                </p>
              </div>
              <button
                onClick={() => claim(m)}
                disabled={m.completed || claiming === m.mission_id}
                className={cn(
                  "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                  m.completed
                    ? "bg-primary/20 text-primary"
                    : "bg-primary text-primary-foreground hover:scale-105 active:scale-95"
                )}
                title={m.completed ? "Concluída" : "Marcar como concluída"}
              >
                {claiming === m.mission_id ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : m.completed ? (
                  <Check size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}