import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Coins, Search, ShoppingBag, Loader2, Map as MapIcon } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
const RARITY_STYLE: Record<string, string> = {
  common: "border-muted text-muted-foreground",
  uncommon: "border-green-500/50 text-green-400",
  rare: "border-blue-500/50 text-blue-400",
  epic: "border-purple-500/50 text-purple-400",
  legendary: "border-yellow-500/60 text-yellow-400 shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
};

const CATEGORIES = [
  { id: "all", label: "Tudo", emoji: "🏪" },
  { id: "wand", label: "Varinhas", emoji: "🪄" },
  { id: "potion", label: "Poções", emoji: "🧪" },
  { id: "sweet", label: "Doces", emoji: "🍬" },
  { id: "robe", label: "Vestes", emoji: "🥻" },
  { id: "accessory", label: "Acessórios", emoji: "🎩" },
  { id: "pet", label: "Mascotes", emoji: "🦉" },
  { id: "broom", label: "Vassouras", emoji: "🧹" },
  { id: "book", label: "Livros", emoji: "📖" },
];

export default function Hogsmeade() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [galeons, setGaleons] = useState(0);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("hogsmeade_items")
      .select("*")
      .eq("active", true)
      .order("price_galeons");
    setItems(data ?? []);
    if (user) {
      const { data: p } = await supabase.from("profiles").select("galeons").eq("user_id", user.id).maybeSingle();
      setGaleons(p?.galeons ?? 0);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const buy = async (id: string, name: string) => {
    setBuyingId(id);
    setLoading(true);
    const { data, error } = await supabase.rpc("buy_hogsmeade_item", { p_item_id: id, p_qty: 1 });
    setLoading(false);
    setBuyingId(null);
    if (error) return toast.error(error.message);
    toast.success(`✨ ${name} adquirido!`);
    load();
  };

  const filtered = items.filter(i =>
    (category === "all" || i.category === category) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient flex items-center gap-2">
            <EmojiIcon e="🏪" /> Vila de Hogsmeade
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Compre itens mágicos com seus Galeões</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => window.location.href='/dashboard/world-map'}>
              <MapIcon size={14} className="mr-1" /> Mapa Mundial
            </Button>
          </div>
        </div>
        <div className="glass-premium rounded-xl px-4 py-2 flex items-center gap-2">
          <Coins className="text-primary" size={20} />
          <span className="font-heading text-xl text-gold-gradient">{galeons}</span>
          <span className="text-xs text-muted-foreground">Galeões</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-4">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2 rounded-full text-xs font-heading border transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
              category === c.id
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-card/40 border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="text-sm">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Procurar item mágico..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`glass-premium rounded-2xl p-4 border-2 transition-all hover:scale-[1.02] ${RARITY_STYLE[item.rarity]}`}
          >
            <div className="text-5xl text-center mb-2 drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]">{item.emoji}</div>
            <h3 className="font-heading text-sm text-center mb-1 line-clamp-1">{item.name}</h3>
            <Badge variant="outline" className={`text-[9px] mb-2 mx-auto block w-fit ${RARITY_STYLE[item.rarity]}`}>
              {item.rarity}
            </Badge>
            <p className="text-[11px] text-muted-foreground text-center line-clamp-2 mb-3 min-h-[28px]">
              {item.description}
            </p>
            <div className="flex items-center justify-center gap-1 mb-3">
              <Coins size={14} className="text-primary" />
              <span className="font-heading text-base text-gold-gradient">{item.price_galeons}</span>
            </div>
            <Button
              size="sm"
              className={`w-full transition-all ${buyingId === item.id ? "scale-95 opacity-50" : ""}`}
              disabled={loading || galeons < item.price_galeons}
              onClick={() => buy(item.id, item.name)}
              variant={galeons < item.price_galeons ? "outline" : "default"}
            >
              {buyingId === item.id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>
                  <ShoppingBag size={14} className="mr-1" />
                  {galeons < item.price_galeons ? "Sem Galeões" : "Comprar"}
                </>
              )}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">Nenhum item encontrado.</p>
        )}
      </div>
    </div>
  );
}