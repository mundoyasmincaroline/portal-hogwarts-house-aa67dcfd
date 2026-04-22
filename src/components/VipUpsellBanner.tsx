/**
 * VipUpsellBanner — Banner de conversão VIP
 * Aparece no Feed para usuários não-VIP
 * Gamificado, animado, com senso de urgência e FOMO
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Star, Zap, X, ChevronRight, Sparkles } from "lucide-react";
import MagicalIcon from "./MagicalIcon";
import MagicalEmoji from "./MagicalEmoji";
import MagicalGaleon from "./MagicalGaleon";

interface Props {
  currentVip?: string | null;
  galeons?: number;
  username?: string;
}

const VIP_BENEFITS = [
  { emoji: "✨", text: "Badge VIP exclusivo" },
  { emoji: "🪙", text: "Galeões mensais" },
  { emoji: "🎁", text: "Itens e Skins únicos" },
  { emoji: "⚡", text: "XP Bônus em tudo" },
  { emoji: "🗝️", text: "Acesso antecipado" },
  { emoji: "🏆", text: "Título no Ranking" },
];

const PLANS = [
  { id: "premium", name: "Iniciante", price: "R$ 9,90", color: "from-slate-900 to-slate-800", border: "border-slate-700", galeons: 0 },
  { id: "vip", name: "VIP", price: "R$ 19,90", color: "from-purple-950 to-indigo-900", border: "border-purple-500", galeons: 200, highlight: true },
  { id: "founder", name: "Fundador", price: "R$ 39,90", color: "from-amber-950 to-orange-900", border: "border-amber-600", galeons: 500 },
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
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 mb-6 shadow-2xl">

      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss */}
      <button onClick={handleDismiss}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
        <X size={16} />
      </button>

      <div className="p-6 md:p-8">

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 rounded-3xl border border-yellow-500/20 shadow-inner shrink-0">
            <Crown size={32} className="text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-yellow-500 uppercase">Poder Mágico Supremo</span>
            </div>
            <h2 className="font-heading text-2xl text-white leading-tight">
              {username ? `${username.split(" ")[0]}, ` : ""}Desbloqueie o <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">VIP Hogwarts</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Junte-se aos bruxos de elite com benefícios exclusivos.
            </p>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {VIP_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-slate-300 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
              <MagicalIcon size="sm">
                <MagicalEmoji emoji={b.emoji} size="sm" />
              </MagicalIcon>
              <span className="text-[10px] uppercase tracking-wider">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANS.map(plan => (
            <div key={plan.id}
              className={`relative rounded-3xl border ${plan.border} bg-gradient-to-br ${plan.color} p-5 text-center shadow-lg transition-transform hover:scale-[1.02]`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Popular
                </span>
              )}
              <div className="mb-4">
                 <MagicalIcon size="md" className="mx-auto">
                    <MagicalEmoji emoji={plan.id === 'founder' ? '👑' : plan.id === 'vip' ? '🥇' : '✨'} size="md" />
                 </MagicalIcon>
              </div>
              <p className="text-white/60 text-[10px] uppercase tracking-[0.2em] mb-1">{plan.name}</p>
              <p className="text-xl font-bold text-white mb-2">{plan.price}</p>
              {plan.galeons > 0 && (
                <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[10px] font-bold text-yellow-400">+{plan.galeons}</span>
                  <MagicalGaleon size="xs" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to="/dashboard/store"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 hover:from-yellow-300 hover:to-amber-500 text-slate-950 font-bold transition-all hover:scale-[1.01]">
            <Sparkles size={18} />
            Assinar VIP agora
          </Link>
        </div>

      </div>
    </div>
  );
}
