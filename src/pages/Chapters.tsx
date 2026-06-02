import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookOpen, Sparkles, Check, Lock } from "lucide-react";

interface Chapter {
  id: string; slug: string; title: string; summary: string | null; content: string;
  chapter_order: number; requires_level: number; rewards_xp: number; rewards_galeons: number; cover_emoji: string | null;
}
interface Choice {
  id: string; chapter_id: string; label: string; outcome_text: string | null;
  next_chapter_slug: string | null; xp_bonus: number; display_order: number;
}

export default function Chapters() {
  const { user, profile } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [progress, setProgress] = useState<Record<string, { choice_id: string | null }>>({});
  const [active, setActive] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    setLoading(true);
    const [ch, co, pr] = await Promise.all([
      supabase.from("story_chapters" as any).select("*").order("chapter_order"),
      supabase.from("story_choices" as any).select("*").order("display_order"),
      user ? supabase.from("story_progress" as any).select("chapter_id, choice_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setChapters((ch.data as any[]) || []);
    setChoices((co.data as any[]) || []);
    const map: Record<string, { choice_id: string | null }> = {};
    ((pr as any).data || []).forEach((p: any) => { map[p.chapter_id] = { choice_id: p.choice_id }; });
    setProgress(map);
    setLoading(false);
  }

  async function pickChoice(choice: Choice, chapter: Chapter) {
    if (!user) return;
    try {
      await supabase.from("story_progress" as any).upsert({
        user_id: user.id, chapter_id: chapter.id, choice_id: choice.id,
      }, { onConflict: "user_id,chapter_id" });

      const xpGain = chapter.rewards_xp + (choice.xp_bonus || 0);
      await supabase.from("profiles").update({
        xp: (profile?.xp || 0) + xpGain,
        galeons: (profile?.galeons || 0) + chapter.rewards_galeons,
      }).eq("user_id", user.id);

      toast.success(`+${xpGain} XP · +${chapter.rewards_galeons} Galeões`, {
        description: choice.outcome_text || "Sua escolha ecoa no castelo...",
      });
      setActive(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar progresso");
    }
  }

  if (loading) return <div className="text-center p-12 text-muted-foreground">Carregando capítulos...</div>;

  if (active) {
    const myChoices = choices.filter(c => c.chapter_id === active.id);
    const myProgress = progress[active.id];
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => setActive(null)}>← Voltar aos capítulos</Button>
        <Card className="p-6 sm:p-10 bg-gradient-to-b from-card via-card/80 to-card border-primary/30">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">{active.cover_emoji || "📖"}</div>
            <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient mb-2">{active.title}</h1>
            {active.summary && <p className="text-sm text-muted-foreground italic">{active.summary}</p>}
          </div>
          <div className="prose prose-invert max-w-none mb-8 whitespace-pre-line font-serif text-base leading-relaxed text-foreground/90">
            {active.content}
          </div>
          {myProgress ? (
            <div className="text-center py-6 border-t border-primary/20">
              <Check className="mx-auto mb-2 text-green-400" size={28} />
              <p className="text-sm text-muted-foreground">Você já fez sua escolha neste capítulo.</p>
            </div>
          ) : (
            <div className="space-y-3 border-t border-primary/20 pt-6">
              <h3 className="font-heading text-sm uppercase tracking-widest text-primary mb-4 text-center">O que você faz?</h3>
              {myChoices.map(c => (
                <Button key={c.id} variant="magical" size="lg"
                  className="w-full justify-start text-left h-auto py-4 whitespace-normal"
                  onClick={() => pickChoice(c, active)}>
                  <Sparkles className="shrink-0 mr-3" size={16} />
                  <span>{c.label}</span>
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  const userLevel = profile?.level || 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="text-4xl">📜</div>
        <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Crônicas de Hogwarts</h1>
        <p className="text-muted-foreground text-sm">Sua jornada narrativa. Cada escolha molda seu destino.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {chapters.map(ch => {
          const done = !!progress[ch.id];
          const locked = userLevel < ch.requires_level;
          return (
            <Card key={ch.id}
              className={`p-5 transition-all cursor-pointer relative overflow-hidden ${
                locked ? "opacity-50" : "hover:border-primary/60 hover:scale-[1.02]"
              } ${done ? "border-green-500/40" : "border-primary/20"}`}
              onClick={() => !locked && setActive(ch)}>
              <div className="flex items-start gap-4">
                <div className="text-4xl shrink-0">{ch.cover_emoji || "📖"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">Cap. {ch.chapter_order}</Badge>
                    {done && <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/40"><Check size={10} className="mr-0.5"/>Concluído</Badge>}
                    {locked && <Badge variant="destructive" className="text-[10px]"><Lock size={10} className="mr-0.5"/>Nv {ch.requires_level}</Badge>}
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-1">{ch.title}</h3>
                  {ch.summary && <p className="text-xs text-muted-foreground italic line-clamp-2">{ch.summary}</p>}
                  <div className="flex gap-3 mt-3 text-[10px] text-primary/70 font-mono">
                    <span>+{ch.rewards_xp} XP</span>
                    <span>+{ch.rewards_galeons} G</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}