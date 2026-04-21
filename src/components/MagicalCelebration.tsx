import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function MagicalCelebration() {
  const { profile } = useAuth();
  const [show, setShow] = useState(false);
  const [lastXp, setLastXp] = useState(profile?.xp || 0);
  const [lastGaleons, setLastGaleons] = useState(profile?.galeons || 0);

  useEffect(() => {
    if (!profile) return;

    const hasGainedXp = profile.xp > lastXp;
    const hasGainedGaleons = profile.galeons > lastGaleons;

    if (hasGainedXp || hasGainedGaleons) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000);
      setLastXp(profile.xp);
      setLastGaleons(profile.galeons);
      return () => clearTimeout(timer);
    }
  }, [profile?.xp, profile?.galeons]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {/* Magic Sparks */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-sparkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.8)',
          }}
        />
      ))}
      
      {/* Golden Aura Flash */}
      <div className="absolute inset-0 bg-yellow-500/5 animate-pulse-glow pointer-events-none" />
      
      {/* Floating Icons */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center animate-fade-in-up">
           <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]">✨</span>
           <p className="font-heading text-2xl text-gold-gradient mt-4">Poder Mágico Aumentado!</p>
        </div>
      </div>
    </div>
  );
}
