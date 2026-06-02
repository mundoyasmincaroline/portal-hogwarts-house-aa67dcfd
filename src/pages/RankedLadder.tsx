import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DIV_COLORS: Record<string, string> = {
  Bronze: "text-amber-700", Prata: "text-gray-300", Ouro: "text-yellow-400",
  Diamante: "text-cyan-300", Mestre: "text-purple-400", Auror: "text-red-400",
};

export default function RankedLadder() {
  const [season, setSeason] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const load = async () => {
    const { data: s } = await (supabase as any).from("ranked_seasons").select("*").eq("active", true).maybeSingle();
    setSeason(s);
    if (s) {
      const { data: p } = await (supabase as any).from("ranked_players").select("*").eq("season_id", s.id).order("mmr", { ascending: false }).limit(50);
      setPlayers(p || []);
      const { data: m } = await (supabase as any).from("ranked_matches").select("*").eq("season_id", s.id).order("reported_at", { ascending: false }).limit(10);
      setMatches(m || []);
    }
  };
  useEffect(() => { load(); }, []);

  const reportTest = async (won: boolean) => {
    if (!season || players.length < 2) return toast.error("Sem oponente disponível");
    const opp = players.find(p => p.user_id)?.user_id;
    if (!opp) return;
    const { error } = await (supabase as any).rpc("report_ranked_match", { p_season_id: season.id, p_opponent: opp, p_won: won });
    if (error) toast.error(error.message); else { toast.success("Partida registrada!"); load(); }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary">🏅 Modo Ranqueado</h1>
        <p className="text-foreground/70 font-serif italic">Suba de divisão: Bronze → Prata → Ouro → Diamante → Mestre → Auror.</p>
        {season && <p className="text-xs text-foreground/60 mt-1">Temporada: {season.name} · Encerra em {new Date(season.ends_at).toLocaleDateString()}</p>}
      </header>

      <section className="rounded-xl border border-primary/30 bg-card/60 p-5">
        <h2 className="font-heading text-lg text-primary mb-3">🏆 Top 50</h2>
        <ol className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="flex justify-between p-2 rounded bg-background/40">
              <span>#{i + 1} <span className="text-xs text-foreground/60">{p.user_id.slice(0, 8)}</span></span>
              <span className={`font-heading ${DIV_COLORS[p.division] || ""}`}>{p.division} · {p.mmr} MMR</span>
              <span className="text-xs text-foreground/60">{p.wins}V/{p.losses}D</span>
            </li>
          ))}
          {players.length === 0 && <li className="text-sm text-foreground/60">Ninguém na ladder ainda. Reporte uma partida!</li>}
        </ol>
      </section>

      <div className="flex gap-2">
        <Button onClick={() => reportTest(true)} className="flex-1">Reportar Vitória</Button>
        <Button onClick={() => reportTest(false)} variant="outline" className="flex-1">Reportar Derrota</Button>
      </div>

      <section>
        <h3 className="font-heading text-primary mb-2">Últimas partidas</h3>
        <ul className="space-y-1 text-sm">
          {matches.map(m => (
            <li key={m.id} className="text-foreground/70">
              {new Date(m.reported_at).toLocaleString()} — ±{m.mmr_change} MMR
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}