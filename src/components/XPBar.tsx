import { getLevelFromXP, type House } from "@/lib/store";

export default function XPBar({ xp, showLabel = true, house }: { xp: number; showLabel?: boolean; house?: House | string }) {
  const info = getLevelFromXP(xp);
  
  const getHouseGradient = () => {
    switch (house) {
      case 'gryffindor': return 'from-red-600 via-red-500 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
      case 'slytherin': return 'from-green-700 via-green-600 to-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
      case 'ravenclaw': return 'from-blue-700 via-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      case 'hufflepuff': return 'from-yellow-600 via-yellow-500 to-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
      default: return 'from-primary via-primary/80 to-primary/60 shadow-[0_0_15px_hsl(var(--primary)/0.4)]';
    }
  };

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading opacity-70">Nível Atual</span>
            <span className={`text-sm font-heading ${house ? '' : 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'}`} style={house ? { color: `var(--${house}-gold || var(--${house}))`, filter: 'drop-shadow(0 0 8px currentColor)' } : {}}>{info.name}</span>
          </div>
          <span className="text-[10px] font-mono text-white/40">{xp} <span className="text-white/10">/</span> {info.next} XP</span>
        </div>
      )}
      <div className="h-3 bg-black/40 rounded-full border border-white/5 p-[2px] relative overflow-hidden shadow-inner">
        {/* Magic Liquid Fill */}
        <div
          className={`h-full bg-gradient-to-r ${getHouseGradient()} rounded-full transition-all duration-1000 ease-out relative`}
          style={{ width: `${info.progress}%` }}
        >
          {/* Shimmer & Glass Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-40" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40" />
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
