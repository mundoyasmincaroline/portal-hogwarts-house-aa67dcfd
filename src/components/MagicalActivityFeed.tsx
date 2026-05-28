import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Activity = { id: string; text: string };

export default function MagicalActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const items: Activity[] = [];

      // últimos 5 posts do feed
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, profiles:user_id(username)")
        .order("created_at", { ascending: false })
        .limit(5);
      (posts || []).forEach((p: any) => {
        const who = p.profiles?.username ? `@${p.profiles.username}` : "Alguém";
        const txt = (p.content || "").slice(0, 60);
        items.push({ id: `p-${p.id}`, text: `${who} publicou: "${txt}${(p.content || "").length > 60 ? "…" : ""}"` });
      });

      // últimos 3 personagens criados
      const { data: chars } = await supabase
        .from("characters")
        .select("id, full_name, house, character_type")
        .order("created_at", { ascending: false })
        .limit(3);
      (chars || []).forEach((c: any) => {
        items.push({ id: `c-${c.id}`, text: `✨ ${c.full_name} ingressou em ${c.house} (${c.character_type === "oc" ? "OC" : "Canon"})` });
      });

      // últimos 3 pontos de casa
      const { data: hp } = await supabase
        .from("house_points")
        .select("id, house, points, reason")
        .order("created_at", { ascending: false })
        .limit(3);
      (hp || []).forEach((h: any) => {
        const sign = h.points >= 0 ? "+" : "";
        items.push({ id: `h-${h.id}`, text: `🏆 ${sign}${h.points} pts para ${h.house}${h.reason ? ` — ${h.reason}` : ""}` });
      });

      // Embaralha para alternar tipos
      const shuffled = items.sort(() => Math.random() - 0.5);
      setActivities(shuffled.length ? shuffled : [
        { id: "fallback", text: "O castelo está em silêncio mágico... seja o primeiro a postar!" }
      ]);
    })();
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % activities.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activities.length]);

  const activity = activities[index];
  if (!activity) return null;

  return (
    <div className="w-full bg-black/60 border-y border-white/5 py-1.5 overflow-hidden">
      <div className="flex items-center justify-center gap-2 px-4">
        <Sparkles size={12} className="text-primary animate-pulse shrink-0" />
        <span className="text-[10px] font-heading text-white/70 truncate">
          {activity.text}
        </span>
      </div>
    </div>
  );
}
