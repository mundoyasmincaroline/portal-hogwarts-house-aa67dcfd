import React from 'react';
import MagicalEmoji from "@/components/shared/MagicalEmoji";

export function getMedalForXP(xp: number) {
  if (xp >= 2000) return { type: 'gold', name: 'Lendário', emoji: '🥇', glow: 'rgba(234, 179, 8, 0.4)' };
  if (xp >= 1000) return { type: 'silver', name: 'Elite', emoji: '🥈', glow: 'rgba(148, 163, 184, 0.3)' };
  if (xp >= 500) return { type: 'bronze', name: 'Mestre', emoji: '🥉', glow: 'rgba(180, 83, 9, 0.3)' };
  return null;
}

export default function MedalBadge({ xp, showName = false }: { xp: number, showName?: boolean }) {
  const medal = getMedalForXP(xp);
  if (!medal) return null;

  return (
    <div className="inline-flex items-center gap-2 group transition-all duration-300 hover:scale-105" title={medal.name}>
      <MagicalEmoji 
        emoji={medal.emoji} 
        size="xs" 
        glowColor={medal.glow} 
        className="shadow-xl" 
      />
      {showName && (
        <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-white/80 drop-shadow-md">
          {medal.name}
        </span>
      )}
    </div>
  );
}
