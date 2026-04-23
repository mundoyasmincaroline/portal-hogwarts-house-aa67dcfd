import { type UserProfile, HOUSES } from "@/lib/store";
import HouseCrest from "./HouseCrest";
import XPBar from "./XPBar";
import { isUserOnline } from "@/lib/auth";

export default function UserCard({ user, compact = false }: { user: UserProfile; compact?: boolean }) {
  const house = HOUSES[user.house];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-[1.2rem] hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-white/10">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-heading text-primary">
            {user.fullName[0]}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isUserOnline(user) ? "bg-green-500" : "bg-muted-foreground"}`} title={isUserOnline(user) ? "Online" : "Offline"} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.fullName}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
        <HouseCrest house={user.house} size="sm" />
      </div>
    );
  }

  return (
    <div className="glass rounded-[3rem] p-8 animate-fade-in-up border-2 border-white/10 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center text-2xl font-heading text-primary">
            {user.fullName[0]}
          </div>
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-card ${isUserOnline(user) ? "bg-green-500" : "bg-muted-foreground"}`} title={isUserOnline(user) ? "Online" : "Offline"} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-foreground">{user.fullName}</h3>
            {user.role === "admin" && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-heading">Admin</span>}
            {user.role === "moderator" && <span className="text-xs bg-ravenclaw/20 text-ravenclaw px-2 py-0.5 rounded-full font-heading">Mod</span>}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username} • {house.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{user.bio}</p>
        </div>
        <HouseCrest house={user.house} />
      </div>
      <div className="mt-3">
        <XPBar xp={user.xp} />
      </div>
      {user.badges.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {user.badges.map((b) => (
            <span key={b} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
              ✨ {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
