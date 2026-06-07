import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Recipe = { id: string; name: string; description: string | null; icon: string; difficulty: number; brew_minutes: number; ingredients: Record<string, number>; xp_reward: number; galeon_reward: number; min_level: number };
type Brew = { id: string; recipe_id: string; status: string; ready_at: string; success: boolean | null };
type Plant = { slug: string; name: string; icon: string };

export default function PotionsLab() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [brews, setBrews] = useState<Brew[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<number | "all">("all");
  const [showMissing, setShowMissing] = useState(false);

  async function load() {
    const [{ data: r }, { data: pl }, { data: { user } }] = await Promise.all([
      supabase.from("potion_recipes" as any).select("*").eq("active", true).order("difficulty"),
      supabase.from("plant_catalog" as any).select("slug,name,icon"),
      supabase.auth.getUser(),
    ]);
    setRecipes((r as any) || []);
    setPlants((pl as any) || []);
    if (user) {
      const [{ data: b }, { data: inv }] = await Promise.all([
        supabase.from("user_potions" as any).select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(15),
        supabase.from("user_ingredients" as any).select("ingredient_slug, quantity").eq("user_id", user.id)
      ]);
      setBrews((b as any) || []);
      const invMap: Record<string, number> = {};
      (inv || []).forEach((i: any) => invMap[i.ingredient_slug] = i.quantity);
      setInventory(invMap);
    }
  }
  useEffect(() => { load(); }, []);

  async function brew(id: string) {
    setLoading(true);
    const { error } = await supabase.rpc("brew_potion" as any, { p_recipe_id: id });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Caldeirão fervendo! 🔥");
    load();
  }

  async function collect(id: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("collect_potion" as any, { p_potion_id: id });
    setLoading(false);
    if (error) return toast.error(error.message);
    const d = data as any;
    toast[d?.success ? "success" : "error"](d?.success ? "Poção pronta! ✨" : "Poção falhou! 💥");
    load();
  }

  const ingName = (slug: string) => plants.find((p) => p.slug === slug);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary"><EmojiIcon e="🧪" /> Laboratório de Poções</h1>
        <p className="text-muted-foreground">Combine ingredientes da estufa em receitas lendárias.</p>
      </div>

      <Tabs defaultValue="brewing">
        <TabsList>
          <TabsTrigger value="brewing">No Caldeirão ({brews.filter(b => b.status === "brewing").length})</TabsTrigger>
          <TabsTrigger value="recipes">Receitas ({recipes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="brewing" className="space-y-3 mt-4">
          {brews.length === 0 && <p className="text-muted-foreground">Nada fervendo.</p>}
          {brews.map((b) => {
            const r = recipes.find((x) => x.id === b.recipe_id);
            const ready = new Date(b.ready_at) <= new Date();
            return (
              <Card key={b.id} className={`p-4 flex items-center justify-between transition-all ${ready ? "bg-primary/10 border-primary animate-pulse" : "bg-card/60 border-primary/20"}`}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{r?.icon || "🧪"}</div>
                  <div>
                    <h3 className="font-heading">{r?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Status: {b.status === "brewing" ? (ready ? "Pronta!" : "Fervendo... " + new Date(b.ready_at).toLocaleString("pt-BR")) : b.status === "success" ? "✅ Sucesso" : "💥 Falhou"}
                    </p>
                  </div>
                </div>
                {b.status === "brewing" && (
                  <Button size="sm" disabled={loading || !ready} onClick={() => collect(b.id)}>Coletar</Button>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="recipes" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Input 
                placeholder="Procurar receita..." 
                className="max-w-xs bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex gap-1">
                <Button 
                  variant={filterDifficulty === "all" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setFilterDifficulty("all")}
                >
                  Todas
                </Button>
                {[1, 2, 3, 4, 5].map(d => (
                  <Button 
                    key={d}
                    variant={filterDifficulty === d ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFilterDifficulty(d)}
                  >
                    {d}★
                  </Button>
                ))}
              </div>
            </div>
            <Button 
              variant={showMissing ? "destructive" : "outline"} 
              size="sm" 
              onClick={() => setShowMissing(!showMissing)}
            >
              {showMissing ? "Ver Todas" : "Ver Faltantes"}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recipes
              .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .filter(r => filterDifficulty === "all" || r.difficulty === filterDifficulty)
              .filter(r => {
                if (!showMissing) return true;
                return Object.entries(r.ingredients).some(([slug, qty]) => (inventory[slug] || 0) < qty);
              })
              .map((r) => (
            <Card key={r.id} className="p-4 space-y-2 bg-card/60 border-primary/20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{r.icon}</div>
                  <div>
                    <h3 className="font-heading">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">{r.brew_minutes} min · Nv. {r.min_level}+</p>
                  </div>
                </div>
                <Badge variant="outline">{"⭐".repeat(r.difficulty)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <div className="text-xs">
                <span className="text-muted-foreground">Ingredientes: </span>
                {Object.entries(r.ingredients).map(([slug, qty]) => {
                  const p = ingName(slug);
                  const has = inventory[slug] || 0;
                  return (
                    <span key={slug} className={`mr-2 ${has < qty ? "text-destructive" : "text-green-500"}`}>
                      {p?.icon} {p?.name || slug} ({has}/{qty})
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-primary">+{r.xp_reward} XP · +{r.galeon_reward} G</span>
                <Button size="sm" disabled={loading} onClick={() => brew(r.id)}>Ferver</Button>
              </div>
            </Card>
          ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}