import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Auctions() {
  const [items, setItems] = useState<any[]>([]);
  const [bid, setBid] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await (supabase as any).from("auctions").select("*").eq("status", "open").order("ends_at");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const place = async (id: string) => {
    const amount = parseInt(bid[id] || "0", 10);
    if (!amount) return;
    const { error } = await (supabase as any).rpc("place_auction_bid", { p_auction_id: id, p_amount: amount });
    if (error) toast.error(error.message); else { toast.success("Lance enviado!"); load(); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-primary"><EmojiIcon e="🔨" /> Casa de Leilões</h1>
        <p className="text-foreground/70 font-serif italic">Lances em galeões. Maior oferta leva.</p>
      </header>
      {items.map(a => (
        <div key={a.id} className="rounded-xl border border-primary/20 bg-card/40 p-4 space-y-2">
          <div className="flex justify-between">
            <h3 className="font-heading text-primary">{a.title}</h3>
            <span className="text-xs text-foreground/60">Encerra: {new Date(a.ends_at).toLocaleString()}</span>
          </div>
          <p className="text-sm text-foreground/70">{a.description}</p>
          <div className="text-sm">Lance atual: <strong className="text-primary">{a.current_bid || a.starting_bid} G</strong></div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="number" placeholder="Seu lance" value={bid[a.id] || ""} onChange={e => setBid({ ...bid, [a.id]: e.target.value })} />
            <Button onClick={() => place(a.id)}>Dar lance</Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-foreground/60">Nenhum leilão ativo.</p>}
    </div>
  );
}