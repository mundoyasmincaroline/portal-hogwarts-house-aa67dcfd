import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, Users, DollarSign, Coins, ArrowUpRight, ArrowDownRight, 
  Calendar, Filter, Download, Sparkles, Crown, Zap, RefreshCw, ScrollText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import MagicalGaleon from "@/components/shared/MagicalGaleon";
import SafeImage from "@/components/SafeImage";

interface FinanceStats {
  totalRevenue: number;
  totalGaleons: number;
  totalOrders: number;
  activeVips: number;
  revenueByDay: any[];
  ordersByType: any[];
}

export default function AdminFinance() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0, totalGaleons: 0, totalOrders: 0, activeVips: 0,
    revenueByDay: [], ordersByType: []
  });
  const [filterQuery, setFilterQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [drill, setDrill] = useState<null | "revenue" | "galeons" | "orders" | "vips">(null);

  useEffect(() => {
    loadFinanceData();
    // Real-time subscription to orders
    const channelId = `admin_finance:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const sub = (supabase.channel(channelId) as any).on("postgres_changes", { event: "*", schema: "public", table: "galeon_orders" }, () => loadFinanceData())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const loadFinanceData = async () => {
    try {
      const { data: allOrders, error } = await supabase
        .from("galeon_orders")
        .select("*, profiles:profiles(full_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const completed = (allOrders || []).filter(o => o.status === "paid");
      
      // Calculate Stats
      const totalRevenue = completed.reduce((sum, o) => sum + (o.amount_brl || 0), 0);
      const totalGaleons = completed.reduce((sum, o) => sum + (o.galeons || 0), 0);
      
      // Revenue by day (last 7 days)
      const dayMap: Record<string, number> = {};
      completed.forEach(o => {
        const day = new Date(o.paid_at || o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        dayMap[day] = (dayMap[day] || 0) + o.amount_brl;
      });
      const revenueByDay = Object.entries(dayMap).map(([name, value]) => ({ name, value })).reverse().slice(0, 7).reverse();

      // Orders by Type
      const typeMap: Record<string, number> = {};
      completed.forEach(o => {
        const type = (o.package_id || "").startsWith("vip_") ? "VIP" : "Galeões";
        typeMap[type] = (typeMap[type] || 0) + 1;
      });
      const ordersByType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

      // Active VIPs (simplified check)
      const { data: vipList, count: vips } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, vip_plan, vip_expires_at, galeons", { count: "exact" })
        .not("vip_plan", "is", null)
        .order("vip_expires_at", { ascending: false });
      setVipUsers(vipList || []);

      setStats({
        totalRevenue,
        totalGaleons,
        totalOrders: completed.length,
        activeVips: vips || 0,
        revenueByDay,
        ordersByType
      });
      setOrders(allOrders || []);
    } catch (err: any) {
      toast.error("Erro ao carregar finanças: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const drillData = (() => {
    if (!drill) return { title: "", subtitle: "", items: [] as any[] };
    if (drill === "vips") {
      return {
        title: "VIPs Ativos",
        subtitle: `${vipUsers.length} bruxos com plano VIP ativo`,
        items: vipUsers.map(u => ({
          user_id: u.user_id,
          name: u.full_name,
          sub: `@${u.username} • ${u.vip_plan?.toUpperCase()} • Expira: ${u.vip_expires_at ? new Date(u.vip_expires_at).toLocaleDateString("pt-BR") : "—"}`,
          right: <span className="text-purple-400 font-bold text-xs uppercase">{u.vip_plan}</span>,
          avatar: u.avatar_url,
        })),
      };
    }
    const paid = orders.filter(o => o.status === "paid");
    if (drill === "revenue") {
      return {
        title: "Receita Total — Compradores",
        subtitle: `${paid.length} transações pagas`,
        items: paid.map(o => ({
          user_id: o.user_id,
          name: o.profiles?.full_name || "Desconhecido",
          sub: `${o.package_id?.replace("vip_", "VIP ").replace(/_/g, " ")} • ${new Date(o.paid_at || o.created_at).toLocaleString("pt-BR")}`,
          right: <span className="text-green-400 font-bold">R$ {(o.amount_brl || 0).toFixed(2)}</span>,
          avatar: o.profiles?.avatar_url,
        })),
      };
    }
    if (drill === "galeons") {
      const onlyGal = paid.filter(o => (o.galeons || 0) > 0);
      return {
        title: "Galeões Vendidos — Compradores",
        subtitle: `${onlyGal.reduce((s, o) => s + (o.galeons || 0), 0).toLocaleString()} galeões em ${onlyGal.length} compras`,
        items: onlyGal.map(o => ({
          user_id: o.user_id,
          name: o.profiles?.full_name || "Desconhecido",
          sub: `${new Date(o.paid_at || o.created_at).toLocaleString("pt-BR")} • R$ ${(o.amount_brl || 0).toFixed(2)}`,
          right: <span className="text-yellow-500 font-bold">🪙 {o.galeons}</span>,
          avatar: o.profiles?.avatar_url,
        })),
      };
    }
    return {
      title: "Vendas Concluídas",
      subtitle: `${paid.length} ordens pagas`,
      items: paid.map(o => ({
        user_id: o.user_id,
        name: o.profiles?.full_name || "Desconhecido",
        sub: `${o.package_id?.replace("vip_", "VIP ").replace(/_/g, " ")} • ${new Date(o.paid_at || o.created_at).toLocaleString("pt-BR")}`,
        right: <span className="text-green-400 font-bold">R$ {(o.amount_brl || 0).toFixed(2)}</span>,
        avatar: o.profiles?.avatar_url,
      })),
    };
  })();

  const COLORS = ["#f59e0b", "#a855f7", "#3b82f6", "#ef4444"];

  const handleExport = () => {
    if (!orders.length) { toast.error("Nenhum dado para exportar."); return; }
    const csv = ["ID,Usuário,Produto,Valor BRL,Galeões,Status,Data",
      ...orders.map(o => [o.id, (o.profiles?.full_name || "").replace(/,/g, " "), o.package_id, o.amount_brl, o.galeons, o.status, new Date(o.created_at).toLocaleDateString("pt-BR")].join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `gringotts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Planilha exportada!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-20 px-2 sm:px-4">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading text-gold-gradient tracking-tight break-words">Tesouro de Gringotts</h1>
          <p className="text-muted-foreground font-serif italic text-sm sm:text-base">Painel de Administração Financeira em Tempo Real</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button variant="outline" className="glass border-white/10 gap-2" onClick={handleExport}>
            <Download size={16} /> Exportar Planilha
          </Button>
          <Button variant="magical" className="gap-2 shadow-xl" onClick={loadFinanceData} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sincronizar
          </Button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <KPIItem title="Receita Total" value={`R$ ${stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} color="text-green-500" onClick={() => setDrill("revenue")} />
        <KPIItem title="Galeões Vendidos" value={stats.totalGaleons.toLocaleString()} icon={Coins} color="text-yellow-500" onClick={() => setDrill("galeons")} />
        <KPIItem title="Vendas Concluídas" value={stats.totalOrders.toString()} icon={TrendingUp} color="text-blue-500" onClick={() => setDrill("orders")} />
        <KPIItem title="VIPs Ativos" value={stats.activeVips.toString()} icon={Crown} color="text-purple-500" onClick={() => setDrill("vips")} />
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2 glass rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-heading text-xl flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} /> Receita (Últimos 7 dias)
            </h3>
            <div className="flex gap-2">
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">AO VIVO</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "1rem" }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution Chart */}
        <Card className="glass rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl">
          <h3 className="font-heading text-xl mb-8 flex items-center gap-2">
            <Zap className="text-purple-400" size={20} /> Distribuição de Vendas
          </h3>
          <div className="h-[350px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="250">
              <PieChart>
                <Pie data={stats.ordersByType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.ordersByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 w-full mt-6">
              {stats.ordersByType.map((t, i) => (
                <div key={t.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{t.name}</span>
                  </div>
                  <span className="font-bold">{t.value} ordens</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── TRANSACTIONS TABLE (PLANILHA) ── */}
      <Card className="glass rounded-2xl sm:rounded-[3rem] border-white/10 bg-black/60 backdrop-blur-3xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-heading text-2xl flex items-center gap-3">
            <ScrollText className="text-primary" size={24} /> Log de Transações Gringotts
          </h3>
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar por usuário ou ID..."
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full md:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
                <th className="px-4 sm:px-8 py-5">Bruxo</th>
                <th className="px-4 sm:px-8 py-5 hidden xl:table-cell">ID Ordem</th>
                <th className="px-4 sm:px-8 py-5">Produto</th>
                <th className="px-4 sm:px-8 py-5 text-right">Valor</th>
                <th className="px-4 sm:px-8 py-5 text-center hidden sm:table-cell">Galeões</th>
                <th className="px-4 sm:px-8 py-5">Status</th>
                <th className="px-4 sm:px-8 py-5 text-right hidden lg:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(() => {
                const q = filterQuery.trim().toLowerCase();
                const filtered = q
                  ? orders.filter(o =>
                      (o.profiles?.full_name?.toLowerCase().includes(q)) ||
                      o.id.toLowerCase().includes(q) ||
                      o.user_id.toLowerCase().includes(q)
                    )
                  : orders;
                return (showAll ? filtered : filtered.slice(0, 20)).map(o => (
                <tr key={o.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 sm:px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                        <SafeImage src={o.profiles?.avatar_url} alt={o.profiles?.full_name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{o.profiles?.full_name || "Desconhecido"}</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono truncate">{o.user_id.slice(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 hidden xl:table-cell">
                    <span className="text-xs font-mono text-muted-foreground">{o.id.slice(0,12)}...</span>
                  </td>
                  <td className="px-4 sm:px-8 py-6">
                    <div className="flex items-center gap-2">
                       {o.package_id.includes("vip") ? <Crown size={12} className="text-purple-400 shrink-0" /> : <MagicalGaleon size="xs" className="shrink-0" />}
                       <span className="text-[11px] sm:text-sm font-serif truncate max-w-[80px] sm:max-w-none">{o.package_id.replace("vip_", "VIP ").replace(/_/g, " ")}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-right">
                    <span className="text-[11px] sm:text-sm font-bold text-green-400 font-mono">R$ {o.amount_brl?.toFixed(2)}</span>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-center hidden sm:table-cell">
                    <span className="text-sm font-bold text-yellow-500">{o.galeons || "-"}</span>
                  </td>
                  <td className="px-4 sm:px-8 py-6">
                    <span className={`text-[8px] sm:text-[9px] font-bold uppercase px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${
                      o.status === "paid" ? "bg-green-500/20 text-green-400 border-green-500/30" : 
                      o.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
                      "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {o.status === "paid" ? "Pago" : o.status === "pending" ? "Pendente" : "Falhou"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-8 py-6 text-right hidden lg:table-cell">
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                    <p className="text-[10px] text-muted-foreground/50">{new Date(o.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </td>
                </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="p-20 text-center text-muted-foreground italic">Nenhuma transação registrada ainda.</div>
        )}
        
        {orders.length > 20 && (
          <div className="p-6 bg-white/5 border-t border-white/5 text-center">
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-primary hover:underline font-bold uppercase tracking-[0.04em] sm:tracking-widest"
            >
              {showAll ? "Recolher" : `Ver Histórico Completo (${orders.length})`}
            </button>
          </div>
        )}
      </Card>

      {/* ── KPI DRILL-DOWN DIALOG ── */}
      <Dialog open={!!drill} onOpenChange={(o) => !o && setDrill(null)}>
        <DialogContent className="max-w-2xl glass border-white/10 bg-black/90 backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-gold-gradient">{drillData.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground italic">{drillData.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
            {drillData.items.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground italic">Nenhum registro encontrado.</p>
            ) : drillData.items.map((it, i) => (
              <button
                key={i}
                onClick={() => { setDrill(null); navigate(`/dashboard/profile/${it.user_id}`); }}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0">
                  <SafeImage src={it.avatar} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{it.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.sub}</p>
                </div>
                <div className="shrink-0">{it.right}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPIItem({ title, value, icon: Icon, color, onClick }: any) {
  return (
    <Card
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
      className={`glass rounded-[2rem] p-6 border-white/10 bg-black/40 hover:border-primary/50 transition-all group overflow-hidden relative ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/10" : ""}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-5 blur-2xl group-hover:opacity-10 transition-opacity -mr-8 -mt-8" style={{ color: color.replace('text-', '') }} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${color}`}>
          <Icon size={24} />
        </div>
        {onClick && <span className="text-[9px] uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors font-bold">Ver lista →</span>}
      </div>
      <div className="relative z-10">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{title}</p>
        <p className="text-3xl font-heading text-white">{value}</p>
      </div>
    </Card>
  );
}

