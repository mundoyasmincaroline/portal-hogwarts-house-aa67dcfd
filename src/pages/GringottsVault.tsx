import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import EmojiIcon from "@/components/shared/EmojiIcon";
type Vault = { id: string; vault_number: number; balance: number; interest_rate: number; last_interest_at: string };
type Tx = { id: string; type: string; amount: number; description: string | null; created_at: string };

export default function GringottsVault() {
  const [vault, setVault] = useState<Vault | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: v } = await supabase.from("gringotts_vaults" as any).select("*").eq("user_id", user.id).maybeSingle();
    setVault((v as any) || null);
    if (v) {
      const { data: t } = await supabase.from("gringotts_transactions" as any).select("*").eq("vault_id", (v as any).id).order("created_at", { ascending: false }).limit(20);
      setTxs((t as any) || []);
    }
  }
  useEffect(() => { load(); }, []);

  async function call(rpc: string, args: any = {}) {
    if (rpc === "vault_deposit" && (parseInt(amount) <= 0 || isNaN(parseInt(amount)))) {
      return toast.error("Insira uma quantidade válida de Galeões.");
    }
    
    if (rpc === "vault_withdraw" && (parseInt(amount) > (vault?.balance || 0))) {
      return toast.error("Saldo insuficiente no cofre!");
    }
    
    setLoading(true);
    const { error } = await supabase.rpc(rpc as any, args);
    setLoading(false);
    
    if (error) return toast.error(error.message);
    toast.success("Operação concluída! 🪙");
    setAmount("");
    load();
  }

  if (!vault) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card className="p-8 text-center space-y-4 bg-card/60 border-primary/30">
          <div className="text-6xl"><EmojiIcon e="🏦" /></div>
          <h1 className="font-heading text-2xl">Bem-vindo a Gringotes</h1>
          <p className="text-muted-foreground">Abra seu cofre pessoal e proteja seus galeões. Render juros diários de 2%.</p>
          <Button onClick={() => call("open_vault")} disabled={loading}>Abrir Cofre</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-amber-950/40 to-card border-primary/40">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Cofre Pessoal</p>
            <h1 className="font-heading text-2xl sm:text-3xl text-primary">N.º {vault.vault_number}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-3xl sm:text-4xl font-bold text-primary break-words">{vault.balance.toLocaleString()} G</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Taxa de juros: {(vault.interest_rate * 100).toFixed(1)}% ao dia</p>
      </Card>

      <Card className="p-4 space-y-3 bg-card/60 border-primary/20">
        <h2 className="font-heading">Operações</h2>
        <Input type="number" placeholder="Quantidade de Galeões" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={() => call("vault_deposit", { p_amount: parseInt(amount) })} disabled={loading || !amount}>Depositar</Button>
          <Button variant="outline" onClick={() => call("vault_withdraw", { p_amount: parseInt(amount) })} disabled={loading || !amount}>Sacar</Button>
          <Button variant="secondary" onClick={() => call("vault_claim_interest")} disabled={loading}>Resgatar Juros</Button>
        </div>
      </Card>

      <Card className="p-4 bg-card/60 border-primary/20">
        <h2 className="font-heading mb-3">Histórico Recente</h2>
        <div className="space-y-2">
          {txs.length === 0 && <p className="text-sm text-muted-foreground">Sem transações ainda.</p>}
          {txs.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b border-border/40 pb-2">
              <div>
                <span className="mr-2">{t.type === "deposit" ? "⬇️" : t.type === "withdraw" ? "⬆️" : "💎"}</span>
                <span>{t.description}</span>
              </div>
              <span className={t.type === "withdraw" ? "text-destructive" : "text-primary"}>
                {t.type === "withdraw" ? "-" : "+"}{t.amount} G
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}