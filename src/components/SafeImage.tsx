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
        className={`flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary font-heading text-primary select-none ${className}`}
        title={alt}
      >
        {fallbackText ? (
          <span className="text-lg font-bold">{fallbackText[0]?.toUpperCase()}</span>
        ) : (
          <span>{fallbackEmoji}</span>
        )}
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
