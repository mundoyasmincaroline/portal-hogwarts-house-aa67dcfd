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
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
    if (!name.trim()) {
      toast.error("Dê um nome à sua guilda!");
      return;
    }
    if (name.length < 3) {
      toast.error("O nome da guilda deve ter pelo menos 3 caracteres.");
      return;
    }
    
    setIsCreating(true);
    const { error } = await (supabase as any).rpc("create_guild", { p_name: name, p_emblem: emblem, p_description: "" });
    setIsCreating(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("✨ Guilda fundada com sucesso!");
      setName("");
      load();
    }
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

      <section className="glass rounded-[2rem] border border-primary/20 bg-card/40 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -z-10" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-heading text-xl text-primary flex items-center gap-2">
              <Plus size={20} /> Fundar Nova Guilda
            </h2>
            <p className="text-xs text-muted-foreground font-serif italic">
              Lidere bruxos da <span className="text-primary">Casa {(profile as any)?.house}</span> rumo à glória.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 shrink-0">
             <div className="space-y-1.5">
               <p className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Brasão</p>
               <Input value={emblem} onChange={e => setEmblem(e.target.value)} className="w-20 text-center h-12 rounded-xl bg-black/40 border-white/10" maxLength={2} />
             </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Nome da Guilda</p>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ex: Os Marotos de Gryffindor" 
              className="h-12 rounded-xl bg-black/40 border-white/10"
              maxLength={30}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={createGuild} 
              disabled={!user || isCreating}
              variant="magical"
              className="h-12 px-8 rounded-xl w-full sm:w-auto shadow-lg shadow-primary/20"
            >
              {isCreating ? "Fundando..." : "Fundar ✨"}
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <h2 className="font-heading text-2xl text-primary flex items-center gap-3">
            <Users size={24} /> Guildas Ativas
          </h2>
          <div className="relative group w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/40 group-focus-within:text-primary transition-colors">
              <EmojiIcon e="🔍" />
            </div>
            <input
              type="text"
              placeholder="Procurar guilda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-serif italic text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {guilds
              .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((g, idx) => (
              <motion.div 
                layout
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center gap-4 p-5 rounded-[2rem] border backdrop-blur-md hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all group relative overflow-hidden ${
                  idx === 0 ? "border-yellow-500/50 bg-yellow-500/5" : "border-primary/20 bg-card/40"
                }`}
              >
                {idx === 0 && (
                  <div className="absolute top-0 right-0 p-3 text-yellow-500">
                    <Trophy className="w-5 h-5 animate-float" />
                  </div>
                )}
                <div className={`text-4xl w-16 h-16 rounded-2xl flex items-center justify-center border transition-transform shadow-inner group-hover:rotate-6 ${
                  idx === 0 ? "bg-yellow-500/20 border-yellow-500/40" : "bg-primary/10 border-primary/20"
                }`}>{g.emblem}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-xl text-primary truncate drop-shadow-sm">{g.name}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1">
                    <Shield size={10} className="text-primary/60" /> {g.house} · {g.total_xp} XP
                  </div>
                </div>
                <Button size="sm" variant="magical" onClick={() => join(g.id)} className="rounded-xl px-6 shadow-md">Entrar</Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {guilds.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className="text-center py-12 glass rounded-[2rem] border-dashed border-white/10">
            <p className="text-sm text-muted-foreground font-serif italic">
              {searchTerm ? `"Nenhum clã encontrado para '${searchTerm}'..."` : "Nenhuma guilda ativa no momento. Funde a primeira!"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}