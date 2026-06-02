import { useEffect, useRef } from "react";
import { getSeasonalEvent } from "@/constants/seasonal";

export default function MagicalParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const season = getSeasonalEvent();
    const theme = season?.particleTheme || "magic";

    let animationId: number;
    const particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isMobile = window.innerWidth < 768;
    const isUltraMobile = window.innerWidth < 400;
    const count = isUltraMobile
      ? (theme === "snow" ? 10 : theme === "leaves" ? 4 : 6)
      : isMobile
        ? (theme === "snow" ? 20 : theme === "leaves" ? 8 : 10)
        : (theme === "snow" ? 60 : theme === "leaves" ? 20 : 28);
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: theme === "snow" ? Math.random() * 2 + 1 : Math.random() * 2 + 0.5,
        speedY: theme === "snow" ? (Math.random() * 1 + 0.5) : theme === "leaves" ? (Math.random() * 0.8 + 0.4) : -(Math.random() * 0.3 + 0.1),
        speedX: theme === "leaves" ? (Math.random() * 1 - 0.5) : 0,
        opacity: Math.random() * 0.5 + 0.2,
        flicker: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
      });
    }


    let paused = document.hidden;
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) {
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const animate = () => {
      if (paused) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        
        if (theme === "leaves") {
          p.x += Math.sin(p.angle) * 0.5;
          p.angle += 0.02;
        }

        let opacity = p.opacity;
        if (theme === "magic" || theme === "sparks") {
          p.flicker += 0.02;
          opacity = p.opacity * (0.5 + Math.sin(p.flicker) * 0.5);
        }

        // Reset positions
        if ((theme === "snow" || theme === "leaves") && p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        } else if ((theme === "magic" || theme === "hearts" || theme === "sparks") && p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        
        if (theme === "hearts") {
          // Simple heart shape
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(p.size * 0.5, p.size * 0.5);
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(0, -3, -5, -3, -5, 0);
          ctx.bezierCurveTo(-5, 3, 0, 5, 0, 8);
          ctx.bezierCurveTo(0, 5, 5, 3, 5, 0);
          ctx.bezierCurveTo(5, -3, 0, -3, 0, 0);
          ctx.fillStyle = `hsla(340, 80%, 60%, ${opacity})`;
          ctx.fill();
          ctx.restore();
        } else {
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          
          if (theme === "snow") {
            ctx.fillStyle = `hsla(0, 0%, 100%, ${opacity})`;
          } else if (theme === "leaves") {
            ctx.fillStyle = `hsla(30, 80%, 40%, ${opacity})`;
          } else {
            ctx.fillStyle = `hsla(43, 65%, 54%, ${opacity})`;
          }
          ctx.fill();
        }

        // Glow for magic/sparks
        if (theme === "magic" || theme === "sparks") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(43, 65%, 54%, ${opacity * 0.15})`;
          ctx.fill();
        }
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}
