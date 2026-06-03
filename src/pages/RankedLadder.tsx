import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";
import { Trophy, Medal, Crown } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
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
      const { data: p } = await (supabase as any)
        .from("ranked_players")
        .select("*, profiles(full_name, username, avatar_url, house)")
        .eq("season_id", s.id)
        .order("mmr", { ascending: false })
        .limit(50);
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
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-10">
      <header className="relative p-8 rounded-[2rem] overflow-hidden border border-primary/20 bg-black/40 text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30 mb-2 animate-float shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Trophy size={40} className="text-primary" />
          </div>
          <h1 className="font-heading text-4xl sm:text-6xl text-gold-gradient drop-shadow-2xl">Modo Ranqueado</h1>
          <div className="flex justify-center gap-3 flex-wrap">
             {Object.keys(DIV_COLORS).map(div => (
               <div key={div} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/10">
                 <Medal size={12} className={DIV_COLORS[div]} />
                 <span className="text-[10px] text-muted-foreground uppercase">{div}</span>
               </div>
             ))}
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto font-serif italic italic italic">
            "A verdadeira maestria não está no poder, mas na disciplina. Suba na hierarquia dos maiores bruxos de Hogwarts."
          </p>
          {season && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-[10px] text-primary uppercase font-bold tracking-widest">
              Temporada: {season.name} · Expira em {new Date(season.ends_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </header>

      {players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-[2rem] p-8 border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent flex items-center gap-6">
            <div className="p-4 bg-black/40 rounded-2xl border border-primary/20 shadow-xl">
              <Medal size={48} className={DIV_COLORS[players[0].division] || "text-primary"} />
            </div>
            <div>
              <h3 className="text-xs font-heading text-primary uppercase tracking-[0.2em] mb-1">Seu Elo Atual</h3>
              <p className="text-3xl font-heading text-foreground">{players[0].division}</p>
              <div className="mt-4 w-48 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">342 MMR para a próxima divisão</p>
            </div>
          </div>

          <div className="glass rounded-[2rem] p-8 border border-white/10 bg-black/20 flex flex-col justify-center text-center">
            <h3 className="text-xs font-heading text-muted-foreground uppercase tracking-[0.2em] mb-4">Estatísticas da Temporada</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-heading text-green-500">12</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Vitórias</p>
              </div>
              <div>
                <p className="text-2xl font-heading text-red-500">4</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Derrotas</p>
              </div>
              <div>
                <p className="text-2xl font-heading text-primary">75%</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Taxa de Win</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-primary/30 bg-card/60 p-5">
        <h2 className="font-heading text-lg text-primary mb-3"><EmojiIcon e="🏆" /> Top 50</h2>
        <ol className="space-y-2">
          {players.map((p, i) => (
            <li key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <div className="flex items-center gap-3">
                <span className="font-heading text-lg w-6 text-muted-foreground">#{i + 1}</span>
                <div className="relative">
                  <SafeImage src={p.profiles?.avatar_url || ""} alt="" className="w-12 h-12 rounded-full border-2 border-primary/20 group-hover:border-primary/50 transition-colors object-cover" />
                  <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-primary/30">
                    <Trophy size={10} className={DIV_COLORS[p.division] || ""} />
                  </div>
                </div>
                <div>
                   <div className="font-heading text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                     {p.profiles?.full_name || "Bruxo"}
                     {i < 3 && <Crown size={12} className="text-yellow-500 animate-pulse" />}
                   </div>
                   <div className="text-[10px] text-muted-foreground uppercase">@{p.profiles?.username} · {p.profiles?.house}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-heading ${DIV_COLORS[p.division] || ""}`}>{p.division} · {p.mmr} MMR</div>
                <div className="text-[10px] text-foreground/60">{p.wins}V / {p.losses}D</div>
              </div>
            </li>
          ))}
          {players.length === 0 && <li className="text-sm text-foreground/60">Ninguém na ladder ainda. Reporte uma partida!</li>}
        </ol>
      </section>

      <div className="flex flex-col sm:flex-row gap-4 p-8 rounded-[2rem] border border-primary/20 bg-primary/5 shadow-inner">
        <div className="flex-1 space-y-2">
          <h3 className="font-heading text-lg text-primary flex items-center gap-2">
            <EmojiIcon e="⚔️" /> Reportar Partida
          </h3>
          <p className="text-xs text-muted-foreground italic font-serif italic">
            Participe de duelos ou atividades PvP e registre o resultado aqui para subir no ranking.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            onClick={() => reportTest(true)} 
            className="px-8 h-12 rounded-xl bg-green-600 hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all active:scale-95"
          >
            Vitória ✨
          </Button>
          <Button 
            onClick={() => reportTest(false)} 
            variant="outline" 
            className="px-8 h-12 rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10 active:scale-95"
          >
            Derrota 🥀
          </Button>
        </div>
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