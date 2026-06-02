import { getLevelFromXP } from "@/types";
import { useEffect, useRef, useState } from "react";

export default function XPBar({ xp, showLabel = true }: { xp: number; showLabel?: boolean }) {
  const info = getLevelFromXP(xp);
  const prevXp = useRef(xp);
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (xp > prevXp.current) {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 1500);
      prevXp.current = xp;
      return () => clearTimeout(t);
    }
    prevXp.current = xp;
  }, [xp]);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="font-heading text-primary">{info.name}</span>
          <span>{xp} / {info.next} XP</span>
        </div>
      )}
      <div className={`h-2.5 bg-secondary rounded-full overflow-hidden border border-white/5 shadow-inner transition-shadow duration-500 ${glow ? "shadow-[0_0_22px_rgba(212,175,55,0.8)]" : ""}`}>
        <div
          className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/80 rounded-full transition-all duration-1000 relative"
          style={{ width: `${info.progress}%` }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
