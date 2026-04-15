import { useAuth } from "@/lib/auth";
import { HOUSES, getLevelFromXP } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  const house = HOUSES[user.house];
  const levelInfo = getLevelFromXP(user.xp);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="glass rounded-2xl p-8 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center text-4xl font-heading text-primary animate-pulse-glow">
            {user.fullName[0]}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <HouseCrest house={user.house} size="sm" />
          </div>
        </div>
        <h1 className="font-heading text-2xl text-foreground">{user.fullName}</h1>
        <p className="text-muted-foreground text-sm">@{user.username}</p>
        {user.role !== "member" && (
          <span className="inline-block mt-1 text-xs font-heading bg-primary/20 text-primary px-3 py-1 rounded-full">
            {user.role === "admin" ? "⚡ Administrador" : "🛡️ Moderador"}
          </span>
        )}
        <p className="text-sm text-muted-foreground mt-3 font-serif italic">{user.bio}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{user.xp}</p>
          <p className="text-xs text-muted-foreground">XP Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{levelInfo.level}</p>
          <p className="text-xs text-muted-foreground">Nível</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{user.badges.length}</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Progresso</h3>
        <XPBar xp={user.xp} />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {levelInfo.name} → Faltam {levelInfo.next - user.xp} XP para o próximo nível
        </p>
      </div>

      {/* House */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <HouseCrest house={user.house} size="md" />
          <div>
            <h3 className="font-heading text-foreground">{house.name}</h3>
            <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
            <p className="text-xs text-primary font-heading mt-1">{house.points} pontos da casa</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Conquistas</h3>
        <div className="flex flex-wrap gap-2">
          {user.badges.map((b) => (
            <div key={b} className="glass px-3 py-2 rounded-lg text-center">
              <div className="text-xl">✨</div>
              <p className="text-xs text-foreground capitalize">{b.replace(/-/g, " ")}</p>
            </div>
          ))}
          {user.badges.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma conquista ainda. Complete desafios para desbloquear!</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Informações</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idade</span>
            <span className="text-foreground">{user.age} anos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span className="text-foreground">{new Date(user.joinedAt).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground">{user.approved ? "✅ Aprovado" : "⏳ Pendente"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
