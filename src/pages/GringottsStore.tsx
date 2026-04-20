import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag, Coins, Crown, Wand2, Shirt, Gem, Sparkles, Star, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  { id: "bolsinha",  name: "Bolsinha de Galeões",     galeons: 100,  price_brl: 4.90,  icon: "💰", color: "from-amber-800/30 to-amber-600/20", border: "border-amber-600/40" },
  { id: "saco",      name: "Saco de Galeões",          galeons: 300,  price_brl: 12.90, icon: "🪙", color: "from-amber-700/40 to-yellow-600/20", border: "border-yellow-500/40", badge: "Mais Popular" },
  { id: "bau",       name: "Baú de Galeões",           galeons: 700,  price_brl: 24.90, icon: "💎", color: "from-yellow-700/40 to-amber-500/20", border: "border-amber-400/50" },
  { id: "tesouro",   name: "Tesouro de Gringotts",     galeons: 1500, price_brl: 44.90, icon: "👑", color: "from-yellow-600/50 to-amber-400/30", border: "border-yellow-400/60", badge: "Melhor Valor" },
  { id: "cofre",     name: "Cofre Lendário",           galeons: 4000, price_brl: 99.90, icon: "🏆", color: "from-yellow-500/60 to-amber-300/40", border: "border-yellow-300/70", badge: "Lendário" },
];

// ─── Planos VIP ────────────────────────────────────────────
const VIP_PLANS = [
  {
    id: "premium", name: "Estudante Premium", icon: "✨", price_brl: 9.90,
    color: "from-blue-900/40 to-blue-700/20", border: "border-blue-400/40", textColor: "text-blue-400",
    benefits: ["+50% XP em todas as atividades", "Badge exclusivo ✨ no perfil", "Acesso a salas Premium", "Nome com brilho especial"],
    galeons_monthly: 0,
  },
  {
    id: "vip", name: "Auror VIP", icon: "🥇", price_brl: 19.90,
    color: "from-purple-900/40 to-purple-700/20", border: "border-purple-400/40", textColor: "text-purple-400",
    benefits: ["Tudo do Premium", "+200 Galeões todo mês", "Nome dourado em todo portal", "Skin exclusiva de Auror", "Acesso antecipado a eventos"],
    galeons_monthly: 200,
  },
  {
    id: "founder", name: "Fundador Hogwarts", icon: "👑", price_brl: 39.90,
    color: "from-yellow-900/40 to-amber-700/20", border: "border-yellow-400/60", textColor: "text-yellow-400",
    benefits: ["Tudo do VIP", "+500 Galeões todo mês", "Acesso ao Conselho Secreto", "Título permanente 👑 Fundador", "Participação em decisões do portal"],
    galeons_monthly: 500,
  },
];

// ─── Raridade ─────────────────────────────────────────────
const RARITY = {
  common:    { label: "Comum",    cls: "text-gray-400 border-gray-600",     glow: "" },
  rare:      { label: "Raro",     cls: "text-blue-400 border-blue-500/60",  glow: "hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]" },
  legendary: { label: "Lendário", cls: "text-yellow-400 border-yellow-400/60", glow: "hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]" },
};

const TABS = [
  { id: "galeons", label: "🪙 Comprar Galeões", icon: Coins },
  { id: "vip",     label: "👑 VIP & Premium",   icon: Crown },
  { id: "clothing",    label: "👗 Roupas",       icon: Shirt },
  { id: "wand",    label: "🪄 Varinhas",         icon: Wand2 },
  { id: "accessory",label: "💎 Acessórios",      icon: Gem },
  { id: "skin",    label: "🎨 Skins",            icon: Sparkles },
];

