import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary">🐉 Chefes Cooperativos</h1>
        <p className="text-foreground/70 font-serif italic">Una forças com todo o castelo para derrotar criaturas lendárias.</p>
      </header>
      {bosses.map(b => {
        const pct = (b.current_hp / b.max_hp) * 100;
        return (
          <div key={b.id} className="rounded-xl border border-primary/30 bg-card/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-primary">{b.name}</h2>
              <span className="text-xs text-foreground/60">{b.current_hp}/{b.max_hp} HP</span>
            </div>
            <Progress value={pct} />
            <p className="text-sm text-foreground/70">{b.description}</p>
            <Button onClick={() => attack(b.id)} className="w-full">⚔️ Atacar</Button>
            <div>
              <div className="text-xs uppercase tracking-widest text-foreground/60 mb-1">Top atacantes</div>
              <ul className="text-sm space-y-1">
                {(ranking[b.id] || []).map((p, i) => (
                  <li key={p.id}>#{i + 1} — {p.damage_dealt} dano</li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
      {bosses.length === 0 && <p className="text-foreground/60">Nenhum chefe ativo no momento.</p>}
    </div>
  );
}