import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CalendarCheck2, History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCharacters } from "@/hooks/features/useCharacters";
import { toast } from "sonner";

type Claim = {
  id: string;
  character_id: string;
  claim_date: string;
  claimed_at: string;
  last_active_at: string;
  messages_count: number;
  xp_earned: number;
};

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

  const fetchToday = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("rp_daily_claims")
      .select("*")
      .eq("user_id", user.id)
      .eq("claim_date", todayInSP())
      .maybeSingle();
    setClaim(data ?? null);
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
    toast.success("Vaga de RP reivindicada para hoje! ✨");
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

      {claim && activeCharacter ? (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-3 py-2">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0 border border-border/40">
            {activeCharacter.avatar_url ? (
              <img src={activeCharacter.avatar_url} alt={activeCharacter.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">🧙</div>
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
                    <div className="w-full h-full flex items-center justify-center text-sm">🧙</div>
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