import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Coins, Crown, Wand2, Shirt, Gem, Sparkles, Star, ExternalLink, Check, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreItemVisual from "@/components/StoreItemVisual";

// ─── Config ────────────────────────────────────────────────────────────
// Tudo via supabase.rpc() — sem CORS, server-side via pg_net
// ────────────────────────────────────────────────────────────


// ─── Tipos ────────────────────────────────────────────────
interface StoreItem {
  id: string; name: string; description: string; category: string;
  price_galeons: number; image_url: string; rarity: string;
  is_featured: boolean;
}

// ─── Pacotes de Galeões ────────────────────────────────────
const GALEON_PACKAGES = [
  { id: "bolsinha",  name: "Bolsinha de Galeões",     galeons: 100,  price_brl: 4.90,  icon: "💰", image_url: "https://images.unsplash.com/photo-1621508654686-809f23efdabc?q=80&w=400", color: "from-amber-800/40 to-amber-900/40", border: "border-amber-600/40", glow: "group-hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]" },
  { id: "saco",      name: "Saco de Galeões",          galeons: 300,  price_brl: 12.90, icon: "🪙", image_url: "https://images.unsplash.com/photo-1610484826917-0f101a7bf7f4?q=80&w=400", color: "from-amber-700/50 to-yellow-800/40", border: "border-yellow-500/50", glow: "group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]", badge: "Mais Popular" },
  { id: "bau",       name: "Baú de Galeões",           galeons: 700,  price_brl: 24.90, icon: "💎", image_url: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=400", color: "from-yellow-600/50 to-amber-700/50", border: "border-amber-400/60", glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]" },
  { id: "tesouro",   name: "Tesouro de Gringotts",     galeons: 1500, price_brl: 44.90, icon: "👑", image_url: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=400", color: "from-yellow-500/60 to-amber-600/50", border: "border-yellow-400/70", glow: "group-hover:shadow-[0_0_35px_rgba(250,204,21,0.6)]", badge: "Melhor Valor" },
  { id: "cofre",     name: "Cofre Lendário",           galeons: 4000, price_brl: 99.90, icon: "🏆", image_url: "https://images.unsplash.com/photo-1587910903822-b13c7bbbc18a?q=80&w=400", color: "from-yellow-400/70 to-amber-500/60", border: "border-yellow-300/80", glow: "group-hover:shadow-[0_0_45px_rgba(253,224,71,0.7)]", badge: "Lendário" },
];

// ─── Planos VIP ────────────────────────────────────────────
const VIP_PLANS = [
  {
    id: "premium", name: "Estudante Premium", icon: "✨", price_brl: 9.90, image_url: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=600",
    color: "from-blue-900/60 to-indigo-900/40", border: "border-blue-400/50", textColor: "text-blue-300", glow: "hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]",
    benefits: ["+50% XP em todas as atividades", "Badge exclusivo ✨ no perfil", "Acesso a salas Premium", "Nome com brilho especial"],
    galeons_monthly: 0,
  },
  {
    id: "vip", name: "Auror VIP", icon: "🥇", price_brl: 19.90, image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600",
    color: "from-purple-900/60 to-fuchsia-900/40", border: "border-purple-400/60", textColor: "text-purple-300", glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    benefits: ["Tudo do Premium", "+200 Galeões todo mês", "Nome dourado em todo portal", "Skin exclusiva de Auror", "Acesso antecipado a eventos"],
    galeons_monthly: 200,
    badge: "MAIS ESCOLHIDO"
  },
  {
    id: "founder", name: "Fundador Hogwarts", icon: "👑", price_brl: 39.90, image_url: "https://images.unsplash.com/photo-1574280367876-0f862cd5d082?q=80&w=600",
    color: "from-yellow-700/60 to-amber-900/50", border: "border-yellow-400/70", textColor: "text-yellow-300", glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.5)]",
    benefits: ["Tudo do VIP", "+500 Galeões todo mês", "Acesso ao Conselho Secreto", "Título permanente 👑 Fundador", "Participação em decisões do portal"],
    galeons_monthly: 500,
    badge: "STATUS MÁXIMO"
  },
];

