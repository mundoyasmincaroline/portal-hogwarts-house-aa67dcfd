import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { useLocation } from "react-router-dom";

export function BirthdayGlobalCelebration() {
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only celebrate on the feed/dashboard main page
    if (location.pathname !== "/dashboard" || hasCelebrated) return;

    const checkBigDay = async () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const { data: chars } = await supabase.from('characters_birthdays').select('name').filter('birth_date', 'ilike', `%-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);

      if (chars && chars.length > 0) {
        // Magical fireworks
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          
          // Since particles fall down, start a bit higher than random
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#D4AF37', '#740001', '#1A472A', '#0E1A40', '#EEB939'] // House colors + Gold
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#D4AF37', '#740001', '#1A472A', '#0E1A40', '#EEB939']
          });
        }, 250);

        setHasCelebrated(true);
      }
    };

    checkBigDay();
  }, [location.pathname, hasCelebrated]);

  return null;
}
