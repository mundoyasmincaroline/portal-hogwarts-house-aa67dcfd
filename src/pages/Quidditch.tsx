import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trophy, Wind, Target, Star } from "lucide-react";
import EmojiIcon from "@/components/shared/EmojiIcon";
const HOUSES = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"];
const HOUSE_LABEL: Record<string, string> = { gryffindor: "🦁 Grifinória", slytherin: "🐍 Sonserina", ravenclaw: "🦅 Corvinal", hufflepuff: "🦡 Lufa-Lufa" };
const POSITIONS: Record<string, { label: string; icon: string; actions: string[] }> = {
  chaser: { label: "Artilheiro", icon: "🏐", actions: ["goal"] },
  keeper: { label: "Goleiro", icon: "🥅", actions: ["save", "goal"] },
  beater: { label: "Batedor", icon: "🏏", actions: ["bludger"] },
  seeker: { label: "Apanhador", icon: "✨", actions: ["snitch"] },
};
const ACTION_LABEL: Record<string, string> = { goal: "Marcar Gol (+10)", save: "Defender (+5)", bludger: "Acertar Balaço (+3)", snitch: "Pegar Pomo (+150 e finaliza)" };

export default function Quidditch() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<string, any[]>>({});
  const [creating, setCreating] = useState(false);
  const [houseB, setHouseB] = useState("slytherin");

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("quidditch_matches").select("*").in("status", ["open", "running"]).order("created_at", { ascending: false });
    setMatches(data || []);
    if (data?.length) {
      const { data: ps } = await (supabase as any).from("quidditch_players").select("*").in("match_id", data.map((m: any) => m.id));
      const map: Record<string, any[]> = {};
      (ps || []).forEach((p: any) => { (map[p.match_id] ||= []).push(p); });
      setPlayers(map);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("quidditch_global")
      .on("postgres_changes", { event: "*", schema: "public", table: "quidditch_matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quidditch_events" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const createMatch = async () => {
    if (!profile?.house) return toast.error("Sem casa definida");
    if (profile.house === houseB) return toast.error("Casas devem ser diferentes");
    setCreating(true);
    const { error } = await (supabase as any).from("quidditch_matches").insert({ house_a: profile.house, house_b: houseB, status: "open" });
    setCreating(false);
    if (error) toast.error(error.message); else { toast.success("Partida criada!"); load(); }
  };

  const join = async (matchId: string, position: string) => {
    if (!user || !profile?.house) return;
    const { error } = await (supabase as any).from("quidditch_players").insert({ match_id: matchId, user_id: user.id, house: profile.house, position });
    if (error) toast.error(error.message); else { toast.success(`Entrou como ${POSITIONS[position].label}!`); load(); }
  };

  const start = async (id: string) => {
    const { error } = await (supabase as any).rpc("start_quidditch_match", { p_match: id });
    if (error) toast.error(error.message); else load();
  };

  const action = async (matchId: string, ev: string) => {
    const { data, error } = await (supabase as any).rpc("quidditch_score", { p_match: matchId, p_event: ev });
    if (error) toast.error(error.message);
    else toast.success(`+${data?.points || 0} pontos!`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-primary"><EmojiIcon e="🧹" /> Quadribol</h1>
        <p className="text-foreground/70 font-serif italic">Voe pelos céus e defenda as cores da sua casa.</p>
      </header>

      <Card className="p-4 bg-card/60 border-primary/30">
        <h2 className="font-heading text-primary mb-2">Criar nova partida</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Sua casa ({HOUSE_LABEL[profile?.house || ""] || "—"}) vs.</span>
          <select value={houseB} onChange={e => setHouseB(e.target.value)} className="bg-background border border-primary/30 rounded px-2 py-1 text-sm">
            {HOUSES.filter(h => h !== profile?.house).map(h => <option key={h} value={h}>{HOUSE_LABEL[h]}</option>)}
          </select>
          <Button size="sm" onClick={createMatch} disabled={creating}>Criar partida</Button>
        </div>
      </Card>

      {matches.map(m => {
        const ps = players[m.id] || [];
        const me = ps.find(p => p.user_id === user?.id);
        return (
          <Card key={m.id} className="p-6 bg-gradient-to-br from-card to-background border-primary/30 space-y-4 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -rotate-45 translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between relative z-10">
              <h3 className="font-heading text-xl tracking-tight">{HOUSE_LABEL[m.house_a]} <span className="text-muted-foreground mx-1 opacity-50">vs</span> {HOUSE_LABEL[m.house_b]}</h3>
              <Badge>{m.status === "open" ? "Abertura" : "🟢 Em jogo"}</Badge>
            </div>
            <div className="grid grid-cols-2 text-center gap-2">
              <div className="p-3 rounded bg-red-500/10 border border-red-500/30"><div className="text-xs">{HOUSE_LABEL[m.house_a]}</div><div className="text-3xl font-heading text-red-300">{m.score_a}</div></div>
              <div className="p-3 rounded bg-green-500/10 border border-green-500/30"><div className="text-xs">{HOUSE_LABEL[m.house_b]}</div><div className="text-3xl font-heading text-green-300">{m.score_b}</div></div>
            </div>

            <div className="text-xs text-foreground/60">
              Jogadores: {ps.length} · {Object.entries(POSITIONS).map(([k, v]) => `${v.icon}${ps.filter(p => p.position === k).length}`).join(" ")}
            </div>

            {!me && m.status === "open" && profile?.house && (m.house_a === profile.house || m.house_b === profile.house) && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(POSITIONS).map(([k, v]) => (
                  <Button key={k} size="sm" variant="outline" onClick={() => join(m.id, k)}>{v.icon} {v.label}</Button>
                ))}
              </div>
            )}

            {m.status === "open" && me && ps.length >= 2 && <Button onClick={() => start(m.id)} className="w-full">▶ Iniciar partida</Button>}

            {m.status === "running" && me && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-primary">Sua posição: {POSITIONS[me.position].icon} {POSITIONS[me.position].label}</div>
                <div className="flex gap-2 flex-wrap">
                  {POSITIONS[me.position].actions.map(a => (
                    <Button key={a} size="sm" onClick={() => action(m.id, a)}>{ACTION_LABEL[a]}</Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {matches.length === 0 && <p className="text-center text-foreground/60">Nenhuma partida aberta. Crie a primeira!</p>}
    </div>
  );
}