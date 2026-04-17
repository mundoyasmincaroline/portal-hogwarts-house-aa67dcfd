import React from 'react';

export function getMedalForXP(xp: number) {
  if (xp >= 2000) return { type: 'gold', name: 'Pomo de Ouro', icon: '✨🥇✨', color: 'from-yellow-300 via-yellow-500 to-yellow-600', glow: 'shadow-[0_0_15px_rgba(255,215,0,0.8)]' };
  if (xp >= 1000) return { type: 'silver', name: 'Prata', icon: '🥈', color: 'from-gray-300 via-gray-400 to-gray-500', glow: 'shadow-[0_0_10px_rgba(192,192,192,0.6)]' };
  if (xp >= 500) return { type: 'bronze', name: 'Bronze', icon: '🥉', color: 'from-amber-600 via-orange-700 to-amber-800', glow: 'shadow-[0_0_10px_rgba(205,127,50,0.6)]' };
  return null;
}

export default function MedalBadge({ xp, showName = false }: { xp: number, showName?: boolean }) {
  const medal = getMedalForXP(xp);
  if (!medal) return null;

  return (
    <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${medal.color} text-white ${medal.glow} animate-pulse-glow text-xs font-heading border border-white/30`} title={medal.name}>
      <span className="drop-shadow-md">{medal.icon}</span>
      {showName && <span className="drop-shadow-md">{medal.name}</span>}
    </div>
  );
}
