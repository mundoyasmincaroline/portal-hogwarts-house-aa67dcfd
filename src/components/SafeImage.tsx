import { useState } from "react";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackEmoji?: string;
}

/**
 * SafeImage — exibe imagem com fallback mágico se quebrar ou não existir.
 * Também adiciona cache-busting automático para evitar imagens desatualizadas do Supabase.
 */
export default function SafeImage({ src, alt, className = "", fallbackText, fallbackEmoji = "🧙" }: SafeImageProps) {
  const [broken, setBroken] = useState(false);

  // Cache-bust: se vier de Supabase storage, adiciona ?v= timestamp truncado ao minuto
  const bustedSrc = src
    ? src.includes("supabase") && !src.includes("?")
      ? `${src}?v=${Math.floor(Date.now() / 60000)}`
      : src
    : null;

  if (!bustedSrc || broken) {
    // Fallback visual
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
    />
  );
}
