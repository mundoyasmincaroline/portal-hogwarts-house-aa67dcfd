import React, { memo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import SafeImage from "@/components/SafeImage";

export const AdminMonetizationTab = memo(({ members, fetchAll }: { members: any[], fetchAll: () => void }) => {
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [galeonTarget, setGaleonTarget] = useState("");
  const [galeonAmount, setGaleonAmount] = useState(0);
  const [crediting, setCrediting] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", description: "", category: "clothing", price_galeons: 100,
    rarity: "common", image_url: "", is_featured: false,
    stats: { atk: 0, def: 0, mana: 0, hp: 0 }
  });
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => { loadStoreItems(); }, []);

  const loadStoreItems = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from("store_items").select("*").order("category").order("price_galeons");
    setStoreItems(data || []);
    setLoadingItems(false);
  };

  const creditGaleons = async () => {
    if (!galeonTarget || galeonAmount <= 0) return toast.error("Selecione um membro e um valor válido.");
    setCrediting(true);
    const member = members.find(m => m.user_id === galeonTarget);
    if (!member) { toast.error("Membro não encontrado."); setCrediting(false); return; }
    const current = (member as any).galeons || 0;
    const { error } = await supabase.from("profiles").update({ galeons: current + galeonAmount } as any).eq("user_id", galeonTarget);
    if (error) { toast.error("Erro ao creditar Galeões."); }
    else { toast.success(`🪙 ${galeonAmount} Galeões creditados para ${member.full_name}!`); }
    setCrediting(false);
    fetchAll();
  };

  const addStoreItem = async () => {
    if (!newItem.name || !newItem.price_galeons) return toast.error("Preencha nome e preço.");
    setAddingItem(true);
    const { error } = await supabase.from("store_items").insert({ ...newItem, is_active: true } as any);
    if (error) toast.error(error.message);
    else { 
        toast.success("✅ Item adicionado à loja!"); 
        setNewItem({ 
            name: "", description: "", category: "clothing", price_galeons: 100, 
            rarity: "common", image_url: "", is_featured: false,
            stats: { atk: 0, def: 0, mana: 0, hp: 0 }
        }); 
        loadStoreItems(); 
    }
    setAddingItem(false);
  };

  const toggleItem = async (item: any) => {
    await supabase.from("store_items").update({ is_active: !item.is_active } as any).eq("id", item.id);
    loadStoreItems();
    toast.success(item.is_active ? "Item desativado." : "Item ativado.");
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
    await supabase.from("store_items").delete().eq("id", id);
    loadStoreItems();
    toast.success("Item removido da loja.");
  };

  const CATEGORY_LABELS: Record<string, string> = {
    clothing: "👗 Roupas", wand: "🪄 Varinhas", accessory: "💎 Acessórios",
    skin: "🎨 Skins", decoration: "🏠 Decorações", pack: "📦 Pacotes",
    spell: "📜 Feitiços", potion: "🧪 Poções", upgrade: "⚡ Upgrades"
  };
  const RARITY_LABELS: Record<string, string> = { common: "Comum", rare: "Raro", legendary: "Lendário" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-heading text-xl text-primary mb-4">💰 Gerenciar Créditos</h2>
          <div className="space-y-4">
            <select
              value={galeonTarget}
              onChange={e => setGaleonTarget(e.target.value)}
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground border border-border"
            >
              <option value="">Selecione o Bruxo...</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.username}) — 🪙 {m.galeons || 0}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Quantidade de Galeões"
              value={galeonAmount}
              onChange={e => setGaleonAmount(parseInt(e.target.value) || 0)}
            />
            <Button onClick={creditGaleons} variant="magical" className="w-full" disabled={crediting}>
              {crediting ? "Creditando..." : "Creditário Manual ✨"}
            </Button>
          </div>
        </div>
        <div className="glass rounded-2xl p-6 border-yellow-500/30 bg-yellow-500/5">
           <h2 className="font-heading text-xl text-yellow-500 mb-4">💳 Teste InfinitePay</h2>
           <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
             Em breve: Link de teste automático
           </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-heading text-xl text-primary mb-4">🏪 Gerenciar Loja Gringotts</h2>
        <div className="glass rounded-xl p-4 mb-6 border border-primary/20 space-y-3">
          <Input placeholder="Nome do item *" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
          <Input placeholder="Preço em Galeões *" type="number" value={newItem.price_galeons} onChange={e => setNewItem({ ...newItem, price_galeons: parseInt(e.target.value) || 0 })} />
          <Button variant="magical" className="w-full" onClick={addStoreItem} disabled={addingItem}>
            {addingItem ? "Salvando..." : "Adicionar à Loja"}
          </Button>
        </div>

        {loadingItems ? (
          <p className="text-center text-muted-foreground animate-pulse">Carregando itens...</p>
        ) : (
          <div className="space-y-2">
            {storeItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">🪙 {item.price_galeons}</p>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>🗑️</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

AdminMonetizationTab.displayName = "AdminMonetizationTab";
