import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, ShoppingBag, Plus, X } from "lucide-react";

type Listing = {
  id: string;
  seller_id: string;
  sticker_id: string;
  price_galeons: number;
  status: string;
  created_at: string;
  sticker?: { character_name: string; rarity: string; image_url: string; house: string };
  seller?: { username: string };
};

type OwnedSticker = {
  sticker_id: string;
  sticker: { id: string; character_name: string; rarity: string; image_url: string };
};

const rarityColors: Record<string, string> = {
  gold: "text-yellow-400 border-yellow-400/50",
  silver: "text-gray-300 border-gray-300/50",
  bronze: "text-amber-600 border-amber-600/50",
};

export default function Marketplace() {
  const user = useAuth((s) => s.user);
  const [listings, setListings] = useState<Listing[]>([]);
  const [owned, setOwned] = useState<OwnedSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSticker, setSelectedSticker] = useState<string>("");
  const [price, setPrice] = useState<string>("50");

  const load = async () => {
    setLoading(true);
    const { data: l } = await supabase
      .from("marketplace_listings")
      .select("*, sticker:stickers(character_name,rarity,image_url,house)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (l || []) as any[];
    const sellerIds = Array.from(new Set(rows.map((r) => r.seller_id)));
    let sellers: Record<string, string> = {};
    if (sellerIds.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", sellerIds);
      (ps || []).forEach((p: any) => (sellers[p.user_id] = p.username));
    }
    setListings(rows.map((r) => ({ ...r, seller: { username: sellers[r.seller_id] } })));

    if (user) {
      const { data: o } = await supabase
        .from("user_stickers")
        .select("sticker_id, sticker:stickers(id,character_name,rarity,image_url)")
        .eq("user_id", user.id);
      setOwned((o || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const createListing = async () => {
    if (!selectedSticker) return toast.error("Escolha uma figurinha");
    const p = parseInt(price);
    if (!p || p <= 0) return toast.error("Preço inválido");
    const { error } = await supabase.rpc("create_marketplace_listing", {
      p_sticker_id: selectedSticker,
      p_price: p,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Anúncio publicado!");
      setSelectedSticker("");
      setPrice("50");
      load();
    }
  };

  const buy = async (id: string) => {
    const { error } = await supabase.rpc("buy_marketplace_listing", { p_listing_id: id });
    if (error) toast.error(error.message);
    else {
      toast.success("Compra realizada!");
      load();
    }
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc("cancel_marketplace_listing", { p_listing_id: id });
    if (error) toast.error(error.message);
    else {
      toast.success("Anúncio cancelado");
      load();
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-primary flex items-center gap-3 flex-wrap">
            <ShoppingBag className="w-7 h-7 sm:w-9 sm:h-9" /> Mercado do Beco
          </h1>
          <p className="text-muted-foreground mt-2">
            Compre e venda figurinhas com outros bruxos. Taxa do Gringotes: 10%.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Novo anúncio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Anunciar figurinha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Figurinha</label>
                <select
                  className="w-full mt-1 bg-background border border-primary/30 rounded px-2 py-2"
                  value={selectedSticker}
                  onChange={(e) => setSelectedSticker(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {owned.map((o) => (
                    <option key={o.sticker_id} value={o.sticker_id}>
                      {o.sticker?.character_name} ({o.sticker?.rarity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Preço (Galeões)</label>
                <Input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <Button onClick={createListing} className="w-full">
                Publicar anúncio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading && <p className="text-center text-muted-foreground">Carregando...</p>}
      {!loading && listings.length === 0 && (
        <Card className="p-8 text-center bg-card/40 border-primary/20">
          <p className="text-muted-foreground">Nenhum anúncio ativo no momento.</p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {listings.map((l) => {
          const mine = user?.id === l.seller_id;
          return (
            <Card key={l.id} className="p-4 bg-card/60 border-primary/20 space-y-3">
              <div className="aspect-square rounded bg-background/40 flex items-center justify-center overflow-hidden">
                {l.sticker?.image_url ? (
                  <img
                    src={l.sticker.image_url}
                    alt={l.sticker.character_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🪄</span>
                )}
              </div>
              <div>
                <p className="font-heading text-sm truncate">{l.sticker?.character_name}</p>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${rarityColors[l.sticker?.rarity || ""] || ""}`}
                >
                  {l.sticker?.rarity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Coins className="w-4 h-4" /> {l.price_galeons}
                </div>
                <span className="text-xs text-muted-foreground">
                  @{l.seller?.username || "?"}
                </span>
              </div>
              {mine ? (
                <Button size="sm" variant="outline" className="w-full" onClick={() => cancel(l.id)}>
                  <X className="w-3 h-3 mr-1" /> Cancelar
                </Button>
              ) : (
                <Button size="sm" className="w-full" onClick={() => buy(l.id)}>
                  Comprar
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}