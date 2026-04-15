import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { MOCK_MEMBERS, MOCK_CHALLENGES, HOUSES, type House } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HouseCrest from "@/components/HouseCrest";
import UserCard from "@/components/UserCard";

type Tab = "members" | "challenges" | "houses" | "pending";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("members");

  if (!user || user.role !== "admin") {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm">Gerencie o Portal Hogwarts House</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{MOCK_MEMBERS.length}</p>
          <p className="text-xs text-muted-foreground">Membros</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{MOCK_MEMBERS.filter((m) => m.online).length}</p>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{MOCK_CHALLENGES.length}</p>
          <p className="text-xs text-muted-foreground">Desafios</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">1</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      {tab === "members" && (
        <div className="space-y-3">
          {MOCK_MEMBERS.map((m) => (
            <div key={m.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <UserCard user={m} compact />
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" className="font-heading text-xs">Editar</Button>
                <Button variant="destructive" size="sm" className="font-heading text-xs">Banir</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "pending" && (
        <div className="glass rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-muted-foreground text-sm">Nenhuma matrícula pendente no momento.</p>
          <p className="text-xs text-muted-foreground mt-1">Novos pedidos aparecerão aqui para aprovação.</p>
        </div>
      )}

      {tab === "challenges" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">Criar Novo Desafio</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <Input placeholder="Título do desafio" className="bg-secondary/50" />
              <Input placeholder="XP de recompensa" type="number" className="bg-secondary/50" />
            </div>
            <textarea placeholder="Descrição..." className="w-full mt-3 bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]" />
            <Button variant="magical" size="sm" className="font-heading text-xs mt-3">
              Criar Desafio ⚡
            </Button>
          </div>
          {MOCK_CHALLENGES.map((c) => (
            <div key={c.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-heading text-sm text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.xpReward} XP • {c.type}</p>
              </div>
              <Button variant="outline" size="sm" className="font-heading text-xs">Editar</Button>
            </div>
          ))}
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
              <div className="flex gap-2">
                <Input placeholder="Ajustar pontos" type="number" className="bg-secondary/50 flex-1" />
                <Button variant="magical" size="sm" className="font-heading text-xs">Salvar</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
