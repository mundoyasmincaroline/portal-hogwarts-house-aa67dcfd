import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface NPC {
  id: string; slug: string; name: string; role: string; house: string | null;
  personality: string; avatar_emoji: string | null; location: string | null;
}

const HOUSE_COLOR: Record<string, string> = {
  gryffindor: "border-red-500/40 bg-red-500/5",
  slytherin: "border-green-500/40 bg-green-500/5",
  ravenclaw: "border-blue-500/40 bg-blue-500/5",
  hufflepuff: "border-yellow-500/40 bg-yellow-500/5",
};

export default function NPCs() {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    supabase.from("npcs" as any).select("*").eq("is_active", true).then(r => {
      setNpcs((r.data as any[]) || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center p-12 text-muted-foreground">Convocando os personagens...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="text-center space-y-2">
        <div className="text-4xl"><EmojiIcon e="🗣️" /></div>
        <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient">Salão dos Retratos Falantes</h1>
        <p className="text-muted-foreground text-sm">Converse com personagens icônicos. Eles têm vida, memória e opiniões.</p>
      </header>

      {npcs.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <div className="text-6xl opacity-30"><EmojiIcon e="🖼️" /></div>
          <p className="font-heading text-xl text-muted-foreground">Os retratos ainda dormem...</p>
          <p className="text-xs text-muted-foreground/60 italic">Novos personagens serão convocados em breve.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {npcs.map(n => (
          <Card key={n.id}
            className={`p-5 cursor-pointer hover:scale-[1.03] transition-all border-2 ${n.house ? HOUSE_COLOR[n.house] : "border-primary/30 bg-primary/5"}`}
            onClick={() => nav(`/dashboard/npc/${n.slug}`)}>
            <div className="flex items-start gap-3">
              <div className="text-5xl">{n.avatar_emoji || "🧙"}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg text-foreground leading-tight">{n.name}</h3>
                <p className="text-[11px] text-primary/80 uppercase tracking-wider font-bold">{n.role}</p>
                {n.location && <Badge variant="outline" className="mt-2 text-[10px]">📍 {n.location}</Badge>}
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic mt-3 line-clamp-2">{n.personality}</p>
            <div className="mt-3 flex items-center gap-1 text-primary text-xs font-heading uppercase tracking-wider">
              <MessageCircle size={12} /> Conversar
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}