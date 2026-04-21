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
  onClose?: () => void;
}

const VIP_BENEFITS = [
  { img: "/medalha_ouro_3d.png", text: "Badge VIP exclusivo no perfil" },
  { img: "/sticker_harry_gold.png", text: "Galeões mensais automáticos" },
  { img: "/robe_safira.png", text: "Skins e itens exclusivos desbloqueados" },
  { img: "/liquid_luck_3d.png", text: "XP bônus em todas as atividades" },
  { img: "/legendary_chest_3d.png", text: "Acesso antecipado a novidades" },
  { img: "/vip_coroa.png", text: "Título de Mago(a) Premium no ranking" },
];

const PLANS = [
  { id: "premium", name: "Iniciante", price: "R$ 9,90", color: "from-slate-800 to-slate-700", border: "border-slate-500/40", img: "/invisibility_cloak_3d.png", galeons: 0 },
  { id: "vip", name: "VIP", price: "R$ 19,90", color: "from-purple-900 to-violet-800", border: "border-purple-400/50", img: "/vip_coroa.png", galeons: 200, highlight: true },
  { id: "founder", name: "Fundador", price: "R$ 39,90", color: "from-yellow-900 to-amber-800", border: "border-yellow-400/50", img: "/elder_wand_3d.png", galeons: 500 },
];

export default function VipUpsellBanner({ currentVip, galeons = 0, username, onClose }: Props) {
  // Não mostrar para VIPs
  if (currentVip) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-slate-900 via-purple-950/60 to-slate-900 mb-6 animate-fade-in-up">

      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

      {/* Dismiss */}
      <button onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all shadow-lg border border-white/5"
      >
        <X size={16} />
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {VIP_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:bg-white/10 transition-colors shadow-lg shadow-black/20">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/30 shrink-0 shadow-[0_0_10px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                <img src={b.img} alt={b.text} className="w-full h-full object-cover mix-blend-lighten" />
              </div>
              <span className="font-medium text-white/90">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative rounded-2xl border bg-gradient-to-br ${plan.color} ${plan.border} p-4 text-center shadow-xl transition-transform hover:-translate-y-1 ${plan.highlight ? "ring-2 ring-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]" : ""}`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-heading font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                  + POPULAR
                </span>
              )}
              <div className="w-14 h-14 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/20 shadow-inner bg-black/50">
                 <img src={plan.img} alt={plan.name} className="w-full h-full object-cover mix-blend-screen opacity-90 hover:scale-110 transition-transform" />
              </div>
              <p className="font-heading text-xs text-white/90 mb-1 uppercase tracking-wider">{plan.name}</p>
              <p className="font-heading text-lg text-yellow-400 drop-shadow-md">{plan.price}<span className="text-[10px] text-yellow-400/50">/mês</span></p>
              {plan.galeons > 0 && (
                <p className="text-[10px] font-bold text-yellow-300 mt-2 bg-yellow-500/20 py-1 rounded-full border border-yellow-500/30">+{plan.galeons} 🪙</p>
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
