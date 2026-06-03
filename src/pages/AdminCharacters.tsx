import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { HOUSES, type House } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, GraduationCap, Pencil, Plus, Search, Sparkles, Trash2, Upload, UserRound } from "lucide-react";
import { z } from "zod";

type AdminTab = "characters" | "professors" | "lessons";

type ProfileOption = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  house: House | null;
  avatar_url: string | null;
};

type CharacterRow = {
  id: string;
  user_id: string;
  full_name: string;
  character_type: "oc" | "canon" | string;
  house: House | null;
  avatar_url: string | null;
  gender: string | null;
  age: number | null;
  school_year: number | null;
  blood_status: string | null;
  wand: string | null;
  patronus: string | null;
  pet: string | null;
  favorite_class: string | null;
  favorite_spell: string | null;
  actor_faceclaim: string | null;
  canon_era: string | null;
  canon_portrayed_by: string | null;
  canon_notes: string | null;
  personality: string | null;
  strength: string | null;
  weakness: string | null;
  fears: string | null;
  dreams: string | null;
  quotes: string | null;
  history: string | null;
  background: string | null;
  physical_description: string | null;
  level: number | null;
  xp: number | null;
  hp: number | null;
  max_hp: number | null;
  created_at?: string | null;
};

type ProfessorRow = {
  id: string;
  canon_name: string;
  title: string;
  subject: string;
  bio: string | null;
  avatar_url: string | null;
  catchphrase: string | null;
  difficulty: number | null;
  active: boolean | null;
};

type SpellRow = {
  id: string;
  name: string;
  incantation: string | null;
  category: string;
  icon: string | null;
};

type LessonRow = {
  id: string;
  professor_id: string;
  spell_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  xp_reward: number | null;
  galeons_reward: number | null;
  max_students: number | null;
  status: string | null;
};

type CharacterDraft = Omit<CharacterRow, "id" | "created_at">;
type ProfessorDraft = Omit<ProfessorRow, "id">;
type LessonDraft = Omit<LessonRow, "id">;

const houseOptions = Object.values(HOUSES);
const emptyCharacter: CharacterDraft = {
  user_id: "",
  full_name: "",
  character_type: "oc",
  house: "gryffindor",
  avatar_url: "",
  gender: "female",
  age: 15,
  school_year: 5,
  blood_status: "",
  wand: "",
  patronus: "",
  pet: "",
  favorite_class: "",
  favorite_spell: "",
  actor_faceclaim: "",
  canon_era: "",
  canon_portrayed_by: "",
  canon_notes: "",
  personality: "",
  strength: "",
  weakness: "",
  fears: "",
  dreams: "",
  quotes: "",
  history: "",
  background: "",
  physical_description: "",
  level: 1,
  xp: 0,
  hp: 100,
  max_hp: 100,
};

const emptyProfessor: ProfessorDraft = {
  canon_name: "",
  title: "Professor(a)",
  subject: "Defesa Contra as Artes das Trevas",
  bio: "",
  avatar_url: "",
  catchphrase: "",
  difficulty: 3,
  active: true,
};

const emptyLesson: LessonDraft = {
  professor_id: "",
  spell_id: null,
  title: "",
  description: "",
  scheduled_at: new Date().toISOString().slice(0, 16),
  duration_minutes: 30,
  xp_reward: 50,
  galeons_reward: 5,
  max_students: 30,
  status: "open",
};

