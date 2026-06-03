import React, { memo } from "react";
import HouseCrest from "@/components/rpg/HouseCrest";
import { Badge } from "@/components/ui/badge";
import { isUserOnline } from "@/lib/auth";

import EmojiIcon from "@/components/shared/EmojiIcon";
export interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  age: number;
  house: any;
  level: number;
  xp: number;
  approved: boolean;
  online: boolean;
  last_seen?: string;
  vip_plan?: "founder" | "premium" | "vip";
}

interface AdminMemberCardProps {
  member: MemberProfile;
  onClick: (id: string, name: string) => void;
}

export const AdminMemberCard = memo(({ member, onClick }: AdminMemberCardProps) => (
  <div
    className="glass rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 border border-transparent transition-colors"
    onClick={() => onClick(member.user_id, member.full_name)}
  >
    <div className="relative">
      <HouseCrest house={member.house} size="sm" />
      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card ${isUserOnline(member) ? "bg-green-500" : "bg-muted-foreground"}`} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-heading text-foreground">{member.full_name}</p>
      <p className="text-xs text-muted-foreground">@{member.username} • {member.age} anos • Nível {member.level} • {member.xp} XP</p>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      {isUserOnline(member) ? (
        <span className="text-xs text-green-500 font-medium"><EmojiIcon e="🟢" /> Online</span>
      ) : (
        <span className="text-xs text-muted-foreground"><EmojiIcon e="⚫" /> Offline</span>
      )}
    </div>
  </div>
));

AdminMemberCard.displayName = "AdminMemberCard";
