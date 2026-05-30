import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import StickerVisual from "./StickerVisual";
import { Button } from "./ui/button";
import { RARITY_COST } from "@/constants/gameConstants";
import { Sticker } from "@/types";

interface Props {
  stickers: Sticker[];
  userStickers: Record<string, boolean>;
  onBuy: (sticker: Sticker) => void;
  buyingId: string | null;
  profileLevel: number;
  profileXp: number;
}

const ITEMS_PER_PAGE = 6;

export default function StickerAlbumBook({ stickers, userStickers, onBuy, buyingId, profileLevel, profileXp }: Props) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalPages = Math.ceil(stickers.length / ITEMS_PER_PAGE);
  const currentItems = stickers.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const paginate = (newDirection: number) => {
    if (page + newDirection < 0 || page + newDirection >= totalPages) return;
    setDirection(newDirection);
    setPage(page + newDirection);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-10">
      {/* Book Container */}
      <div className="relative aspect-[4/5] sm:aspect-[16/10] bg-[#1a1a1a] rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-8 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden">
        {/* Book Spine */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 sm:w-2 bg-black/40 shadow-inner z-20 border-x border-white/5" />
        
        {/* Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none" />

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { duration: 0.4 }
            }}
            className="absolute inset-0 flex flex-col sm:grid sm:grid-cols-2 gap-0 overflow-y-auto sm:overflow-hidden scrollbar-none"
          >
            {/* Left Page */}
            <div className="p-3 sm:p-8 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-white/5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {currentItems.slice(0, 3).map((s) => (
                  <StickerSlot key={s.id} sticker={s} owned={!!userStickers[s.id]} onBuy={onBuy} buying={buyingId === s.id} profileLevel={profileLevel} profileXp={profileXp} />
                ))}
              </div>
            </div>

            {/* Right Page */}
            <div className="p-3 sm:p-8 flex flex-col items-center border-t sm:border-t-0 sm:border-l border-white/5 pb-20 sm:pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {currentItems.slice(3, 6).map((s) => (
                  <StickerSlot key={s.id} sticker={s} owned={!!userStickers[s.id]} onBuy={onBuy} buying={buyingId === s.id} profileLevel={profileLevel} profileXp={profileXp} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Page Indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-4 sm:gap-10 items-center z-30">
          <button 
            onClick={() => paginate(-1)} 
            disabled={page === 0}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 sm:bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed group backdrop-blur-md"
          >
            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-black/60 border border-white/10 font-heading text-[10px] sm:text-xs tracking-widest text-muted-foreground backdrop-blur-md">
            PÁGINA <span className="text-white">{page + 1}</span> DE {totalPages}
          </div>

          <button 
            onClick={() => paginate(1)} 
            disabled={page === totalPages - 1}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 sm:bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed group backdrop-blur-md"
          >
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Visual Hint */}
      <div className="mt-8 flex justify-center gap-4 text-muted-foreground/40 text-[10px] uppercase font-heading tracking-[0.3em]">
        <BookOpen size={14} />
        <span>Folheie as páginas do seu destino</span>
      </div>
    </div>
  );
}

function StickerSlot({ sticker, owned, onBuy, buying, profileLevel, profileXp }: { 
  sticker: Sticker; 
  owned: boolean; 
  onBuy: (s: Sticker) => void; 
  buying: boolean;
  profileLevel: number;
  profileXp: number;
}) {
  const cost = RARITY_COST[sticker.rarity as keyof typeof RARITY_COST] || 100;
  const levelOk = profileLevel >= sticker.level_required;
  const xpOk = profileXp >= cost;

  return (
    <div className={`relative aspect-[3/4.2] rounded-lg overflow-hidden border-2 transition-all duration-500 group ${
      owned 
        ? sticker.rarity === 'gold' ? 'border-yellow-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-white/20'
        : 'border-dashed border-white/10 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
    }`}>
      <StickerVisual 
        name={sticker.character_name} 
        rarity={sticker.rarity as any} 
        unlocked={owned} 
        imageUrl={sticker.image_url} 
      />
      {sticker.image_url && owned && (
        <img 
          src={sticker.image_url} 
          alt={sticker.character_name} 
          className="absolute inset-0 w-full h-full object-cover z-10 opacity-80 group-hover:opacity-100 transition-opacity"
          loading="lazy"
        />
      )}
      
      {/* Label Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 z-20">
        <p className={`text-[8px] font-heading text-center leading-tight truncate ${owned ? 'text-white' : 'text-white/40'}`}>
          {sticker.character_name}
        </p>
        {!owned && (
          <div className="flex flex-col gap-1 mt-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-5 text-[6px] p-0 w-full bg-primary/10 border border-primary/20 hover:bg-primary/30"
              disabled={!levelOk || !xpOk || buying}
              onClick={() => onBuy(sticker)}
            >
              {buying ? "..." : `Comprar ${cost}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
