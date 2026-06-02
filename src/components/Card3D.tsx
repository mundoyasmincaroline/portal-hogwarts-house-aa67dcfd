import { useRef, useState, ReactNode, CSSProperties } from "react";

interface Card3DProps {
  children: ReactNode;
  className?: string;
  /** Intensidade máxima do tilt em graus. Padrão 8°. */
  intensity?: number;
  /** Brilho/glare ao passar o mouse. */
  glare?: boolean;
  /** Eleva o card e adiciona sombra de profundidade ao passar o mouse. */
  lift?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * Card3D — efeito de perspectiva 3D leve e GPU-accelerated.
 * Não usa WebGL; apenas transforms CSS, ~0 impacto na navegação.
 * Respeita prefers-reduced-motion automaticamente via CSS.
 */
export default function Card3D({
  children,
  className = "",
  intensity = 8,
  glare = true,
  lift = true,
  style,
  onClick,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, o: 0 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * intensity;
    const ry = (x - 0.5) * intensity;
    setTransform(
      `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) ${
        lift ? "translateZ(14px)" : ""
      }`
    );
    if (glare) setGlarePos({ x: x * 100, y: y * 100, o: 0.18 });
  };

  const handleLeave = () => {
    setTransform("");
    setGlarePos((p) => ({ ...p, o: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={`relative will-change-transform transition-transform duration-200 ease-out motion-reduce:transform-none ${className}`}
      style={{
        transform,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200 motion-reduce:hidden"
          style={{
            opacity: glarePos.o,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}