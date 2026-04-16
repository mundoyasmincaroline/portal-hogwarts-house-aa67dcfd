import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HouseCrest from "@/components/HouseCrest";

type Tab = "members" | "challenges" | "houses" | "pending";

interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  age: number;
  house: House;
  level: number;
  xp: number;
  approved: boolean;
  online: boolean;
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setMembers(data as unknown as MemberProfile[]);
    setLoading(false);
  };

  const approveUser = async (userId: string) => {
    await supabase.from("profiles").update({ approved: true } as never).eq("user_id", userId);
    fetchMembers();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="font-heading text-xl text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground text-sm">Apenas administradores podem acessar esta área.</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "members", label: "Membros", icon: "👥" },
    { id: "pending", label: "Pendentes", icon: "⏳" },
    { id: "challenges", label: "Desafios", icon: "⚔️" },
    { id: "houses", label: "Casas", icon: "🏰" },
  ];

  const pendingMembers = members.filter(m => !m.approved);
  const approvedMembers = members.filter(m => m.approved);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gerencie o Portal Hogwarts House</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{members.length}</p>
          <p className="text-xs text-muted-foreground">Membros</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{approvedMembers.length}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{pendingMembers.length}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">4</p>
          <p className="text-xs text-muted-foreground">Casas</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-heading whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <>
          {tab === "members" && (
            <div className="space-y-3">
              {approvedMembers.map((m) => (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <HouseCrest house={m.house} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} • {m.xp} XP • Nível {m.level}</p>
                  </div>
                </div>
              ))}
              {approvedMembers.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">Nenhum membro aprovado ainda.</p>
              )}
            </div>
          )}

          {tab === "pending" && (
            <div className="space-y-3">
              {pendingMembers.map((m) => (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <HouseCrest house={m.house} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos</p>
                  </div>
                  <Button variant="magical" size="sm" className="font-heading text-xs" onClick={() => approveUser(m.user_id)}>
                    Aprovar ✓
                  </Button>
                </div>
              ))}
              {pendingMembers.length === 0 && (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">✅</div>
                  <p className="text-muted-foreground text-sm">Nenhuma matrícula pendente.</p>
                </div>
              )}
            </div>
          )}

          {tab === "challenges" && (
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl mb-3">⚔️</div>
              <p className="text-muted-foreground text-sm">Gerenciamento de desafios em breve.</p>
            </div>
          )}

          {tab === "houses" && (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.values(HOUSES).map((h) => (
                <div key={h.id} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <HouseCrest house={h.id as House} size="md" />
                    <div>
                      <p className="font-heading text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{h.members} membros • {h.points} pts</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
