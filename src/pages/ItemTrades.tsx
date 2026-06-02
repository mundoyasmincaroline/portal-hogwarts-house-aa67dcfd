import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeftRight, Check, X, Plus } from "lucide-react";

import EmojiIcon from "@/components/shared/EmojiIcon";
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  accepted: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

export default function ItemTrades() {
  const { user } = useAuth();
  const [sent, setSent] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  // form
  const [recipient, setRecipient] = useState("");
  const [offItem, setOffItem] = useState("");
  const [offQty, setOffQty] = useState(1);
  const [offGal, setOffGal] = useState(0);
  const [reqItem, setReqItem] = useState("");
  const [reqQty, setReqQty] = useState(1);
  const [reqGal, setReqGal] = useState(0);
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!user) return;
    const [s, r, inv, prof, items] = await Promise.all([
      supabase.from("item_trades").select("*, offered:offered_item_id(name,emoji), requested:requested_item_id(name,emoji)").eq("sender_id", user.id).order("created_at", { ascending: false }),
      supabase.from("item_trades").select("*, offered:offered_item_id(name,emoji), requested:requested_item_id(name,emoji)").eq("recipient_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_inventory").select("*, item:hogsmeade_items(id,name,emoji,tradable)").eq("user_id", user.id).gt("quantity", 0),
      supabase.from("profiles").select("user_id,username,full_name").neq("user_id", user.id).limit(100),
      supabase.from("hogsmeade_items").select("id,name,emoji").eq("active", true).eq("tradable", true).order("name"),
    ]);
    setSent(s.data ?? []); setReceived(r.data ?? []);
    setMyItems((inv.data ?? []).filter((i: any) => i.item?.tradable));
    setUsers(prof.data ?? []); setAllItems(items.data ?? []);
  };
  useEffect(() => { load(); }, [user?.id]);

  const propose = async () => {
    if (!recipient) return toast.error("Escolha um destinatário");
    if (!offItem && offGal <= 0) return toast.error("Ofereça um item ou galeões");
    if (!reqItem && reqGal <= 0) return toast.error("Peça um item ou galeões");
    const { error } = await supabase.rpc("propose_item_trade", {
      p_recipient_id: recipient,
      p_offered_item: offItem || null,
      p_offered_qty: offItem ? offQty : 0,
      p_offered_gal: offGal,
      p_requested_item: reqItem || null,
      p_requested_qty: reqItem ? reqQty : 0,
      p_requested_gal: reqGal,
      p_message: msg || null,
    });
    if (error) return toast.error(error.message);
    toast.success("🤝 Proposta enviada!");
    setOpen(false); setRecipient(""); setOffItem(""); setOffGal(0); setReqItem(""); setReqGal(0); setMsg("");
    load();
  };

  const respond = async (id: string, accept: boolean) => {
    const { error } = await supabase.rpc("respond_item_trade", { p_trade_id: id, p_accept: accept });
    if (error) return toast.error(error.message);
    toast.success(accept ? "✅ Troca concluída!" : "Troca recusada");
    load();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc("cancel_item_trade", { p_trade_id: id });
    if (error) return toast.error(error.message);
    toast.success("Cancelada"); load();
  };

  const renderTrade = (t: any, isSent: boolean) => (
    <div key={t.id} className="glass-premium rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <Badge className={STATUS_STYLE[t.status]}>{t.status}</Badge>
        <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center text-sm">
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-1">Oferece</p>
          {t.offered && <p className="font-heading">{t.offered.emoji} {t.offered.name} x{t.offered_qty}</p>}
          {t.offered_galeons > 0 && <p className="text-primary">🪙 {t.offered_galeons} G</p>}
        </div>
        <ArrowLeftRight className="text-primary" />
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground mb-1">Pede</p>
          {t.requested && <p className="font-heading">{t.requested.emoji} {t.requested.name} x{t.requested_qty}</p>}
          {t.requested_galeons > 0 && <p className="text-primary">🪙 {t.requested_galeons} G</p>}
        </div>
      </div>
      {t.message && <p className="text-xs italic text-muted-foreground mt-2">"{t.message}"</p>}
      {t.status === "pending" && (
        <div className="flex gap-2 mt-3 justify-end">
          {isSent ? (
            <Button size="sm" variant="outline" onClick={() => cancel(t.id)}><X size={14} className="mr-1"/> Cancelar</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => respond(t.id, false)}><X size={14} className="mr-1"/> Recusar</Button>
              <Button size="sm" onClick={() => respond(t.id, true)}><Check size={14} className="mr-1"/> Aceitar</Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl text-gold-gradient"><EmojiIcon e="🤝" /> Trocas Mágicas</h1>
          <p className="text-sm text-muted-foreground">Negocie itens e galeões com outros bruxos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-1"/> Nova Proposta</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Proposta de Troca</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Destinatário</label>
                <Select value={recipient} onValueChange={setRecipient}>
                  <SelectTrigger><SelectValue placeholder="Escolha um bruxo..."/></SelectTrigger>
                  <SelectContent>{users.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.username || u.full_name || u.user_id.slice(0,8)}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-heading mb-2 text-primary">Você oferece</p>
                <Select value={offItem} onValueChange={setOffItem}>
                  <SelectTrigger><SelectValue placeholder="Item da sua mochila (opcional)..."/></SelectTrigger>
                  <SelectContent>{myItems.map(i => (
                    <SelectItem key={i.item.id} value={i.item.id}>{i.item.emoji} {i.item.name} (x{i.quantity})</SelectItem>
                  ))}</SelectContent>
                </Select>
                {offItem && <Input type="number" min={1} value={offQty} onChange={e => setOffQty(parseInt(e.target.value)||1)} placeholder="Quantidade" className="mt-2"/>}
                <Input type="number" min={0} value={offGal} onChange={e => setOffGal(parseInt(e.target.value)||0)} placeholder="Galeões a oferecer" className="mt-2"/>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs font-heading mb-2 text-primary">Em troca de</p>
                <Select value={reqItem} onValueChange={setReqItem}>
                  <SelectTrigger><SelectValue placeholder="Item desejado (opcional)..."/></SelectTrigger>
                  <SelectContent>{allItems.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.emoji} {i.name}</SelectItem>
                  ))}</SelectContent>
                </Select>
                {reqItem && <Input type="number" min={1} value={reqQty} onChange={e => setReqQty(parseInt(e.target.value)||1)} placeholder="Quantidade" className="mt-2"/>}
                <Input type="number" min={0} value={reqGal} onChange={e => setReqGal(parseInt(e.target.value)||0)} placeholder="Galeões pedidos" className="mt-2"/>
              </div>
              <Textarea placeholder="Mensagem (opcional)" value={msg} onChange={e => setMsg(e.target.value)} maxLength={200}/>
              <Button className="w-full" onClick={propose}>Enviar Proposta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">📥 Recebidas ({received.filter(t=>t.status==='pending').length})</TabsTrigger>
          <TabsTrigger value="sent">📤 Enviadas ({sent.filter(t=>t.status==='pending').length})</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-4">
          {received.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma proposta recebida</p> : received.map(t => renderTrade(t, false))}
        </TabsContent>
        <TabsContent value="sent" className="mt-4">
          {sent.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma proposta enviada</p> : sent.map(t => renderTrade(t, true))}
        </TabsContent>
      </Tabs>
    </div>
  );
}