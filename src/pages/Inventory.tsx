import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Backpack, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import EmojiIcon from "@/components/shared/EmojiIcon";
const RARITY_STYLE: Record<string, string> = {
  common: "border-muted",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-yellow-500/60 shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
};

export default function Inventory() {
  const { user } = useAuth();
  const [inv, setInv] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    if (!user) return;
    const { data: hogsData } = await supabase
      .from("user_inventory")
      .select("*, item:hogsmeade_items(*)")
      .eq("user_id", user.id)
      .gt("quantity", 0);
      
    const { data: diagonData } = await supabase
      .from("diagon_purchases")
      .select("*, item:diagon_shop_items(*)")
      .eq("user_id", user.id);

    const diagonGrouped = (diagonData || []).reduce((acc: any, row: any) => {
      if (!row.item) return acc;
      const itemId = row.item_id;
      if (!acc[itemId]) {
        acc[itemId] = {
          id: row.id,
          user_id: user.id,
          item_id: itemId,
          quantity: 1,
          equipped: false,
          obtained_at: row.purchased_at,
          item: {
            ...row.item,
            emoji: row.item.icon || "✨",
            category: "diagon_alley",
            equippable: false
          }
        };
      } else {
        acc[itemId].quantity += 1;
      }
      return acc;
    }, {});

    const combined = [...(hogsData || []), ...Object.values(diagonGrouped)];
    combined.sort((a: any, b: any) => new Date(b.obtained_at).getTime() - new Date(a.obtained_at).getTime());
    
    setInv(combined);
  };
  useEffect(() => { load(); }, [user?.id]);

  const toggleEquip = async (row: any) => {
    const { error } = await supabase
      .from("user_inventory")
      .update({ equipped: !row.equipped })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(row.equipped ? "Item desequipado" : "✨ Item equipado!");
    load();
  };

  const filtered = filter === "all" ? inv : inv.filter(r => r.item?.category === filter);
  const categories = Array.from(new Set(inv.map(r => r.item?.category).filter(Boolean)));

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient flex items-center gap-2">
            <Backpack /> Mochila Mágica
          </h1>
          <p className="text-sm text-muted-foreground">
            {inv.length} {inv.length === 1 ? "item" : "itens"} na sua mochila
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/hogsmeade"><Button variant="outline" size="sm"><EmojiIcon e="🏪" /> Hogsmeade</Button></Link>
          <Link to="/dashboard/item-trades"><Button size="sm"><EmojiIcon e="🤝" /> Trocas</Button></Link>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-heading border ${
              filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >Tudo</button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c!)}
              className={`px-3 py-1 rounded-full text-xs font-heading border capitalize ${
                filter === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
              }`}
            >{c}</button>
          ))}
        </div>
      )}

      {inv.length === 0 ? (
        <div className="glass-premium rounded-2xl p-12 text-center">
          <Backpack size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Sua mochila está vazia.</p>
          <Link to="/dashboard/hogsmeade"><Button>Visitar Hogsmeade</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(row => (
            <div key={row.id} className={`glass-premium rounded-2xl p-4 border-2 ${RARITY_STYLE[row.item?.rarity ?? 'common']} relative`}>
              {row.equipped && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                  <Sparkles size={10} className="mr-1" /> Equipado
                </Badge>
              )}
              <div className="text-5xl text-center mb-2">{row.item?.emoji}</div>
              <h3 className="font-heading text-sm text-center line-clamp-1">{row.item?.name}</h3>
              <p className="text-[10px] text-muted-foreground text-center capitalize mb-1">{row.item?.category} • x{row.quantity}</p>
              <p className="text-[10px] text-muted-foreground text-center line-clamp-2 mb-3 min-h-[24px]">{row.item?.description}</p>
              {row.item?.equippable && (
                <Button size="sm" variant={row.equipped ? "outline" : "default"} className="w-full" onClick={() => toggleEquip(row)}>
                  {row.equipped ? "Desequipar" : "Equipar"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}