import { useState, useEffect, useCallback, useMemo } from "react";
import { storeService, StoreItem } from "@/services/storeService";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Monster Quality items are now loaded from the database table 'store_items'
const MONSTER_QUALITY_ITEMS: StoreItem[] = [];

export function useStore() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    setLoading(true);
    try {
      const [dbItems, myOwnedIds] = await Promise.all([
        storeService.getActiveItems(),
        user ? storeService.getUserOwnedItems(user.id) : Promise.resolve([])
      ]);

      const allItems = [...MONSTER_QUALITY_ITEMS, ...dbItems];
      const uniqueItems = allItems.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      
      setItems(uniqueItems);
      setOwned(myOwnedIds);
    } catch (error: any) {
      toast.error("Erro ao carregar a loja: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const buyItem = async (item: StoreItem) => {
    if (!user || !profile) {
      toast.error("Você precisa estar logado.");
      return false;
    }

    const bal = profile?.galeons ?? 0;
    if (bal < item.price_galeons) {
      toast.error(`Galeões insuficientes! Você tem ${bal} Galeões.`);
      return false;
    }

    setBuyingId(item.id);
    try {
      // Logique de déduction de galions (à centraliser éventuellement dans storeService)
      const { error: deduct } = await supabase
        .from("profiles")
        .update({ galeons: bal - item.price_galeons } as never)
        .eq("user_id", user.id);
      
      if (deduct) throw deduct;

      const { error: ins } = await supabase
        .from("user_items")
        .insert({ user_id: user.id, item_id: item.id } as never);
      
      if (ins) {
        // Rollback galeons
        await supabase.from("profiles").update({ galeons: bal } as never).eq("user_id", user.id);
        throw ins;
      }

      setOwned(prev => [...prev, item.id]);
      toast.success(`✅ "${item.name}" adicionado ao inventário!`);
      return true;
    } catch (error: any) {
      toast.error("Erro na compra: " + error.message);
      return false;
    } finally {
      setBuyingId(null);
    }
  };

  return {
    items,
    owned,
    loading,
    buyingId,
    loadStore,
    buyItem,
    galeons: profile?.galeons ?? 0
  };
}
