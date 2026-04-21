import { useEffect, useRef } from "react";
import { getSeasonalEvent } from "@/lib/seasonal";
import { type House } from "@/lib/store";

interface Props {
  house?: House | string;
}

export default function MagicalParticles({ house }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const season = getSeasonalEvent();
    const seasonTheme = season?.particleTheme || "magic";
    
    // House Override
    let theme = seasonTheme;
    if (house) theme = `house-${house}`;

    let animationId: number;
    const particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Config based on theme
    let count = 50;
    if (theme === "snow") count = 100;
    else if (theme === "leaves") count = 30;
    else if (theme?.startsWith("house-")) count = 60;
    
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedY: theme === "snow" ? (Math.random() * 1 + 0.5) : theme === "leaves" ? (Math.random() * 0.8 + 0.4) : -(Math.random() * 0.4 + 0.2),
        speedX: theme === "leaves" ? (Math.random() * 1 - 0.5) : (Math.random() * 0.4 - 0.2),
        opacity: Math.random() * 0.5 + 0.2,
        flicker: Math.random() * Math.PI * 2,
        angle: Math.random() * Math.PI * 2,
        life: Math.random() * 100,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.life += 0.05;
        
        if (theme === "leaves") {
          p.x += Math.sin(p.angle) * 0.5;
          p.angle += 0.02;
        }

        let opacity = p.opacity;
        p.flicker += 0.03;
        opacity = p.opacity * (0.5 + Math.sin(p.flicker) * 0.5);

        // Reset positions
        if ((theme === "snow" || theme === "leaves") && p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        } else if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        
        let color = `hsla(43, 65%, 54%, ${opacity})`; // Default gold
        let glowColor = `hsla(43, 65%, 54%, ${opacity * 0.2})`;

        if (theme === "snow") {
          color = `hsla(0, 0%, 100%, ${opacity})`;
        } else if (theme === "leaves") {
          color = `hsla(30, 80%, 40%, ${opacity})`;
        } else if (theme === "house-gryffindor") {
          color = `hsla(0, 80%, 60%, ${opacity})`; // Red sparks
          glowColor = `hsla(43, 80%, 50%, ${opacity * 0.3})`; // Gold glow
        } else if (theme === "house-slytherin") {
          color = `hsla(145, 80%, 40%, ${opacity})`; // Green bubbles
          glowColor = `hsla(200, 10%, 70%, ${opacity * 0.3})`; // Silver glow
        } else if (theme === "house-ravenclaw") {
          color = `hsla(215, 80%, 60%, ${opacity})`; // Blue stars
          glowColor = `hsla(0, 0%, 100%, ${opacity * 0.4})`; // White glow
        } else if (theme === "house-hufflepuff") {
          color = `hsla(48, 80%, 55%, ${opacity})`; // Yellow dust
          glowColor = `hsla(30, 60%, 40%, ${opacity * 0.3})`; // Earth glow
        }

        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [house]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-10" />;
}
