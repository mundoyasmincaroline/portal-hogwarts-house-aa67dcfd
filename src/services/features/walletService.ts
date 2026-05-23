import { supabase } from "@/integrations/supabase/client";

export interface Order {
  id: string;
  package_id: string;
  amount_brl: number;
  galeons: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

export const walletService = {
  async getUserOrders(userId: string, limit = 20): Promise<Order[]> {
    const { data, error } = await supabase
      .from("galeon_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data as Order[]) || [];
  }
};
