import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, MapPin } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface Room {
  id: string; slug: string; name: string; description: string; room_type: string;
  pos_x: number; pos_y: number; emoji: string | null; unlock_level: number; event_chance: number;
}

const EVENTS = [
  { type: "galeon", text: "Você encontrou uma bolsa de Galeões esquecida!", reward: { galeons: 25 } },
  { type: "xp", text: "Um quadro te dá uma aula rápida. +50 XP!", reward: { xp: 50 } },
  { type: "fantasma", text: "Pirraça aparece e foge rindo. Nada de mal feito.", reward: {} },
  { type: "feitico", text: "Você relembra um feitiço. +30 XP!", reward: { xp: 30 } },
  { type: "biscoito", text: "Um elfo te oferece biscoitos. Você se sente acolhido.", reward: { galeons: 5 } },
];

export default function CastleMap() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [visits, setVisits] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Room | null>(null);
  const [eventMsg, setEventMsg] = useState<string | null>(null);

  useEffect(() => { load(); }, [user?.id]);

  async function load() {
    const [r, v] = await Promise.all([
      supabase.from("castle_rooms" as any).select("*").order("unlock_level"),
      user ? supabase.from("room_visits" as any).select("room_id, visit_count").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    ]);
    setRooms((r.data as any[]) || []);
    const map: Record<string, number> = {};
    ((v as any).data || []).forEach((x: any) => { map[x.room_id] = x.visit_count; });
    setVisits(map);
  }

  async function visit(room: Room) {
    if (!user) return;
    if ((profile?.level || 1) < room.unlock_level) {
      toast.error(`Você precisa do nível ${room.unlock_level} para entrar aqui.`);
      return;
    }
    setSelected(room);
    setEventMsg(null);

    const current = visits[room.id] || 0;
    await supabase.from("room_visits" as any).upsert({
      user_id: user.id, room_id: room.id, visit_count: current + 1, last_visited: new Date().toISOString(),
    }, { onConflict: "user_id,room_id" });

    // Roll event
    if (Math.random() < room.event_chance) {
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setEventMsg(ev.text);
      if (ev.reward.xp || ev.reward.galeons) {
        await supabase.from("profiles").update({
          xp: (profile?.xp || 0) + (ev.reward.xp || 0),
          galeons: (profile?.galeons || 0) + (ev.reward.galeons || 0),
        }).eq("user_id", user.id);
      }
    }
    load();
  }

  const userLevel = profile?.level || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="text-4xl"><EmojiIcon e="🗺️" /></div>
        <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Mapa do Castelo</h1>
        <p className="text-muted-foreground text-sm">Explore Hogwarts. Cada sala guarda surpresas.</p>
      </header>

      <Card className="relative w-full aspect-[16/10] bg-gradient-to-br from-amber-950/40 via-stone-900/60 to-slate-950/80 border-2 border-primary/30 overflow-hidden">
        {/* Castle silhouette decoration */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_70%,rgba(212,175,55,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10" />

        {rooms.map(r => {
          const locked = userLevel < r.unlock_level;
          const visited = !!visits[r.id];
          return (
            <button key={r.id}
              style={{ left: `${r.pos_x}%`, top: `${r.pos_y}%` }}
              onClick={() => visit(r)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center transition-all hover:scale-110 ${locked ? "opacity-40" : ""}`}>
              <div className={`text-3xl sm:text-4xl drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all ${
                visited ? "scale-110" : ""
              } ${selected?.id === r.id ? "animate-pulse" : ""}`}>
                {locked ? "🔒" : (r.emoji || "🏰")}
              </div>
              <span className="mt-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] sm:text-[10px] text-primary font-heading uppercase tracking-wider whitespace-nowrap border border-primary/30">
                {r.name}
              </span>
            </button>
          );
        })}
      </Card>

      {selected && (
        <Card className="p-6 border-primary/30 bg-gradient-to-br from-card to-amber-950/10">
          <div className="flex items-start gap-4 mb-3">
            <div className="text-5xl">{selected.emoji}</div>
            <div className="flex-1">
              <h3 className="font-heading text-xl text-foreground">{selected.name}</h3>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{selected.room_type}</Badge>
                <Badge variant="outline" className="text-[10px]">Visitas: {visits[selected.id] || 0}</Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
          </div>
          <p className="text-sm text-muted-foreground italic font-serif">{selected.description}</p>
          {eventMsg && (
            <div className="mt-4 p-4 rounded-xl border border-primary/40 bg-primary/10 text-foreground text-sm">
              <p className="font-heading text-primary text-xs uppercase tracking-widest mb-1"><EmojiIcon e="✨" /> Evento mágico!</p>
              {eventMsg}
            </div>
          )}
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground">
        <MapPin className="inline mr-1" size={12}/> {Object.keys(visits).length} de {rooms.length} salas exploradas
      </div>
    </div>
  );
}