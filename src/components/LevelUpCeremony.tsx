import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useImmersion } from "@/hooks/core/useImmersion";
import { HOUSES } from "@/types/house";
import { cn } from "@/lib/core-utils";

/**
 * Cerimônia full-screen disparada quando profile.level aumenta.
 * Substitui a celebração genérica para o marco de Level Up.
 */
export default function LevelUpCeremony() {
  const { profile } = useAuth();
  const { cast } = useImmersion();
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const lastLevel = useRef<number | null>(null);

  useEffect(() => {
    if (!profile?.level) return;
    if (lastLevel.current === null) {
      lastLevel.current = profile.level;
      return;
    }
    if (profile.level > lastLevel.current) {
      lastLevel.current = profile.level;
      setNewLevel(profile.level);
      cast("levelUp");
      const t = setTimeout(() => setNewLevel(null), 5200);
      return () => clearTimeout(t);
    }
    lastLevel.current = profile.level;
  }, [profile?.level, cast]);

  if (newLevel === null) return null;

  const house = profile?.house ? HOUSES[profile.house] : null;
  const primary = house?.colors.primary ?? "hsl(43,80%,55%)";

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Aura radial */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{
          background: `radial-gradient(circle at center, ${primary}33 0%, transparent 65%)`,
        }}
      />
      {/* Faíscas */}
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: primary,
            boxShadow: `0 0 12px ${primary}`,
            animationDelay: `${Math.random() * 1.5}s`,
          }}
        />
      ))}
      {/* Anéis pulsantes */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full border-2 animate-ping"
        style={{ borderColor: primary, opacity: 0.4 }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full border animate-ping"
        style={{ borderColor: primary, opacity: 0.3, animationDelay: "0.4s" }}
      />
      {/* Conteúdo */}
      <div className="relative z-10 text-center animate-scale-in">
        <p className="font-heading text-lg tracking-[0.4em] text-foreground/70 uppercase mb-2">
          Sua magia evoluiu
        </p>
        <div
          className={cn(
            "font-heading text-[10rem] leading-none text-gold-gradient drop-shadow-[0_0_40px_rgba(212,175,55,0.6)]"
          )}
        >
          {newLevel}
        </div>
        <p className="font-heading text-3xl text-gold-gradient mt-2">
          Nível {newLevel} alcançado
        </p>
        {house && (
          <p className="text-sm text-foreground/70 mt-3 italic">
            "{house.motto}" — {house.name}
          </p>
        )}
      </div>
    </div>
  );
}