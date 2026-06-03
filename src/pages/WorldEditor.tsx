import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function WorldEditor() {
  const { user } = useAuth();
  const [tab, setTab] = useState("rooms");
  const [rooms, setRooms] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [spells, setSpells] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: "", description: "", title: "", incantation: "", effect: "" });

  const load = async () => {
    const { data: r } = await (supabase as any).from("ugc_rooms").select("*").order("votes", { ascending: false });
    setRooms(r || []);
    const { data: m } = await (supabase as any).from("ugc_missions").select("*").order("votes", { ascending: false });
    setMissions(m || []);
    const { data: s } = await (supabase as any).from("ugc_spells").select("*").order("votes", { ascending: false });
    setSpells(s || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) return;
    let res: any;
    if (tab === "rooms") {
      res = await (supabase as any).from("ugc_rooms").insert({ creator_id: user.id, name: form.name, description: form.description });
    } else if (tab === "missions") {
      res = await (supabase as any).from("ugc_missions").insert({ creator_id: user.id, title: form.title, description: form.description });
    } else {
      res = await (supabase as any).from("ugc_spells").insert({ creator_id: user.id, incantation: form.incantation, effect: form.effect });
    }
    if (res.error) toast.error(res.error.message);
    else { toast.success("Enviado para moderação!"); setForm({ name: "", description: "", title: "", incantation: "", effect: "" }); load(); }
  };

  const vote = async (type: string, id: string) => {
    const { error } = await (supabase as any).rpc("vote_ugc", { p_target_type: type, p_target_id: id });
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🛠️" /> Oficina do Mundo</h1>
        <p className="text-foreground/70 font-serif italic">Crie salas, missões e feitiços. A comunidade vota e os moderadores aprovam.</p>
      </header>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="rooms">Salas</TabsTrigger>
          <TabsTrigger value="missions">Missões</TabsTrigger>
          <TabsTrigger value="spells">Feitiços</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-3 pt-4">
          <div className="space-y-2 rounded-xl border border-primary/20 bg-card/40 p-4">
            <Input placeholder="Nome da sala" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Button onClick={submit}>Submeter</Button>
          </div>
          <AnimatePresence mode="popLayout">
            {rooms.map(r => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={r.id} 
                className="rounded-2xl border border-primary/20 bg-card/30 p-5 flex items-center justify-between group hover:border-primary/40 transition-all shadow-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-lg text-primary flex items-center gap-2 truncate">
                    {r.name} 
                    <Badge variant="outline" className="text-[9px] uppercase px-2 py-0 h-4 opacity-60">{r.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1 italic">{r.description}</div>
                </div>
                <Button size="sm" variant="ghost" className="hover:bg-primary/10 text-primary gap-2" onClick={() => vote("room", r.id)}>
                   <span className="text-base">👍</span> <span className="font-heading">{r.votes}</span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="missions" className="space-y-3 pt-4">
          <div className="space-y-2 rounded-xl border border-primary/20 bg-card/40 p-4">
            <Input placeholder="Título da missão" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="O que o jogador deve fazer?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Button onClick={submit}>Submeter</Button>
          </div>
          {missions.map(m => (
            <div key={m.id} className="rounded-lg border border-primary/15 bg-card/30 p-3 flex justify-between">
              <div>
                <div className="font-heading text-primary">{m.title} <span className="text-xs text-foreground/50">[{m.status}]</span></div>
                <div className="text-xs text-foreground/60">{m.description}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => vote("mission", m.id)}>👍 {m.votes}</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="spells" className="space-y-3 pt-4">
          <div className="space-y-2 rounded-xl border border-primary/20 bg-card/40 p-4">
            <Input placeholder="Encantamento (ex: Lumos Maxima)" value={form.incantation} onChange={e => setForm({ ...form, incantation: e.target.value })} />
            <Textarea placeholder="Efeito" value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value })} />
            <Button onClick={submit}>Submeter</Button>
          </div>
          {spells.map(s => (
            <div key={s.id} className="rounded-lg border border-primary/15 bg-card/30 p-3 flex justify-between">
              <div>
                <div className="font-heading text-primary italic">{s.incantation} <span className="text-xs not-italic text-foreground/50">[{s.status}]</span></div>
                <div className="text-xs text-foreground/60">{s.effect}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => vote("spell", s.id)}>👍 {s.votes}</Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}