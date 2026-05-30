import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Conquistas automáticas do Portal Hogwarts.
 * Detecta marcos de XP/nível e exibe toast mágico.
 * Cada conquista é concedida uma única vez (localStorage).
 */

interface Badge {
  key: string;
  title: string;
  emoji: string;
  description: string;
  xpBonus: number;
  check: (xp: number, level: number) => boolean;
}

const BADGES: Badge[] = [
  { key: "first_steps", emoji: "🪄", title: "Primeiros Passos",   description: "Chegou ao Portal pela primeira vez!",         xpBonus: 0,   check: (xp) => xp >= 0 },
  { key: "xp_50",       emoji: "⭐", title: "Estudante Dedicado", description: "Alcançou 50 XP acumulados.",                  xpBonus: 10,  check: (xp) => xp >= 50 },
  { key: "xp_200",      emoji: "🌟", title: "Aprendiz de Bruxo",  description: "Alcançou 200 XP! A magia cresce em você.",    xpBonus: 25,  check: (xp) => xp >= 200 },
  { key: "xp_500",      emoji: "💫", title: "Bruxo Talentoso",    description: "500 XP! Dumbledore ficaria orgulhoso.",        xpBonus: 50,  check: (xp) => xp >= 500 },
  { key: "xp_1000",     emoji: "⚡", title: "Mago Veterano",      description: "1000 XP! A força da magia é inegável.",        xpBonus: 100, check: (xp) => xp >= 1000 },
  { key: "xp_2500",     emoji: "🏆", title: "Lenda de Hogwarts",  description: "2500 XP! Seu nome ecoará pelo castelo.",       xpBonus: 200, check: (xp) => xp >= 2500 },
  { key: "level_5",     emoji: "🎓", title: "Nível 5 Alcançado",  description: "Subiu ao nível 5! Avança de ano em Hogwarts.", xpBonus: 75,  check: (_xp, lvl) => lvl >= 5 },
  { key: "level_10",    emoji: "🧙", title: "Mestre das Artes",   description: "Nível 10! Um verdadeiro Mestre Bruxo.",        xpBonus: 150, check: (_xp, lvl) => lvl >= 10 },
];

export function useAchievements(userId: string | undefined, xp: number, level: number) {
  const grantedRef = useRef<Set<string>>(new Set());
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!userId || xp === undefined) return;

    const storageKey = `badges_${userId}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
    grantedRef.current = new Set(stored);

    const check = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;
      const newGrants: string[] = [];

      for (const badge of BADGES) {
        if (grantedRef.current.has(badge.key)) continue;
        if (!badge.check(xp, level)) continue;

        grantedRef.current.add(badge.key);
        newGrants.push(badge.key);

        // Toast sem JSX (arquivo .tsx agora suporta, mas usamos string para segurança)
        toast(
          <div className="flex items-center gap-3">
            <span className="text-3xl">{badge.emoji}</span>
            <div>
              <p className="font-heading text-sm font-bold text-primary">Conquista desbloqueada!</p>
              <p className="font-heading text-base text-foreground">{badge.title}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {badge.xpBonus > 0 && (
                <p className="text-xs text-primary font-bold">+{badge.xpBonus} XP de bônus!</p>
              )}
            </div>
          </div>,
          { duration: 6000 }
        );

        if (badge.xpBonus > 0) {
          await supabase.rpc("award_xp_action", {
            _action: `badge_${badge.key}`,
            _user_id: userId,
            _xp: badge.xpBonus,
          });
        }

        await new Promise(r => setTimeout(r, 800));
      }

      if (newGrants.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify([...grantedRef.current]));
      }
      isCheckingRef.current = false;
    };

    check();
  }, [userId, xp, level]);
}
