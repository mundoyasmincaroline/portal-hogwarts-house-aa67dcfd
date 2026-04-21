import React from 'react';

export function getMedalForXP(xp: number) {
  if (xp >= 2000) return { type: 'gold', name: 'Lendário', icon: '/medalha_ouro.png', color: 'from-yellow-600/40 via-yellow-500/20 to-black', glow: 'shadow-[0_0_15px_rgba(255,215,0,0.4)]', filter: '' };
  if (xp >= 1000) return { type: 'silver', name: 'Elite', icon: '/medalha_ouro.png', color: 'from-gray-600/40 via-gray-500/20 to-black', glow: 'shadow-[0_0_10px_rgba(192,192,192,0.3)]', filter: 'grayscale brightness-125' };
  if (xp >= 500) return { type: 'bronze', name: 'Mestre', icon: '/medalha_ouro.png', color: 'from-amber-800/40 via-amber-700/20 to-black', glow: 'shadow-[0_0_10px_rgba(205,127,50,0.3)]', filter: 'sepia brightness-75 contrast-125' };
  return null;
}

export default function MedalBadge({ xp, showName = false }: { xp: number, showName?: boolean }) {
  const medal = getMedalForXP(xp);
  if (!medal) return null;

  return (
    <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-br ${medal.color} text-white ${medal.glow} animate-pulse-glow text-[10px] font-heading border border-white/20`} title={medal.name}>
      <img src={medal.icon} alt={medal.name} className={`w-4 h-4 object-contain ${medal.filter}`} />
      {showName && <span className="drop-shadow-md">{medal.name}</span>}
    </div>
  );
}
