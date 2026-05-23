import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";

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
