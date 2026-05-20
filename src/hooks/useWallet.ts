import { useState, useEffect, useCallback } from "react";
import { walletService, Order } from "@/services/walletService";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function useWallet() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await walletService.getUserOrders(user.id);
      setOrders(data);
    } catch (error: any) {
      toast.error("Erro ao carregar histórico financeiro: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const paidOrders = orders.filter(o => o.status === "paid");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const totalSpent = paidOrders.reduce((s, o) => s + o.amount_brl, 0);

  return {
    orders,
    paidOrders,
    pendingOrders,
    totalSpent,
    loading,
    loadOrders,
    galeons: profile?.galeons ?? 0,
    vipPlan: profile?.vip_plan,
    vipExpires: profile?.vip_expires_at
  };
}
