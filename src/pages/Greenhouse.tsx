import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Plant = { id: string; slug: string; name: string; description: string | null; icon: string; rarity: string; seed_cost: number; grow_hours: number };
type Plot = { id: string; plant_id: string | null; planted_at: string | null; ready_at: string | null; slot_number: number };
type Ing = { ingredient_slug: string; quantity: number };

export default function Greenhouse() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [ings, setIngs] = useState<Ing[]>([]);
  const [pick, setPick] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: p } = await supabase.from("plant_catalog" as any).select("*").eq("active", true).order("seed_cost");
    const { data: { user } } = await supabase.auth.getUser();
    setPlants((p as any) || []);
    if (user) {
      const { data: pl } = await supabase.from("greenhouse_plots" as any).select("*").eq("user_id", user.id);
      const { data: i } = await supabase.from("user_ingredients" as any).select("ingredient_slug,quantity").eq("user_id", user.id);
      setPlots((pl as any) || []);
      setIngs((i as any) || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function call(rpc: string, args: any) {
    setLoading(true);
    const { data, error } = await supabase.rpc(rpc as any, args);
    setLoading(false);
    if (error) return toast.error(error.message);
    const d = data as any;
    if (d?.yield) toast.success(`Colheu ${d.yield}× ${d.ingredient}! 🌿`);
    else toast.success("Pronto!");
    load();
  }

  const slots = Array.from({ length: 6 }, (_, i) => i + 1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🌿" /> Estufa de Herbologia</h1>
        <p className="text-muted-foreground">Cultive ingredientes para suas poções. Você tem 6 vasos.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slots.map((s) => {
          const plot = plots.find((p) => p.slot_number === s);
          const plant = plot && plot.plant_id ? plants.find((p) => p.id === plot.plant_id) : null;
          const ready = plot?.ready_at ? new Date(plot.ready_at) <= new Date() : false;
          return (
            <Card key={s} className="p-4 space-y-3 bg-card/60 border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Vaso #{s}</span>
                {plant && <Badge variant="outline">{plant.rarity}</Badge>}
              </div>
              {plant ? (
                <>
                  <div className="text-center py-4">
                    <div className="text-6xl">{plant.icon}</div>
                    <p className="font-heading mt-2">{plant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ready ? "🌟 Pronta para colher!" : `Pronta em ${plot?.ready_at ? new Date(plot.ready_at).toLocaleString("pt-BR") : "..."}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" disabled={loading} onClick={() => call("water_plot", { p_slot: s })}><EmojiIcon e="💧" /> Regar</Button>
                    <Button size="sm" disabled={loading || !ready} onClick={() => call("harvest_plot", { p_slot: s })}><EmojiIcon e="🌾" /> Colher</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center py-6 text-muted-foreground text-4xl"><EmojiIcon e="🟫" /></div>
                  <Select value={pick[s] || ""} onValueChange={(v) => setPick({ ...pick, [s]: v })}>
                    <SelectTrigger><SelectValue placeholder="Escolha uma semente" /></SelectTrigger>
                    <SelectContent>
                      {plants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.icon} {p.name} ({p.seed_cost} G)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full" disabled={loading || !pick[s]} onClick={() => call("plant_seed", { p_slot: s, p_plant_id: pick[s] })}>
                    Plantar
                  </Button>
                </>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-card/60 border-primary/20">
        <h2 className="font-heading mb-3"><EmojiIcon e="📦" /> Armazém de Ingredientes</h2>
        {ings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem ingredientes ainda. Plante e colha!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ings.map((i) => {
              const pl = plants.find((p) => p.slug === i.ingredient_slug);
              return (
                <Badge key={i.ingredient_slug} variant="outline" className="text-sm py-1.5">
                  {pl?.icon || "🌱"} {pl?.name || i.ingredient_slug} × {i.quantity}
                </Badge>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}