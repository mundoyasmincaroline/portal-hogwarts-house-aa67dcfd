import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Crown, TrendingUp } from "lucide-react";

interface EloRow {
  user_id: string;
  elo: number;
  wins: number;
  losses: number;
  streak: number;
}
interface ProfileLite { user_id: string; full_name: string | null; house: string | null; avatar_url: string | null; }

export default function DuelLadder() {
  const [rows, setRows] = useState<(EloRow & Partial<ProfileLite>)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("duel_elo")
        .select("*")
        .order("elo", { ascending: false })
        .limit(50);
      const elo = (data as EloRow[]) || [];
      if (elo.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name, house, avatar_url")
          .in("user_id", elo.map((e) => e.user_id));
        const map = new Map((profs || []).map((p: any) => [p.user_id, p]));
        setRows(elo.map((e) => ({ ...e, ...(map.get(e.user_id) || {}) })));
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
  }, []);

  const tier = (elo: number) =>
    elo >= 1400 ? "Lorde dos Duelos" :
    elo >= 1200 ? "Mestre" :
    elo >= 1100 ? "Adepto" :
    elo >= 1000 ? "Aprendiz" : "Iniciante";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Swords className="h-8 w-8 text-primary" />
        <div>
          <h1 className="font-heading text-3xl">Ranking de Duelistas</h1>
          <p className="text-sm text-foreground/60">Classificação ELO dos bruxos mais talentosos.</p>
        </div>
      </div>
      <Card className="border-primary/40 bg-card/60">
        <CardHeader><CardTitle className="font-heading">Top 50</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-foreground/60">Carregando ranking...</p>
          ) : rows.length === 0 ? (
            <p className="text-foreground/60">Nenhum duelo ranqueado registrado ainda.</p>
          ) : (
            <ol className="space-y-2">
              {rows.map((r, i) => (
                <li key={r.user_id} className="flex items-center gap-3 rounded-md border border-border/50 p-3">
                  <span className="w-8 text-center font-heading text-primary">{i + 1}</span>
                  {i === 0 && <Crown className="h-4 w-4 text-primary" />}
                  <div className="flex-1">
                    <p className="font-medium">{r.full_name || "Bruxo Anônimo"}</p>
                    <p className="text-xs text-foreground/60">{tier(r.elo)} · {r.wins}V / {r.losses}D</p>
                  </div>
                  {r.streak > 1 && (
                    <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" />{r.streak}</Badge>
                  )}
                  <Badge>{r.elo} ELO</Badge>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}