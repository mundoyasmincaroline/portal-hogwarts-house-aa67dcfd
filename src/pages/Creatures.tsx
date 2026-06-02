import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

type Catalog = { id: string; name: string; species: string; description: string | null; icon: string; rarity: string; adopt_cost: number };
type Mine = { id: string; creature_id: string; nickname: string; bond: number; hunger: number; training_level: number };

export default function Creatures() {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [nickname, setNickname] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: c } = await supabase.from("creature_catalog" as any).select("*").eq("active", true).order("adopt_cost");
    const { data: { user } } = await supabase.auth.getUser();
    setCatalog((c as any) || []);
    if (user) {
      const { data: m } = await supabase.from("user_creatures" as any).select("*").eq("user_id", user.id);
      setMine((m as any) || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function adopt(id: string) {
    const nick = (nickname[id] || "").trim();
    if (!nick) return toast.error("Dê um apelido à criatura");
    setLoading(true);
    const { error } = await supabase.rpc("adopt_creature" as any, { p_creature_id: id, p_nickname: nick });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Adotada! 🐾");
    load();
  }

  async function act(rpc: string, id: string) {
    setLoading(true);
    const { error } = await supabase.rpc(rpc as any, { p_user_creature_id: id });
    setLoading(false);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary">🐉 Criaturas Mágicas</h1>
        <p className="text-muted-foreground">Sua reserva pessoal. Adote, alimente e treine.</p>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">Minha Reserva ({mine.length})</TabsTrigger>
          <TabsTrigger value="adopt">Adotar</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {mine.length === 0 && <p className="text-muted-foreground">Você ainda não possui criaturas.</p>}
          {mine.map((m) => {
            const c = catalog.find((x) => x.id === m.creature_id);
            return (
              <Card key={m.id} className="p-4 space-y-3 bg-card/60 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{c?.icon || "🐾"}</div>
                  <div>
                    <h3 className="font-heading">{m.nickname}</h3>
                    <p className="text-xs text-muted-foreground">{c?.name}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Vínculo</span><span>{m.bond}/100</span></div>
                  <Progress value={m.bond} className="h-1.5" />
                  <div className="flex justify-between"><span>Saciedade</span><span>{m.hunger}/100</span></div>
                  <Progress value={m.hunger} className="h-1.5" />
                  <div className="flex justify-between"><span>Treino</span><span>Nv. {m.training_level}/10</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" disabled={loading} onClick={() => act("feed_creature", m.id)}>🍖 Alimentar</Button>
                  <Button size="sm" variant="outline" disabled={loading} onClick={() => act("train_creature", m.id)}>🎯 Treinar</Button>
                </div>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="adopt" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {catalog.map((c) => (
            <Card key={c.id} className="p-4 space-y-3 bg-card/60 border-primary/20">
              <div className="flex items-start justify-between">
                <div className="text-4xl">{c.icon}</div>
                <Badge variant="outline">{c.rarity}</Badge>
              </div>
              <div>
                <h3 className="font-heading">{c.name}</h3>
                <p className="text-xs text-muted-foreground italic">{c.species}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
              </div>
              <Input placeholder="Apelido" value={nickname[c.id] || ""} onChange={(e) => setNickname({ ...nickname, [c.id]: e.target.value })} />
              <Button size="sm" className="w-full" disabled={loading} onClick={() => adopt(c.id)}>Adotar por {c.adopt_cost} G</Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}