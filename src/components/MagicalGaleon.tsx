import React, { memo } from "react";

interface MagicalGaleonProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const MagicalGaleon = memo(function MagicalGaleon({ size = "md", className = "" }: MagicalGaleonProps) {
  const sizeMap = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <img
        src="/monster_quality_galeon.png"
        alt="Galeon"
        className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.6)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </div>
  );
});

export default MagicalGaleon;
