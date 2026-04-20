import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PedidosTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "paid" | "all">("pending");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, [filter]);

  const loadOrders = async () => {
    setLoading(true);
    let q = supabase
      .from("galeon_orders")
      .select("*, profiles(full_name, username, galeons)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  };

  const creditOrder = async (order: any) => {
    if (order.status === "paid") { toast.info("Pedido já processado."); return; }
    setProcessing(order.id);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("galeons")
        .eq("user_id", order.user_id)
        .single();

      const currentGaleons = prof?.galeons ?? 0;
      const isVip = order.package_id?.startsWith("vip_");

      if (isVip) {
        const planId = order.package_id.replace("vip_", "");
        const VIP_GALEONS: Record<string, number> = { premium: 0, vip: 200, founder: 500 };
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);

        await supabase.from("profiles").update({
          vip_plan: planId,
          vip_expires_at: expires.toISOString(),
          galeons: currentGaleons + (VIP_GALEONS[planId] || 0),
        } as never).eq("user_id", order.user_id);

        await supabase.from("vip_subscriptions").insert({
          user_id: order.user_id,
          plan: planId,
          amount_brl: order.amount_brl,
          status: "active",
          expires_at: expires.toISOString(),
          galeons_monthly: VIP_GALEONS[planId] ?? 0,
        } as never);

        toast.success(`👑 VIP ${planId.toUpperCase()} ativado para ${order.profiles?.full_name}!`);
      } else {
        const galeons = order.galeons ?? 0;
        await supabase.from("profiles")
          .update({ galeons: currentGaleons + galeons } as never)
          .eq("user_id", order.user_id);
        toast.success(`🪙 ${galeons} Galeões creditados para ${order.profiles?.full_name}!`);
      }

      // Marcar pedido como pago
      await supabase.from("galeon_orders")
        .update({ status: "paid", paid_at: new Date().toISOString() } as never)
        .eq("id", order.id);

      loadOrders();
    } catch (e: any) {
      toast.error("Erro ao creditar: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    await supabase.from("galeon_orders").update({ status: "cancelled" } as never).eq("id", orderId);
    toast.success("Pedido cancelado.");
    loadOrders();
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-sm text-primary flex items-center gap-2">
            🧾 Pedidos de Galeões
            {pendingCount > 0 && filter === "pending" && (
              <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aprovação manual de pagamentos. Clique em "Creditar agora" para liberar os Galeões.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["pending", "paid", "all"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-heading border transition-all ${
                filter === f
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}>
              {f === "pending" ? "⏳ Pendentes" : f === "paid" ? "✅ Pagos" : "📋 Todos"}
            </button>
          ))}
          <button onClick={loadOrders}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/40">
            🔄 Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-muted-foreground animate-pulse">
          Carregando pedidos...
        </div>
      ) : orders.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-muted-foreground text-sm">
            {filter === "pending" ? "Nenhum pedido pendente! Tudo em dia." : "Nenhum pedido encontrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div key={order.id}
              className={`glass rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3 ${
                order.status === "pending"
                  ? "border-yellow-500/30 bg-yellow-900/5"
                  : order.status === "paid"
                  ? "border-green-500/20 bg-green-900/5"
                  : "border-border/30 opacity-60"
              }`}>
              {/* Status badge + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-heading px-2 py-0.5 rounded-full border ${
                    order.status === "paid"
                      ? "text-green-400 border-green-500/40 bg-green-900/20"
                      : order.status === "pending"
                      ? "text-yellow-400 border-yellow-500/40 bg-yellow-900/20"
                      : "text-muted-foreground border-border"
                  }`}>
                    {order.status === "paid" ? "✅ Pago" : order.status === "pending" ? "⏳ Pendente" : "❌ Cancelado"}
                  </span>
                  <span className="font-heading text-sm text-foreground">
                    {order.profiles?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{order.profiles?.username}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.package_id?.startsWith("vip_")
                    ? `👑 Plano VIP ${order.package_id.replace("vip_", "").toUpperCase()}`
                    : `🪙 ${order.galeons} Galeões`}
                  {" · "}
                  <span className="text-foreground/70">
                    R$ {parseFloat(order.amount_brl || 0).toFixed(2).replace(".", ",")}
                  </span>
                  {" · "}
                  {new Date(order.created_at).toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Ações */}
              {order.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="magical" size="sm"
                    disabled={processing === order.id}
                    onClick={() => creditOrder(order)}>
                    {processing === order.id ? "⏳..." : "✅ Creditar agora"}
                  </Button>
                  <Button variant="outline" size="sm"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    onClick={() => cancelOrder(order.id)}>
                    ✕
                  </Button>
                </div>
              )}
              {order.status === "paid" && order.paid_at && (
                <span className="text-[10px] text-green-400/70 shrink-0">
                  Pago em {new Date(order.paid_at).toLocaleString("pt-BR")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
