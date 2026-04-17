import { MOCK_MEMBERS, HOUSES, getLevelFromXP } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";
import MedalBadge from "@/components/MedalBadge";

export default function Ranking() {
  const sorted = [...MOCK_MEMBERS].sort((a, b) => b.xp - a.xp);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass rounded-2xl p-6 text-center">
        <h1 className="font-heading text-2xl text-gold-gradient mb-2">Ranking Geral</h1>
        <p className="text-muted-foreground text-sm">Os bruxos mais poderosos do portal</p>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-3 gap-3">
        {sorted.slice(0, 3).map((u, i) => (
          <div key={u.id} className={`glass rounded-xl p-4 text-center ${i === 0 ? "ring-2 ring-primary animate-pulse-glow" : ""}`}>
            <div className="text-3xl mb-2">{["🥇", "🥈", "🥉"][i]}</div>
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary flex items-center justify-center text-xl font-heading text-primary mb-2">
              {u.fullName[0]}
            </div>
            <p className="font-heading text-sm text-foreground flex items-center justify-center gap-1">
              {u.fullName}
              <MedalBadge xp={u.xp} />
            </p>
            <p className="text-xs text-muted-foreground">@{u.username}</p>
            <HouseCrest house={u.house} size="sm" />
            <p className="font-heading text-primary text-sm mt-1">{u.xp} XP</p>
            <p className="text-xs text-muted-foreground">{getLevelFromXP(u.xp).name}</p>
          </div>
        ))}
      </div>

      {/* Full list */}
      <div className="glass rounded-xl overflow-hidden">
        {sorted.map((u, i) => (
          <div key={u.id} className={`flex items-center gap-3 p-4 ${i !== sorted.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-sm font-heading text-muted-foreground w-8 text-center">#{i + 1}</span>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary">
              {u.fullName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">{u.fullName}</p>
                <MedalBadge xp={u.xp} />
                <HouseCrest house={u.house} size="sm" />
              </div>
              <XPBar xp={u.xp} showLabel={false} />
            </div>
            <div className="text-right">
              <p className="font-heading text-sm text-primary">{u.xp} XP</p>
              <p className="text-xs text-muted-foreground">{getLevelFromXP(u.xp).name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
