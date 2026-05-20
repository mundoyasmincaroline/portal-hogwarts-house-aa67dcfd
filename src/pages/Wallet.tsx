import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import { Coins, Crown, ShoppingBag, Zap, Star, Trophy, Calendar, ChevronRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import MagicalEmoji from "@/components/MagicalEmoji";
import MagicalGaleon from "@/components/MagicalGaleon";
import { useWallet } from "@/hooks/useWallet";

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

const PACKAGES = [
  { id: "starter",  name: "Bolsinha",    galeons: 50,   price: 4.90,  icon: "👝" },
  { id: "bag",      name: "Saquinho",    galeons: 150,  price: 12.90, icon: "👜" },
  { id: "chest",    name: "Baú",         galeons: 350,  price: 24.90, icon: "🧳" },
  { id: "vault",    name: "Cofre",       galeons: 800,  price: 44.90, icon: "🏦" },
  { id: "dragon",   name: "Tesouro",     galeons: 2000, price: 99.90, icon: "🐉" },
];

export default function Wallet() {
  const { galeons, vipPlan, vipExpires, paidOrders, pendingOrders, totalSpent, loading } = useWallet();
  const vipConf = vipPlan ? VIP_CONFIG[vipPlan] : null;


  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="glass rounded-3xl p-8 relative overflow-hidden border border-yellow-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Coins size={28} className="text-yellow-400" />
            <h1 className="font-heading text-3xl text-gold-gradient">Carteira Mágica</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Seu saldo, histórico e benefícios em um só lugar.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Saldo */}
            <div className="md:col-span-2 glass rounded-2xl p-5 border border-yellow-400/30 bg-gradient-to-br from-yellow-900/20 to-transparent">
              <p className="text-xs text-yellow-400/70 font-heading uppercase tracking-widest mb-1">Saldo Atual</p>
              <p className="font-heading text-5xl text-yellow-400">{galeons.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">🪙 Galeões</p>
              <Link to="/dashboard/store">
              <Link to="/dashboard/store">
                <Button variant="plaque" size="sm" className="mt-3 text-[10px]">
                  <ShoppingBag size={12} className="mr-1" /> Usar na Loja
                </Button>
              </Link>
              </Link>
            </div>

            {/* Status VIP */}
            <div className={`glass rounded-2xl p-5 border ${vipConf ? "border-purple-400/40" : "border-border/30"} relative overflow-hidden`}>
              {vipConf && <div className={`absolute inset-0 bg-gradient-to-br ${vipConf.color} opacity-20`} />}
              <div className="relative z-10">
                <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest mb-1">Plano VIP</p>
                {vipConf ? (
                  <>
                    <p className="font-heading text-xl text-foreground">{vipConf.icon} {vipConf.name}</p>
                    {vipExpires && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar size={10} /> Expira: {new Date(vipExpires).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-heading text-base text-muted-foreground">Sem plano</p>
                    <Link to="/dashboard/store" className="text-[10px] text-purple-400 hover:text-purple-300 mt-1 block">
                      → Ativar VIP a partir de R$9,90
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Total gasto */}
            <div className="glass rounded-2xl p-5 border border-border/30">
              <p className="text-xs text-muted-foreground font-heading uppercase tracking-widest mb-1">Total Investido</p>
              <p className="font-heading text-xl text-foreground">R$ {totalSpent.toFixed(2).replace(".", ",")}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{paidOrders.length} {paidOrders.length === 1 ? "compra" : "compras"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Benefícios VIP ── */}
      {vipConf && (
        <div className={`glass rounded-2xl p-6 border border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-violet-900/10 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <h2 className="font-heading text-lg text-purple-300 mb-4 flex items-center gap-2">
            <Crown size={18} /> Seus Benefícios {vipConf.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "🏅 Badge VIP exclusivo no perfil e posts",
              `+${vipConf.galeons} Galeões mensais automáticos`,
              "⚡ XP bônus em todas as atividades",
              "✨ Acesso a itens e skins exclusivos",
              "🔮 Acesso antecipado a novidades",
              "👑 Título no ranking de membros",
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-white/3 rounded-lg px-3 py-2 border border-white/5">
                {b}
              </div>
            ))}
          </div>
          {vipConf.galeons > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-yellow-900/20 border border-yellow-500/30 flex items-center justify-between">
              <span className="text-sm text-yellow-400 font-heading flex items-center gap-2"><MagicalGaleon size="xs" /> Galeões mensais incluídos</span>
              <span className="text-lg font-heading text-yellow-400">+{vipConf.galeons}/mês</span>
            </div>
          )}
        </div>
      )}

      {/* ── Formas de ganhar Galeões grátis ── */}
      <div className="glass rounded-2xl p-6 border border-green-500/20">
        <h2 className="font-heading text-lg text-foreground mb-1 flex items-center gap-2">
          <Gift size={18} className="text-green-400" /> Como Ganhar Galeões de Graça
        </h2>
        <p className="text-xs text-muted-foreground mb-4">Acumule Galeões participando do portal!</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FREE_WAYS.map((w, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-3 border border-border/30 hover:border-green-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{w.icon}</span>
                <span className="text-xs font-heading text-green-400 flex items-center gap-1"><MagicalGaleon size="xs" /> {w.reward}</span>
              </div>
              <p className="text-xs font-heading text-foreground">{w.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{w.tip}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
          <span className="text-sm text-foreground">Quer mais Galeões mais rápido?</span>
          <Link to="/dashboard/store">
            <Button variant="plaque" size="sm" className="text-[10px]">
              Comprar Galeões <ChevronRight size={12} />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Pedidos pendentes ── */}
      {pendingOrders.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-yellow-500/30 bg-yellow-900/10">
          <h2 className="font-heading text-base text-yellow-400 mb-3 flex items-center gap-2">
            <Zap size={16} /> {pendingOrders.length} Pagamento{pendingOrders.length > 1 ? "s" : ""} Pendente{pendingOrders.length > 1 ? "s" : ""}
          </h2>
          <div className="space-y-2">
            {pendingOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm bg-yellow-900/20 rounded-lg px-4 py-2 border border-yellow-500/20">
                <div>
                  <p className="text-foreground text-xs font-heading flex items-center gap-1">{o.galeons > 0 ? <><MagicalGaleon size="xs" /> {o.galeons} Galeões</> : `👑 Plano VIP`}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-heading text-xs">R$ {o.amount_brl?.toFixed(2).replace(".", ",")}</p>
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Aguardando</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Pagamentos Pix são confirmados em até 30 minutos. Problemas? Fale com os admins.
          </p>
        </div>
      )}

      {/* ── Histórico de compras ── */}
      <div className="glass rounded-2xl p-6 border border-border/30">
        <h2 className="font-heading text-lg text-foreground mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-primary" /> Histórico de Compras
        </h2>
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-6 animate-pulse">Carregando...</p>
        ) : paidOrders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-muted-foreground text-sm">Nenhuma compra ainda.</p>
            <Link to="/dashboard/store" className="mt-3 inline-block">
              <Button variant="magical" size="sm" className="font-heading text-xs">
                Ir para a Gringotts
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {paidOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border/30 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    {o.package_id?.includes("vip") ? <Crown size={16} className="text-yellow-400" /> : <Coins size={16} className="text-yellow-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-heading text-foreground">
                      {o.package_id?.includes("vip") ? `👑 VIP ${o.package_id.replace("vip_", "").toUpperCase()}` : `🪙 ${o.galeons} Galeões`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {o.paid_at ? new Date(o.paid_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-heading text-foreground">R$ {o.amount_brl?.toFixed(2).replace(".", ",")}</p>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Pago</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA comprar mais ── */}
      {!vipConf && (
        <div className="glass rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-violet-950/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
          <Star size={32} className="mx-auto text-purple-400 mb-3 animate-pulse" />
          <h3 className="font-heading text-xl text-foreground mb-2">Pronto para o próximo nível?</h3>
          <p className="text-sm text-muted-foreground mb-4">Assine o VIP e ganhe Galeões mensais, badge exclusivo e acesso a itens únicos.</p>
          <Link to="/dashboard/store">
            <Button variant="magical" className="font-heading px-8">
              👑 Ver Planos VIP — a partir de R$9,90/mês
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
