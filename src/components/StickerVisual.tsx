import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";

interface StickerVisualProps {
  name: string;
  rarity: "bronze" | "silver" | "gold";
  unlocked?: boolean;
  imageUrl?: string | null;
  failedImage?: boolean;
}

const StickerVisual = ({ name, rarity, unlocked = false, imageUrl, failedImage }: StickerVisualProps) => {
  const getRarityStyles = () => {
    switch (rarity) {
      case "gold":
        return {
          border: "border-yellow-400/50",
          glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
          bg: "bg-gradient-to-br from-yellow-900/40 via-yellow-600/20 to-black",
          text: "text-yellow-400"
        };
      case "silver":
        return {
          border: "border-slate-300/40",
          glow: "shadow-[0_0_15px_rgba(203,213,225,0.2)]",
          bg: "bg-gradient-to-br from-slate-800/40 via-slate-500/10 to-black",
          text: "text-slate-200"
        };
      default:
        return {
          border: "border-amber-800/40",
          glow: "shadow-[0_0_10px_rgba(146,64,14,0.15)]",
          bg: "bg-gradient-to-br from-amber-950/40 via-amber-800/10 to-black",
          text: "text-amber-600"
        };
    }
  };

  const styles = getRarityStyles();

  return (
    <motion.div 
      whileHover={unlocked ? { scale: 1.05, rotate: 1 } : {}}
      className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 ${styles.border} ${styles.glow} ${styles.bg} group transition-all duration-500`}
    >
      {!unlocked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Lock className="w-8 h-8 text-white/20 mb-2" />
          <p className="text-[10px] font-heading uppercase tracking-widest text-white/30 px-2 text-center">{name}</p>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          {imageUrl && !failedImage ? (
            <motion.img 
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={imageUrl} 
              alt={name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className={`w-10 h-10 ${styles.text} opacity-30`} />
            </div>
          )}
          <div className="absolute bottom-2 inset-x-0 text-center z-20 px-2">
            <p className="font-heading text-xs text-white truncate drop-shadow-lg">{name}</p>
          </div>
          {rarity === "gold" && (
             <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
                <motion.div 
                  animate={{ 
                    x: ["-100%", "200%"],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 3,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
             </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default StickerVisual;