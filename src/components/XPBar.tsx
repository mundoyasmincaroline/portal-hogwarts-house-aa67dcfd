import { getLevelFromXP } from "@/lib/store";

export default function XPBar({ xp, showLabel = true }: { xp: number; showLabel?: boolean }) {
  const info = getLevelFromXP(xp);
  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading opacity-70">Nível Atual</span>
            <span className="text-sm font-heading text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">{info.name}</span>
          </div>
          <span className="text-[10px] font-mono text-primary/60">{xp} <span className="text-white/20">/</span> {info.next} XP</span>
        </div>
      )}
      <div className="h-3 bg-black/40 rounded-full border border-white/5 p-[2px] relative overflow-hidden shadow-inner">
        {/* Magic Liquid Fill */}
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
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
