import { useAuth } from "@/lib/auth";
import { HOUSES, getLevelFromXP } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";

export default function Profile() {
  const { profile } = useAuth();
  if (!profile) return null;
  const house = HOUSES[profile.house];
  const levelInfo = getLevelFromXP(profile.xp);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center text-4xl font-heading text-primary animate-pulse-glow">
            {profile.full_name[0]}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <HouseCrest house={profile.house} size="sm" />
          </div>
        </div>
        <h1 className="font-heading text-2xl text-foreground">{profile.full_name}</h1>
        <p className="text-muted-foreground text-sm">@{profile.username}</p>
        <p className="text-sm text-muted-foreground mt-3 font-serif italic">{profile.bio}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-primary">{profile.xp}</p>
          <p className="text-xs text-muted-foreground">XP Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">{levelInfo.level}</p>
          <p className="text-xs text-muted-foreground">Nível</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-heading text-foreground">0</p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Progresso</h3>
        <XPBar xp={profile.xp} />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {levelInfo.name} → Faltam {levelInfo.next - profile.xp} XP para o próximo nível
        </p>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-3">
          <HouseCrest house={profile.house} size="md" />
          <div>
            <h3 className="font-heading text-foreground">{house.name}</h3>
            <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h3 className="font-heading text-sm text-primary mb-3">Informações</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idade</span>
            <span className="text-foreground">{profile.age} anos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membro desde</span>
            <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground">{profile.approved ? "✅ Aprovado" : "⏳ Pendente"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
