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
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className} group/galeon`}>
      <img
        src="/monster_quality_galeon.png"
        alt="Galeon"
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.7)] group-hover/galeon:scale-110 group-hover/galeon:rotate-[15deg] transition-all duration-500 animate-float"
      />
      <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover/galeon:opacity-100 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 group-hover/galeon:opacity-100 -translate-x-full group-hover/galeon:translate-x-full transition-all duration-1000 skew-x-[25deg]" />
    </div>
  );
});

export default MagicalGaleon;
