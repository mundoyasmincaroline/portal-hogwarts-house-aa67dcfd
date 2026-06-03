import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, History, Coins } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
export default function Gringotts() {
  const [loans, setLoans] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [amount, setAmount] = useState("100");
  const [shares, setShares] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: l } = await (supabase as any).from("bank_loans").select("*").order("created_at", { ascending: false });
    setLoans(l || []);
    const { data: s } = await (supabase as any).from("wizard_stocks").select("*").order("ticker");
    setStocks(s || []);
    const { data: h } = await (supabase as any).from("stock_holdings").select("*");
    setHoldings(h || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const takeLoan = async () => {
    const { error } = await (supabase as any).rpc("take_bank_loan", { p_amount: parseInt(amount), p_days: 7 });
    if (error) toast.error(error.message); else { toast.success("Empréstimo liberado!"); load(); }
  };
  const repay = async (id: string, total: number, paid: number) => {
    const { error } = await (supabase as any).rpc("repay_bank_loan", { p_loan_id: id, p_amount: total - paid });
    if (error) toast.error(error.message); else { toast.success("Quitado!"); load(); }
  };
  const buy = async (id: string) => {
    const n = parseInt(shares[id] || "1");
    const { error } = await (supabase as any).rpc("buy_stock", { p_stock_id: id, p_shares: n });
    if (error) toast.error(error.message); else { toast.success("Compra realizada"); load(); }
  };
  const sell = async (id: string) => {
    const n = parseInt(shares[id] || "1");
    const { error } = await (supabase as any).rpc("sell_stock", { p_stock_id: id, p_shares: n });
    if (error) toast.error(error.message); else { toast.success("Venda realizada"); load(); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 relative overflow-hidden">
      <AnimatePresence>
        {!loading && (
          <motion.div 
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div 
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Lock size={80} className="text-primary mb-4" />
              </motion.div>
              <h2 className="font-heading text-2xl text-primary">Abrindo Cofre...</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-primary flex items-center gap-2"><EmojiIcon e="🏦" /> Banco de Gringotts</h1>
          <p className="text-foreground/70 font-serif italic">Empréstimos e investimentos no mercado bruxo.</p>
        </div>
        <div className="flex gap-2">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-primary/10 border border-primary/30 p-2 rounded-xl flex items-center gap-2"
          >
            <Coins className="text-yellow-500" />
            <span className="font-heading text-lg">1.250</span>
          </motion.div>
        </div>
      </header>
      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans">Empréstimos</TabsTrigger>
          <TabsTrigger value="stocks">Bolsa Mágica</TabsTrigger>
        </TabsList>
        <TabsContent value="loans" className="space-y-4 pt-4">
          <div className="rounded-xl border border-primary/20 bg-card/40 p-4 space-y-2">
            <p className="text-sm">Taxa: <strong>15%</strong> em 7 dias.</p>
            <div className="flex gap-2">
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <Button onClick={takeLoan}>Pegar empréstimo</Button>
            </div>
          </div>
          {loans.map(l => (
            <div key={l.id} className="rounded-lg border border-primary/15 bg-card/30 p-3 flex justify-between items-center">
              <div>
                <div className="font-heading text-primary">{l.amount} G → Devolver {l.total_due} G</div>
                <div className="text-xs text-foreground/60">Status: {l.status} · Pago: {l.paid} G · Vence: {new Date(l.due_at).toLocaleDateString()}</div>
              </div>
              {l.status === "open" && <Button size="sm" onClick={() => repay(l.id, l.total_due, l.paid)}>Quitar</Button>}
            </div>
          ))}
        </TabsContent>
        <TabsContent value="stocks" className="space-y-3 pt-4">
          {stocks.map(s => {
            const h = holdings.find(x => x.stock_id === s.id);
            return (
              <div key={s.id} className="rounded-lg border border-primary/15 bg-card/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <div>
                    <div className="font-heading text-primary">{s.ticker} — {s.company}</div>
                    <div className="text-xs text-foreground/60">{s.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-primary">{s.price} G</div>
                    {h && <div className="text-xs text-foreground/60">Você tem: {h.shares}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="qtd" value={shares[s.id] || ""} onChange={e => setShares({ ...shares, [s.id]: e.target.value })} className="w-24" />
                  <Button size="sm" onClick={() => buy(s.id)}>Comprar</Button>
                  <Button size="sm" variant="outline" onClick={() => sell(s.id)}>Vender</Button>
                </div>
              </div>
            );
          })}
          {stocks.length === 0 && <p className="text-foreground/60 text-sm">Nenhuma empresa listada ainda.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}