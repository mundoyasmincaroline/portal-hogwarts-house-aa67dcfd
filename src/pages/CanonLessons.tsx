import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Clock, Award, BookOpen, Wand2 } from "lucide-react";
import SpellCastingMiniGame from "@/components/SpellCastingMiniGame";
import AcademicProgressCard from "@/components/AcademicProgressCard";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Lesson {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  xp_reward: number;
  galeons_reward: number;
  status: string;
  spell_id: string | null;
  professor: {
    id: string;
    canon_name: string;
    title: string;
    subject: string;
    avatar_url: string | null;
    catchphrase: string | null;
  } | null;
  spell: {
    id: string;
    name: string;
    incantation: string | null;
    category: string;
    icon: string | null;
  } | null;
}

export default function CanonLessons() {
  const { user, profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendedMap, setAttendedMap] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<Lesson | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("professor_lessons")
      .select(
        "id,title,description,scheduled_at,duration_minutes,xp_reward,galeons_reward,status,spell_id, professor:canon_professors(id,canon_name,title,subject,avatar_url,catchphrase), spell:spells(id,name,incantation,category,icon)"
      )
      .eq("status", "open")
      .order("scheduled_at", { ascending: true })
      .limit(30);
    setLessons((data as any) ?? []);

    if (profile?.active_character_id) {
      const { data: att } = await supabase
        .from("lesson_attendance")
        .select("lesson_id")
        .eq("character_id", profile.active_character_id);
      const map: Record<string, boolean> = {};
      att?.forEach((a: any) => (map[a.lesson_id] = true));
      setAttendedMap(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.active_character_id]);

  const handleComplete = async (mastery: number) => {
    if (!active || !profile?.active_character_id) return;
    const lesson = active;
    setActive(null);
    const { data, error } = await supabase.rpc("complete_canon_lesson", {
      p_lesson_id: lesson.id,
      p_character_id: profile.active_character_id,
      p_mastery_score: mastery,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const res: any = data;
    toast.success(
      `+${res?.xp_awarded ?? 0} XP · +${res?.galeons_awarded ?? 0} ⚜️ Galeões  ·  Maestria ${res?.mastery ?? mastery}`
    );
    setAttendedMap((prev) => ({ ...prev, [lesson.id]: true }));
  };

  if (loading) return <div className="text-center py-10 font-serif italic">Convocando os professores...</div>;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0 pb-20 space-y-8">
      {/* HERO */}
      <header className="relative glass rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 text-center overflow-hidden border border-primary/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-black to-amber-950/30" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1">
            <Wand2 className="w-3 h-3 text-primary animate-float" />
            <span className="text-[10px] font-heading uppercase tracking-widest text-primary">Aulas Canon</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading text-gold-gradient">A Sala dos Mestres</h1>
          <p className="text-sm sm:text-base font-serif italic text-white/70 max-w-2xl mx-auto">
            Aprenda feitiços diretamente dos professores canônicos de Hogwarts. Cada aula concluída ensina um feitiço
            ao seu personagem e aumenta sua maestria.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* LESSONS LIST */}
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-white/10">
              <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="font-serif italic text-muted-foreground">
                Nenhum mestre está dando aula agora. Volte em breve.
              </p>
            </div>
          ) : (
            lessons.map((l) => {
              const attended = attendedMap[l.id];
              return (
                <article
                  key={l.id}
                  className="glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-white/10 hover:border-primary/40 transition group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  <div className="relative z-10 flex flex-col sm:flex-row gap-5">
                    {/* PROFESSOR */}
                    <div className="flex sm:flex-col items-center gap-3 sm:w-28 sm:text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-primary/30 bg-primary/10 overflow-hidden shrink-0">
                        {l.professor?.avatar_url ? (
                          <img src={l.professor.avatar_url} alt={l.professor.canon_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl"><EmojiIcon e="🧙" /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l.professor?.title}</p>
                        <p className="font-heading text-sm text-primary truncate">{l.professor?.canon_name}</p>
                        <p className="text-[10px] text-white/50 italic">{l.professor?.subject}</p>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <h3 className="font-heading text-xl sm:text-2xl text-white">{l.title}</h3>
                        {l.description && <p className="text-sm font-serif italic text-muted-foreground mt-1">{l.description}</p>}
                      </div>
                      {l.professor?.catchphrase && (
                        <blockquote className="border-l-2 border-primary/40 pl-3 text-xs italic text-white/60">
                          "{l.professor.catchphrase}"
                        </blockquote>
                      )}

                      <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-widest">
                        {l.spell && (
                          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                            {l.spell.icon ?? "✨"} {l.spell.name}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                          +{l.xp_reward} XP
                        </span>
                        <span className="px-3 py-1 rounded-full bg-amber-600/10 border border-amber-500/30 text-amber-400">
                          +{l.galeons_reward} ⚜️
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {l.duration_minutes}min
                        </span>
                      </div>

                      <div className="pt-2">
                        {attended ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
                            <Award className="w-4 h-4 text-green-400" />
                            <span className="text-[10px] font-heading uppercase tracking-widest text-green-400">
                              Feitiço Aprendido
                            </span>
                          </div>
                        ) : !profile?.active_character_id ? (
                          <p className="text-xs text-muted-foreground italic">Selecione um personagem para participar.</p>
                        ) : (
                          <Button variant="magical" size="sm" onClick={() => setActive(l)}>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Praticar Feitiço
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* SIDEBAR */}
        <aside>
          <AcademicProgressCard />
        </aside>
      </div>

      <SpellCastingMiniGame
        open={!!active}
        spellName={active?.spell?.name ?? active?.title}
        incantation={active?.spell?.incantation}
        onClose={() => setActive(null)}
        onComplete={handleComplete}
      />
    </div>
  );
}