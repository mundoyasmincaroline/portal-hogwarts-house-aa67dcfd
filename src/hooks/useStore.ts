import { useState, useEffect, useCallback, useMemo } from "react";
import { storeService, StoreItem } from "@/services/storeService";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Monster Quality hardcoded items moved here or can be kept in a constant file
const MONSTER_QUALITY_ITEMS: StoreItem[] = [
  { id: "mq_wand_elder", name: "Varinha das Varinhas", category: "wand", price_galeons: 5000, image_url: "https://portal-hogwarts.lovable.app/legendary_elder_wand_cinematic_1776814022237.png", rarity: "legendary", is_featured: true, description: "A varinha mais poderosa já fabricada, feita de sabugueiro e núcleo de pelo de testrálio." },
  { id: "mq_wand_ebony", name: "Varinha de Ébano", category: "wand", price_galeons: 2500, image_url: "https://portal-hogwarts.lovable.app/monster_quality_wand_ebony_1776815361581.png", rarity: "rare", is_featured: false, description: "Ébano é uma madeira preta e impressionante, com um brilho quase metálico." },
  // ... more items
];

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
