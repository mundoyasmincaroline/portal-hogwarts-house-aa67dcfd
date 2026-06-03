import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import EmojiIcon from "@/components/shared/EmojiIcon";
const THEMES = [
  { id: "estudo", icon: "📚", label: "Sala de Estudos" },
  { id: "duelo", icon: "⚔️", label: "Arena de Duelos" },
  { id: "festa", icon: "🎉", label: "Salão de Festas" },
  { id: "treino", icon: "🏋️", label: "Treinamento" },
  { id: "biblioteca", icon: "📖", label: "Biblioteca Oculta" },
];

export default function RoomOfRequirement() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<any[]>([]);
  const [members, setMembers] = useState<Record<string, any[]>>({});
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("estudo");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    const { data } = await (supabase as any).from("room_of_requirement").select("*").order("created_at", { ascending: false });
    setRooms(data || []);
    if (data?.length) {
      const { data: ms } = await (supabase as any).from("room_members").select("*").in("room_id", data.map((r: any) => r.id));
      const map: Record<string, any[]> = {};
      (ms || []).forEach((m: any) => { (map[m.room_id] ||= []).push(m); });
      setMembers(map);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!user || !name.trim()) return;
    const { error } = await (supabase as any).from("room_of_requirement").insert({ owner_id: user.id, name: name.trim(), theme, description: description.trim() || null });
    if (error) toast.error(error.message); else { toast.success("✨ Sala materializada!"); setName(""); setDescription(""); load(); }
  };

  const join = async (roomId: string) => {
    if (!user) return;
    const { error } = await (supabase as any).from("room_members").insert({ room_id: roomId, user_id: user.id });
    if (error) toast.error(error.message); else { toast.success("Entrou na sala!"); load(); }
  };

  const leave = async (roomId: string) => {
    if (!user) return;
    await (supabase as any).from("room_members").delete().eq("room_id", roomId).eq("user_id", user.id);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Apagar esta sala?")) return;
    await (supabase as any).from("room_of_requirement").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🚪" /> Sala Precisa</h1>
        <p className="text-foreground/70 font-serif italic">Manifeste uma sala mágica que se transforma conforme sua necessidade.</p>
      </header>

      <Card className="p-4 bg-card/60 border-primary/30 space-y-3">
        <h2 className="font-heading text-primary">Manifestar nova sala</h2>
        <Input placeholder="Nome da sala" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)} className={`px-3 py-2 rounded-full text-xs border transition-all ${theme === t.id ? "bg-primary/20 border-primary text-primary" : "bg-background/70 border-primary/30 text-foreground hover:border-primary/60"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <Button onClick={create} className="w-full"><EmojiIcon e="✨" /> Materializar Sala</Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {rooms.map(r => {
          const ms = members[r.id] || [];
          const joined = ms.some(m => m.user_id === user?.id);
          const t = THEMES.find(x => x.id === r.theme);
          return (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={r.id} 
              className="p-5 rounded-2xl bg-card/60 backdrop-blur-md border border-primary/20 space-y-3 shadow-2xl hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-lg text-primary">{t?.icon} {r.name}</h3>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/60">{t?.label}</div>
                </div>
                {r.owner_id === user?.id && <Button size="sm" variant="ghost" onClick={() => del(r.id)}><EmojiIcon e="🗑" /></Button>}
              </div>
              {r.description && <p className="text-sm text-foreground/80">{r.description}</p>}
              <div className="text-xs text-foreground/60">{ms.length}/{r.max_members} bruxos dentro</div>
              {joined
                ? <Button size="sm" variant="outline" className="w-full" onClick={() => leave(r.id)}>Sair</Button>
                : <Button size="sm" className="w-full" onClick={() => join(r.id)} disabled={ms.length >= r.max_members}>{ms.length >= r.max_members ? "Lotada" : "Entrar"}</Button>
              }
            </motion.div>
          );
          })}
        </AnimatePresence>
      </div>

      {rooms.length === 0 && <p className="text-center text-foreground/60">Nenhuma sala ativa. Manifeste a primeira!</p>}
    </div>
  );
}