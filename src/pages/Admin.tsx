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
              <div className="flex justify-end gap-2 mb-4">
                <Button size="sm" variant={onlineFilter === "all" ? "magical" : "ghost"} onClick={() => setOnlineFilter("all")} className="text-[10px] px-space-md rounded-full">
                  TODOS
                </Button>
                <Button size="sm" variant={onlineFilter === "online" ? "magical" : "ghost"} onClick={() => setOnlineFilter("online")} className="text-[10px] px-space-md rounded-full">
                  ONLINE AGORA
                </Button>
              </div>
              <div className="grid gap-4">
                {members
                  .filter(m => onlineFilter === "all" || isUserOnline(m as any))
                  .map(m => <AdminMemberCard key={m.user_id} member={m} onClick={(uid, name) => setEditMember({ uid, name })} />)}
                {members.filter(m => onlineFilter === "all" || isUserOnline(m as any)).length === 0 && (
                  <p className="text-center py-10 text-muted-foreground text-sm italic">Nenhum bruxo encontrado nesta categoria.</p>
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
