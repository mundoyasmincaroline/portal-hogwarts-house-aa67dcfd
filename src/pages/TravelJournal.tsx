import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Loc = { id: string; name: string; icon: string };
type Entry = { id: string; location_id: string | null; title: string; entry: string; mood: string | null; created_at: string };
type Ach = { id: string; achievement_id: string; earned_at: string };
type AchCat = { id: string; code: string; name: string; description: string | null; icon: string; required_visits: number };

const MOODS = ["✨","🌟","😍","🤔","😰","😱","🥰","🤩","🌈","🌙"];

export default function TravelJournal() {
  const [locs, setLocs] = useState<Loc[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [achs, setAchs] = useState<Ach[]>([]);
  const [catalog, setCatalog] = useState<AchCat[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("✨");
  const [locId, setLocId] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: l } = await supabase.from("world_locations" as any).select("id,name,icon");
    const { data: cat } = await supabase.from("explorer_achievements" as any).select("*").order("required_visits");
    const { data: { user } } = await supabase.auth.getUser();
    setLocs((l as any) || []);
    setCatalog((cat as any) || []);
    if (user) {
      const { data: e } = await supabase.from("travel_journal" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      const { data: a } = await supabase.from("user_explorer_achievements" as any).select("*").eq("user_id", user.id);
      setEntries((e as any) || []);
      setAchs((a as any) || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!title.trim() || !body.trim()) return toast.error("Preencha título e conteúdo");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("travel_journal" as any).insert({
      user_id: user.id, title, entry: body, mood, location_id: locId || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Entrada salva! 📓");
    setTitle(""); setBody(""); setLocId("");
    load();
  }

  async function del(id: string) {
    const { error } = await supabase.from("travel_journal" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }

  const earnedIds = new Set(achs.map((a) => a.achievement_id));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="📓" /> Diário de Viagem</h1>
        <p className="text-muted-foreground">Registre suas aventuras pelo mundo bruxo.</p>
      </div>

      <Card className="p-4 bg-card/60 border-primary/30">
        <h2 className="font-heading mb-3"><EmojiIcon e="🏆" /> Conquistas de Explorador</h2>
        <div className="flex flex-wrap gap-2">
          {catalog.map((c) => {
            const got = earnedIds.has(c.id);
            return (
              <Badge key={c.id} variant="outline" className={`text-sm py-1.5 ${got ? "border-primary/60 bg-primary/10" : "opacity-50"}`}>
                {c.icon} {c.name} {got ? "✓" : `(${c.required_visits} viagens)`}
              </Badge>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 space-y-3 bg-card/60 border-primary/20">
        <h2 className="font-heading"><EmojiIcon e="✍️" /> Nova Entrada</h2>
        <Input placeholder="Título do registro" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={locId} onValueChange={setLocId}>
            <SelectTrigger><SelectValue placeholder="Local (opcional)" /></SelectTrigger>
            <SelectContent>
              {locs.map((l) => <SelectItem key={l.id} value={l.id}>{l.icon} {l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOODS.map((m) => <SelectItem key={m} value={m}>{m} Humor</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Textarea placeholder="O que aconteceu na sua viagem?" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button onClick={save} disabled={loading}><EmojiIcon e="📜" /> Salvar Entrada</Button>
      </Card>

      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Diário vazio. Comece a explorar!</p>}
        {entries.map((e) => {
          const l = locs.find((x) => x.id === e.location_id);
          return (
            <Card key={e.id} className="p-5 bg-card/60 border-primary/20 hover:border-primary/40 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full flex items-center justify-center -mr-4 -mt-4 group-hover:bg-primary/10 transition-colors">
                <span className="text-xl rotate-12 opacity-30 group-hover:opacity-100 transition-opacity">📌</span>
              </div>
              <div className="flex items-start justify-between mb-3">
                <div className="relative z-10">
                  <h3 className="font-heading text-lg text-primary flex items-center gap-2">
                    {e.mood} {e.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {l && (
                      <Badge variant="outline" className="text-[9px] uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                        {l.icon} {l.name}
                      </Badge>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => del(e.id)}><EmojiIcon e="🗑️" /></Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{e.entry}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}