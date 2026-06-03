import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Shield, Trophy, Users, Plus } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Guilds() {
  const { user, profile } = useAuth();
  const [guilds, setGuilds] = useState<any[]>([]);
  const [war, setWar] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [emblem, setEmblem] = useState("⚔️");

  const load = async () => {
    const { data: g } = await (supabase as any).from("guilds").select("*").eq("active", true).order("total_xp", { ascending: false });
    setGuilds(g || []);
    const { data: w } = await (supabase as any).from("house_wars").select("*").eq("status", "open").maybeSingle();
    setWar(w);
    if (w) {
      const { data: s } = await (supabase as any).from("house_war_scores").select("*").eq("war_id", w.id).order("points", { ascending: false });
      setScores(s || []);
    }
  };
  useEffect(() => { load(); }, []);

  const createGuild = async () => {
    if (!name.trim()) return;
    const { error } = await (supabase as any).rpc("create_guild", { p_name: name, p_emblem: emblem, p_description: "" });
    if (error) toast.error(error.message); else { toast.success("Guilda fundada!"); setName(""); load(); }
  };
  const join = async (id: string) => {
    const { error } = await (supabase as any).rpc("join_guild", { p_guild_id: id });
    if (error) toast.error(error.message); else { toast.success("Você entrou na guilda!"); load(); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="⚔️" /> Guildas & Guerra das Casas</h1>
        <p className="text-foreground/70 font-serif italic">Una-se a um clã da sua casa e lute pela glória semanal.</p>
      </header>

      {war && (
        <section className="rounded-xl border border-primary/30 bg-card/60 p-5">
          <h2 className="font-heading text-lg text-primary mb-3"><EmojiIcon e="🏆" /> Guerra da Semana</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scores.map(s => (
              <li key={s.id} className="text-center p-3 rounded-lg bg-background/40">
                <div className="text-xs uppercase tracking-widest text-foreground/60">{s.house}</div>
                <div className="font-heading text-2xl text-primary">{s.points}</div>
              </li>
            ))}
            {scores.length === 0 && <li className="col-span-full text-sm text-foreground/60">Sem pontuações ainda.</li>}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-primary/20 bg-card/40 p-5 space-y-3">
        <h2 className="font-heading text-lg text-primary">Fundar Guilda na sua casa ({(profile as any)?.house})</h2>
        <div className="flex gap-2">
          <Input value={emblem} onChange={e => setEmblem(e.target.value)} className="w-20 text-center" maxLength={2} />
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da guilda" />
          <Button onClick={createGuild} disabled={!user}>Fundar</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg text-primary">Guildas Ativas</h2>
        {guilds.map(g => (
          <div key={g.id} className="flex items-center gap-3 p-4 rounded-lg border border-primary/15 bg-card/40">
            <div className="text-3xl">{g.emblem}</div>
            <div className="flex-1">
              <div className="font-heading text-primary">{g.name}</div>
              <div className="text-xs text-foreground/60">{g.house} · {g.total_xp} XP</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => join(g.id)}>Entrar</Button>
          </div>
        ))}
        {guilds.length === 0 && <p className="text-sm text-foreground/60">Nenhuma guilda ativa. Seja o primeiro a fundar.</p>}
      </section>
    </div>
  );
}