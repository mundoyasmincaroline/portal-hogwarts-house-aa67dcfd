import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Loc = { id: string; slug: string; name: string; region: string; description: string | null; icon: string; pos_x: number; pos_y: number; min_level: number; danger_level: number; travel_cost: number };

export default function WorldMap() {
  const [locs, setLocs] = useState<Loc[]>([]);
  const [active, setActive] = useState<Loc | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("world_locations" as any).select("*").eq("discoverable", true);
      setLocs((data as any) || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pos } = await supabase.from("user_position" as any).select("current_location_id").eq("user_id", user.id).maybeSingle();
        if (pos) setCurrentId((pos as any).current_location_id);
        const { data: trips } = await supabase.from("user_travels" as any).select("location_id").eq("user_id", user.id).eq("success", true);
        setVisited(new Set(((trips as any) || []).map((t: any) => t.location_id)));
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary">🌍 Mapa do Mundo Mágico</h1>
        <p className="text-muted-foreground">Clique em um marco para ver detalhes e viajar.</p>
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-950/30 via-card to-blue-950/30 border-primary/30" style={{ aspectRatio: "16 / 9" }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.15) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        {locs.map((l) => {
          const isCurrent = currentId === l.id;
          const isVisited = visited.has(l.id);
          return (
            <button
              key={l.id}
              onClick={() => setActive(l)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${l.pos_x}%`, top: `${l.pos_y}%` }}
            >
              <div className={`text-3xl transition-all hover:scale-150 drop-shadow-lg ${isCurrent ? "animate-pulse" : ""} ${isVisited ? "" : "grayscale opacity-70"}`}>
                {l.icon}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 mt-1 text-[10px] font-heading whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                {l.name}
              </div>
              {isCurrent && <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs">📍</div>}
            </button>
          );
        })}
      </Card>

      {active && (
        <Card className="p-4 bg-card/60 border-primary/30 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl">{active.icon} {active.name}</h2>
              <p className="text-xs text-muted-foreground">{active.region}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">Nv. {active.min_level}+</Badge>
              <Badge variant="outline" className="border-destructive/50">⚠️ {active.danger_level}/5</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{active.description}</p>
          <div className="flex gap-2">
            <Button asChild><Link to={`/dashboard/travel?to=${active.id}`}>✈️ Viajar ({active.travel_cost} G)</Link></Button>
            {visited.has(active.id) && <Badge className="bg-green-500/20 text-green-300 self-center">✓ Já visitou</Badge>}
          </div>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {locs.map((l) => (
          <Card key={l.id} className="p-3 bg-card/40 border-primary/10 hover:border-primary/40 cursor-pointer" onClick={() => setActive(l)}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{l.icon}</div>
              <div className="flex-1">
                <h3 className="font-heading text-sm">{l.name}</h3>
                <p className="text-xs text-muted-foreground">{l.region}</p>
              </div>
              {visited.has(l.id) && <span className="text-green-400">✓</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}