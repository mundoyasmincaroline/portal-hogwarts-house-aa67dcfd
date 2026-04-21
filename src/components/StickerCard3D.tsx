import React, { useState, useRef } from "react";
import { type House } from "@/lib/store";

interface StickerCard3DProps {
  id: string;
  name: string;
  imageUrl: string;
  rarity: "common" | "rare" | "legendary";
  isOwned: boolean;
  house?: House;
}

const StickerCard3D: React.FC<StickerCard3DProps> = ({ name, imageUrl, rarity, isOwned, house }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isOwned) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setRotate({ x: rotateX, y: rotateY });
    setGlare({ 
      x: (x / rect.width) * 100, 
      y: (y / rect.height) * 100,
      opacity: 0.6
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  const rarityColors = {
    common: "border-slate-500/30 bg-slate-900/40",
    rare: "border-blue-500/50 bg-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
    legendary: "border-yellow-500/60 bg-amber-900/40 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 w-full aspect-[3/4] cursor-pointer group"
    >
      <div 
        style={{ 
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: rotate.x === 0 ? "all 0.5s ease" : "none"
        }}
        className={`relative w-full h-full rounded-[1.5rem] border-2 ${rarityColors[rarity]} overflow-hidden transition-all duration-300 transform-gpu preserve-3d shadow-2xl ${!isOwned ? 'grayscale opacity-40' : ''}`}
      >
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/parchment.png')] opacity-20 pointer-events-none" />
        
        {/* Holographic Glare */}
        {isOwned && rarity === "legendary" && (
          <div 
            style={{ 
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 80%)`,
              mixBlendMode: "overlay"
            }}
            className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-300"
          />
        )}

        {/* Rainbow Sheen (for legendary) */}
        {isOwned && rarity === "legendary" && (
          <div className="absolute inset-0 z-10 opacity-20 mix-blend-color-dodge pointer-events-none animate-pulse"
               style={{ background: "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)" }} />
        )}

        {/* Sticker Image */}
        <div className="absolute inset-2 rounded-xl overflow-hidden bg-black/60 border border-white/5">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          
          {/* Overlay Info */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black to-transparent">
            <p className="text-[8px] font-heading text-white/40 uppercase tracking-widest">{rarity}</p>
            <p className="text-[10px] font-heading text-white truncate">{name.toUpperCase()}</p>
          </div>
        </div>

        {/* Shine highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default StickerCard3D;