const characterSchema = z.object({
  user_id: z.string().uuid("Selecione o dono da ficha."),
  full_name: z.string().trim().min(2, "Informe o nome da ficha.").max(120),
  character_type: z.enum(["oc", "canon"]),
  house: z.enum(["gryffindor", "slytherin", "ravenclaw", "hufflepuff"]),
  gender: z.string().max(30).nullable().optional(),
  age: z.coerce.number().int().min(1).max(300).nullable().optional(),
  school_year: z.coerce.number().int().min(1).max(7).nullable().optional(),
  avatar_url: z.string().trim().max(500).nullable().optional(),
  blood_status: z.string().trim().max(80).nullable().optional(),
  wand: z.string().trim().max(220).nullable().optional(),
  patronus: z.string().trim().max(120).nullable().optional(),
  pet: z.string().trim().max(120).nullable().optional(),
  favorite_class: z.string().trim().max(120).nullable().optional(),
  favorite_spell: z.string().trim().max(120).nullable().optional(),
  actor_faceclaim: z.string().trim().max(160).nullable().optional(),
  canon_era: z.string().trim().max(120).nullable().optional(),
  canon_portrayed_by: z.string().trim().max(160).nullable().optional(),
  canon_notes: z.string().trim().max(3000).nullable().optional(),
  personality: z.string().trim().max(3000).nullable().optional(),
  strength: z.string().trim().max(1200).nullable().optional(),
  weakness: z.string().trim().max(1200).nullable().optional(),
  fears: z.string().trim().max(1200).nullable().optional(),
  dreams: z.string().trim().max(1200).nullable().optional(),
  quotes: z.string().trim().max(1500).nullable().optional(),
  history: z.string().trim().max(5000).nullable().optional(),
  background: z.string().trim().max(5000).nullable().optional(),
  physical_description: z.string().trim().max(3000).nullable().optional(),
  level: z.coerce.number().int().min(1).max(100).nullable().optional(),
  xp: z.coerce.number().int().min(0).max(9999999).nullable().optional(),
  hp: z.coerce.number().int().min(0).max(9999).nullable().optional(),
  max_hp: z.coerce.number().int().min(1).max(9999).nullable().optional(),
});

const professorSchema = z.object({
  canon_name: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(3000).nullable().optional(),
  avatar_url: z.string().trim().max(500).nullable().optional(),
  catchphrase: z.string().trim().max(500).nullable().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).nullable().optional(),
  active: z.boolean().nullable().optional(),
});

const lessonSchema = z.object({
  professor_id: z.string().uuid("Selecione um professor."),
  spell_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  scheduled_at: z.string().min(1),
  duration_minutes: z.coerce.number().int().min(5).max(240).nullable().optional(),
  xp_reward: z.coerce.number().int().min(0).max(5000).nullable().optional(),
  galeons_reward: z.coerce.number().int().min(0).max(5000).nullable().optional(),
  max_students: z.coerce.number().int().min(1).max(500).nullable().optional(),
  status: z.enum(["open", "ongoing", "finished"]),
});

