import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, MessageSquare, Sparkles } from "lucide-react";
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

export default function RPHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("rp_daily_claims")
        .select("*, character:characters(full_name, avatar_url)")
        .eq("user_id", user.id)
        .order("claim_date", { ascending: false })
        .limit(60);
      setRows((data as Row[]) ?? []);
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