import { type UserProfile, HOUSES } from "@/types";
import HouseCrest from "@/components/rpg/HouseCrest";
import XPBar from "@/components/rpg/XPBar";
import { isUserOnline } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export default function UserCard({ user, compact = false }: { user: UserProfile; compact?: boolean }) {
  const house = HOUSES[user.house];

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
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
    <div className="glass rounded-[2rem] p-6 animate-fade-in-up group hover:border-primary/40 transition-all border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -z-10 group-hover:bg-primary/10 transition-all" />
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary to-black border border-white/10 flex items-center justify-center text-3xl font-heading text-primary shadow-xl group-hover:scale-105 transition-transform overflow-hidden relative">
            {user.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : user.fullName[0]}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card ${isUserOnline(user) ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-muted-foreground"}`} title={isUserOnline(user) ? "Online" : "Offline"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-heading text-lg text-foreground group-hover:text-primary transition-colors truncate">{user.fullName}</h3>
            {user.role === "admin" && <Badge className="h-4 text-[8px] bg-primary/20 text-primary border-primary/30 uppercase tracking-widest">Admin</Badge>}
          </div>
          <p className="text-xs text-muted-foreground/80 font-medium">@{user.username} • <span className="text-primary/70">{house.name}</span></p>
          {user.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic font-serif leading-relaxed opacity-70">"{user.bio}"</p>}
        </div>
        <div className="shrink-0 group-hover:rotate-12 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <HouseCrest house={user.house} size="md" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <XPBar xp={user.xp} />
        {user.badges.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {user.badges.map((b) => (
              <span key={b} className="text-[9px] font-heading uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-primary/80 group-hover:border-primary/30 transition-all">
                ✨ {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