function toDb<T extends Record<string, unknown>>(draft: T) {
  return Object.fromEntries(
    Object.entries(draft).map(([key, value]) => [key, value === "" ? null : value]),
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs font-heading uppercase tracking-widest text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function selectClass(extra = "") {
  return `h-11 w-full rounded-xl border border-white/10 bg-background/80 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 ${extra}`;
}

export default function AdminCharacters() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<AdminTab>("characters");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [professors, setProfessors] = useState<ProfessorRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [spells, setSpells] = useState<SpellRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCharAdmin, setUploadingCharAdmin] = useState(false);
  const [uploadingProfAdmin, setUploadingProfAdmin] = useState(false);
  const [query, setQuery] = useState("");

  const [characterOpen, setCharacterOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [characterDraft, setCharacterDraft] = useState<CharacterDraft>(emptyCharacter);

  const [professorOpen, setProfessorOpen] = useState(false);
  const [editingProfessorId, setEditingProfessorId] = useState<string | null>(null);
  const [professorDraft, setProfessorDraft] = useState<ProfessorDraft>(emptyProfessor);

  const [lessonOpen, setLessonOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLesson);

  const profileById = useMemo(() => Object.fromEntries(profiles.map((p) => [p.user_id, p])), [profiles]);
  const professorById = useMemo(() => Object.fromEntries(professors.map((p) => [p.id, p])), [professors]);
  const spellById = useMemo(() => Object.fromEntries(spells.map((s) => [s.id, s])), [spells]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const [profilesRes, charactersRes, professorsRes, lessonsRes, spellsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, username, house, avatar_url").order("full_name", { ascending: true }).limit(500),
      (supabase as any).from("characters").select("*").order("created_at", { ascending: false }).limit(500),
      (supabase as any).from("canon_professors").select("*").order("canon_name", { ascending: true }).limit(200),
      (supabase as any).from("professor_lessons").select("*").order("scheduled_at", { ascending: false }).limit(200),
      (supabase as any).from("spells").select("id, name, incantation, category, icon").order("name", { ascending: true }).limit(300),
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data as ProfileOption[]);
    if (charactersRes.data) setCharacters(charactersRes.data as CharacterRow[]);
    if (professorsRes.data) setProfessors(professorsRes.data as ProfessorRow[]);
    if (lessonsRes.data) setLessons(lessonsRes.data as LessonRow[]);
    if (spellsRes.data) setSpells(spellsRes.data as SpellRow[]);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredCharacters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) => {
      const owner = profileById[c.user_id];
      return [c.full_name, c.character_type, c.house, owner?.full_name, owner?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [characters, profileById, query]);

  const openNewCharacter = () => {
    setEditingCharacterId(null);
    setCharacterDraft({ ...emptyCharacter, user_id: profiles[0]?.user_id || "" });
    setCharacterOpen(true);
  };

  const openEditCharacter = (character: CharacterRow) => {
    setEditingCharacterId(character.id);
    setCharacterDraft({ ...emptyCharacter, ...character, character_type: character.character_type === "canon" ? "canon" : "oc" });
    setCharacterOpen(true);
  };

  const saveCharacter = async () => {
    const parsed = characterSchema.safeParse(characterDraft);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Revise os campos da ficha.");
      return;
    }
    setSaving(true);
    try {
      const payload = toDb(parsed.data);
      if (editingCharacterId) {
        const { error } = await (supabase as any).from("characters").update(payload).eq("id", editingCharacterId);
        if (error) throw error;
        toast.success("Ficha atualizada pelo admin.");
      } else {
        const { data, error } = await (supabase as any).from("characters").insert(payload).select("id").single();
        if (error) throw error;
        await supabase.from("profiles").update({ active_character_id: data.id } as any).eq("user_id", parsed.data.user_id).is("active_character_id", null);
        toast.success("Ficha criada pelo admin.");
      }

      if (parsed.data.character_type === "canon") {
        await (supabase as any).from("canon_claims").upsert(
          { canon_name: parsed.data.full_name, user_id: parsed.data.user_id, claimed_by: parsed.data.user_id },
          { onConflict: "canon_name" },
        );
      }
      setCharacterOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar ficha.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCharacter = async (character: CharacterRow) => {
    if (!window.confirm(`Excluir a ficha de ${character.full_name}?`)) return;
    const { error } = await (supabase as any).from("characters").delete().eq("id", character.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (character.character_type === "canon") {
      await (supabase as any).from("canon_claims").delete().ilike("canon_name", character.full_name);
    }
    toast.success("Ficha excluída.");
    load();
  };

  const openNewProfessor = () => {
    setEditingProfessorId(null);
    setProfessorDraft(emptyProfessor);
    setProfessorOpen(true);
  };

  const openEditProfessor = (professor: ProfessorRow) => {
    setEditingProfessorId(professor.id);
    setProfessorDraft({ ...emptyProfessor, ...professor });
    setProfessorOpen(true);
  };

  const saveProfessor = async () => {
    const parsed = professorSchema.safeParse(professorDraft);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Revise os campos do professor.");
      return;
    }
    setSaving(true);
    try {
      const payload = toDb(parsed.data);
      const res = editingProfessorId
        ? await (supabase as any).from("canon_professors").update(payload).eq("id", editingProfessorId)
        : await (supabase as any).from("canon_professors").insert(payload);
      if (res.error) throw res.error;
      toast.success(editingProfessorId ? "Professor canon atualizado." : "Professor canon criado.");
      setProfessorOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar professor.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProfessor = async (professor: ProfessorRow) => {
    if (!window.confirm(`Excluir ${professor.canon_name} e suas aulas vinculadas?`)) return;
    const { error } = await (supabase as any).from("canon_professors").delete().eq("id", professor.id);
    if (error) return toast.error(error.message);
    toast.success("Professor canon excluído.");
    load();
  };

  const openNewLesson = () => {
    setEditingLessonId(null);
    setLessonDraft({ ...emptyLesson, professor_id: professors[0]?.id || "", spell_id: spells[0]?.id || null });
    setLessonOpen(true);
  };

  const openEditLesson = (lesson: LessonRow) => {
    setEditingLessonId(lesson.id);
    setLessonDraft({ ...emptyLesson, ...lesson, scheduled_at: lesson.scheduled_at ? new Date(lesson.scheduled_at).toISOString().slice(0, 16) : emptyLesson.scheduled_at });
    setLessonOpen(true);
  };

  const saveLesson = async () => {
    const parsed = lessonSchema.safeParse(lessonDraft);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Revise os campos da aula.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...toDb(parsed.data), scheduled_at: new Date(parsed.data.scheduled_at).toISOString() };
      const res = editingLessonId
        ? await (supabase as any).from("professor_lessons").update(payload).eq("id", editingLessonId)
        : await (supabase as any).from("professor_lessons").insert(payload);
      if (res.error) throw res.error;
      toast.success(editingLessonId ? "Aula canon atualizada." : "Aula canon criada.");
      setLessonOpen(false);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar aula.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lesson: LessonRow) => {
    if (!window.confirm(`Excluir a aula ${lesson.title}?`)) return;
    const { error } = await (supabase as any).from("professor_lessons").delete().eq("id", lesson.id);
    if (error) return toast.error(error.message);
    toast.success("Aula excluída.");
    load();
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-24 space-y-6">
      <header className="glass rounded-3xl border border-primary/20 p-5 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-heading uppercase tracking-widest text-primary mb-3">
              <Sparkles className="h-3 w-3" /> Oficina do Ministério
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl text-gold-gradient">Admin de Fichas & Canons</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Crie, edite e exclua OCs, personagens canon, professores e aulas diretamente pelo painel administrativo.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={characters.length} label="Fichas" />
            <Stat value={professors.length} label="Canons" />
            <Stat value={lessons.length} label="Aulas" />
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button className="shrink-0" variant={tab === "characters" ? "magical" : "outline"} onClick={() => setTab("characters")}>Fichas</Button>
          <Button className="shrink-0 max-w-[70vw]" variant={tab === "professors" ? "magical" : "outline"} onClick={() => setTab("professors")}>Professores Canon</Button>
          <Button className="shrink-0" variant={tab === "lessons" ? "magical" : "outline"} onClick={() => setTab("lessons")}>Aulas Canon</Button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {tab === "characters" && <Button className="w-full md:w-auto" onClick={openNewCharacter}><Plus className="h-4 w-4" /> Nova ficha</Button>}
          {tab === "professors" && <Button className="w-full md:w-auto" onClick={openNewProfessor}><Plus className="h-4 w-4" /> Novo canon</Button>}
          {tab === "lessons" && <Button className="w-full md:w-auto" onClick={openNewLesson} disabled={professors.length === 0}><Plus className="h-4 w-4" /> Nova aula</Button>}
        </div>
      </div>

      {tab === "characters" && (
        <section className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, dono, tipo ou casa..." className="pl-9 bg-background/70" />
          </div>
          {loading ? <p className="text-muted-foreground">Carregando fichas...</p> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCharacters.map((character) => {
                const owner = profileById[character.user_id];
                return (
                  <Card key={character.id} className="p-4 bg-card/60 border-primary/20 space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={character.avatar_url} label={character.full_name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-heading text-lg text-primary truncate">{character.full_name}</h2>
                          <Badge variant={character.character_type === "canon" ? "default" : "secondary"}>{character.character_type?.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Dono: {owner?.full_name || owner?.username || character.user_id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{character.house ? HOUSES[character.house]?.name : "Sem casa"} · Nível {character.level ?? 1} · {character.xp ?? 0} XP</p>
                      </div>
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground min-h-[3.75rem]">{character.personality || character.background || character.history || "Ficha ainda sem descrição administrativa."}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditCharacter(character)}><Pencil className="h-4 w-4" /> Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCharacter(character)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "professors" && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {professors.map((professor) => (
            <Card key={professor.id} className="p-4 bg-card/60 border-primary/20 space-y-4">
              <div className="flex gap-3">
                <Avatar src={professor.avatar_url} label={professor.canon_name} />
                <div className="min-w-0">
                  <h2 className="font-heading text-lg text-primary truncate">{professor.canon_name}</h2>
                  <p className="text-xs text-muted-foreground">{professor.title} · {professor.subject}</p>
                  <Badge variant={professor.active ? "default" : "secondary"}>{professor.active ? "Ativo" : "Inativo"}</Badge>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{professor.bio || professor.catchphrase || "Sem biografia."}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditProfessor(professor)}><Pencil className="h-4 w-4" /> Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteProfessor(professor)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {tab === "lessons" && (
        <section className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="p-4 bg-card/60 border-primary/20 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-heading text-lg text-primary">{lesson.title}</h2>
                  <Badge>{lesson.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{lesson.description || "Sem descrição."}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <GraduationCap className="inline h-3 w-3 mr-1" /> {professorById[lesson.professor_id]?.canon_name || "Professor"} · <BookOpen className="inline h-3 w-3 mx-1" /> {lesson.spell_id ? spellById[lesson.spell_id]?.name : "Sem feitiço"} · {new Date(lesson.scheduled_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditLesson(lesson)}><Pencil className="h-4 w-4" /> Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteLesson(lesson)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={characterOpen} onOpenChange={setCharacterOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl bg-background/95 border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{editingCharacterId ? "Editar ficha" : "Criar ficha pelo admin"}</DialogTitle>
            <DialogDescription>Administradores podem criar e ajustar OCs e personagens canon de qualquer membro.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Dono da ficha"><select className={selectClass()} value={characterDraft.user_id} onChange={(e) => setCharacterDraft((d) => ({ ...d, user_id: e.target.value }))}>{profiles.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name || p.username || p.user_id.slice(0, 8)}</option>)}</select></Field>
            <Field label="Tipo"><select className={selectClass()} value={characterDraft.character_type} onChange={(e) => setCharacterDraft((d) => ({ ...d, character_type: e.target.value as "oc" | "canon" }))}><option value="oc">OC</option><option value="canon">Canon</option></select></Field>
            <Field label="Nome completo"><Input value={characterDraft.full_name} onChange={(e) => setCharacterDraft((d) => ({ ...d, full_name: e.target.value }))} /></Field>
            <Field label="Casa"><select className={selectClass()} value={characterDraft.house || "gryffindor"} onChange={(e) => setCharacterDraft((d) => ({ ...d, house: e.target.value as House }))}>{houseOptions.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field>
            <Field label="Gênero"><Input value={characterDraft.gender || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, gender: e.target.value }))} /></Field>
            <Field label="Idade"><Input type="number" value={characterDraft.age ?? ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, age: e.target.value ? Number(e.target.value) : null }))} /></Field>
            <Field label="Ano escolar"><Input type="number" min={1} max={7} value={characterDraft.school_year ?? ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, school_year: e.target.value ? Number(e.target.value) : null }))} /></Field>
            <Field label="Foto do personagem">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {characterDraft.avatar_url ? (
                    <img src={characterDraft.avatar_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-primary/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary/40 flex items-center justify-center text-xl">🧙</div>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer text-xs font-heading text-primary transition-colors">
                    <Upload size={14} />
                    {uploadingCharAdmin ? "Enviando..." : "Upload de imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingCharAdmin}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !characterDraft.user_id) {
                          if (!characterDraft.user_id) toast.error("Selecione o dono da ficha antes do upload.");
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5MB."); return; }
                        setUploadingCharAdmin(true);
                        try {
                          const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                          const path = `${characterDraft.user_id}/characters/${Date.now()}.${ext}`;
                          const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
                          if (upErr) { toast.error("Falha no upload: " + upErr.message); return; }
                          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
                          setCharacterDraft((d) => ({ ...d, avatar_url: `${publicUrl}?t=${Date.now()}` }));
                          toast.success("Foto enviada! ✨");
                        } finally {
                          setUploadingCharAdmin(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
                <Input placeholder="Ou cole uma URL de imagem..." value={characterDraft.avatar_url || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, avatar_url: e.target.value }))} />
              </div>
            </Field>
            <Field label="Status de sangue"><Input value={characterDraft.blood_status || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, blood_status: e.target.value }))} /></Field>
            <Field label="Varinha"><Input value={characterDraft.wand || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, wand: e.target.value }))} /></Field>
            <Field label="Patrono"><Input value={characterDraft.patronus || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, patronus: e.target.value }))} /></Field>
            <Field label="Pet"><Input value={characterDraft.pet || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, pet: e.target.value }))} /></Field>
            <Field label="Aula favorita"><Input value={characterDraft.favorite_class || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, favorite_class: e.target.value }))} /></Field>
            <Field label="Feitiço favorito"><Input value={characterDraft.favorite_spell || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, favorite_spell: e.target.value }))} /></Field>
            <Field label="Faceclaim / ator"><Input value={characterDraft.actor_faceclaim || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, actor_faceclaim: e.target.value }))} /></Field>
            <Field label="Intérprete canon"><Input value={characterDraft.canon_portrayed_by || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, canon_portrayed_by: e.target.value }))} /></Field>
            <Field label="Era canon"><Input value={characterDraft.canon_era || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, canon_era: e.target.value }))} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nível"><Input type="number" value={characterDraft.level ?? 1} onChange={(e) => setCharacterDraft((d) => ({ ...d, level: Number(e.target.value) }))} /></Field>
              <Field label="XP"><Input type="number" value={characterDraft.xp ?? 0} onChange={(e) => setCharacterDraft((d) => ({ ...d, xp: Number(e.target.value) }))} /></Field>
              <Field label="HP"><Input type="number" value={characterDraft.hp ?? 100} onChange={(e) => setCharacterDraft((d) => ({ ...d, hp: Number(e.target.value) }))} /></Field>
            </div>
            <Field label="HP máximo"><Input type="number" value={characterDraft.max_hp ?? 100} onChange={(e) => setCharacterDraft((d) => ({ ...d, max_hp: Number(e.target.value) }))} /></Field>
            <Field label="Personalidade"><Textarea value={characterDraft.personality || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, personality: e.target.value }))} /></Field>
            <Field label="História / background"><Textarea value={characterDraft.background || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, background: e.target.value }))} /></Field>
            <Field label="Descrição física"><Textarea value={characterDraft.physical_description || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, physical_description: e.target.value }))} /></Field>
            <Field label="Notas canon"><Textarea value={characterDraft.canon_notes || ""} onChange={(e) => setCharacterDraft((d) => ({ ...d, canon_notes: e.target.value }))} /></Field>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setCharacterOpen(false)}>Cancelar</Button>
            <Button onClick={saveCharacter} disabled={saving}>{saving ? "Salvando..." : "Salvar ficha"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={professorOpen} onOpenChange={setProfessorOpen}>
        <DialogContent className="sm:max-w-2xl bg-background/95 border-primary/30">
          <DialogHeader><DialogTitle className="font-heading text-primary">{editingProfessorId ? "Editar canon professor" : "Novo canon professor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome canon"><Input value={professorDraft.canon_name} onChange={(e) => setProfessorDraft((d) => ({ ...d, canon_name: e.target.value }))} /></Field>
            <Field label="Título"><Input value={professorDraft.title} onChange={(e) => setProfessorDraft((d) => ({ ...d, title: e.target.value }))} /></Field>
            <Field label="Matéria"><Input value={professorDraft.subject} onChange={(e) => setProfessorDraft((d) => ({ ...d, subject: e.target.value }))} /></Field>
            <Field label="Dificuldade"><Input type="number" min={1} max={5} value={professorDraft.difficulty ?? 3} onChange={(e) => setProfessorDraft((d) => ({ ...d, difficulty: Number(e.target.value) }))} /></Field>
            <Field label="Foto do professor">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {professorDraft.avatar_url ? (
                    <img src={professorDraft.avatar_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-primary/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary/40 flex items-center justify-center text-xl">🎓</div>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer text-xs font-heading text-primary transition-colors">
                    <Upload size={14} />
                    {uploadingProfAdmin ? "Enviando..." : "Upload de imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingProfAdmin}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error("Imagem maior que 5MB."); return; }
                        setUploadingProfAdmin(true);
                        try {
                          const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                          const path = `canon-professors/${Date.now()}.${ext}`;
                          const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
                          if (upErr) { toast.error("Falha no upload: " + upErr.message); return; }
                          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
                          setProfessorDraft((d) => ({ ...d, avatar_url: `${publicUrl}?t=${Date.now()}` }));
                          toast.success("Foto enviada! ✨");
                        } finally {
                          setUploadingProfAdmin(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
                <Input placeholder="Ou cole uma URL de imagem..." value={professorDraft.avatar_url || ""} onChange={(e) => setProfessorDraft((d) => ({ ...d, avatar_url: e.target.value }))} />
              </div>
            </Field>
            <Field label="Status"><select className={selectClass()} value={professorDraft.active ? "active" : "inactive"} onChange={(e) => setProfessorDraft((d) => ({ ...d, active: e.target.value === "active" }))}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></Field>
            <Field label="Frase"><Textarea value={professorDraft.catchphrase || ""} onChange={(e) => setProfessorDraft((d) => ({ ...d, catchphrase: e.target.value }))} /></Field>
            <Field label="Biografia"><Textarea value={professorDraft.bio || ""} onChange={(e) => setProfessorDraft((d) => ({ ...d, bio: e.target.value }))} /></Field>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setProfessorOpen(false)}>Cancelar</Button><Button onClick={saveProfessor} disabled={saving}>Salvar canon</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
        <DialogContent className="sm:max-w-2xl bg-background/95 border-primary/30">
          <DialogHeader><DialogTitle className="font-heading text-primary">{editingLessonId ? "Editar aula canon" : "Nova aula canon"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Professor"><select className={selectClass()} value={lessonDraft.professor_id} onChange={(e) => setLessonDraft((d) => ({ ...d, professor_id: e.target.value }))}>{professors.map((p) => <option key={p.id} value={p.id}>{p.canon_name}</option>)}</select></Field>
            <Field label="Feitiço"><select className={selectClass()} value={lessonDraft.spell_id || ""} onChange={(e) => setLessonDraft((d) => ({ ...d, spell_id: e.target.value || null }))}><option value="">Sem feitiço</option>{spells.map((s) => <option key={s.id} value={s.id}>{s.icon || "✨"} {s.name}</option>)}</select></Field>
            <Field label="Título"><Input value={lessonDraft.title} onChange={(e) => setLessonDraft((d) => ({ ...d, title: e.target.value }))} /></Field>
            <Field label="Data e hora"><Input type="datetime-local" value={lessonDraft.scheduled_at} onChange={(e) => setLessonDraft((d) => ({ ...d, scheduled_at: e.target.value }))} /></Field>
            <Field label="Duração"><Input type="number" value={lessonDraft.duration_minutes ?? 30} onChange={(e) => setLessonDraft((d) => ({ ...d, duration_minutes: Number(e.target.value) }))} /></Field>
            <Field label="Status"><select className={selectClass()} value={lessonDraft.status || "open"} onChange={(e) => setLessonDraft((d) => ({ ...d, status: e.target.value }))}><option value="open">Aberta</option><option value="ongoing">Em andamento</option><option value="finished">Finalizada</option></select></Field>
            <Field label="XP"><Input type="number" value={lessonDraft.xp_reward ?? 0} onChange={(e) => setLessonDraft((d) => ({ ...d, xp_reward: Number(e.target.value) }))} /></Field>
            <Field label="Galeões"><Input type="number" value={lessonDraft.galeons_reward ?? 0} onChange={(e) => setLessonDraft((d) => ({ ...d, galeons_reward: Number(e.target.value) }))} /></Field>
            <Field label="Vagas"><Input type="number" value={lessonDraft.max_students ?? 30} onChange={(e) => setLessonDraft((d) => ({ ...d, max_students: Number(e.target.value) }))} /></Field>
            <Field label="Descrição"><Textarea value={lessonDraft.description || ""} onChange={(e) => setLessonDraft((d) => ({ ...d, description: e.target.value }))} /></Field>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4"><Button variant="outline" onClick={() => setLessonOpen(false)}>Cancelar</Button><Button onClick={saveLesson} disabled={saving}>Salvar aula</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-background/60 px-4 py-3">
      <p className="font-heading text-2xl text-primary">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Avatar({ src, label }: { src: string | null; label: string }) {
  return src ? (
    <img src={src} alt={label} className="h-14 w-14 rounded-2xl object-cover border border-primary/20 bg-secondary" />
  ) : (
    <div className="h-14 w-14 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center text-primary">
      <UserRound className="h-6 w-6" />
    </div>
  );
}
