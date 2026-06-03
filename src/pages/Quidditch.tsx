import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EmojiIcon from "@/components/shared/EmojiIcon";

const HOUSES = ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"];
const HOUSE_LABEL: Record<string, string> = { 
  gryffindor: "🦁 Grifinória", 
  slytherin: "🐍 Sonserina", 
  ravenclaw: "🦅 Corvinal", 
  hufflepuff: "🦡 Lufa-Lufa" 
};

const POSITIONS: Record<string, { label: string; icon: string; actions: string[] }> = {
  chaser: { label: "Artilheiro", icon: "🏐", actions: ["goal"] },
  keeper: { label: "Goleiro", icon: "🥅", actions: ["save", "goal"] },
  beater: { label: "Batedor", icon: "🏏", actions: ["bludger"] },
  seeker: { label: "Apanhador", icon: "✨", actions: ["snitch"] },
};

const ACTION_LABEL: Record<string, string> = { 
  goal: "Marcar Gol (+10)", 
  save: "Defender (+5)", 
  bludger: "Acertar Balaço (+3)", 
  snitch: "Pegar Pomo (+150 e finaliza)" 
};

export default function Quidditch() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<Record<string, any[]>>({});
  const [teams, setTeams] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [houseB, setHouseB] = useState("slytherin");

  const load = useCallback(async () => {
    // 1. Carregar times para saber os IDs das casas
    const { data: teamsData } = await supabase.from("quidditch_teams").select("*");
    setTeams(teamsData || []);

    // 2. Carregar partidas com status open ou running
    const { data: matchesData } = await supabase
      .from("quidditch_matches")
      .select("*")
      .in("status", ["open", "running", "scheduled"])
      .order("created_at", { ascending: false });
    
    setMatches(matchesData || []);

    if (matchesData?.length) {
      // 3. Carregar jogadores das partidas ativas
      const { data: ps } = await supabase
        .from("quidditch_players")
        .select("*")
        .in("match_id", matchesData.map((m: any) => m.id));
      
      const map: Record<string, any[]> = {};
      (ps || []).forEach((p: any) => { 
        (map[p.match_id] ||= []).push(p); 
      });
      setPlayers(map);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel("quidditch_global")
      .on("postgres_changes", { event: "*", schema: "public", table: "quidditch_matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quidditch_events" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quidditch_players" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const createMatch = async () => {
    if (!profile?.house) return toast.error("Você precisa pertencer a uma casa!");
    if (profile.house === houseB) return toast.error("As casas devem ser diferentes!");
    
    const teamA = teams.find(t => t.house === profile.house);
    const teamB = teams.find(t => t.house === houseB);

    if (!teamA || !teamB) return toast.error("Erro ao identificar os times das casas.");

    setCreating(true);
    try {
      const { error } = await supabase.from("quidditch_matches").insert({ 
        house_a: profile.house, 
        house_b: houseB, 
        status: "open",
        scheduled_at: new Date().toISOString()
      });

      if (error) {
        console.error("Erro ao criar partida:", error);
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.success("Partida de Quadribol aberta nos campos!");
        load();
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setCreating(false);
    }
  };

  const join = async (matchId: string, position: string) => {
    if (!user || !profile?.house) return toast.error("Você precisa estar logado e ter uma casa!");
    
    // Verificar se o jogador já está na partida
    const ps = players[matchId] || [];
    if (ps.some(p => p.user_id === user.id)) return toast.error("Você já está nesta partida!");

    const { error } = await supabase.from("quidditch_players").insert({ 
      match_id: matchId, 
      user_id: user.id, 
      house: profile.house, 
      position 
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Você entrou como ${POSITIONS[position].label}!`);
      load();
    }
  };

  const start = async (id: string) => {
    const { error } = await (supabase as any).rpc("start_quidditch_match", { p_match: id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("A partida começou! Monte em sua vassoura!");
      load();
    }
  };

  const action = async (matchId: string, ev: string) => {
    const { data, error } = await (supabase as any).rpc("quidditch_score", { 
      p_match: matchId, 
      p_event: ev 
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Ação registrada! +${data?.points || 0} pontos!`);
    }
  };

  const getHouseByTeamId = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.house || "";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: [window.innerWidth + 100, -100],
            y: [100, 200, 100, 300, 100],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="text-4xl absolute z-0 opacity-40 filter blur-[1px]"
        >
          ✨
        </motion.div>
      </div>

      <header className="relative z-10">
        <h1 className="font-heading text-2xl sm:text-3xl text-primary flex items-center gap-2">
          <EmojiIcon e="🧹" /> Quadribol
        </h1>
        <p className="text-foreground/70 font-serif italic">Voe pelos céus e defenda as cores da sua casa nos campos de Hogwarts.</p>
      </header>

      <Card className="p-4 bg-card/60 border-primary/30 relative z-10 backdrop-blur-sm">
        <h2 className="font-heading text-primary mb-2">Organizar Amistoso</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sua casa:</span>
            <Badge variant="outline" className="border-primary/40">
              {HOUSE_LABEL[profile?.house || ""] || "Sem Casa"}
            </Badge>
          </div>
          <span className="text-sm font-bold text-primary">VS</span>
          <select 
            value={houseB} 
            onChange={e => setHouseB(e.target.value)} 
            className="bg-background border border-primary/30 rounded px-3 py-1 text-sm focus:ring-1 focus:ring-primary outline-none"
          >
            {HOUSES.filter(h => h !== profile?.house).map(h => (
              <option key={h} value={h}>{HOUSE_LABEL[h]}</option>
            ))}
          </select>
          <Button size="sm" onClick={createMatch} disabled={creating || !profile?.house}>
            {creating ? "Abrindo portões..." : "Abrir Partida"}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {matches.map(m => {
          const ps = players[m.id] || [];
          const me = ps.find(p => p.user_id === user?.id);
          const houseA = getHouseByTeamId(m.team1_id);
          const houseB = getHouseByTeamId(m.team2_id);

          return (
            <Card key={m.id} className="p-6 bg-gradient-to-br from-card to-background border-primary/30 space-y-4 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -rotate-45 translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center justify-between relative z-10">
                <h3 className="font-heading text-xl tracking-tight flex items-center gap-2">
                  {HOUSE_LABEL[houseA]} 
                  <span className="text-muted-foreground mx-1 opacity-50 text-sm">VS</span> 
                  {HOUSE_LABEL[houseB]}
                </h3>
                <Badge variant={m.status === "open" ? "secondary" : "default"}>
                  {m.status === "open" ? "Inscrições Abertas" : m.status === "running" ? "🟢 Em jogo" : "Agendada"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 text-center gap-4">
                <div className="p-3 rounded bg-primary/5 border border-primary/20">
                  <div className="text-xs text-muted-foreground mb-1">{HOUSE_LABEL[houseA]}</div>
                  <div className="text-4xl font-heading text-primary">{m.team1_score || 0}</div>
                </div>
                <div className="p-3 rounded bg-primary/5 border border-primary/20">
                  <div className="text-xs text-muted-foreground mb-1">{HOUSE_LABEL[houseB]}</div>
                  <div className="text-4xl font-heading text-primary">{m.team2_score || 0}</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-primary/10 pt-4">
                <div className="text-xs text-foreground/60 flex gap-2">
                  <span className="font-bold">Jogadores: {ps.length}</span>
                  <span className="opacity-40">|</span>
                  {Object.entries(POSITIONS).map(([k, v]) => (
                    <span key={k} title={v.label}>{v.icon}{ps.filter(p => p.position === k).length}</span>
                  ))}
                </div>
              </div>

              {!me && m.status === "open" && profile?.house && (houseA === profile.house || houseB === profile.house) && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground italic">Escolha sua posição para entrar em campo:</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(POSITIONS).map(([k, v]) => {
                      const count = ps.filter(p => p.position === k && p.house === profile.house).length;
                      const max = k === "chaser" ? 3 : k === "beater" ? 2 : 1;
                      return (
                        <Button 
                          key={k} 
                          size="sm" 
                          variant="outline" 
                          disabled={count >= max}
                          onClick={() => join(m.id, k)}
                          className="hover:bg-primary/10"
                        >
                          {v.icon} {v.label} ({count}/{max})
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {m.status === "open" && me && ps.length >= 2 && (
                <Button onClick={() => start(m.id)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-heading">
                  🚀 INICIAR PARTIDA
                </Button>
              )}

              {m.status === "running" && me && (
                <div className="space-y-3 bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <div className="text-xs uppercase tracking-widest text-primary font-bold">
                    Sua posição: {POSITIONS[me.position].icon} {POSITIONS[me.position].label}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {POSITIONS[me.position].actions.map(a => (
                      <Button key={a} size="sm" onClick={() => action(m.id, a)} className="shadow-lg">
                        {ACTION_LABEL[a]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {matches.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-xl bg-card/30">
            <EmojiIcon e="🏟️" />
            <p className="mt-2 text-foreground/60">O campo está vazio. Que tal organizar um amistoso?</p>
          </div>
        )}
      </div>
    </div>
  );
}
