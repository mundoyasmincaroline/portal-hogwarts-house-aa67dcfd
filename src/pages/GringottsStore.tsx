import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Coins, Crown, Wand2, Shirt, Gem, Sparkles, Star, ExternalLink, Check, Flame, Gift, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreItemVisual from "@/components/StoreItemVisual";
import SafeImage from "@/components/SafeImage";

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
  { id: "bolsinha",  name: "Bolsinha de Galeões",     galeons: 100,  price_brl: 4.90,  icon: "💰", image_url: "https://i.pinimg.com/736x/8b/6e/8b/8b6e8b4e7a2b9a1e8b4e7a2b9a1e8b4e.jpg", color: "from-amber-800/40 to-amber-900/40", border: "border-amber-600/40", glow: "group-hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]" },
  { id: "saco",      name: "Saco de Galeões",          galeons: 300,  price_brl: 12.90, icon: "🪙", image_url: "https://i.pinimg.com/736x/2c/31/31/2c313181232812328123281232812328.jpg", color: "from-amber-700/50 to-yellow-800/40", border: "border-yellow-500/50", glow: "group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]", badge: "Mais Popular" },
  { id: "bau",       name: "Baú de Galeões",           galeons: 700,  price_brl: 24.90, icon: "💎", image_url: "/bau_lendario_3d.png", color: "from-yellow-600/50 to-amber-700/50", border: "border-amber-400/60", glow: "group-hover:shadow-[0_0_30_rgba(251,191,36,0.5)]" },
  { id: "tesouro",   name: "Tesouro de Gringotts",     galeons: 1500, price_brl: 44.90, icon: "👑", image_url: "/liquid_luck_3d.png", color: "from-yellow-500/60 to-amber-600/50", border: "border-yellow-400/70", glow: "group-hover:shadow-[0_0_35px_rgba(250,204,21,0.6)]", badge: "Melhor Valor" },
  { id: "cofre",     name: "Cofre Lendário",           galeons: 4000, price_brl: 99.90, icon: "🏆", image_url: "/medalha_ouro_3d.png", color: "from-yellow-400/70 to-amber-500/60", border: "border-yellow-300/80", glow: "group-hover:shadow-[0_0_45px_rgba(253,224,71,0.7)]", badge: "Lendário" },
];

