import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BookOpen, Sparkles, Zap, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Grimoire() {
  const { user } = useAuth();
  const [spells, setSpells] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

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

  const filteredSpells = spells.filter(s => {
    const matchesSearch = s.spell?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.spell?.incantation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || s.spell?.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 text-4xl rotate-12 text-primary">ᚦ</div>
        <div className="absolute bottom-20 right-10 text-4xl -rotate-12 text-primary">ᚫ</div>
        <div className="absolute top-1/2 left-1/4 text-4xl rotate-45 text-primary">ᚱ</div>
        <div className="absolute top-1/3 right-1/4 text-4xl -rotate-45 text-primary">ᚠ</div>
      </div>

      <div className="mb-8 relative z-10 space-y-6">
        <div>
          <h1 className="font-heading text-4xl text-gold-gradient flex items-center gap-3"><BookOpen className="w-8 h-8"/> Grimório Pessoal</h1>
          <p className="text-sm text-muted-foreground italic">"As palavras são, na minha nada humilde opinião, nossa mais inesgotável fonte de magia."</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-primary/40 group-focus-within:text-primary transition-colors">
              <Wand2 size={18} />
            </div>
            <input
              type="text"
              placeholder="Procurar no grimório..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-serif italic text-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {["all", "Combate", "Utilitário", "Defesa", "Artes das Trevas"].map(cat => (
              <Button 
                key={cat}
                variant={activeCategory === cat ? "magical" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="whitespace-nowrap rounded-xl px-4"
              >
                {cat === "all" ? "Todos" : cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-heading text-lg text-gold-gradient mb-3">Feitiços Aprendidos ({filteredSpells.length})</h2>
          {filteredSpells.length === 0 ? (
            <div className="glass-premium rounded-2xl p-12 text-center">
              <Sparkles size={40} className="mx-auto text-muted-foreground mb-3"/>
              <p className="text-muted-foreground">Você ainda não aprendeu nenhum feitiço. Frequente as Aulas Canon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredSpells.map(s => (
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