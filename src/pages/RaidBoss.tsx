import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Zap, Heart, Trophy } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function RaidBoss() {
  const [bosses, setBosses] = useState<any[]>([]);
  const [ranking, setRanking] = useState<Record<string, any[]>>({});

  const load = async () => {
    const { data } = await (supabase as any).from("raid_bosses").select("*").eq("status", "active").order("ends_at");
    setBosses(data || []);
    for (const b of data || []) {
      const { data: p } = await (supabase as any).from("raid_participants").select("*").eq("boss_id", b.id).order("damage_dealt", { ascending: false }).limit(5);
      setRanking(prev => ({ ...prev, [b.id]: p || [] }));
    }
  };
  useEffect(() => { load(); }, []);

  const attack = async (id: string) => {
    const dmg = 50 + Math.floor(Math.random() * 150);
    const { error, data } = await (supabase as any).rpc("damage_raid_boss", { p_boss_id: id, p_damage: dmg });
    if (error) toast.error(error.message);
    else { toast.success(`⚡ Você causou ${dmg} de dano!`); load(); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-primary"><EmojiIcon e="🐉" /> Chefes Cooperativos</h1>
        <p className="text-foreground/70 font-serif italic">Una forças com todo o castelo para derrotar criaturas lendárias.</p>
      </header>
      {bosses.map(b => {
        const pct = (b.current_hp / b.max_hp) * 100;
        return (
          <motion.div 
            layout
            key={b.id} 
            className="rounded-2xl border border-primary/30 bg-card/60 p-6 space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 -rotate-45 translate-x-16 -translate-y-16" />
            <div className="flex items-center justify-between relative z-10">
              <h2 className="font-heading text-2xl text-primary">{b.name}</h2>
              <Badge variant="destructive" className="animate-pulse">
                {b.current_hp.toLocaleString()} / {b.max_hp.toLocaleString()} HP
              </Badge>
            </div>
            <div className="relative h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
               />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">{b.description}</p>
            <Button onClick={() => attack(b.id)} className="w-full h-14 rounded-xl text-lg font-heading group" variant="magical">
              <Swords className="mr-2 group-hover:rotate-12 transition-transform" /> Atacar Criatura
            </Button>
            <div className="pt-4 border-t border-white/5">
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3 flex items-center gap-2">
                <Trophy size={14} /> Top Atacantes
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(ranking[b.id] || []).map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 text-xs">
                    <span className="text-muted-foreground">#{i + 1} bruxo</span>
                    <span className="font-heading text-red-400">-{p.damage_dealt} HP</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      })}
      {bosses.length === 0 && <p className="text-foreground/60">Nenhum chefe ativo no momento.</p>}
    </div>
  );
}