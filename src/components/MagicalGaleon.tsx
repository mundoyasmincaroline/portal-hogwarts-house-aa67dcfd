import React from "react";

interface MagicalGaleonProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export default function MagicalGaleon({ size = "md", className = "" }: MagicalGaleonProps) {
  const sizeMap = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <img
        src="https://portal-hogwarts.lovable.app/monster_quality_galeon_coin_3d_1776816757264.png"
        alt="Galeon"
        className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-float-subtle group-hover:drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all"
      />
      <div className="absolute inset-0 bg-yellow-400/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
