import { useEffect } from "react";

export default function GrandOpeningFireworks() {
  useEffect(() => {
    // Only run if it's the grand opening day (or just whenever this is mounted)
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);

    let intervalId: NodeJS.Timeout;

    script.onload = () => {
      const wConfetti = (window as any).confetti;
      if (!wConfetti) return;

      const duration = 15 * 1000; // 15 segundos de fogos intensos no carregamento inicial
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, colors: ['#FFD700', '#ff0000', '#00ff00', '#0000ff', '#ffffff'] };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      // 1. Fogos intensos ao carregar a página
      const burstInterval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(burstInterval);
          return;
        }
        const particleCount = 50 * (timeLeft / duration);
        wConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        wConfetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // 2. Fogos esporádicos durante o dia (A cada 30 segundos, solta um fogo bonito)
      intervalId = setInterval(() => {
        wConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6, x: randomInRange(0.2, 0.8) },
          colors: ['#FFD700', '#FF4500', '#8A2BE2', '#00FA9A']
        });
      }, 30000);
    };

    return () => {
      document.body.removeChild(script);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}
