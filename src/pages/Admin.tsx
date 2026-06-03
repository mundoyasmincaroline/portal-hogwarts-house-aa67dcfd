import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Filter, Shield, User, Coins } from "lucide-react";
import { AdminMemberCard, type MemberProfile } from "./Admin/AdminMemberCard";
import { AdminMonetizationTab } from "./Admin/AdminMonetizationTab";
import PedidosTab from "@/components/PedidosTab";
import { AdminStreakMilestonesTab } from "./Admin/AdminStreakMilestonesTab";
import AdminKpiPanel from "@/components/admin/AdminKpiPanel";
import AdminMemberModal from "@/components/admin/AdminMemberModal";
import { AdminModerationTab } from "@/components/admin/AdminModerationTab";


import EmojiIcon from "@/components/shared/EmojiIcon";
type Tab = "members" | "monetization" | "pedidos" | "streak" | "moderation";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [onlineFilter, setOnlineFilter] = useState<"all" | "online">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [houseFilter, setHouseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editMember, setEditMember] = useState<{ uid: string; name: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: m, error } = await supabase.from("profiles").select("*").eq("approved", true).order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar membros: " + error.message);
    if (m) setMembers(m as unknown as MemberProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  if (isAdmin === undefined) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-pulse font-heading uppercase tracking-widest text-xs">
        Verificando permissões do Ministério...
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-6xl"><EmojiIcon e="🚫" /></p>
        <p className="font-heading text-2xl text-red-400">Acesso Negado pelo Ministério da Magia</p>
        <p className="text-sm text-muted-foreground font-serif italic">"Somente membros da Ordem podem ver este pergaminho."</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
          ← Voltar ao Salão Principal
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-4 sm:p-6">
        <h1 className="font-heading text-xl sm:text-2xl text-gold-gradient mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gerencie o Portal Hogwarts House</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/characters")}><EmojiIcon e="🧾" /> Fichas & Canons</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/analytics")}><EmojiIcon e="📊" /> Analytics</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/finance")}><EmojiIcon e="💰" /> Financeiro</Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/admin/support")}><EmojiIcon e="🛟" /> Suporte</Button>
        </div>
      </div>

      <AdminKpiPanel />

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {([
          { key: "members", label: "Membros" },
          { key: "monetization", label: "Monetização" },
          { key: "pedidos", label: "Pedidos" },
          { key: "streak", label: "Sequência" },
          { key: "moderation", label: "Moderação" },
        ] as { key: Tab; label: string }[]).map((t) => (

          <Button key={t.key} onClick={() => setTab(t.key)} variant={tab === t.key ? "magical" : "ghost"}>
            {t.label.toUpperCase()}
          </Button>
        ))}
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className="mt-6">
          {tab === "members" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-4 bg-background/40 p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por nome ou ID..." 
                    className="pl-9 bg-background/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-background/50 border border-input rounded-md px-3 py-2 text-xs"
                  value={houseFilter}
                  onChange={(e) => setHouseFilter(e.target.value)}
                >
                  <option value="all">Todas as Casas</option>
                  {Object.values(HOUSES).map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <select 
                  className="bg-background/50 border border-input rounded-md px-3 py-2 text-xs"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos Status</option>
                  <option value="vip">VIPs</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="grid gap-4">
                {members
                  .filter(m => {
                    const matchesSearch = !searchQuery || m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.user_id.includes(searchQuery);
                    const matchesHouse = houseFilter === "all" || m.house === houseFilter;
                    const matchesStatus = statusFilter === "all" || (statusFilter === "online" && isUserOnline(m as any)) || (statusFilter === "vip" && m.vip_plan);
                    const matchesOnlineFilter = onlineFilter === "all" || isUserOnline(m as any);
                    return matchesSearch && matchesHouse && matchesStatus && matchesOnlineFilter;
                  })
                  .map(m => (
                    <div key={m.user_id} className="relative group">
                      <AdminMemberCard member={m} onClick={(uid, name) => setEditMember({ uid, name })} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-background/80" title="Gerir Galeões" onClick={() => setEditMember({ uid: m.user_id, name: m.full_name || 'Bruxo' })}>
                          <Coins size={14} className="text-yellow-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {members.length === 0 && !loading && (
                  <p className="text-center py-10 text-muted-foreground text-sm italic">Nenhum bruxo encontrado com estes filtros.</p>
                )}
              </div>
            </div>
          )}
          {tab === "monetization" && <AdminMonetizationTab members={members} fetchAll={fetchAll} />}
          {tab === "pedidos" && <PedidosTab />}
          {tab === "streak" && <AdminStreakMilestonesTab />}
          {tab === "moderation" && <AdminModerationTab />}
        </div>

      )}

      {editMember && (
        <AdminMemberModal
          memberId={editMember.uid}
          memberName={editMember.name}
          onClose={() => setEditMember(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