// ─── Planos VIP ────────────────────────────────────────────
const VIP_PLANS = [
  {
    id: "premium", name: "Estudante Premium", icon: "✨", price_brl: 9.90, image_url: "/medalha_ouro_3d.png",
    color: "from-blue-900/60 to-indigo-900/40", border: "border-blue-400/50", textColor: "text-blue-300", glow: "hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]",
    benefits: ["+50% XP em todas as atividades", "Badge exclusivo ✨ no perfil", "Acesso a salas Premium", "Nome com brilho especial"],
    galeons_monthly: 0,
  },
  {
    id: "vip", name: "Auror VIP", icon: "🥇", price_brl: 19.90, image_url: "/liquid_luck_3d.png",
    color: "from-purple-900/60 to-fuchsia-900/40", border: "border-purple-400/60", textColor: "text-purple-300", glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    benefits: ["Tudo do Premium", "+200 Galeões todo mês", "Nome dourado em todo portal", "Skin exclusiva de Auror", "Acesso antecipado a eventos"],
    galeons_monthly: 200,
    badge: "MAIS ESCOLHIDO"
  },
  {
    id: "founder", name: "Fundador Hogwarts", icon: "👑", price_brl: 39.90, image_url: "/bau_lendario_3d.png",
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
  { id: "wand",     label: "🪄 Varinhas",   icon: Wand2 },
  { id: "spell",    label: "📜 Feitiços",   icon: Sparkles },
  { id: "potion",   label: "🧪 Poções",     icon: Gem },
  { id: "stickers", label: "🖼️ Figurinhas",  icon: Trophy },
  { id: "clothing", label: "👗 Roupas",     icon: Shirt },
  { id: "upgrade",  label: "⚡ Upgrades",   icon: Zap },
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

  // Injetar itens lendários 3D se as abas correspondentes forem selecionadas
  const displayItems = tab === "stickers" 
    ? [...filteredItems, { 
        id: "3d_sticker_pack", 
        name: "Pacote de Figurinhas Mágicas", 
        description: "Contém 3 figurinhas aleatórias. Chance de vir Lendária!", 
        category: "stickers", 
        price_galeons: 25, 
        image_url: "/stickers_pack_3d.png", 
        rarity: "rare", 
        is_featured: true 
      }]
    : tab === "wand"
    ? [...filteredItems, {
        id: "3d_elder_wand",
        name: "A Varinha das Varinhas",
        description: "A varinha mais poderosa que já existiu. Feita de sabugueiro.",
        category: "wand",
        price_galeons: 5000,
        image_url: "/elder_wand_3d.png",
        rarity: "legendary",
        is_featured: true
      }]
    : tab === "clothing"
    ? [...filteredItems, {
        id: "3d_invisibility_cloak",
        name: "Manto da Invisibilidade",
        description: "Um dos três itens das Relíquias da Morte. Verdadeira invisibilidade.",
        category: "clothing",
        price_galeons: 8000,
        image_url: "/invisibility_cloak_3d.png",
        rarity: "legendary",
        is_featured: true
      }]
    : filteredItems;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      
      {/* ── MONSTER HERO BANNER: THE VAULT ENTRANCE ── */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-b from-white/[0.08] to-black/80 backdrop-blur-3xl p-10 md:p-20 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618501275376-7eb3e284f3cc?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-1000" />
        
        {/* Magic Light Beams */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 shadow-2xl">
              <Sparkles size={14} className="text-yellow-400 animate-spin-slow" />
              <span className="text-[10px] font-heading text-yellow-400 uppercase tracking-[0.3em]">Cofre de Elite Gringotts</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-heading text-gold-gradient leading-[0.9] tracking-tighter drop-shadow-2xl">
              GRINGOTTS<br/><span className="text-white/90">SUPREME</span>
            </h1>
            
            <p className="text-white/60 text-lg md:text-xl max-w-xl leading-relaxed font-serif italic">
              "Fortuna, prestígio e artefatos de poder incomensurável. Onde a magia encontra o luxo absoluto."
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button variant="magical" size="lg" className="h-16 px-10 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-heading text-xs tracking-widest shadow-2xl shadow-yellow-500/20 hover:scale-105 transition-all" onClick={() => setTab("featured")}>
                EXPLORAR EXCLUSIVOS <Flame className="ml-2" size={18} />
              </Button>
            </div>
          </div>
          
          {/* Balance Card - Monster 3D */}
          <div className="w-full max-w-sm relative group/card">
            <div className="absolute inset-0 bg-yellow-400/20 blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
            <div className="relative glass bg-black/60 border border-white/10 rounded-[3rem] p-10 text-center backdrop-blur-3xl shadow-2xl transform transition-transform group-hover/card:rotate-2">
               <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-2xl border border-yellow-500/30 flex items-center justify-center shadow-inner">
                  <Coins size={40} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
               </div>
               <p className="text-white/40 text-[10px] font-heading uppercase tracking-[0.4em] mb-2">Seu Tesouro</p>
               <h2 className="text-5xl font-heading text-white mb-2 tracking-tighter drop-shadow-2xl">
                  {galeons.toLocaleString("pt-BR")}
               </h2>
               <p className="text-xs text-yellow-500/60 font-heading uppercase tracking-widest mb-8">Galeões de Ouro</p>
               <Button variant="outline" className="w-full h-14 border-white/10 text-white hover:bg-white/5 rounded-2xl font-heading text-[10px] tracking-widest" onClick={() => setTab("galeons")}>
                  ADQUIRIR MAIS
               </Button>
            </div>
          </div>
        </div>
      </div>

      {pendingOrderId && (
        <div className="relative overflow-hidden rounded-[2rem] p-6 border border-yellow-500/40 bg-yellow-900/20 backdrop-blur-xl flex flex-col md:flex-row items-center gap-6 animate-pulse-glow shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40 shrink-0">
             <Zap size={24} className="text-yellow-400" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="font-heading text-yellow-400 text-lg tracking-tight">TRANSAÇÃO EM CURSO</p>
            <p className="text-xs text-yellow-200/60 font-medium">Os duendes estão processando seu ouro. Clique para validar a magia.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="magical" size="sm" className="h-10 rounded-xl px-6" onClick={() => verifyAndCreditPayment(pendingOrderId, "", "")}>
               VERIFICAR AGORA
             </Button>
             <button onClick={() => setPendingOrderId(null)} className="p-2 text-white/20 hover:text-white transition-colors">
               <Check size={20} />
             </button>
          </div>
        </div>
      )}

      {/* ── NAVIGATION TABS - MONSTER QUALITY ── */}
      <div className="flex justify-center sticky top-4 z-40 px-4">
        <div className="glass p-2 rounded-[2rem] border border-white/10 inline-flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-3xl shadow-2xl">
          {TABS.map(t => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-heading tracking-widest transition-all duration-500 overflow-hidden group/tab ${
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}>
                {isActive && (
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                )}
                <Icon size={14} className={`relative z-10 ${isActive ? "animate-pulse" : ""}`} />
                <span className="relative z-10">{t.label.toUpperCase()}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── ABA: DESTAQUES / EXCLUSIVOS - MONSTER QUALITY ── */}
      {tab === "featured" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl font-heading text-white tracking-tight flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
                <Flame className="text-orange-500" size={20} />
              </div>
              OFERTAS LENDÁRIAS
            </h2>
            <p className="text-white/40 text-sm font-heading tracking-widest uppercase">Artefatos Únicos e Relíquias de Colecionador</p>
          </div>

          {/* LIGHTNING OFFER: THE SAPPHIRE ROBE */}
          <div className="relative overflow-hidden rounded-[4rem] bg-gradient-to-br from-blue-900/40 via-black to-blue-900/20 border border-blue-400/30 p-1 group shadow-[0_0_80px_rgba(37,99,235,0.2)]">
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618501275376-7eb3e284f3cc?q=80&w=2000')] bg-cover bg-center opacity-5 mix-blend-overlay" />
             <div className="relative glass rounded-[3.5rem] p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />
                
                <div className="relative w-64 h-64 md:w-80 md:h-80 group-hover:scale-110 transition-transform duration-700 shrink-0">
                    <div className="absolute inset-0 bg-blue-400/20 blur-[80px] animate-pulse" />
                    <img src="/robe_safira_premium.png" alt="Robe Safira" className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(59,130,246,0.8)] relative z-10" />
                </div>

                <div className="flex-1 space-y-8 text-center lg:text-left">
                   <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 text-[10px] font-heading tracking-[0.3em] uppercase">
                      <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      LOTE LIMITADO: 03 UNIDADES
                   </div>
                   
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-6xl font-heading text-white leading-none tracking-tighter">Manto de Safira do Arquiteto</h2>
                      <p className="text-blue-100/60 text-lg font-serif italic max-w-xl">"Dizem que este manto foi tecido com fios de pura consciência pelo próprio Morpheus."</p>
                   </div>

                   <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10">
                      <div className="space-y-1">
                         <p className="text-[10px] text-white/40 uppercase font-heading tracking-widest">Tempo Restante</p>
                         <div className="flex gap-4 font-heading text-3xl text-yellow-500">
                            <div className="flex flex-col items-center">
                               <span className="text-white drop-shadow-2xl">04</span>
                               <span className="text-[8px] text-white/20">HORAS</span>
                            </div>
                            <span className="opacity-20">:</span>
                            <div className="flex flex-col items-center">
                               <span className="text-white drop-shadow-2xl">12</span>
                               <span className="text-[8px] text-white/20">MIN</span>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-1">
                         <p className="text-[10px] text-white/40 uppercase font-heading tracking-widest">Troca Requerida</p>
                         <div className="flex items-center gap-4">
                            <span className="text-xl text-white/20 line-through">2.500</span>
                            <span className="text-4xl font-heading text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">🪙 1.500</span>
                         </div>
                      </div>
                   </div>

                   <Button size="lg" variant="magical" className="h-16 px-12 rounded-2xl shadow-2xl shadow-yellow-500/20 hover:scale-105 transition-transform font-heading text-xs tracking-widest group/btn" onClick={() => buyItem({ id: "featured_robe_safira", name: "Robe Azul-Safira", category: "clothing", price_galeons: 1500, image_url: "/robe_safira_premium.png" })}>
                      ADQUIRIR AGORA <Sparkles className="ml-2 group-hover/btn:rotate-12 transition-transform" />
                   </Button>
                </div>
             </div>
          </div>

          {/* MYSTERY VAULT - MONSTER 3D */}
          <div className="relative overflow-hidden rounded-[4rem] bg-gradient-to-br from-purple-900/40 via-black to-purple-900/20 border border-purple-500/30 p-10 md:p-20 text-center lg:text-left">
             <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent" />
             <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                <div className="relative shrink-0 group/vault">
                    <div className="absolute inset-0 bg-purple-500/20 blur-[100px] animate-pulse" />
                    <div className="relative w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center group-hover/vault:scale-110 transition-transform duration-700 shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                        <Gift size={100} className="text-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-bounce-slow" />
                    </div>
                    <div className="absolute -bottom-4 inset-x-0 mx-auto w-fit bg-purple-600 text-white text-[9px] font-heading px-6 py-2 rounded-full tracking-[0.3em] shadow-2xl">MYSTERY VAULT</div>
                </div>

                <div className="flex-1 space-y-8">
                   <div className="space-y-4">
                      <h2 className="text-4xl md:text-6xl font-heading text-white tracking-tighter">O Cofre do Desconhecido</h2>
                      <p className="text-purple-200/50 text-lg font-serif italic max-w-2xl">"O que reside além das sombras? Apenas os mais corajosos — ou mais ricos — descobrirão o que os duendes esconderam por milênios."</p>
                   </div>

                   <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8">
                      <div className="bg-black/40 backdrop-blur-2xl px-8 py-4 rounded-2xl border border-white/10">
                         <p className="text-[10px] text-white/40 font-heading tracking-widest uppercase mb-1">Custo da Chave</p>
                         <p className="text-4xl font-heading text-yellow-400 tracking-tighter">🪙 30</p>
                      </div>

                      <Button 
                        variant="magical" 
                        className="h-20 px-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none font-heading text-lg tracking-widest shadow-2xl shadow-purple-500/30 group/vaultbtn"
                        onClick={() => {
                            if (galeons < 30) return toast.error("Galeões insuficientes!");
                            toast.promise(new Promise(r => setTimeout(r, 2000)), {
                                loading: '🪄 Abrindo selos do cofre...',
                                success: '🎁 Cofre aberto! Verifique seu inventário.',
                                error: 'Erro na abertura.',
                            });
                        }}
                      >
                        TENTAR A SORTE <Star size={24} className="ml-3 group-hover/vaultbtn:rotate-180 transition-transform duration-500" />
                      </Button>
                   </div>
                </div>
             </div>
          </div>

          {/* GRID DESTAQUES - MONSTER QUALITY */}
          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-heading text-white tracking-tight flex items-center gap-3">
                   <Star className="text-yellow-400" size={20} />
                   RELÍQUIAS FEATURED
                </h3>
                <div className="h-[1px] flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {featuredItems.map(item => {
                 const isOwned = owned.includes(item.id);
                 const canAfford = galeons >= item.price_galeons;
                 return (
                   <div key={item.id} className="relative group/item overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/5 p-6 transition-all duration-500 hover:bg-white/[0.06] hover:border-white/10 hover:-translate-y-2">
                     <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-black/40 border border-white/5 mb-6">
                        <StoreItemVisual imageUrl={item.image_url} name={item.name} category={item.category} isOwned={isOwned} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                           {!isOwned && canAfford && (
                              <Button variant="magical" className="rounded-xl font-heading text-[10px] tracking-widest px-6" onClick={() => buyItem(item)}>COMPRAR</Button>
                           )}
                        </div>
                     </div>
                     <div className="space-y-4 text-center">
                        <div className="space-y-1">
                           <h4 className="font-heading text-lg text-white group-hover/item:text-yellow-400 transition-colors">{item.name.toUpperCase()}</h4>
                           <p className="text-[10px] text-white/30 font-heading tracking-widest uppercase">{item.category}</p>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-2 rounded-xl">
                           <span className="text-sm text-yellow-400 font-heading">🪙 {item.price_galeons}</span>
                        </div>
                     </div>
                   </div>
                 )
               })}
             </div>
          </div>
        </div>
      )}

      {/* ── ABA: GALEÕES - MONSTER QUALITY ── */}
      {tab === "galeons" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl font-heading text-white tracking-tight flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/40">
                <Coins className="text-yellow-400" size={20} />
              </div>
              CÂMBIO GRINGOTTS
            </h2>
            <p className="text-white/40 text-sm font-heading tracking-widest uppercase">Abasteça seu Cofre com as Melhores Taxas</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {GALEON_PACKAGES.map((pkg, i) => (
              <div key={pkg.id}
                className={`group/pkg relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border ${pkg.border} p-1 transition-all duration-500 hover:-translate-y-4 hover:bg-white/[0.06] ${pkg.glow}`}>
                <div className="relative glass h-full rounded-[2.3rem] p-6 flex flex-col items-center text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover/pkg:opacity-100 transition-opacity" />
                  
                  {pkg.badge && (
                    <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-[9px] font-heading uppercase tracking-[0.2em] py-2 shadow-lg">
                      {pkg.badge}
                    </div>
                  )}
                  
                  <div className="relative w-32 h-32 mb-6 mt-4 group-hover/pkg:scale-110 transition-transform duration-700">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-3xl opacity-0 group-hover/pkg:opacity-100 transition-opacity" />
                    <SafeImage src={pkg.image_url} alt={pkg.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                  </div>

                  <div className="space-y-4 flex-1 w-full">
                     <div className="space-y-1">
                        <h3 className="font-heading text-base text-white/80 group-hover/pkg:text-white transition-colors">{pkg.name.toUpperCase()}</h3>
                        <p className="text-4xl font-heading text-yellow-400 drop-shadow-2xl">🪙 {pkg.galeons}</p>
                     </div>
                     
                     <div className="py-2 border-y border-white/5">
                        <p className="text-[10px] text-white/20 font-heading tracking-widest uppercase">
                           {(pkg.galeons / pkg.price_brl).toFixed(0)} GAL / R$
                        </p>
                     </div>

                     <Button variant="magical" className="w-full h-14 rounded-2xl font-heading text-xs tracking-widest shadow-xl group/pkgbtn overflow-hidden relative" disabled={buying === pkg.id} onClick={() => buyGaleons(pkg)}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/pkgbtn:animate-[shimmer_2s_infinite]" />
                        <span className="relative z-10">{buying === pkg.id ? "..." : `R$ ${pkg.price_brl.toFixed(2).replace(".", ",")}`}</span>
                     </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative overflow-hidden rounded-[3rem] bg-white/[0.02] border border-white/5 p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-10 max-w-4xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center border border-green-500/40 shrink-0 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
               <Check size={40} className="text-green-500" />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h4 className="font-heading text-2xl text-white tracking-tight uppercase">Selo de Segurança Gringotts</h4>
              <p className="text-white/40 text-sm leading-relaxed max-w-xl">
                 Todas as transações são protegidas por feitiços de criptografia antiga. O ouro será creditado no seu cofre instantaneamente após a confirmação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: VIP - MONSTER QUALITY ── */}
      {tab === "vip" && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl font-heading text-white tracking-tight flex items-center justify-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                <Crown className="text-purple-400" size={20} />
              </div>
              SOCIEDADE DE ELITE
            </h2>
            <p className="text-white/40 text-sm font-heading tracking-widest uppercase">Ascenda ao Status de Lenda em Hogwarts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto px-4">
            {VIP_PLANS.map((plan, i) => {
              const isCenter = i === 1;
              return (
                <div key={plan.id}
                  className={`group/vip relative overflow-hidden rounded-[3.5rem] bg-white/[0.03] border ${plan.border} p-1 transition-all duration-700 hover:-translate-y-6 ${plan.glow} ${isCenter ? 'md:scale-105 md:-translate-y-4 z-10 shadow-2xl' : ''}`}>
                  <div className={`relative glass h-full rounded-[3.3rem] p-8 md:p-10 flex flex-col overflow-hidden ${isCenter ? 'bg-black/60' : 'bg-black/40'}`}>
                    {/* Decorative Aura */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-current opacity-5 blur-[80px] rounded-full pointer-events-none" style={{ color: plan.textColor.split('-')[1] }} />
                    
                    {currentVip === plan.id && (
                      <div className="absolute top-6 right-6 bg-green-500/20 border border-green-500/40 text-green-400 text-[9px] font-heading tracking-widest px-4 py-1.5 rounded-full backdrop-blur-3xl animate-pulse">
                        PLANO ATUAL
                      </div>
                    )}
                    
                    {plan.badge && (
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-heading uppercase tracking-[0.2em] py-2 text-center shadow-lg">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-8 flex-1">
                       <div className="space-y-4 text-center mt-4">
                          <div className="w-24 h-24 mx-auto bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center group-hover/vip:scale-110 transition-transform duration-500 shadow-2xl">
                             <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{plan.icon}</span>
                          </div>
                          <h3 className={`font-heading text-2xl tracking-tighter ${plan.textColor}`}>{plan.name.toUpperCase()}</h3>
                       </div>

                       <div className="text-center">
                          <div className="inline-flex items-baseline gap-1">
                             <span className={`text-5xl font-heading tracking-tighter ${plan.textColor}`}>R$ {plan.price_brl.toFixed(2).replace(".", ",")}</span>
                             <span className="text-[10px] text-white/20 font-heading tracking-widest uppercase">/MÊS</span>
                          </div>
                       </div>

                       <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                       <ul className="space-y-4">
                         {plan.benefits.map(b => (
                           <li key={b} className="flex items-start gap-4 group/item">
                             <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mt-0.5 group-hover/item:border-white/20 transition-colors shrink-0">
                                <Check size={10} className="text-white/60" />
                             </div>
                             <span className="text-xs text-white/60 leading-relaxed font-medium group-hover/item:text-white transition-colors">{b}</span>
                           </li>
                         ))}
                       </ul>
                       
                       {plan.galeons_monthly > 0 && (
                         <div className="mt-8 p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/20 flex items-center gap-4 group/galeon">
                            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shadow-inner group-hover/galeon:scale-110 transition-transform">
                               <Coins size={18} className="text-yellow-400" />
                            </div>
                            <div>
                               <p className="text-[9px] font-heading text-yellow-400/40 uppercase tracking-widest">Mesada Mensal</p>
                               <p className="text-sm font-heading text-yellow-400">+{plan.galeons_monthly} GALEÕES</p>
                            </div>
                         </div>
                       )}
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5">
                       <Button size="lg" className={`w-full h-16 rounded-2xl font-heading text-[10px] tracking-[0.2em] shadow-2xl transition-all duration-500 overflow-hidden relative group/vipbtn ${
                           currentVip === plan.id ? "bg-white/5 text-white/20 border border-white/5" : 
                           isCenter ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-none" :
                           i === 2 ? "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-black border-none" :
                           "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                         }`} disabled={buying === plan.id || currentVip === plan.id}
                         onClick={() => buyVip(plan)}>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/vipbtn:animate-[shimmer_2s_infinite]" />
                         <span className="relative z-10 uppercase">{buying === plan.id ? "..." : currentVip === plan.id ? "PLANO ATIVO" : "ASSINAR AGORA"}</span>
                       </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ABAS DE ITENS (Roupas, Varinhas, Feitiços, Poções, etc) - MONSTER QUALITY ── */}
      {["clothing","wand","spell","potion","upgrade","stickers"].includes(tab) && (
        <div className="animate-in fade-in duration-500">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {[1,2,3,4,5,6,7,8,9,10].map(i => <div key={i} className="glass aspect-[3/4.5] rounded-[2.5rem] animate-pulse bg-white/5" />)}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="relative overflow-hidden rounded-[3rem] p-20 text-center max-w-2xl mx-auto border border-white/5 bg-white/[0.02]">
              <div className="w-24 h-24 mx-auto bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10">
                <ShoppingBag size={48} className="text-white/20" />
              </div>
              <h3 className="text-3xl font-heading text-white mb-4 tracking-tight">Estoque Esgotado</h3>
              <p className="text-white/40 text-sm font-medium leading-relaxed">
                 Nossos artesãos estão trabalhando em novas relíquias. Volte em breve para descobrir o que os duendes prepararam para você.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {displayItems.map(item => {
                const rar = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common;
                const isOwned = owned.includes(item.id);
                const canAfford = galeons >= item.price_galeons;
                const stats = (item as any).stats;

                return (
                  <div key={item.id}
                    className={`group/item relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border ${rar.border.replace('border-', 'border-white/10 group-hover/item:border-')} p-1 transition-all duration-500 hover:-translate-y-4 hover:bg-white/[0.06] ${rar.glow}`}>
                    <div className="relative glass h-full rounded-[2.3rem] p-5 flex flex-col overflow-hidden">
                       <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/5 mb-4 group-hover/item:scale-[1.02] transition-transform duration-500">
                          <StoreItemVisual imageUrl={item.image_url} name={item.name} category={item.category} isOwned={isOwned} />
                          <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[8px] font-heading tracking-widest border backdrop-blur-3xl z-10 ${rar.cls}`}>
                             {rar.label.toUpperCase()}
                          </div>
                       </div>

                       <div className="space-y-4 flex-1 flex flex-col">
                          <div className="space-y-1">
                             <h4 className="font-heading text-sm text-white/90 leading-tight group-hover/item:text-white transition-colors">{item.name.toUpperCase()}</h4>
                             <p className="text-[10px] text-white/30 font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>

                          {stats && (stats.atk > 0 || stats.def > 0 || stats.mana > 0 || stats.hp > 0) && (
                              <div className="grid grid-cols-2 gap-1.5">
                                  {stats.atk > 0 && <div className="text-[8px] font-heading text-red-400 bg-red-400/10 px-2 py-1 rounded-lg border border-red-400/20">ATK +{stats.atk}</div>}
                                  {stats.def > 0 && <div className="text-[8px] font-heading text-blue-400 bg-blue-400/10 px-2 py-1 rounded-lg border border-blue-400/20">DEF +{stats.def}</div>}
                                  {stats.mana > 0 && <div className="text-[8px] font-heading text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg border border-indigo-400/20">MANA +{stats.mana}</div>}
                                  {stats.hp > 0 && <div className="text-[8px] font-heading text-green-400 bg-green-400/10 px-2 py-1 rounded-lg border border-green-400/20">HP +{stats.hp}</div>}
                              </div>
                          )}

                          <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between gap-3">
                             <div className="flex items-center gap-2">
                                <span className="text-sm">🪙</span>
                                <span className="font-heading text-yellow-400 text-base tracking-tighter">{item.price_galeons}</span>
                             </div>
                             <Button 
                                size="sm" 
                                variant={isOwned ? "outline" : "magical"}
                                disabled={isOwned || buying === item.id || (!canAfford && !isOwned)}
                                onClick={() => !isOwned && buyItem(item)}
                                className={`h-10 rounded-xl px-4 text-[10px] font-heading tracking-widest ${isOwned ? 'border-green-500/20 text-green-400' : 'shadow-lg shadow-primary/20'}`}>
                                {isOwned ? "OK" : buying === item.id ? "..." : "BUY"}
                             </Button>
                          </div>
                       </div>
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
