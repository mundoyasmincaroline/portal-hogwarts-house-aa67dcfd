import React, { memo } from "react";
import XPBar from "@/components/rpg/XPBar";
import HouseCrest from "@/components/rpg/HouseCrest";
import { getLevelFromXP, HOUSES, type House } from "@/types";

export const ProfileAboutTab = memo(({ profile, userBadges, userItems }: { profile: any, userBadges: any[], userItems: any[] }) => {
  const house = HOUSES[profile.house as House] || HOUSES.gryffindor;
  const levelInfo = getLevelFromXP(profile.xp);

  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-heading text-primary">{profile.xp}</p>
          <p className="text-[8px] text-muted-foreground uppercase">XP Total</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-heading text-foreground">{levelInfo.level}</p>
          <p className="text-[8px] text-muted-foreground uppercase">Nível</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-blue-500/20 bg-blue-500/5">
          <p className="text-xl font-heading text-blue-400">{Math.floor(profile.xp / 10 + userItems.length * 50)}</p>
          <p className="text-[8px] text-blue-300/60 uppercase">Força Mágica</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xl font-heading text-foreground">{userBadges.length}</p>
          <p className="text-[8px] text-muted-foreground uppercase">Badges</p>
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
    </>
  );
});

ProfileAboutTab.displayName = "ProfileAboutTab";
