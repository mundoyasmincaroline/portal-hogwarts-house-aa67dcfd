import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ShoppingBag, Search } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Shop = { id: string; slug: string; name: string; description: string | null; icon: string };
type Item = { id: string; shop_id: string; name: string; description: string | null; icon: string; price_galeons: number; rarity: string; exclusive: boolean; stock: number };

export default function DiagonAlley() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
    const qty = quantities[id] || 1;
    setLoading(true);
    
    // Server-side Galeon validation (imaginary RPC that supports quantity)
    const { data, error } = await supabase.rpc("buy_diagon_item" as any, { 
      p_item_id: id,
      p_quantity: qty
    });
    
    setLoading(false);
    if (error) {
      if (error.message?.includes("insufficient_funds")) {
        toast.error("Saldo insuficiente de Galeões! Visite o Gringotes.");
      } else {
        return toast.error(error.message);
      }
      return;
    }
    
    toast.success(`${qty > 1 ? qty + ' itens comprados!' : 'Compra realizada!'} 🛍️`);
    const { data: i } = await supabase.from("diagon_shop_items" as any).select("*").order("price_galeons");
    setItems((i as any) || []);
    setQuantities(prev => ({ ...prev, [id]: 1 }));
  }

  const rarityColor: Record<string, string> = {
    common: "bg-muted text-foreground",
    rare: "bg-blue-500/20 text-blue-300",
    epic: "bg-purple-500/20 text-purple-300",
    legendary: "bg-amber-500/20 text-amber-300",
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 relative overflow-hidden min-h-screen">
      <div className="flex items-end justify-between gap-3 relative z-10">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-primary"><EmojiIcon e="🛍️" /> Beco Diagonal</h1>
          <p className="text-muted-foreground">A rua mágica mais famosa do mundo bruxo.</p>
        </div>
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className="relative bg-primary/20 p-3 rounded-full border border-primary/30 cursor-help"
        >
          <ShoppingCart className="w-6 h-6 text-primary" />
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
          >
            0
          </motion.span>
        </motion.div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {shops.map((s) => (
          <Button key={s.id} variant={active === s.id ? "default" : "outline"} onClick={() => setActive(s.id)} className="shrink-0 max-w-[78vw] sm:max-w-none px-4">
            <span className="shrink-0">{s.icon}</span><span className="truncate">{s.name}</span>
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
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-primary font-bold">{i.price_galeons} G</span>
              <Button size="sm" className="w-full sm:w-auto" disabled={loading || i.stock === 0} onClick={() => buy(i.id)}>
                {i.stock === 0 ? "Esgotado" : "Comprar"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}