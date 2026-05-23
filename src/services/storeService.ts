import { supabase } from "@/integrations/supabase/client";

export interface StoreItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  price_galeons: number;
  image_url: string;
  rarity?: string;
  is_featured?: boolean;
  effects?: Record<string, any>;
}

export const storeService = {
  async getActiveItems(): Promise<StoreItem[]> {
    const { data, error } = await supabase
      .from("store_items")
      .select("*")
      .eq("is_active", true)
      .order("price_galeons");
    
    if (error) throw error;
    return (data as StoreItem[]) || [];
  },

  async getUserOwnedItems(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_items")
      .select("item_id")
      .eq("user_id", userId);
    
    if (error) throw error;
    return (data || []).map(i => i.item_id);
  },

  async verifyPayment(orderNsu: string, transactionNsu: string, slug: string) {
    const { data, error } = await supabase.rpc("verify_infinitepay_payment", {
      p_order_nsu: orderNsu,
      p_transaction_nsu: transactionNsu,
      p_slug: slug,
    });
    if (error) throw error;
    return data as any;
  },

  async buyStoreItem(userId: string, itemId: string) {
    const { data, error } = await supabase.rpc("buy_store_item", {
      _user_id: userId,
      _item_id: itemId,
    });
    if (error) throw error;
    return data as { success: boolean; message: string };
  }
};
