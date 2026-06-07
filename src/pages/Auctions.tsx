import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Gavel, ArrowUp } from "lucide-react";
import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Auctions() {
  const [items, setItems] = useState<any[]>([]);
  const [bid, setBid] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await (supabase as any).from("auctions").select("*").eq("status", "open").order("ends_at");
    setItems(data || []);
  };
  useEffect(() => { 
    load();
    const channel = supabase
      .channel("public:auctions")
      .on("postgres_changes", { event: "*", schema: "public", table: "auctions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const place = async (id: string) => {
    const amount = parseInt(bid[id] || "0", 10);
    if (!amount) return toast.error("Digite um valor de lance");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Faça login para dar lances");
    const { error } = await (supabase as any).rpc("place_auction_bid", { p_auction_id: id, p_amount: amount });
    if (error) toast.error(error.message); else { toast.success("Lance enviado!"); load(); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="font-heading text-2xl sm:text-3xl text-primary"><EmojiIcon e="🔨" /> Casa de Leilões</h1>
        <p className="text-foreground/70 font-serif italic">Lances em galeões. Maior oferta leva.</p>
      </header>
      {items.map(a => {
        const timeRemaining = new Date(a.ends_at).getTime() - Date.now();
        const isExpiringSoon = timeRemaining > 0 && timeRemaining < 30000; // Less than 30s
        
        return (
          <div key={a.id} className={`rounded-xl border transition-all duration-500 bg-card/40 p-4 space-y-3 ${isExpiringSoon ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-primary/20'}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-heading text-primary flex items-center gap-2">
                  <Gavel size={18} /> {a.title}
                </h3>
                <p className="text-xs text-foreground/60">Lance inicial: {a.starting_bid} G</p>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full border ${isExpiringSoon ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                <Timer size={12} />
                {timeRemaining > 0 ? (
                  isExpiringSoon ? `ENCERRANDO EM ${Math.floor(timeRemaining / 1000)}s` : new Date(a.ends_at).toLocaleString()
                ) : "Encerrado"}
              </div>
            </div>
            
            <p className="text-sm text-foreground/70">{a.description}</p>
            
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div className="text-sm">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Lance atual</span>
                <strong className="text-primary text-xl font-heading">{a.current_bid || a.starting_bid} G</strong>
              </div>
              {a.last_bidder_id && (
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Último lance</span>
                  <span className="text-xs">ID: {a.last_bidder_id.slice(0, 8)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder={`Mín: ${(a.current_bid || a.starting_bid) + 1} G`}
                  className="bg-background/40 border-primary/20 focus:border-primary/50"
                  value={bid[a.id] || ""} 
                  onChange={e => setBid({ ...bid, [a.id]: e.target.value })} 
                />
              </div>
              <Button 
                onClick={() => place(a.id)}
                className="bg-primary/80 hover:bg-primary text-white font-heading"
                disabled={timeRemaining <= 0}
              >
                <ArrowUp size={16} className="mr-2" /> Dar lance
              </Button>
            </div>
          </div>
        );
      })}
      {items.length === 0 && <p className="text-foreground/60">Nenhum leilão ativo.</p>}
    </div>
  );
}