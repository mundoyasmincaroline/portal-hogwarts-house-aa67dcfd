import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Entry { id: string; title: string; content: string; mood: string; created_at: string; }
const MOODS = [
  { v: "joyful", l: "Alegre", e: "😊" },
  { v: "neutral", l: "Neutro", e: "😐" },
  { v: "thoughtful", l: "Pensativo", e: "🤔" },
  { v: "sad", l: "Triste", e: "😢" },
  { v: "excited", l: "Empolgado", e: "🤩" },
  { v: "mysterious", l: "Misterioso", e: "🔮" },
];

export default function Diary() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("diary_entries" as any).select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setEntries((data as any[]) || []);
  }

  async function save() {
    if (!user || !title.trim() || !content.trim()) return;
    const { error } = await supabase.from("diary_entries" as any).insert({
      user_id: user.id, title: title.trim(), content: content.trim(), mood,
    });
    if (error) return toast.error(error.message);
    toast.success("Página adicionada ao seu diário");
    setTitle(""); setContent(""); setMood("neutral"); setCreating(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("diary_entries" as any).delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="text-4xl"><EmojiIcon e="📔" /></div>
        <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient font-serif tracking-tighter">Diário Pessoal</h1>
        <p className="text-muted-foreground text-sm">Suas memórias, suas reflexões. Só você pode ler.</p>
      </header>

      {!creating ? (
        <Button variant="magical" size="lg" className="w-full" onClick={() => setCreating(true)}>
          <Plus className="mr-2" size={18}/> Nova Página
        </Button>
      ) : (
        <Card className="p-5 space-y-3 border-primary/30">
          <Input placeholder="Título da página..." value={title} onChange={e => setTitle(e.target.value)} maxLength={120}/>
          <Textarea placeholder="O que aconteceu hoje em Hogwarts?" value={content} onChange={e => setContent(e.target.value)} rows={6} maxLength={4000}/>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button key={m.v} onClick={() => setMood(m.v)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  mood === m.v ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}>
                {m.e} {m.l}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
            <Button variant="magical" onClick={save} className="flex-1">Salvar Página</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="mx-auto mb-3 opacity-40" size={40}/>
            <p className="text-sm italic">Seu diário ainda está em branco...</p>
          </div>
        )}
        {entries.map(e => {
          const m = MOODS.find(x => x.v === e.mood) || MOODS[1];
          return (
            <Card key={e.id} className="p-5 border-primary/20 bg-[#fdf5e6]/5 text-foreground hover:bg-[#fdf5e6]/10 transition-all shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[url('https://www.transparenttextures.com/patterns/old-mathematics.png')] opacity-5 pointer-events-none" />
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{m.e} {m.l}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(e.created_at), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg text-foreground">{e.title}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Deseja apagar esta memória?")) remove(e.id); }} className="text-destructive shrink-0">
                  <Trash2 size={14}/>
                </Button>
              </div>
              <p className="text-sm text-foreground/85 whitespace-pre-wrap font-serif italic leading-relaxed">{e.content}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}