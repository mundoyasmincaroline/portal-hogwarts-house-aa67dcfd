import { getLevelFromXP } from "@/lib/store";

export default function XPBar({ xp, showLabel = true }: { xp: number; showLabel?: boolean }) {
  const info = getLevelFromXP(xp);
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="font-heading text-primary">{info.name}</span>
          <span>{xp} / {info.next} XP</span>
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700"
          style={{ width: `${info.progress}%` }}
        />
      </div>
    </div>
  );
}
