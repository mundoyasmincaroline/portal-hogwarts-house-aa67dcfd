import { LucideIcon } from "lucide-react";

interface MagicalEmojiProps {
  emoji?: string;
  icon?: LucideIcon;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  glowColor?: string;
}

export default function MagicalEmoji({ 
  emoji, 
  icon: Icon,
  size = "md", 
  className = "", 
  glowColor = "rgba(234, 179, 8, 0.3)" 
}: MagicalEmojiProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-3xl",
    lg: "w-20 h-20 text-5xl",
    xl: "w-28 h-28 text-7xl",
    "2xl": "w-40 h-40 text-8xl",
  };

  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl md:rounded-3xl bg-gradient-to-br from-black/90 via-zinc-900/40 to-amber-900/10 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl group transition-all duration-500 hover:scale-110 hover:-rotate-2 ${sizeClasses[size]} ${className}`}
      style={{ boxSizing: "border-box" }}
    >
      {/* Texture & Reflection */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 rounded-inherit pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none" />
      
      {/* Impactful Border Glow */}
      <div className="absolute inset-0 rounded-inherit border border-white/5 group-hover:border-white/20 transition-colors" />
      
      {/* The Emoji or Icon with "Monster" effects */}
      <div className="relative z-10 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] group-hover:drop-shadow-[0_0_20px_white] transition-all duration-500 animate-float-subtle flex items-center justify-center pointer-events-none">
        {Icon ? <Icon size={size === "xs" ? 14 : size === "sm" ? 22 : size === "md" ? 34 : size === "lg" ? 52 : 72} className="text-white" /> : (
          <span className="text-white drop-shadow-md select-none">{emoji}</span>
        )}
      </div>

      {/* Plate Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
      
      {/* Background Glow */}
      <div 
        className="absolute inset-0 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full"
        style={{ backgroundColor: glowColor }}
      />
    </div>
  );
}
