import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmojiIcon from "@/components/shared/EmojiIcon";
import { 
  ShoppingBag, Sparkles, Coins, Crown, Gift, 
  Search, Filter, ChevronRight, Wand2, Shield, Heart, Zap, Star,
  Flame, Shirt, Gem, ExternalLink, Check, Smartphone, CreditCard, CheckCircle2, Wallet as WalletIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SafeImage from "@/components/SafeImage";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import Card3D from "@/components/Card3D";
import { playMagicSound } from "@/services/core/soundService";

import VipUpsellBanner from "@/components/VipUpsellBanner";
import PedidosTab from "@/components/PedidosTab";
import { useStore } from "@/hooks/features/useStore";
import { type StoreItem } from "@/types";
import { CATEGORY_LABELS, RARITY_LABELS } from "@/constants/gameConstants";
import StoreItemVisual from "@/components/StoreItemVisual";
import ItemPreviewDialog from "@/components/store/ItemPreviewDialog";

// ─── Pacotes de Galeões ────────────────────────────────────
const GALEON_PACKAGES = [
  { id: "bolsinha",  name: "Bolsinha de Galeões",     galeons: 100,  price_brl: 4.90,  icon: "💰", image_url: "/monster_quality_galeon.png", color: "from-amber-800/40 to-amber-900/40", border: "border-amber-600/40", glow: "group-hover:shadow-[0_0_20px_rgba(217,119,6,0.3)]" },
  { id: "saco",      name: "Saco de Galeões",          galeons: 300,  price_brl: 12.90, icon: "🪙", image_url: "/monster_quality_galeon.png", color: "from-amber-700/50 to-yellow-800/40", border: "border-yellow-500/50", glow: "group-hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]", badge: "Mais Popular" },
  { id: "bau",       name: "Baú de Galeões",           galeons: 700,  price_brl: 24.90, icon: "💎", image_url: "/monster_quality_galeon.png", color: "from-yellow-600/50 to-amber-700/50", border: "border-amber-400/60", glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]" },
  { id: "tesouro",   name: "Tesouro de Gringotts",     galeons: 1500, price_brl: 44.90, icon: "👑", image_url: "/monster_quality_galeon.png", color: "from-yellow-500/60 to-amber-600/50", border: "border-yellow-400/70", glow: "group-hover:shadow-[0_0_35px_rgba(250,204,21,0.6)]", badge: "Melhor Valor" },
  { id: "cofre",     name: "Cofre Lendário",           galeons: 4000, price_brl: 99.90, icon: "🏆", image_url: "/monster_quality_galeon.png", color: "from-yellow-400/70 to-amber-500/60", border: "border-yellow-300/80", glow: "group-hover:shadow-[0_0_45px_rgba(253,224,71,0.7)]", badge: "Lendário" },
];

// ─── Planos VIP ────────────────────────────────────────────
const VIP_PLANS = [
  {
    id: "premium", name: "Estudante Premium", icon: "✨", price_brl: 9.90, image_url: "/vip_coroa.png",
    color: "from-blue-900/60 to-indigo-900/40", border: "border-blue-400/50", textColor: "text-blue-300", glow: "hover:shadow-[0_0_30px_rgba(96,165,250,0.3)]",
    benefits: ["+50% XP em todas as atividades", "Badge exclusivo ✨ no perfil", "Acesso a salas Premium", "Nome com brilho especial"],
    galeons_monthly: 0,
  },
  {
    id: "vip", name: "Auror VIP", icon: "🥇", price_brl: 19.90, image_url: "/vip_coroa.png",
    color: "from-purple-900/60 to-fuchsia-900/40", border: "border-purple-400/60", textColor: "text-purple-300", glow: "hover:shadow-[0_0_40px_rgba(192,132,252,0.4)]",
    benefits: ["Tudo do Premium", "+200 Galeões todo mês", "Nome dourado em todo portal", "Skin exclusiva de Auror", "Acesso antecipado a eventos"],
    galeons_monthly: 200,
    badge: "MAIS ESCOLHIDO"
  },
  {
    id: "founder", name: "Fundador Hogwarts", icon: "👑", price_brl: 39.90, image_url: "/vip_coroa.png",
    color: "from-yellow-700/60 to-amber-900/50", border: "border-yellow-400/70", textColor: "text-yellow-300", glow: "hover:shadow-[0_0_50px_rgba(251,191,36,0.5)]",
    benefits: ["Tudo do VIP", "+500 Galeões todo mês", "Acesso ao Conselho Secreto", "Título permanente 👑 Fundador", "Participação em decisões do portal"],
    galeons_monthly: 500,
    badge: "STATUS MÁXIMO"
  },
];

const TABS = [
  { id: "featured", label: "🔥 Exclusivos", icon: Flame, color: "from-orange-500 to-red-500" },
  { id: "galeons",  label: "🪙 Galeões",    icon: Coins, color: "from-yellow-400 to-amber-600" },
  { id: "vip",      label: "👑 VIP",        icon: Crown, color: "from-purple-500 to-indigo-600" },
  { id: "wand",     label: "🪄 Varinhas",   icon: Wand2, color: "from-amber-700 to-yellow-900" },
  { id: "pet",      label: "🐾 Pets",       icon: Sparkles, color: "from-emerald-400 to-teal-600" },
  { id: "potion",   label: "🧪 Poções",     icon: Gem, color: "from-emerald-400 to-teal-700" },
  { id: "clothing", label: "👗 Roupas",     icon: Shirt, color: "from-rose-400 to-pink-700" },
  { id: "accessory",label: "✨ Acessórios", icon: Zap, color: "from-cyan-400 to-blue-700" },
  { id: "title",    label: "📜 Títulos",   icon: Star, color: "from-amber-400 to-red-700" },
  { id: "upgrade",  label: "⚡ Upgrades",   icon: Sparkles, color: "from-blue-400 to-indigo-600" },
];

export default function GringottsStore() {
  const { user, profile } = useAuth();
  const { items, owned, loading, buyItem: handleBuyItem, galeons } = useStore();
  const [buyingIdLocal, setBuyingIdLocal] = useState<string | null>(null);
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return t || "featured";
  });
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<StoreItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNsu = params.get("order_nsu");
    const transactionNsu = params.get("transaction_nsu") ?? "";
    const slug = params.get("slug") ?? "";
    if (!orderNsu) return;

    window.history.replaceState({}, "", window.location.pathname);
    const verify = async () => {
      toast.info("🔍 Verificando pagamento em Gringotts...");
      try {
        const { data, error } = await supabase.rpc("verify_infinitepay_payment", {
          p_order_nsu: orderNsu,
          p_transaction_nsu: transactionNsu,
          p_slug: slug,
        });
        if (error) throw error;
        const result = data as any;
        if (result?.success) {
          if (result.type === "vip") {
            toast.success(`👑 Plano ${String(result.plan).toUpperCase()} ativado!`);
          } else if (result.type === "galeons") {
            toast.success(`🪙 ${result.galeons} Galeões creditados!`);
          } else {
            toast.success("✅ Pagamento confirmado!");
          }
          playMagicSound();
          setTimeout(() => window.location.reload(), 1500);
        } else {
          toast.warning(result?.message || "⏳ Pagamento ainda não confirmado. Aguarde alguns segundos.");
        }
      } catch (e: any) {
        toast.error(e.message || "Erro ao verificar pagamento.");
      }
    };
    verify();
  }, []);

  const buyGaleons = async (pkg: typeof GALEON_PACKAGES[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuyingPackageId(pkg.id);
    
    try {
      const { data: order, error: orderErr } = await supabase.from("galeon_orders").insert({
        user_id: user.id,
        amount_brl: pkg.price_brl,
        galeons: pkg.galeons,
        package_id: pkg.id,
        status: 'pending'
      } as any).select("id").single();

      if (orderErr) throw orderErr;

      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: {
          order_id: order.id,
          amount_brl: pkg.price_brl,
          galeons: pkg.galeons,
          package_name: pkg.name,
          user_id: user.id,
          user_email: user.email,
          user_name: profile.full_name,
        }
      });

      if (error || !data?.payment_url) throw error || new Error("Erro ao gerar link.");
      window.location.href = data.payment_url;
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar.");
    } finally {
      setBuyingPackageId(null);
    }
  };

  const buyVip = async (plan: typeof VIP_PLANS[0]) => {
    if (!user || !profile) return toast.error("Você precisa estar logado.");
    setBuyingPackageId(plan.id);
    
    try {
      const { data: order, error: orderErr } = await supabase.from("galeon_orders").insert({
        user_id: user.id,
        amount_brl: plan.price_brl,
        package_id: `vip_${plan.id}`,
        galeons: 0,
        status: 'pending'
      } as any).select("id").single();

      if (orderErr) throw orderErr;

      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: {
          order_id: order.id,
          amount_brl: plan.price_brl,
          package_name: plan.name,
          user_id: user.id,
          user_email: user.email,
          user_name: profile.full_name,
          vip_plan: plan.id
        }
      });

      if (error || !data?.payment_url) throw error || new Error("Erro ao gerar link.");
      window.location.href = data.payment_url;
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar VIP.");
    } finally {
      setBuyingPackageId(null);
    }
  };

  const buyItem = async (item: StoreItem) => {
    if (buyingIdLocal || buyingPackageId) return;
    setBuyingIdLocal(item.id);
    try {
      const success = await handleBuyItem(item);
      if (success) playMagicSound();
    } finally {
      setBuyingIdLocal(null);
    }
  };

  const filteredItems = useMemo(() => items.filter(i => i.category === tab), [items, tab]);

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-24 px-4 sm:px-6">
      {/* ── Header com saldo persistente ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 -mb-8">
        <Link to="/dashboard/wallet" className="glass rounded-2xl px-5 py-3 border border-yellow-500/30 flex items-center gap-3 hover:border-yellow-400/60 transition-all group">
          <WalletIcon size={18} className="text-yellow-400" />
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-widest text-yellow-300/80 font-heading leading-none">Saldo na Carteira</p>
            <p className="font-heading text-lg text-yellow-400 leading-tight">{galeons.toLocaleString("pt-BR")} Galeões</p>
          </div>
          <ChevronRight size={14} className="text-yellow-400/60 group-hover:translate-x-1 transition-transform" />
        </Link>
        {profile?.vip_plan && (
          <div className="glass rounded-2xl px-5 py-3 border border-purple-500/30 flex items-center gap-3">
            <Crown size={18} className="text-purple-400" />
            <div className="text-left">
              <p className="text-[9px] uppercase tracking-widest text-purple-300/80 font-heading leading-none">Plano Ativo</p>
              <p className="font-heading text-lg text-purple-400 leading-tight uppercase">{profile.vip_plan}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-heading text-gold-gradient tracking-tighter drop-shadow-[0_15px_40px_rgba(212,175,55,0.5)]">Gringotts Bank</h1>
        <p className="text-muted-foreground/90 text-xl font-serif italic max-w-2xl mx-auto leading-relaxed">"Fortius Quo Fidelius" — Mais forte quanto mais fiel.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-12">
        {TABS.map(t => (
          <Button
            key={t.id}
            variant={tab === t.id ? "magical" : "outline"}
            className="rounded-full px-3 py-2 sm:px-6 sm:py-6 h-auto text-[10px] sm:text-sm flex-1 min-w-[100px] sm:flex-initial"
            onClick={() => {
              playMagicSound();
              setTab(t.id);
            }}
          >
            <t.icon size={16} className="mr-1 sm:mr-2 shrink-0" />
            <span className="truncate">{t.label}</span>
          </Button>
        ))}
      </div>

      {tab === "featured" && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.filter(i => i.is_featured).map(item => (
                <Card3D key={item.id} intensity={10} className="glass p-8 rounded-[2.5rem] border border-primary/20 hover:border-primary/50 group">
                   <button type="button" onClick={() => setPreviewItem(item)} className="relative aspect-square rounded-2xl overflow-hidden mb-4 border border-white/10 w-full block cursor-pointer">
                      <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                       {item.category === "wand" && <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                   </button>
                   <h3 className="font-heading text-xl text-primary">{item.name}</h3>
                   <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <MagicalGaleon size="xs" />
                        <span className="font-heading text-yellow-400">{item.price_galeons}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => buyItem(item)} disabled={owned.includes(item.id)}>
                        {owned.includes(item.id) ? "Já é seu" : "Adquirir"}
                      </Button>
                   </div>
                </Card3D>
              ))}
           </div>
        </div>
      )}

      {tab === "galeons" && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
          <div className="glass rounded-[2rem] p-6 sm:p-8 border border-yellow-500/20 bg-gradient-to-br from-yellow-950/20 to-black/30">
            <h3 className="font-heading text-lg text-yellow-400 mb-5 flex items-center gap-2">
              <CreditCard size={18} /> Como Comprar Galeões
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: Star, title: "1. Escolha o pacote", desc: "Quanto maior o pacote, mais Galeões por Real." },
                { icon: Smartphone, title: "2. Pague no Pix ou Cartão", desc: "Checkout seguro via InfinitePay. Pix cai em segundos." },
                { icon: CheckCircle2, title: "3. Crédito automático", desc: "Os Galeões aparecem na carteira em tempo real." },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <s.icon size={18} className="text-yellow-400 mb-2" />
                  <p className="font-heading text-sm text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {GALEON_PACKAGES.map(pkg => (
            <div key={pkg.id} className="glass p-6 sm:p-10 rounded-2xl sm:rounded-[3.5rem] border-yellow-500/20 text-center flex flex-col items-center hover:scale-[1.02] transition-transform relative">
              {pkg.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-heading uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">{pkg.badge}</span>
              )}
              <div className="text-6xl mb-4">{pkg.icon}</div>
              <h3 className="font-heading text-2xl text-yellow-400">{pkg.name}</h3>
              <p className="text-3xl sm:text-4xl font-heading my-4">{pkg.galeons} 🪙</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                ≈ {(pkg.galeons / pkg.price_brl).toFixed(0)} Galeões por R$
              </p>
              <Button 
                variant="magical" 
                className="w-full min-h-14 h-auto rounded-2xl px-4"
                disabled={!!buyingPackageId}
                onClick={() => buyGaleons(pkg)}
              >
                {buyingPackageId === pkg.id ? "⏳ ..." : `R$ ${pkg.price_brl.toFixed(2)}`}
              </Button>
            </div>
          ))}
          </div>
        </div>
      )}
      
      {tab === "vip" && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
          <div className="glass rounded-[2rem] p-6 sm:p-8 border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-black/30">
            <h3 className="font-heading text-lg text-purple-300 mb-2 flex items-center gap-2">
              <Crown size={18} /> Por que ser VIP?
            </h3>
            <p className="text-sm text-muted-foreground">
              Assinaturas mensais via InfinitePay. Você mantém todos os benefícios pelo período pago e pode renovar quando quiser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {VIP_PLANS.map(plan => (
             <div key={plan.id} className="glass p-8 rounded-[3rem] border-purple-500/20 text-center relative">
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-heading uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">{plan.badge}</span>
                )}
                <div className="text-6xl mb-4">{plan.icon}</div>
                <h3 className="font-heading text-2xl text-purple-400">{plan.name}</h3>
                <p className="text-3xl font-heading my-4">R$ {plan.price_brl.toFixed(2)}<span className="text-sm text-muted-foreground">/mês</span></p>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 mb-5 text-left">
                  {plan.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2"><Check size={12} className="text-purple-400 mt-0.5 shrink-0" /><span>{b}</span></li>
                  ))}
                </ul>
                <Button 
                  variant="magical" 
                  className="w-full min-h-14 h-auto rounded-2xl bg-purple-600 hover:bg-purple-500 px-4"
                  disabled={!!buyingPackageId}
                  onClick={() => buyVip(plan)}
                >
                  {buyingPackageId === plan.id ? "⏳ ..." : "Assinar VIP"}
                </Button>
             </div>
           ))}
          </div>
        </div>
      )}

      {(tab !== "featured" && tab !== "galeons" && tab !== "vip") && (
        filteredItems.length === 0 ? (
          <div className="text-center py-24 space-y-4 animate-in fade-in duration-700">
            <div className="text-7xl opacity-30"><EmojiIcon e="🪄" /></div>
            <p className="font-heading text-2xl text-muted-foreground">Os estoques de Gringotts estão sendo repostos...</p>
            <p className="text-sm text-muted-foreground/85 font-serif italic">"Os goblins trabalham dia e noite. Volte em breve."</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8">
          {filteredItems.map(item => (
            <Card3D key={item.id} intensity={6} className="glass p-4 rounded-xl border border-white/5 hover:border-primary/40">
              <button type="button" onClick={() => setPreviewItem(item)} className="aspect-square rounded-lg overflow-hidden border border-white/5 mb-4 w-full block cursor-pointer">
                 <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </button>
              <h3 className="font-heading text-lg">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.price_galeons} Galeões</p>
              <Button 
                className="w-full mt-4" 
                disabled={owned.includes(item.id) || buyingIdLocal === item.id}
                onClick={() => buyItem(item)}
              >
                {owned.includes(item.id) ? "Adquirido" : "Comprar"}
              </Button>
            </Card3D>
          ))}
        </div>
        )
      )}
      <ItemPreviewDialog
        item={previewItem}
        open={!!previewItem}
        onOpenChange={(v) => !v && setPreviewItem(null)}
        owned={previewItem ? owned.includes(previewItem.id) : false}
        onBuy={buyItem}
      />
    </div>
  );
}