export default function GringottsStore() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("galeons");
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
      // Limpar params da URL
      window.history.replaceState({}, "", window.location.pathname);
      verifyAndCreditPayment(orderNsu, transactionNsu, slug);
    }
  }, []);

  const verifyAndCreditPayment = async (orderNsu: string, transactionNsu: string, slug: string) => {
    try {
      toast.info("🔍 Verificando seu pagamento...");

      // ✅ Verificar server-side via pg_net (sem CORS!)
      const { data, error } = await supabase.rpc("verify_infinitepay_payment", {
        p_order_nsu:       orderNsu,
        p_transaction_nsu: transactionNsu,
        p_slug:            slug,
      });

      if (error) throw new Error(error.message);

      if (data?.success) {
        if (data.type === "vip") {
          toast.success(`🎉 Plano ${data.plan?.toUpperCase()} ativado! Bem-vindo ao VIP!`, { duration: 6000 });
        } else {
          toast.success(`🎉 ${data.galeons} Galeões adicionados à sua conta!`, { duration: 6000 });
        }
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

  // ── Criar Link via supabase.rpc (pg_net — server-side, sem CORS) ──
  const createInfinitePayLink = async (
    orderId: string,
    amountBrl: number,
    description: string,
    userEmail: string,
    userName: string,
    galeonsQty?: number,
    vipPlan?: string,
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc("create_infinitepay_link", {
        p_order_id:    orderId,
        p_amount_brl:  amountBrl,
        p_description: description,
        p_user_id:     user?.id,
        p_user_email:  userEmail,
        p_user_name:   userName,
        p_galeons:     galeonsQty ?? 0,
        p_vip_plan:    vipPlan ?? null,
      });
      if (error) { console.error("RPC error:", error); return null; }
      if (data?.payment_url) return data.payment_url;
      console.warn("Sem URL na resposta:", data);
      return null;
    } catch (e) {
      console.error("Erro ao chamar create_infinitepay_link:", e);
      return null;
    }
  };

  // ── Comprar Galeões ───────────────────────────────────────
  const buyGaleons = async (pkg: typeof GALEON_PACKAGES[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(pkg.id);
    try {
      // 1. Criar ordem no banco
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id,
        package_id: pkg.id,
        amount_brl: pkg.price_brl,
        galeons: pkg.galeons,
        status: "pending",
      } as never).select("id").single();
      if (error) throw error;

      const description = `${pkg.name} — ${pkg.galeons}🪙 Galeões — Portal Hogwarts`;
      const payUrl = await createInfinitePayLink(
        order.id, pkg.price_brl, description, user.email ?? "", profile.full_name,
        pkg.galeons
      );

      if (!payUrl) throw new Error("Não foi possível gerar o link de pagamento.");

      await supabase.from("galeon_orders").update({ payment_link: payUrl } as never).eq("id", order.id);
      toast.info("💳 Redirecionando para o pagamento...");
      setTimeout(() => { window.location.href = payUrl; }, 800);

    } catch (e: any) {
      toast.error(e.message || "Erro ao processar pagamento.");
    } finally {
      setBuying(null);
    }
  };


  // ── Comprar Item da Loja ──────────────────────────────────
  const buyItem = async (item: StoreItem) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    const bal = profile?.galeons ?? 0;
    if (bal < item.price_galeons) {
      toast.error(`Galeões insuficientes! Você tem ${bal}🪙 e precisa de ${item.price_galeons}🪙`);
      return;
    }
    setBuying(item.id);
    try {
      const { error: deduct } = await supabase.from("profiles").update({ galeons: bal - item.price_galeons } as never).eq("user_id", user.id);
      if (deduct) throw deduct;
      const { error: ins } = await supabase.from("user_items").insert({ user_id: user.id, item_id: item.id } as never);
      if (ins) {
        // Reverter se falhou
        await supabase.from("profiles").update({ galeons: bal } as never).eq("user_id", user.id);
        throw ins;
      }
      setOwned(prev => [...prev, item.id]);
      toast.success(`✅ "${item.name}" adicionado ao seu inventário!`);
    } catch (e: any) {
      toast.error("Erro ao comprar item: " + (e.message || "Tente novamente."));
    } finally {
      setBuying(null);
    }
  };

  // ── Assinar VIP ───────────────────────────────────────────
  const buyVip = async (plan: typeof VIP_PLANS[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuying(plan.id);
    try {
      const { data: order, error } = await supabase.from("galeon_orders").insert({
        user_id: user.id,
        package_id: `vip_${plan.id}`,
        amount_brl: plan.price_brl,
        galeons: 0,
        status: "pending",
      } as never).select("id").single();
      if (error) throw error;

      const description = `VIP ${plan.name} — Portal Hogwarts (1 mês)`;
      const payUrl = await createInfinitePayLink(
        order.id, plan.price_brl, description, user.email ?? "", profile.full_name,
        plan.galeons_monthly, plan.id
      );

      if (!payUrl) throw new Error("Não foi possível gerar o link de pagamento VIP.");

      await supabase.from("galeon_orders").update({ payment_link: payUrl } as never).eq("id", order.id);
      toast.info("💳 Redirecionando para assinatura VIP...");
      setTimeout(() => { window.location.href = payUrl; }, 800);
    } catch (e: any) {
      toast.error(e.message || "Erro ao ativar VIP.");
    } finally {
      setBuying(null);
    }
  };

  const galeons = profile?.galeons ?? 0;
  const currentVip = profile?.vip_plan;
  const filteredItems = items.filter(i => i.category === tab);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">

      {/* Header */}
      <div className="glass rounded-3xl p-8 relative overflow-hidden border border-yellow-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618944847823-72c1cce8a8e1?w=1200')] bg-cover bg-center opacity-5" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl text-gold-gradient flex items-center gap-3">
              <ShoppingBag size={36} /> Gringotts — Loja Mágica
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Itens exclusivos, VIP e muito mais para personalizar sua experiência
            </p>
          </div>
          <div className="glass rounded-2xl px-6 py-3 border border-yellow-400/40 text-center">
            <p className="text-xs text-muted-foreground font-heading">Seu Saldo</p>
            <p className="font-heading text-2xl text-yellow-400">🪙 {galeons.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] text-muted-foreground">Galeões</p>
          </div>
        </div>
      </div>

      {/* Banner de pagamento pendente — verificar novamente */}
      {pendingOrderId && (
        <div className="glass rounded-2xl p-5 border border-yellow-400/40 bg-yellow-900/10 flex flex-col sm:flex-row items-center gap-4">
          <div className="text-3xl">⏳</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-heading text-yellow-400 text-sm">Pagamento aguardando confirmação</p>
            <p className="text-xs text-muted-foreground mt-0.5">Clique para verificar se o pagamento foi aprovado.</p>
          </div>
          <Button variant="magical" size="sm"
            onClick={() => verifyAndCreditPayment(pendingOrderId, "", "")}>
            🔍 Verificar novamente
          </Button>
          <button onClick={() => setPendingOrderId(null)}
            className="text-muted-foreground hover:text-foreground text-xs underline">
            Dispensar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-heading transition-all border ${
              tab === t.id
                ? "bg-primary/20 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA: GALEÕES ── */}
      {tab === "galeons" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Galeões são a moeda mágica do portal. Use-os para comprar itens exclusivos, skins e acessórios na loja.
            O pagamento é processado com segurança pela <strong className="text-foreground">InfinitePay</strong> (Pix ou Cartão).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GALEON_PACKAGES.map(pkg => (
              <div key={pkg.id}
                className={`glass rounded-2xl p-6 border ${pkg.border} bg-gradient-to-br ${pkg.color} relative hover:-translate-y-1 transition-all`}>
                {pkg.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-heading px-3 py-0.5 rounded-full whitespace-nowrap">
                    {pkg.badge}
                  </span>
                )}
                <div className="text-4xl mb-3">{pkg.icon}</div>
                <h3 className="font-heading text-lg text-foreground mb-1">{pkg.name}</h3>
                <p className="text-2xl font-heading text-yellow-400 mb-1">🪙 {pkg.galeons.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  R$ {(pkg.galeons / pkg.price_brl).toFixed(0)} Galeões por real
                </p>
                <Button variant="magical" className="w-full" disabled={buying === pkg.id}
                  onClick={() => buyGaleons(pkg)}>
                  {buying === pkg.id ? "Gerando link..." : `R$ ${pkg.price_brl.toFixed(2).replace(".", ",")} 💳`}
                </Button>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl p-4 border border-border/50 text-xs text-muted-foreground space-y-1">
            <p>🔒 <strong>Pagamento 100% seguro</strong> processado pela InfinitePay</p>
            <p>✅ Galeões creditados <strong>automaticamente</strong> após confirmação do pagamento</p>
            <p>📧 Dúvidas? Entre em contato com os administradores pelo portal</p>
          </div>
        </div>
      )}

      {/* ── ABA: VIP ── */}
      {tab === "vip" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Escolha seu plano e desbloqueie benefícios exclusivos. Assinatura mensal, cancele quando quiser.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VIP_PLANS.map(plan => (
              <div key={plan.id}
                className={`glass rounded-2xl p-6 border ${plan.border} bg-gradient-to-br ${plan.color} relative flex flex-col`}>
                {currentVip === plan.id && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-heading px-3 py-0.5 rounded-full">✓ Ativo</span>
                )}
                <div className="text-4xl mb-3">{plan.icon}</div>
                <h3 className={`font-heading text-xl mb-1 ${plan.textColor}`}>{plan.name}</h3>
                <p className={`font-heading text-3xl mb-4 ${plan.textColor}`}>
                  R$ {plan.price_brl.toFixed(2).replace(".", ",")}<span className="text-sm text-muted-foreground">/mês</span>
                </p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.benefits.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={14} className={`shrink-0 mt-0.5 ${plan.textColor}`} />
                      {b}
                    </li>
                  ))}
                  {plan.galeons_monthly > 0 && (
                    <li className="flex items-start gap-2 text-sm text-yellow-400 font-heading">
                      <Check size={14} className="shrink-0 mt-0.5 text-yellow-400" />
                      +{plan.galeons_monthly}🪙 Galeões/mês
                    </li>
                  )}
                </ul>
                <Button variant="magical" className="w-full" disabled={buying === plan.id || currentVip === plan.id}
                  onClick={() => buyVip(plan)}>
                  {buying === plan.id ? "Processando..." : currentVip === plan.id ? "✓ Plano Ativo" : `Assinar por R$ ${plan.price_brl.toFixed(2).replace(".", ",")}`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABAS DE ITENS ── */}
      {["clothing","wand","accessory","skin","decoration"].includes(tab) && (
        <div>
          {loading ? (
            <p className="text-center text-muted-foreground py-10 animate-pulse">Carregando itens mágicos...</p>
          ) : filteredItems.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">🏪</p>
              <p className="text-muted-foreground">Novos itens chegando em breve!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const rar = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common;
                const isOwned = owned.includes(item.id);
                const canAfford = galeons >= item.price_galeons;
                return (
                  <div key={item.id}
                    className={`glass rounded-2xl border overflow-hidden flex flex-col transition-all ${rar.border} ${rar.glow} ${
                      item.rarity === "legendary" ? "bg-gradient-to-br from-yellow-900/20 to-amber-800/10" : ""
                    }`}>
                    <div className="relative aspect-square overflow-hidden bg-secondary/50">
                      <img src={item.image_url} alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400"; }} />
                      <span className={`absolute top-2 right-2 text-[10px] font-heading px-2 py-0.5 rounded-full border ${rar.cls} bg-card/80 backdrop-blur-sm`}>
                        {rar.label}
                        {item.rarity === "legendary" && " ⭐"}
                      </span>
                      {isOwned && (
                        <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center">
                          <span className="font-heading text-green-400 text-sm bg-card/80 px-3 py-1 rounded-full">✓ Adquirido</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h4 className="font-heading text-sm text-foreground leading-tight mb-1">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground flex-1 mb-3 leading-relaxed line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-yellow-400 text-sm">🪙 {item.price_galeons}</span>
                        <Button size="sm" variant={isOwned ? "outline" : "magical"}
                          disabled={isOwned || buying === item.id || !canAfford}
                          onClick={() => !isOwned && buyItem(item)}
                          className="text-xs px-3 py-1 h-7">
                          {isOwned ? "✓" : !canAfford ? "🪙 Insuf." : buying === item.id ? "..." : "Comprar"}
                        </Button>
                      </div>
                      {!isOwned && !canAfford && (
                        <p className="text-[10px] text-muted-foreground mt-1 text-center">
                          Faltam 🪙 {item.price_galeons - galeons}
                        </p>
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
