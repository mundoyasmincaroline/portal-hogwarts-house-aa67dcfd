import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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

// Slugs de salas que possuem uma página real no portal
const SLUG_TO_ROUTE: Record<string, { path: string; label: string }> = {
  "salao-principal": { path: "/dashboard/chats", label: "Entrar no Salão Principal" },
  "biblioteca": { path: "/dashboard/grimoire", label: "Abrir Grimório" },
  "campo-quadribol": { path: "/dashboard/quidditch", label: "Ir ao Campo de Quadribol" },
  "sala-precisa": { path: "/dashboard/room", label: "Entrar na Sala Precisa" },
  "masmorras": { path: "/dashboard/potions-lab", label: "Descer ao Laboratório de Poções" },
  "torre-astronomia": { path: "/dashboard/canon-lessons", label: "Aula de Astronomia" },
  "corujal": { path: "/dashboard/dm", label: "Ler Mensagens (Corujal)" },
  "floresta-proibida": { path: "/dashboard/creatures", label: "Explorar Criaturas" },
  "jardim": { path: "/dashboard/greenhouse", label: "Ir à Estufa" },
  "sala-de-transfiguracao": { path: "/dashboard/classes", label: "Entrar na Aula" },
  "cabana-hagrid": { path: "/dashboard/creatures", label: "Visitar a Cabana" },
  "sala-comunal-grifinoria": { path: "/dashboard/chats", label: "Sala Comunal" },
  "sala-comunal-sonserina": { path: "/dashboard/chats", label: "Sala Comunal" },
  "camara-secreta": { path: "/dashboard/dark-arts", label: "Adentrar a Câmara" },
  "ponte-suspensa": { path: "/dashboard/castle-entrance", label: "Atravessar a Ponte" },
};

export default function CastleMap() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [visits, setVisits] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Room | null>(null);
  const [eventMsg, setEventMsg] = useState<string | null>(null);
  const [liveExplorers, setLiveExplorers] = useState<any[]>([]);

  useEffect(() => { 
    load();
    loadExplorers();
  }, [user?.id]);

  async function loadExplorers() {
    // Busca perfis que ganharam XP recentemente (simulando atividade)
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name")
      .order("updated_at", { ascending: false })
      .limit(5);
    setLiveExplorers(data || []);
  }

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
        await updateProfile({
          xp: (profile?.xp || 0) + (ev.reward.xp || 0),
          galeons: (profile?.galeons || 0) + (ev.reward.galeons || 0),
        });
      }
    }
    load();
  }

  const userLevel = profile?.level || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left space-y-2">
          <div className="text-4xl"><EmojiIcon e="🗺️" /></div>
          <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Mapa do Castelo</h1>
          <div className="flex flex-col items-center md:items-start gap-2 mt-2">
            <p className="text-muted-foreground text-sm max-w-md">Explore Hogwarts clicando nos ícones. Cada sala guarda segredos, XP e até Galeões escondidos!</p>
            <div className="flex gap-3 text-[10px] uppercase tracking-widest font-heading text-primary/60">
              <span className="flex items-center gap-1"><EmojiIcon e="🔒" size={12} /> Nível Insuficiente</span>
              <span className="flex items-center gap-1"><EmojiIcon e="✨" size={12} /> Evento Aleatório</span>
            </div>
          </div>
        </div>

        {liveExplorers.length > 0 && (
          <div className="glass p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col items-center md:items-end gap-2">
            <p className="text-[10px] font-heading text-primary uppercase tracking-widest font-bold">Exploradores Online</p>
            <div className="flex -space-x-3 overflow-hidden">
              {liveExplorers.map((ex, i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-primary/20 overflow-hidden bg-black/40 group relative">
                  <img src={ex.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ex.username}`} alt={ex.username} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold truncate px-1">@{ex.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-heading text-primary/80">
          <span>Progresso de Exploração</span>
          <span>{Object.keys(visits).length} / {rooms.length} Salas</span>
        </div>
        <div className="h-2 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(Object.keys(visits).length / Math.max(1, rooms.length)) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 shadow-[0_0_10px_rgba(212,175,55,0.4)]"
          />
        </div>
      </div>


      <Card className="relative w-full aspect-[16/10] bg-gradient-to-br from-amber-950/40 via-stone-900/60 to-slate-950/80 border-2 border-primary/30 overflow-hidden">
        {/* Castle silhouette decoration */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_70%,rgba(212,175,55,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10" />

        {rooms.map(r => {
          const locked = userLevel < r.unlock_level;
          const visited = !!visits[r.id];
          const clampedX = Math.min(95, Math.max(5, r.pos_x));
          const clampedY = Math.min(92, Math.max(8, r.pos_y));
          return (
            <button key={r.id}
              style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
              onClick={() => visit(r)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center justify-center text-center transition-all hover:scale-110 ${locked ? "opacity-40" : ""}`}>
              <div className={`text-3xl sm:text-4xl drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] transition-all ${
                visited ? "scale-110" : ""
              } ${selected?.id === r.id ? "animate-pulse" : ""}`}>
                {locked ? "🔒" : (r.emoji || "🏰")}
              </div>
              <span className="mt-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] sm:text-[10px] text-primary font-heading uppercase tracking-wider border border-primary/30 max-w-[140px] truncate">
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
          {SLUG_TO_ROUTE[selected.slug] && (
            <Button
              variant="magical"
              className="mt-4 w-full"
              onClick={() => navigate(SLUG_TO_ROUTE[selected.slug].path)}
            >
              ✨ {SLUG_TO_ROUTE[selected.slug].label}
            </Button>
          )}
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground">
        <MapPin className="inline mr-1" size={12}/> {Object.keys(visits).length} de {rooms.length} salas exploradas
      </div>
    </div>
  );
}