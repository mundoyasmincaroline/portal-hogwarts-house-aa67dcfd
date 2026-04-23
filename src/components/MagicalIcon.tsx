import React from "react";
import { LucideIcon } from "lucide-react";

interface MagicalIconProps {
  icon?: LucideIcon;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | number;
  className?: string;
  children?: React.ReactNode;
}

export default function MagicalIcon({ icon: Icon, color = "#d4af37", size = "md", className = "", children }: MagicalIconProps) {
  const sizeMap = {
    xs: "w-8 h-8",
    sm: "w-10 h-10",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const iconSizeMap = {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 32,
  };

  const containerClass = typeof size === "string" ? sizeMap[size] : "w-12 h-12";
  const actualIconSize = typeof size === "string" ? iconSizeMap[size] : size;

  return (
    <div className={`relative group/micon inline-flex ${className}`}>
      {/* Background Glow */}
      <div 
        className="absolute inset-0 rounded-2xl blur-xl opacity-20 group-hover/micon:opacity-50 transition-opacity duration-700"
        style={{ backgroundColor: color }}
      />
      
      {/* Glass Plaque - Monster Quality */}
      <div className={`relative ${containerClass} flex items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl group-hover/micon:scale-110 group-hover/micon:border-white/40 transition-all duration-500 overflow-hidden`}>
        
        {/* Cinematic Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/micon:translate-x-[100%] transition-transform duration-1000" />
        
        {/* Content */}
        {children ? (
          <div className="relative z-10 transition-transform group-hover/micon:rotate-6">
            {children}
          </div>
        ) : (Icon && typeof Icon === 'function') ? (
          <Icon 
            size={actualIconSize} 
            style={{ color: color }} 
            className="relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] group-hover/micon:rotate-12 transition-transform" 
          />
        ) : null}
        
        {/* Inner Glass Highlights */}
        <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
        <div className="absolute inset-[1px] rounded-[inherit] border border-white/5 pointer-events-none" />
      </div>
    </div>
  );
}
