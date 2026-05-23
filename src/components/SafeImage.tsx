import React, { useState, memo } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackEmoji?: string;
}

/**
 * SafeImage — exibe imagem com fallback mágico se quebrar ou não existir.
 * Adiciona cache-busting inteligente (10 min) para imagens do Supabase.
 */
const SafeImage = memo(function SafeImage({ 
  src, 
  alt, 
  className = "", 
  fallbackText, 
  fallbackEmoji = "🧙" 
}: SafeImageProps) {
  const [broken, setBroken] = useState(false);

  // Cache-bust: 10 minutos para garantir atualização sem comprometer excessivamente o cache do browser
  const bustedSrc = src
    ? src.includes("supabase") && !src.includes("?")
      ? `${src}?v=${Math.floor(Date.now() / 600000)}`
      : src
    : null;

  if (!bustedSrc || broken) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary font-heading text-primary select-none ${className}`}
        title={alt}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,hsl(var(--primary)/0.28),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-primary/10" />
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 drop-shadow-[0_6px_18px_hsl(var(--background)/0.8)]">
          <span className="text-[1.65em] leading-none">{fallbackEmoji}</span>
          {fallbackText && (
            <span className="font-heading text-[0.7em] font-bold uppercase tracking-widest text-primary/80 leading-none">
              {fallbackText[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={bustedSrc}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
      loading="lazy"
      decoding="async"
    />
  );
});

export default SafeImage;
