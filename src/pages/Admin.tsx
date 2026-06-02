import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AdminMemberCard, type MemberProfile } from "./Admin/AdminMemberCard";
import { AdminMonetizationTab } from "./Admin/AdminMonetizationTab";
import PedidosTab from "@/components/PedidosTab";

type Tab = "members" | "pending_members" | "challenges" | "monetization" | "pedidos";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [onlineFilter, setOnlineFilter] = useState<"all" | "online">("all");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: m } = await supabase.from("profiles").select("*").eq("approved", true).order("created_at", { ascending: false });
    if (m) setMembers(m as unknown as MemberProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  if (!isAdmin) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gerencie o Portal Hogwarts House</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["members", "monetization", "pedidos"] as Tab[]).map((t) => (
          <Button key={t} onClick={() => setTab(t)} variant={tab === t ? "magical" : "ghost"}>
            {t.toUpperCase()}
          </Button>
        ))}
      </div>

      {loading ? <p>Carregando...</p> : (
        <div className="mt-6">
          {tab === "members" && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2 mb-4">
                <Button size="sm" variant={onlineFilter === "all" ? "magical" : "ghost"} onClick={() => setOnlineFilter("all")} className="text-[10px] h-8 px-4 rounded-full">
                  TODOS
                </Button>
                <Button size="sm" variant={onlineFilter === "online" ? "magical" : "ghost"} onClick={() => setOnlineFilter("online")} className="text-[10px] h-8 px-4 rounded-full">
                  ONLINE AGORA
                </Button>
              </div>
              <div className="grid gap-4">
                {members
                  .filter(m => onlineFilter === "all" || isUserOnline(m as any))
                  .map(m => <AdminMemberCard key={m.user_id} member={m} onClick={() => navigate(`/dashboard/profile/${m.user_id}`)} />)}
                {members.filter(m => onlineFilter === "all" || isUserOnline(m as any)).length === 0 && (
                  <p className="text-center py-10 text-muted-foreground text-sm italic">Nenhum bruxo encontrado nesta categoria.</p>
                )}
              </div>
            </div>
          )}
          {tab === "monetization" && <AdminMonetizationTab members={members} fetchAll={fetchAll} />}
          {tab === "pedidos" && <PedidosTab />}
        </div>
      )}
    </div>
  );
}
