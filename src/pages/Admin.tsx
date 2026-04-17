import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HouseCrest from "@/components/HouseCrest";
import { toast } from "sonner";

type Tab = "members" | "challenges" | "houses" | "filch";

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

interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  type: string;
  active: boolean;
}

interface ModLog {
  id: string;
  user_id: string | null;
  content_type: string;
  original_content: string;
  reason: string;
  action: string;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [logs, setLogs] = useState<ModLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCh, setNewCh] = useState({ title: "", description: "", xp_reward: 50, type: "daily" });

  const fetchAll = async () => {
    const [{ data: m }, { data: c }, { data: l }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("challenges").select("*").order("created_at", { ascending: false }),
      supabase.from("moderation_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (m) setMembers(m as unknown as MemberProfile[]);
    if (c) setChallenges(c as ChallengeRow[]);
    if (l) setLogs(l as ModLog[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAll();
    else setLoading(false);
  }, [isAdmin]);

  const createChallenge = async () => {
    if (!newCh.title.trim() || !user) return;
    const { error } = await supabase.from("challenges").insert({
      title: newCh.title,
      description: newCh.description,
      xp_reward: newCh.xp_reward,
      type: newCh.type,
      created_by: user.id,
      active: true,
    } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Desafio criado!");
    setNewCh({ title: "", description: "", xp_reward: 50, type: "daily" });
    fetchAll();
  };

  const toggleChallenge = async (c: ChallengeRow) => {
    await supabase.from("challenges").update({ active: !c.active } as never).eq("id", c.id);
    fetchAll();
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
    { id: "challenges", label: "Desafios", icon: "⚔️" },
    { id: "houses", label: "Casas", icon: "🏰" },
    { id: "filch", label: "Filch (Log)", icon: "🧹" },
  ];

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
          <p className="text-2xl font-heading text-foreground">{members.filter((m) => m.online).length}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{challenges.filter((c) => c.active).length}</p>
          <p className="text-xs text-muted-foreground">Desafios ativos</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{logs.length}</p>
          <p className="text-xs text-muted-foreground">Bloqueios Filch</p>
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
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : (
        <>
          {tab === "members" && (
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="relative">
                    <HouseCrest house={m.house} size="sm" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${m.online ? "bg-green-500" : "bg-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} • {m.age} anos • {m.xp} XP</p>
                  </div>
                  {m.online && <span className="text-xs text-green-500">🟢 Online</span>}
                </div>
              ))}
            </div>
          )}

          {tab === "challenges" && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-heading text-sm text-primary">➕ Criar novo desafio</h3>
                <Input placeholder="Título" value={newCh.title} onChange={(e) => setNewCh({ ...newCh, title: e.target.value })} />
                <Input placeholder="Descrição" value={newCh.description} onChange={(e) => setNewCh({ ...newCh, description: e.target.value })} />
                <div className="flex gap-2">
                  <Input type="number" placeholder="XP" value={newCh.xp_reward} onChange={(e) => setNewCh({ ...newCh, xp_reward: parseInt(e.target.value) || 0 })} />
                  <select value={newCh.type} onChange={(e) => setNewCh({ ...newCh, type: e.target.value })} className="bg-secondary/50 rounded-md px-3 text-sm text-foreground border border-border">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="special">Especial</option>
                  </select>
                  <Button variant="magical" size="sm" onClick={createChallenge}>Criar</Button>
                </div>
              </div>
              {challenges.map((c) => (
                <div key={c.id} className="glass rounded-xl p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-heading text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.xp_reward} XP • {c.type} • {c.active ? "Ativo" : "Inativo"}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleChallenge(c)}>
                    {c.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === "houses" && (
            <div className="grid md:grid-cols-2 gap-4">
              {Object.values(HOUSES).map((h) => {
                const count = members.filter((m) => m.house === h.id).length;
                return (
                  <div key={h.id} className="glass rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <HouseCrest house={h.id as House} size="md" />
                      <div>
                        <p className="font-heading text-foreground">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{count} membros</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "filch" && (
            <div className="space-y-3">
              <div className="glass rounded-xl p-4">
                <h3 className="font-heading text-sm text-primary mb-1">🧹 Filch, o Zelador</h3>
                <p className="text-xs text-muted-foreground">Bot de moderação que bloqueia automaticamente palavras impróprias em posts e comentários.</p>
              </div>
              {logs.length === 0 ? (
                <div className="glass rounded-xl p-6 text-center">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="text-muted-foreground text-sm">Nenhum bloqueio registrado. O castelo está em paz!</p>
                </div>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="glass rounded-xl p-4 border-l-2 border-destructive">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-heading text-destructive">{l.action.toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{l.reason}</p>
                    <p className="text-xs text-foreground italic">"{l.original_content}"</p>
                    <p className="text-xs text-muted-foreground mt-1">Tipo: {l.content_type}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
