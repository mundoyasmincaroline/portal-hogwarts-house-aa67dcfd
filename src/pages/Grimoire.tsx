import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BookOpen, Sparkles, Zap } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Grimoire() {
  const { user } = useAuth();
  const [spells, setSpells] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [s, c] = await Promise.all([
      supabase.from("user_spells").select("*, spell:spells(*)").eq("user_id", user.id),
      supabase.from("spell_combos").select("*").eq("active", true),
    ]);
    setSpells(s.data ?? []); setCombos(c.data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const practice = async (id: string, spellId: string, name: string) => {
    setLoading(id);
    const { error } = await supabase.rpc("practice_spell", { p_spell_id: spellId });
    setLoading(null);
    if (error) return toast.error(error.message);
    toast.success(`✨ ${name} praticado! +5 XP`);
    load();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-gold-gradient flex items-center gap-2"><BookOpen/> Grimório Pessoal</h1>
        <p className="text-sm text-muted-foreground">Pratique seus feitiços para aumentar a maestria</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg text-gold-gradient mb-3">Feitiços Aprendidos ({spells.length})</h2>
          {spells.length === 0 ? (
            <div className="glass-premium rounded-2xl p-12 text-center">
              <Sparkles size={40} className="mx-auto text-muted-foreground mb-3"/>
              <p className="text-muted-foreground">Você ainda não aprendeu nenhum feitiço. Frequente as Aulas Canon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {spells.map(s => (
                <div key={s.id} className="glass-premium rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-3xl">{s.spell?.icon ?? '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-sm">{s.spell?.name}</h3>
                      <p className="text-[10px] italic text-primary">{s.spell?.incantation}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px]">Nv {s.mastery_level}/5</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 min-h-[28px]">{s.spell?.description}</p>
                  <Progress value={(s.mastery_level / 5) * 100} className="h-1.5 mb-2"/>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Praticado {s.times_practiced ?? 0}x</span>
                    <Button size="sm" variant="outline" disabled={loading===s.id} onClick={() => practice(s.id, s.spell_id, s.spell?.name)}>
                      <Zap size={12} className="mr-1"/> Praticar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-heading text-lg text-gold-gradient mb-3"><EmojiIcon e="⚡" /> Combos Mágicos</h2>
          <div className="space-y-2">
            {combos.map(c => (
              <div key={c.id} className="glass-premium rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="font-heading text-sm">{c.name}</p>
                    <Badge variant="outline" className="text-[9px] capitalize">{c.rarity}</Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{c.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.spell_sequence.map((sp: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">{i+1}. {sp}</Badge>
                  ))}
                </div>
                <p className="text-[10px] text-primary">+{c.bonus_xp} XP · +{c.bonus_galeons} G</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}