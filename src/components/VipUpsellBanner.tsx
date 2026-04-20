/**
 * VipUpsellBanner — Banner de conversão VIP
 * Aparece no Feed para usuários não-VIP
 * Gamificado, animado, com senso de urgência e FOMO
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Star, Zap, X, ChevronRight, Sparkles } from "lucide-react";

interface Props {
  currentVip?: string | null;
  galeons?: number;
  username?: string;
}

const VIP_BENEFITS = [
  { icon: "🏅", text: "Badge VIP exclusivo no perfil" },
  { icon: "🪙", text: "Galeões mensais automáticos" },
  { icon: "✨", text: "Skins e itens exclusivos desbloqueados" },
  { icon: "⚡", text: "XP bônus em todas as atividades" },
  { icon: "🔮", text: "Acesso antecipado a novidades" },
  { icon: "👑", text: "Título de Mago(a) Premium no ranking" },
];

const PLANS = [
  { id: "premium", name: "Iniciante", price: "R$ 9,90", color: "from-slate-800 to-slate-700", border: "border-slate-500/40", badge: "⭐", galeons: 0 },
  { id: "vip", name: "VIP", price: "R$ 19,90", color: "from-purple-900 to-violet-800", border: "border-purple-400/50", badge: "💜", galeons: 200, highlight: true },
  { id: "founder", name: "Fundador", price: "R$ 39,90", color: "from-yellow-900 to-amber-800", border: "border-yellow-400/50", badge: "👑", galeons: 500 },
];

export default function VipUpsellBanner({ currentVip, galeons = 0, username }: Props) {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("vip_banner_dismissed") === new Date().toDateString()
  );

  // Não mostrar para VIPs
  if (currentVip || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("vip_banner_dismissed", new Date().toDateString());
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900 via-purple-950/60 to-slate-900 mb-6 animate-fade-in-up">

      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      {/* Dismiss */}
      <button onClick={handleDismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
        <X size={14} />
      </button>

      <div className="p-6 md:p-8">

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-2xl border border-yellow-500/30 animate-pulse-glow shrink-0">
            <Crown size={28} className="text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-heading tracking-widest text-yellow-400/70 uppercase">Poder Mágico Supremo</span>
              <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-heading animate-pulse">NOVO</span>
            </div>
            <h2 className="font-heading text-xl md:text-2xl text-foreground leading-tight">
              {username ? `${username.split(" ")[0]}, ` : ""}Desbloqueie o <span className="text-gold-gradient">VIP Hogwarts</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Junte-se aos bruxos de elite. Benefícios exclusivos, Galeões mensais e muito mais.
            </p>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {VIP_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2 border border-white/5">
              <span className="text-base shrink-0">{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative rounded-xl border bg-gradient-to-br ${plan.color} ${plan.border} p-3 text-center ${plan.highlight ? "ring-1 ring-purple-400/50" : ""}`}>
              {plan.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-heading px-2 py-0.5 rounded-full whitespace-nowrap">
                  + POPULAR
                </span>
              )}
              <div className="text-xl mb-1">{plan.badge}</div>
              <p className="font-heading text-[11px] text-foreground mb-1">{plan.name}</p>
              <p className="font-heading text-sm text-primary">{plan.price}<span className="text-[9px] text-muted-foreground">/mês</span></p>
              {plan.galeons > 0 && (
                <p className="text-[9px] text-yellow-400 mt-1">+{plan.galeons}🪙/mês</p>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to="/dashboard/store"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-heading font-bold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/25">
            <Sparkles size={16} />
            Ver Planos VIP
            <ChevronRight size={16} />
          </Link>
          <Link to="/dashboard/store"
            className="flex items-center gap-2 py-3 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all font-heading">
            <Star size={14} />
            Comprar Galeões
          </Link>
        </div>

        {/* Urgency footer */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <Zap size={11} className="text-yellow-400" />
          <p className="text-[10px] text-muted-foreground text-center">
            Cancele a qualquer momento · Galeões creditados imediatamente · Pagamento seguro via Pix ou Cartão
          </p>
        </div>

      </div>
    </div>
  );
}