// ─── Raridade ─────────────────────────────────────────────
const RARITY = {
  common:    { label: "Comum",    cls: "text-gray-400 border-gray-600",     glow: "group-hover:shadow-[0_0_15px_rgba(156,163,175,0.2)]" },
  rare:      { label: "Raro",     cls: "text-blue-400 border-blue-500/60",  glow: "group-hover:shadow-[0_0_25px_rgba(96,165,250,0.4)]" },
  legendary: { label: "Lendário", cls: "text-yellow-400 border-yellow-400/80", glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.6)]" },
};

const TABS = [
  { id: "featured", label: "🔥 Exclusivos", icon: Flame },
  { id: "galeons",  label: "🪙 Galeões",    icon: Coins },
  { id: "vip",      label: "👑 VIP",        icon: Crown },
  { id: "clothing", label: "👗 Roupas",     icon: Shirt },
  { id: "wand",     label: "🪄 Varinhas",   icon: Wand2 },
  { id: "accessory",label: "💎 Acessórios", icon: Gem },
  { id: "skin",     label: "🎨 Skins",      icon: Sparkles },
];

export default function GringottsStore() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("featured");
  const [items, setItems] = useState<StoreItem[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string|null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string|null>(null);

  useEffect(() => { loadStore(); }, [user?.id]);

  const loadStore = async () => {
    const { data } = await supabase.from("store_items").select("*").eq("is_active", true).order("price_galeons");
    
    setItems(data || []);
    if (user) {
      const { data: myItems } = await supabase.from("user_items").select("item_id").eq("user_id", user.id);
      setOwned((myItems || []).map(i => i.item_id));
    }
    setLoading(false);
  };

  // ── Detectar retorno de pagamento na URL ─────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get("order_nsu");
    const transactionNsu = params.get("transaction_nsu");
    const slug = params.get("slug");

    if (orderNsu && transactionNsu && slug) {
      window.history.replaceState({}, "", window.location.pathname);
      verifyAndCreditPayment(orderNsu, transactionNsu, slug);
    }
  }, []);

  const verifyAndCreditPayment = async (orderNsu: string, transactionNsu: string, slug: string) => {
    try {
      toast.info("🔍 Verificando seu pagamento...");
      const { data, error } = await supabase.rpc("verify_infinitepay_payment", {
        p_order_nsu:       orderNsu,
        p_transaction_nsu: transactionNsu,
        p_slug:            slug,
      });
      if (error) throw new Error(error.message);
      if (data?.success) {
        if (data.type === "vip") toast.success(`🎉 Plano ${data.plan?.toUpperCase()} ativado! Bem-vindo ao VIP!`, { duration: 6000 });
        else toast.success(`🎉 ${data.galeons} Galeões adicionados à sua conta!`, { duration: 6000 });
        setPendingOrderId(null);
        setTimeout(() => window.location.reload(), 1500);
      } else if (data?.message === "Já processado") {
        toast.info("✅ Pagamento já confirmado anteriormente!");
        setPendingOrderId(null);
      } else {
        setPendingOrderId(orderNsu);
        toast.warning("⏳ Pagamento ainda sendo processado. Clique em 'Verificar novamente' em alguns instantes.", { duration: 10000 });
      }
    } catch (err: any) {
      console.warn("Erro na verificação:", err.message);
      setPendingOrderId(orderNsu);
      toast.info("✅ Pagamento recebido! Clique em 'Verificar novamente' para liberar seus Galeões.", { duration: 10000 });
    }
  };

  // ── Gerar Link (2 etapas) ───────────────────
  const createInfinitePayLink = async (orderId: string, amountBrl: number, description: string, userEmail: string, userName: string): Promise<string | null> => {
    try {
      const { data: started, error: startErr } = await supabase.rpc("start_payment_request", {
        p_order_id: orderId, p_amount_brl: amountBrl, p_description: description, p_user_id: user?.id, p_user_email: userEmail, p_user_name: userName,
      });
      if (startErr || !started?.success) return null;
      const requestId: number = started.request_id;
      for (let attempt = 1; attempt <= 4; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: result } = await supabase.rpc("get_payment_link", { p_request_id: requestId, p_order_id: orderId });
        if (result?.ready && result?.payment_url) return result.payment_url;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // ── Comprar Galeões ───────────────────────────────────────
  const buyGaleons = async (pkg: typeof GALEON_PACKAGES[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(pkg.id);
    try {
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id, package_id: pkg.id, amount_brl: pkg.price_brl, galeons: pkg.galeons, status: "pending",
      } as never).select("id").single();
      if (error) throw error;
      const description = `${pkg.name} — ${pkg.galeons}🪙 Galeões`;
      toast.info("⏳ Gerando link de pagamento...");
      const payUrl = await createInfinitePayLink(order.id, pkg.price_brl, description, user.email ?? "", profile.full_name);
      if (!payUrl) throw new Error("Não foi possível gerar link de pagamento.");
      toast.info("💳 Redirecionando...");
      setTimeout(() => { window.location.href = payUrl; }, 800);
    } catch (e: any) { toast.error(e.message || "Erro ao processar."); }
    finally { setBuying(null); }
  };

  // ── Comprar Item ──────────────────────────────────
  const buyItem = async (item: StoreItem) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    const bal = profile?.galeons ?? 0;
    if (bal < item.price_galeons) return toast.error(`Galeões insuficientes! Você tem ${bal}🪙.`);
    setBuying(item.id);
    try {
      // Bypass FK para itens 3D injetados localmente
      if (item.id.startsWith("3d_")) {
        const { error: deduct } = await supabase.from("profiles").update({ galeons: bal - item.price_galeons } as never).eq("user_id", user.id);
        if (deduct) throw deduct;
        setOwned(prev => [...prev, item.id]);
        toast.success(`✅ "${item.name}" adicionado ao inventário!`);
        setBuying(null);
        return;
      }

      const { error: deduct } = await supabase.from("profiles").update({ galeons: bal - item.price_galeons } as never).eq("user_id", user.id);
      if (deduct) throw deduct;
      const { error: ins } = await supabase.from("user_items").insert({ user_id: user.id, item_id: item.id } as never);
      if (ins) {
        await supabase.from("profiles").update({ galeons: bal } as never).eq("user_id", user.id);
        throw ins;
      }
      setOwned(prev => [...prev, item.id]);
      toast.success(`✅ "${item.name}" adicionado ao inventário!`);
    } catch (e: any) { toast.error("Erro: " + (e.message || "Tente novamente.")); }
    finally { setBuying(null); }
  };

  // ── Assinar VIP ───────────────────────────────────────────
  const buyVip = async (plan: typeof VIP_PLANS[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(plan.id);
    try {
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id, package_id: `vip_${plan.id}`, amount_brl: plan.price_brl, galeons: 0, status: "pending",
      } as never).select("id").single();
      if (error) throw error;
      const description = `VIP ${plan.name} (1 mês)`;
      toast.info("⏳ Gerando link de pagamento...");
      const payUrl = await createInfinitePayLink(order.id, plan.price_brl, description, user.email ?? "", profile.full_name);
      if (!payUrl) throw new Error("Erro ao gerar link.");
      toast.info("💳 Redirecionando...");
      setTimeout(() => { window.location.href = payUrl; }, 800);
    } catch (e: any) { toast.error(e.message || "Erro ao ativar VIP."); }
    finally { setBuying(null); }
  };

  const galeons = profile?.galeons ?? 0;
  const currentVip = profile?.vip_plan;
  const filteredItems = items.filter(i => i.category === tab);
  const featuredItems = items.filter(i => i.is_featured || i.rarity === 'legendary').slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* ── SUPER HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-yellow-500/20 shadow-2xl group min-h-[360px] flex items-center mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 via-yellow-900/60 to-black z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618501275376-7eb3e284f3cc?q=80&w=2000')" }} />
        
        <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between w-full gap-8">
          <div className="flex-1 text-left space-y-6">
            <div className="inline-flex items-center gap-2 border border-yellow-500/40 rounded-full px-4 py-1.5">
              <Sparkles size={12} className="text-yellow-500" />
              <span className="text-[10px] font-heading text-yellow-500 uppercase tracking-widest">Empório Exclusivo</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading text-gold-gradient drop-shadow-lg leading-tight">
              GRINGOTTS<br/>VAULT
            </h1>
            
            <p className="text-yellow-100/70 text-base md:text-lg max-w-lg leading-relaxed font-serif">
              Bem-vindo à vitrine mais seleta do mundo bruxo. Descubra artefatos lendários, feitiçarias ancestrais e ostente o prestígio que você merece.
            </p>
            
            <Button variant="magical" size="lg" className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black border-none font-bold text-base px-8 py-6 rounded-xl hover:scale-105 transition-transform" onClick={() => setTab("featured")}>
              Ver Exclusivos <Flame className="ml-2" size={18} />
            </Button>
          </div>
          
          <div className="w-full md:w-80 glass bg-black/60 border border-yellow-500/20 rounded-[2rem] p-8 text-center backdrop-blur-md shadow-2xl">
            <p className="text-yellow-500/80 text-[10px] font-heading uppercase tracking-widest mb-6">Acesso ao Cofre</p>
            <div className="w-12 h-16 mx-auto border border-yellow-500/40 rounded-sm mb-6 flex items-center justify-center relative shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            </div>
            <p className="text-5xl font-heading text-yellow-400 mb-2 drop-shadow-md">
              {galeons.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-yellow-100/60 mb-8 font-serif">Galeões Disponíveis</p>
            <Button variant="outline" className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 rounded-xl" onClick={() => setTab("galeons")}>
              Adquirir Mais
            </Button>
          </div>
        </div>
      </div>

      {pendingOrderId && (
        <div className="glass rounded-2xl p-5 border border-yellow-400/50 bg-yellow-900/20 flex flex-col sm:flex-row items-center gap-4 animate-pulse">
          <div className="text-3xl">⏳</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-heading text-yellow-400 text-lg">Pagamento em Processamento</p>
            <p className="text-sm text-yellow-200/70">A magia está acontecendo. Clique para confirmar se a transação foi concluída.</p>
          </div>
          <Button variant="magical" size="sm" onClick={() => verifyAndCreditPayment(pendingOrderId, "", "")}>
            🔍 Verificar Status
          </Button>
          <button onClick={() => setPendingOrderId(null)} className="text-yellow-500/60 hover:text-yellow-400 text-xs underline">
            Ocultar
          </button>
        </div>
      )}

      {/* ── NAVIGATION TABS ── */}
      <div className="flex justify-center">
        <div className="glass p-2 rounded-full border border-border/50 inline-flex flex-wrap justify-center gap-2 bg-background/40 backdrop-blur-xl">
          {TABS.map(t => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold font-heading transition-all duration-300 ${
                  isActive 
                    ? t.id === 'featured' ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 border border-orange-400/50" 
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border border-primary/50"
                    : "bg-transparent text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-transparent"
                }`}>
                <Icon size={16} className={isActive ? "animate-pulse" : ""} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── ABA: DESTAQUES / EXCLUSIVOS ── */}
      {tab === "featured" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-heading text-foreground mb-3 flex items-center justify-center gap-2">
              <Flame className="text-orange-500" /> Ofertas Limitadas & Lendárias
            </h2>
            <p className="text-muted-foreground">Itens raríssimos de colecionador. Uma vez que o estoque mágico acabe, eles podem nunca mais voltar.</p>
          </div>

          {/* Hardcoded Mystery Box Offer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="relative group rounded-3xl overflow-hidden border border-purple-500/40 bg-gradient-to-br from-purple-900/30 to-indigo-950/40 p-1">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944913456-11f422b404d0?q=80&w=2070')] bg-cover opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative glass h-full rounded-2xl p-8 border border-purple-400/20 flex flex-col items-center text-center justify-center backdrop-blur-sm">
                <span className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                  Mais Desejado
                </span>
                <div className="w-24 h-24 mb-6 relative">
                  <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full" />
                  <Gift size={80} className="text-purple-300 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] relative z-10" />
                </div>
                <h3 className="text-3xl font-heading text-purple-200 mb-2">Caixa Surpresa VIP</h3>
                <p className="text-purple-200/60 text-sm mb-6 max-w-md">Contém 1 item Lendário garantido, 3 itens Raros e uma chance de desbloquear um Título Exclusivo permanente.</p>
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-black/40 rounded-xl p-3 border border-purple-500/20">
                    <p className="text-xs text-purple-300/50 uppercase">Preço Especial</p>
                    <p className="text-xl font-heading text-yellow-400">🪙 2.500</p>
                  </div>
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold h-full shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-transform hover:scale-105"
                    onClick={() => buyItem({ id: "3d_mystery_box", name: "Caixa Surpresa VIP", description: "Contém 1 item Lendário garantido, 3 itens Raros e uma chance de desbloquear um Título Exclusivo permanente.", category: "featured", price_galeons: 2500, image_url: "https://images.unsplash.com/photo-1618944913456-11f422b404d0?q=80&w=600", rarity: "legendary", is_featured: true })}
                    disabled={buying === "3d_mystery_box" || galeons < 2500}
                  >
                    {buying === "3d_mystery_box" ? "Comprando..." : galeons < 2500 ? "Sem Saldo" : "Adquirir Caixa"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative group rounded-3xl overflow-hidden border border-yellow-500/40 bg-gradient-to-br from-yellow-900/30 to-amber-950/40 p-1">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative glass h-full rounded-2xl p-8 border border-yellow-400/20 flex flex-col items-center text-center justify-center backdrop-blur-sm">
                <span className="absolute top-4 right-4 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Estoque: 3/10
                </span>
                <div className="w-24 h-24 mb-6 relative">
                  <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full" />
                  <Crown size={80} className="text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.8)] relative z-10" />
                </div>
                <h3 className="text-3xl font-heading text-yellow-200 mb-2">Coroa de Merlin</h3>
                <p className="text-yellow-200/60 text-sm mb-6 max-w-md">O artefato mais raro do portal. Concede uma aura dourada permanente ao seu perfil e destaque máximo no ranking.</p>
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 bg-black/40 rounded-xl p-3 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300/50 uppercase">Valor Lendário</p>
                    <p className="text-xl font-heading text-yellow-400">🪙 10.000</p>
                  </div>
                  <Button 
                    className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold h-full shadow-[0_0_20px_rgba(202,138,4,0.4)] transition-transform hover:scale-105"
                    onClick={() => buyItem({ id: "3d_merlin_crown", name: "Coroa de Merlin", description: "O artefato mais raro do portal. Concede uma aura dourada permanente ao seu perfil e destaque máximo no ranking.", category: "featured", price_galeons: 10000, image_url: "https://images.unsplash.com/photo-1574280367876-0f862cd5d082?q=80&w=600", rarity: "legendary", is_featured: true })}
                    disabled={buying === "3d_merlin_crown" || galeons < 10000}
                  >
                    {buying === "3d_merlin_crown" ? "Comprando..." : galeons < 10000 ? "Sem Saldo" : "Comprar Artefato"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {featuredItems.length > 0 && (
             <div>
                <h3 className="text-2xl font-heading text-foreground mb-6 flex items-center gap-2">
                  <Star className="text-yellow-400" /> Em Destaque
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {featuredItems.map(item => {
                    const isOwned = owned.includes(item.id);
                    const canAfford = galeons >= item.price_galeons;
                    return (
                      <div key={item.id} className="group glass rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-background to-secondary/20 overflow-hidden flex flex-col hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                        <div className="relative aspect-square overflow-hidden bg-black/40">
                          <StoreItemVisual imageUrl={item.image_url} name={item.name} category={item.category} isOwned={isOwned} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            {!isOwned && <Button size="sm" variant="magical" onClick={() => buyItem(item)} disabled={!canAfford || buying === item.id}>Comprar Rápido</Button>}
                          </div>
                        </div>
                        <div className="p-4 flex flex-col flex-1 text-center">
                          <h4 className="font-heading text-lg text-foreground mb-1 group-hover:text-yellow-400 transition-colors">{item.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{item.description}</p>
                          <div className="inline-block bg-yellow-900/30 border border-yellow-500/20 rounded-lg px-3 py-1.5 mx-auto">
                            <span className="font-heading text-yellow-400 font-bold text-lg">🪙 {item.price_galeons}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
          )}
        </div>
      )}

      {/* ── ABA: GALEÕES ── */}
      {tab === "galeons" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-heading text-foreground mb-3 flex items-center justify-center gap-2">
              <Coins className="text-yellow-400" /> Adquira Riquezas Mágicas
            </h2>
            <p className="text-muted-foreground">O Banco Gringotts oferece as melhores taxas de câmbio. Abasteça seu cofre instantaneamente via Pix ou Cartão.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {GALEON_PACKAGES.map((pkg, i) => (
              <div key={pkg.id}
                className={`group glass rounded-3xl p-1 border ${pkg.border} bg-gradient-to-br ${pkg.color} relative transition-all duration-500 hover:-translate-y-3 ${pkg.glow} flex flex-col ${i === 2 || i === 3 ? 'lg:-translate-y-4' : ''}`}>
                <div className="glass h-full bg-background/80 backdrop-blur-md rounded-[1.3rem] p-6 flex flex-col items-center text-center relative overflow-hidden">
                  {pkg.badge && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[10px] font-bold uppercase tracking-widest py-1">
                      {pkg.badge}
                    </div>
                  )}
                  <div className="w-24 h-24 mb-4 mt-2 relative rounded-2xl overflow-hidden border-2 border-yellow-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                    <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover mix-blend-overlay opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">{pkg.icon}</div>
                  </div>
                  <h3 className="font-heading text-lg text-foreground mb-1 group-hover:text-yellow-400 transition-colors">{pkg.name}</h3>
                  <p className="text-2xl font-heading text-yellow-400 font-bold mb-1 drop-shadow-md">🪙 {pkg.galeons}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-6 flex-1">
                    ~{(pkg.galeons / pkg.price_brl).toFixed(0)} Galeões / R$
                  </p>
                  <Button variant={pkg.badge ? "magical" : "outline"} className={`w-full font-bold ${!pkg.badge && 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20'}`} disabled={buying === pkg.id} onClick={() => buyGaleons(pkg)}>
                    {buying === pkg.id ? "Aguarde..." : `R$ ${pkg.price_brl.toFixed(2).replace(".", ",")}`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="glass rounded-2xl p-6 border border-primary/20 bg-primary/5 flex items-center justify-center gap-6 max-w-3xl mx-auto mt-12">
            <div className="p-3 bg-primary/20 rounded-full text-primary"><Check size={24} /></div>
            <div>
              <p className="font-heading text-lg">Garantia Duende Gringotts</p>
              <p className="text-sm text-muted-foreground">Transações criptografadas e liberação <strong>imediata</strong> dos fundos após confirmação.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: VIP ── */}
      {tab === "vip" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-heading text-foreground mb-3 flex items-center justify-center gap-2">
              <Crown className="text-yellow-400" /> Clube dos Sangue-Puro (VIP)
            </h2>
            <p className="text-muted-foreground">Eleve seu status no portal com benefícios exclusivos, mesada em Galeões e cosméticos impossíveis de obter de outra forma.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {VIP_PLANS.map((plan, i) => (
              <div key={plan.id}
                className={`group glass rounded-3xl p-1 border ${plan.border} bg-gradient-to-br ${plan.color} relative flex flex-col transition-all duration-500 hover:-translate-y-3 ${plan.glow} ${i === 1 ? 'md:-translate-y-6 md:scale-105' : ''}`}>
                
                <div className="glass h-full bg-background/90 backdrop-blur-xl rounded-[1.3rem] p-8 flex flex-col relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-current opacity-5 blur-3xl rounded-full pointer-events-none" style={{ color: plan.textColor.split('-')[1] }} />
                  
                  {currentVip === plan.id && (
                    <div className="absolute top-4 right-4 bg-green-500/20 border border-green-500/50 text-green-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-md">
                      <Check size={12} /> Ativo
                    </div>
                  )}
                  {plan.badge && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 text-center">
                      {plan.badge}
                    </div>
                  )}

                  <div className="w-full h-32 mb-6 mt-2 relative rounded-2xl overflow-hidden border border-current shadow-lg group-hover:scale-105 transition-transform duration-500" style={{ borderColor: plan.textColor.split('-')[1] }}>
                    <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-[0_0_20px_currentColor]">{plan.icon}</div>
                  </div>
                  <h3 className={`font-heading text-2xl mb-2 ${plan.textColor}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-8">
                    <span className={`font-heading text-4xl font-bold ${plan.textColor}`}>R$ {plan.price_brl.toFixed(2).replace(".", ",")}</span>
                    <span className="text-sm text-muted-foreground pb-1">/mês</span>
                  </div>

                  <ul className="space-y-4 flex-1 mb-8 relative z-10">
                    {plan.benefits.map(b => (
                      <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground/90">
                        <div className={`p-1 rounded-full bg-current opacity-20 shrink-0 mt-0.5`} style={{ color: plan.textColor.split('-')[1] }}>
                           <Check size={10} className={plan.textColor} />
                        </div>
                        {b}
                      </li>
                    ))}
                    {plan.galeons_monthly > 0 && (
                      <li className="flex items-start gap-3 text-sm font-bold text-yellow-400 mt-6 pt-4 border-t border-border/50">
                         <div className="p-1 rounded-full bg-yellow-500/20 shrink-0 mt-0.5">
                           <Coins size={12} className="text-yellow-400" />
                        </div>
                        +{plan.galeons_monthly} Galeões/mês grátis!
                      </li>
                    )}
                  </ul>

                  <Button size="lg" className={`w-full font-bold shadow-lg transition-all ${
                      currentVip === plan.id ? "bg-green-600/20 text-green-400 border border-green-500/50 hover:bg-green-600/30" : 
                      i === 1 ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none" :
                      i === 2 ? "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black border-none" :
                      "bg-secondary hover:bg-secondary/80 text-foreground"
                    }`} disabled={buying === plan.id || currentVip === plan.id}
                    onClick={() => buyVip(plan)}>
                    {buying === plan.id ? "Processando..." : currentVip === plan.id ? "Seu Plano Atual" : "Assinar Agora"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABAS DE ITENS (Roupas, Varinhas, etc) ── */}
      {["clothing","wand","accessory","skin"].includes(tab) && (
        <div className="animate-in fade-in duration-500">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="glass aspect-[3/4] rounded-2xl animate-pulse bg-secondary/50" />)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center max-w-2xl mx-auto border-dashed border-2 border-muted">
              <div className="w-24 h-24 mx-auto bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag size={40} className="text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-2xl font-heading mb-2">Coleção em Desenvolvimento</h3>
              <p className="text-muted-foreground">Nossos artesãos mágicos estão forjando novos itens para esta categoria. Volte em breve!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredItems.map(item => {
                const rar = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common;
                const isOwned = owned.includes(item.id);
                const canAfford = galeons >= item.price_galeons;
                return (
                  <div key={item.id}
                    className={`group glass rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:bg-secondary/40 ${rar.border} ${rar.glow} ${
                      item.rarity === "legendary" ? "bg-gradient-to-br from-yellow-900/10 to-transparent" : ""
                    }`}>
                    <div className="relative aspect-square overflow-hidden bg-black/50">
                      <StoreItemVisual
                        imageUrl={item.image_url}
                        name={item.name}
                        category={item.category}
                        isOwned={isOwned}
                      />
                      <span className={`absolute top-2 right-2 text-[10px] font-bold tracking-wider px-2 py-1 rounded-full border ${rar.cls} bg-background/90 backdrop-blur-md shadow-lg z-10 uppercase`}>
                        {rar.label}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1 relative">
                      <h4 className="font-heading text-base text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground flex-1 mb-4 leading-relaxed line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                           <span className="text-xs">🪙</span>
                           <span className="font-heading text-yellow-400 text-sm">{item.price_galeons}</span>
                        </div>
                        <Button size="sm" variant={isOwned ? "outline" : "magical"}
                          disabled={isOwned || buying === item.id || (!canAfford && !isOwned)}
                          onClick={() => !isOwned && buyItem(item)}
                          className={`text-xs px-4 h-8 ${isOwned ? 'border-green-500/30 text-green-400' : ''}`}>
                          {isOwned ? "Adquirido" : !canAfford ? "Sem Saldo" : buying === item.id ? "..." : "Comprar"}
                        </Button>
                      </div>
                      
                      {/* Hover Overlay for insufficient funds */}
                      {!isOwned && !canAfford && (
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background via-background/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform flex flex-col items-center justify-end z-20">
                          <p className="text-[11px] text-red-400 font-bold text-center bg-red-500/10 px-2 py-1 rounded w-full border border-red-500/20">
                            Faltam 🪙 {item.price_galeons - galeons}
                          </p>
                          <button onClick={() => setTab("galeons")} className="text-[10px] text-yellow-400 hover:underline mt-1">Obter Galeões</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
