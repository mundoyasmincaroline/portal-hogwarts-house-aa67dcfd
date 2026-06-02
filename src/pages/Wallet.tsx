import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { Coins, Crown, ShoppingBag, Zap, Star, Trophy, Calendar, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import { useWallet } from "@/hooks/features/useWallet";

const VIP_CONFIG: Record<string, { name: string; color: string; icon: string; galeons: number }> = {
  premium: { name: "Iniciante",  color: "from-slate-700 to-slate-600",   icon: "⭐", galeons: 0 },
  vip:     { name: "VIP",        color: "from-purple-800 to-violet-700", icon: "💜", galeons: 200 },
  founder: { name: "Fundador",   color: "from-yellow-800 to-amber-700",  icon: "👑", galeons: 500 },
};

const FREE_WAYS = [
  { icon: "☀️", label: "Login diário",          reward: "+5",   tip: "Entre todo dia e ganhe Galeões" },
  { icon: "📝", label: "Publicar no Feed",       reward: "+2",   tip: "Cada post publica Galeões" },
  { icon: "⚔️", label: "Completar desafios",     reward: "+10",  tip: "Desafios diários e semanais" },
  { icon: "🤝", label: "Convidar um amigo",      reward: "+20",  tip: "Referral aprovado no nível 2" },
  { icon: "💬", label: "Comentar no Feed",       reward: "+1",   tip: "Interaja com a comunidade" },
  { icon: "🏆", label: "Subir de nível",         reward: "+15",  tip: "A cada novo nível alcançado" },
];

export default function Wallet() {
  const { galeons, vipPlan, vipExpires, paidOrders, pendingOrders, totalSpent, loading } = useWallet();
  const vipConf = vipPlan ? VIP_CONFIG[vipPlan] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 px-2 sm:px-0">

      {/* ── Header ── */}
      <div className="glass rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden border border-yellow-500/30 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-black/40 to-amber-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.1),transparent_60%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <Coins size={32} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-gold-gradient tracking-tighter">Carteira Mágica</h1>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground/80 font-serif italic">"Seu ouro está seguro no cofre mais protegido do mundo bruxo."</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
               <div className="glass bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 border-white/10">
                  <Trophy size={14} className="text-primary" />
                  <span className="text-[10px] font-heading uppercase tracking-widest text-primary/80">Prestígio Financeiro</span>
               </div>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <div className="glass rounded-[2rem] p-6 sm:p-8 border-yellow-400/30 bg-gradient-to-br from-yellow-900/30 to-black/60 shadow-2xl text-center relative group w-full md:min-w-[280px]">
              <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[10px] text-yellow-400/95 font-heading uppercase tracking-[0.2em] mb-4">Saldo Disponível</p>
              <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                <MagicalGaleon size="md" />
                <p className="font-heading text-4xl sm:text-5xl md:text-6xl text-yellow-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] break-words max-w-full leading-none">{galeons.toLocaleString("pt-BR")}</p>
              </div>
              <Link to="/dashboard/store" className="block">
                <Button variant="magical" size="lg" className="w-full h-14 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl">
                  <ShoppingBag size={14} className="mr-2" /> Visitar a Loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status VIP */}
        <div className={`glass rounded-2xl p-6 border ${vipConf ? "border-purple-400/40" : "border-border/30"} relative overflow-hidden`}>
          {vipConf && <div className={`absolute inset-0 bg-gradient-to-br ${vipConf.color} opacity-20`} />}
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest mb-1">Plano VIP</p>
            {vipConf ? (
              <>
                <p className="font-heading text-2xl text-foreground">{vipConf.icon} {vipConf.name}</p>
                {vipExpires && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 opacity-95">
                    <Calendar size={12} /> Expira em {new Date(vipExpires).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-heading text-xl text-muted-foreground">Sem plano ativo</p>
                <Link to="/dashboard/store" className="text-xs text-purple-400 hover:text-purple-300 mt-2 block font-heading uppercase tracking-wider">
                  → Ativar VIP a partir de R$9,90
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Total gasto */}
        <div className="glass rounded-2xl p-6 border border-border/30">
          <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest mb-1">Total Investido</p>
          <p className="font-heading text-2xl text-foreground">R$ {totalSpent.toFixed(2).replace(".", ",")}</p>
          <p className="text-xs text-muted-foreground mt-2 opacity-95">{paidOrders.length} {paidOrders.length === 1 ? "compra realizada" : "compras realizadas"}</p>
        </div>
      </div>

      {/* ── Benefícios VIP ── */}
      {vipConf && (
        <div className={`glass rounded-2xl p-8 border border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/10 relative overflow-hidden shadow-xl`}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="font-heading text-xl text-purple-300 mb-6 flex items-center gap-3">
            <Crown size={22} /> Seus Benefícios {vipConf.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "🏅 Badge VIP exclusivo",
              `+${vipConf.galeons} Galeões/mês`,
              "⚡ bônus de XP diário",
              "✨ Skins exclusivas",
              "🔮 Acesso antecipado",
              "👑 Título honorário",
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/70 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500/40" />
                {b}
              </div>
            ))}
          </div>
          {vipConf.galeons > 0 && (
            <div className="mt-6 p-4 rounded-[1.5rem] bg-yellow-900/20 border border-yellow-500/30 flex items-center justify-between group">
              <span className="text-base text-yellow-400 font-heading flex items-center gap-2 tracking-tight">
                <MagicalGaleon size="sm" /> Galeões mensais garantidos
              </span>
              <span className="text-2xl font-heading text-yellow-400 drop-shadow-md group-hover:scale-110 transition-transform">+{vipConf.galeons}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Formas de ganhar Galeões grátis ── */}
      <div className="glass rounded-[2rem] p-8 border border-green-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading text-2xl text-foreground mb-1 flex items-center gap-3">
              <Gift size={24} className="text-green-400" /> Recompensas do Portal
            </h2>
            <p className="text-sm text-muted-foreground font-serif italic opacity-95">"A atividade é recompensada com ouro para os bruxos dedicados."</p>
          </div>
          <Link to="/dashboard/store">
            <Button variant="magical" size="sm" className="text-[10px] h-10 px-6 rounded-xl">
              COMPRAR GALEÕES <ChevronRight size={14} className="ml-1" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREE_WAYS.map((w, i) => (
            <div key={i} className="bg-secondary/20 rounded-2xl p-4 border border-border/30 hover:border-green-500/30 transition-all group hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">{w.icon}</div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                   <MagicalGaleon size="xs" />
                   <span className="text-xs font-heading text-green-400">{w.reward}</span>
                </div>
              </div>
              <p className="text-sm font-heading text-foreground mb-1">{w.label}</p>
              <p className="text-[10px] text-muted-foreground font-serif italic opacity-90 leading-relaxed">{w.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pedidos pendentes ── */}
      {pendingOrders.length > 0 && (
        <div className="glass rounded-[2rem] p-8 border border-yellow-500/30 bg-yellow-900/10 shadow-xl">
          <h2 className="font-heading text-lg text-yellow-400 mb-4 flex items-center gap-3">
            <Zap size={20} className="animate-pulse" /> {pendingOrders.length} Magia{pendingOrders.length > 1 ? "s" : ""} em Caminho
          </h2>
          <div className="space-y-3">
            {pendingOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-yellow-900/20 rounded-xl border border-yellow-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">⏳</div>
                  <div>
                    <p className="text-foreground text-sm font-heading flex items-center gap-1.5">{o.galeons > 0 ? <><MagicalGaleon size="xs" /> {o.galeons} Galeões</> : `👑 Plano VIP`}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-heading text-base">R$ {o.amount_brl?.toFixed(2).replace(".", ",")}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-yellow-500/95">Processando</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Histórico de compras ── */}
      <div className="glass rounded-[2rem] p-8 border border-border/30">
        <h2 className="font-heading text-xl text-foreground mb-6 flex items-center gap-3">
          <Trophy size={22} className="text-primary" /> Arquivos de Gringotts
        </h2>
        {loading ? (
          <div className="space-y-3">
             {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : paidOrders.length === 0 ? (
          <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/5">
            <div className="text-5xl mb-4 opacity-20">🏦</div>
            <p className="text-muted-foreground font-serif italic">Nenhuma transação registrada em seu nome ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paidOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {o.package_id?.includes("vip") ? <Crown size={20} className="text-yellow-400" /> : <Coins size={20} className="text-yellow-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-heading text-foreground">
                      {o.package_id?.includes("vip") ? `PLANO VIP ${o.package_id.replace("vip_", "").toUpperCase()}` : `${o.galeons} GALEÕES`}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                      {o.paid_at ? new Date(o.paid_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-heading text-foreground">R$ {o.amount_brl?.toFixed(2).replace(".", ",")}</p>
                  <span className="text-[9px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">CONFIRMADO</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA comprar mais ── */}
      {!vipConf && (
        <div className="glass rounded-[2rem] p-8 border border-purple-500/30 bg-gradient-to-br from-purple-950/60 to-black text-center relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
          <Star size={40} className="mx-auto text-purple-400 mb-4 animate-float" />
          <h3 className="font-heading text-2xl text-foreground mb-2 tracking-tighter">Ascenda ao Status Lendário</h3>
          <p className="text-base text-muted-foreground/80 mb-6 font-serif italic max-w-md mx-auto">"O VIP é mais que um plano, é uma marca de distinção em Hogwarts."</p>
          <Link to="/dashboard/store">
            <Button variant="magical" size="lg" className="font-heading text-sm px-10 h-14 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
              VER PLANOS VIP — DESBLOQUEAR MAGIA
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}