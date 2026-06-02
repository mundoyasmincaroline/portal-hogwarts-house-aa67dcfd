import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Shop = { id: string; slug: string; name: string; description: string | null; icon: string };
type Item = { id: string; shop_id: string; name: string; description: string | null; icon: string; price_galeons: number; rarity: string; exclusive: boolean; stock: number };

export default function DiagonAlley() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("diagon_shops" as any).select("*").eq("active", true).order("name");
      const { data: i } = await supabase.from("diagon_shop_items" as any).select("*").order("price_galeons");
      setShops((s as any) || []);
      setItems((i as any) || []);
      if (s && s.length) setActive((s as any)[0].id);
    })();
  }, []);

  async function buy(id: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("buy_diagon_item" as any, { p_item_id: id });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Compra realizada! 🛍️");
    const { data: i } = await supabase.from("diagon_shop_items" as any).select("*").order("price_galeons");
    setItems((i as any) || []);
  }

  const rarityColor: Record<string, string> = {
    common: "bg-muted text-foreground",
    rare: "bg-blue-500/20 text-blue-300",
    epic: "bg-purple-500/20 text-purple-300",
    legendary: "bg-amber-500/20 text-amber-300",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-primary">🛍️ Beco Diagonal</h1>
        <p className="text-muted-foreground">A rua mágica mais famosa do mundo bruxo.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {shops.map((s) => (
          <Button key={s.id} variant={active === s.id ? "default" : "outline"} onClick={() => setActive(s.id)} className="whitespace-nowrap">
            <span className="mr-2">{s.icon}</span>{s.name}
          </Button>
        ))}
      </div>

      {shops.filter((s) => s.id === active).map((s) => (
        <Card key={s.id} className="p-4 bg-card/60 border-primary/30">
          <h2 className="font-heading text-xl">{s.icon} {s.name}</h2>
          <p className="text-sm text-muted-foreground italic">{s.description}</p>
        </Card>
      ))}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.filter((i) => i.shop_id === active).map((i) => (
          <Card key={i.id} className="p-4 space-y-3 bg-card/60 border-primary/20 hover:border-primary/60 transition">
            <div className="flex items-start justify-between">
              <div className="text-4xl">{i.icon}</div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={rarityColor[i.rarity] || ""}>{i.rarity}</Badge>
                {i.exclusive && <Badge variant="outline" className="border-amber-500/50 text-amber-300">Exclusivo</Badge>}
              </div>
            </div>
            <div>
              <h3 className="font-heading">{i.name}</h3>
              <p className="text-xs text-muted-foreground">{i.description}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-primary font-bold">{i.price_galeons} G</span>
              <Button size="sm" disabled={loading || i.stock === 0} onClick={() => buy(i.id)}>
                {i.stock === 0 ? "Esgotado" : "Comprar"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}