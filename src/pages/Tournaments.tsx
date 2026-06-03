import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Swords, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SafeImage from "@/components/SafeImage";

type Tournament = {
  id: string;
  name: string;
  description: string;
  status: string;
  max_participants: number;
  xp_prize: number;
  galeon_prize: number;
  starts_at: string | null;
  ends_at: string | null;
  banner_url: string | null;
};

type Match = {
  id: string;
  tournament_id: string;
  round: number;
  slot: number;
  player_a: string | null;
  player_b: string | null;
  winner: string | null;
  status: string;
};

export default function Tournaments() {
  const user = useAuth((s) => s.user);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [participantsByT, setParticipantsByT] = useState<Record<string, string[]>>({});
  const [matchesByT, setMatchesByT] = useState<Record<string, Match[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: ts } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (ts || []) as Tournament[];
    setTournaments(list);

    const ids = list.map((t) => t.id);
    if (ids.length) {
      const { data: parts } = await supabase
        .from("tournament_participants")
        .select("tournament_id, user_id")
        .in("tournament_id", ids);
      const map: Record<string, string[]> = {};
      (parts || []).forEach((p: any) => {
        (map[p.tournament_id] ||= []).push(p.user_id);
      });
      setParticipantsByT(map);

      const { data: ms } = await supabase
        .from("tournament_matches")
        .select("*")
        .in("tournament_id", ids)
        .order("round", { ascending: true });
      const mmap: Record<string, Match[]> = {};
      (ms || []).forEach((m: any) => {
        (mmap[m.tournament_id] ||= []).push(m);
      });
      setMatchesByT(mmap);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const join = async (id: string) => {
    const { error } = await supabase.rpc("join_tournament", { p_tournament_id: id });
    if (error) toast.error(error.message);
    else {
      toast.success("Inscrição confirmada!");
      load();
    }
  };

  const reportWin = async (matchId: string, winner: string) => {
    const { error } = await supabase.rpc("report_match_result", {
      p_match_id: matchId,
      p_winner: winner,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Resultado registrado!");
      load();
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="text-center mb-2">
        <h1 className="font-heading text-3xl sm:text-4xl text-primary flex items-center justify-center gap-3 flex-wrap">
          <Trophy className="w-7 h-7 sm:w-9 sm:h-9" /> Torneio Tribruxo
        </h1>
        <p className="text-muted-foreground mt-2">
          Inscreva-se nas competições oficiais do castelo e dispute por glória, XP e Galeões.
        </p>
      </header>

      {loading && <p className="text-center text-muted-foreground">Carregando...</p>}
      {!loading && tournaments.length === 0 && (
        <Card className="p-8 text-center bg-card/40 border-primary/20">
          <p className="text-muted-foreground">
            Nenhum torneio aberto no momento. Volte em breve!
          </p>
        </Card>
      )}

      {tournaments.map((t) => {
        const parts = participantsByT[t.id] || [];
        const matches = matchesByT[t.id] || [];
        const joined = user ? parts.includes(user.id) : false;
        return (
          <Card key={t.id} className="p-6 bg-card/60 border-primary/30 space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-2xl text-primary">{t.name}</h2>
                  <Badge variant={t.status === "open" ? "default" : "secondary"}>
                    {t.status === "open"
                      ? "Inscrições abertas"
                      : t.status === "running"
                      ? "Em andamento"
                      : "Finalizado"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">{t.description}</p>
              </div>
              <div className="flex gap-2">
                {t.status === "open" && !joined && (
                  <Button onClick={() => join(t.id)}>
                    <Swords className="w-4 h-4 mr-1" /> Inscrever
                  </Button>
                )}
                {joined && (
                  <Badge variant="outline" className="text-primary border-primary/50">
                    Você está inscrito
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat icon={<Users className="w-4 h-4" />} label="Participantes" value={`${parts.length}/${t.max_participants}`} />
              <Stat icon={<Trophy className="w-4 h-4" />} label="XP" value={`+${t.xp_prize}`} />
              <Stat icon={<Trophy className="w-4 h-4" />} label="Galeões" value={`+${t.galeon_prize}`} />
              <Stat
                icon={<Calendar className="w-4 h-4" />}
                label="Início"
                value={t.starts_at ? new Date(t.starts_at).toLocaleDateString("pt-BR") : "—"}
              />
            </div>

            {matches.length > 0 && (
              <div className="border-t border-primary/10 pt-3">
                <h3 className="font-heading text-sm text-primary mb-2">Chaveamento</h3>
                <div className="space-y-2">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between bg-background/40 rounded p-2 text-sm"
                    >
                      <span className="text-muted-foreground">R{m.round}</span>
                      <div className="flex-1 mx-3 text-center">
                        <span className={m.winner === m.player_a ? "text-primary font-bold" : ""}>
                          {m.player_a?.slice(0, 8) || "?"}
                        </span>{" "}
                        vs{" "}
                        <span className={m.winner === m.player_b ? "text-primary font-bold" : ""}>
                          {m.player_b?.slice(0, 8) || "?"}
                        </span>
                      </div>
                      {m.status !== "done" && user && (m.player_a === user.id || m.player_b === user.id) && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => reportWin(m.id, user.id)}>
                            Venci
                          </Button>
                        </div>
                      )}
                      {m.status === "done" && (
                        <Badge variant="outline">Finalizada</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-background/40 rounded p-2">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}