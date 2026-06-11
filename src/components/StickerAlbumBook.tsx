import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Lock, Sparkles } from "lucide-react";
import StickerVisual from "./StickerVisual";
import { Button } from "./ui/button";
import { RARITY_COST, RARITY_LABELS_PT } from "@/constants/gameConstants";
import { Sticker } from "@/types";
import StickerDetailDialog from "./StickerDetailDialog";

interface Props {
  stickers: Sticker[];
  userStickers: Record<string, boolean>;
  onBuy: (sticker: Sticker) => void;
  buyingId: string | null;
  profileLevel: number;
  profileGaleons: number;
}

const ITEMS_PER_PAGE = 8;

export default function StickerAlbumBook({ stickers, userStickers, onBuy, buyingId, profileLevel, profileGaleons }: Props) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isOpened, setIsOpened] = useState(false);
  const [selected, setSelected] = useState<Sticker | null>(null);

  const totalPages = Math.ceil(stickers.length / ITEMS_PER_PAGE);
  const currentItems = stickers.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const paginate = (newDirection: number) => {
    if (page + newDirection < 0 || page + newDirection >= totalPages) return;
    setDirection(newDirection);
    setPage(page + newDirection);
  };

  const variants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      rotateY: direction < 0 ? 90 : -90,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-10 perspective-1000">
      <AnimatePresence mode="wait">
        {!isOpened ? (
          <motion.div
            key="cover"
            initial={{ rotateY: 0, x: 0 }}
            exit={{ rotateY: -110, x: "-50%", transition: { duration: 1.2, ease: "easeInOut" } }}
            className="relative w-full aspect-[4/5] sm:aspect-[16/10] max-w-3xl mx-auto cursor-pointer group preserve-3d"
            onClick={() => setIsOpened(true)}
          >
            {/* Book Cover Design */}
            <div className="absolute inset-0 bg-[#2a1b0a] rounded-r-[2rem] rounded-l-[0.5rem] shadow-[20px_0_50px_rgba(0,0,0,0.8)] border-y-4 border-r-4 border-[#3d2b16] overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-60 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60" />
              
              {/* Decorative Gold Borders */}
              <div className="absolute inset-6 border-2 border-yellow-600/30 rounded-lg pointer-events-none" />
              <div className="absolute inset-8 border border-yellow-600/20 rounded-lg pointer-events-none" />

              {/* Central Crest Area */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] animate-pulse" />
                  <div className="w-32 h-32 sm:w-48 sm:h-48 relative z-10 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-transform group-hover:scale-110 duration-700 flex items-center justify-center text-7xl sm:text-8xl">
                    <span aria-label="Brasão de Hogwarts">🏰</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-heading text-4xl sm:text-6xl text-gold-gradient drop-shadow-2xl tracking-tighter uppercase">
                    Álbum de Magia
                  </h2>
                  <p className="text-yellow-500/60 font-serif italic text-sm sm:text-lg tracking-widest">
                    "Draco Dormiens Nunquam Titillandus"
                  </p>
                </div>

                <div className="pt-8">
                  <Button variant="plaque" className="min-h-14 h-auto px-5 sm:px-10 rounded-full animate-bounce">
                    Abrir Relicário <BookOpen className="ml-2" />
                  </Button>
                </div>
              </div>

              {/* Spine Detail */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/40 border-r border-yellow-600/20 shadow-inner" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="book-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            {/* Open Book Container */}
            <div className="relative aspect-[4/6] sm:aspect-[16/10] bg-[#f4e4bc] rounded-[0.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-[#d4c39a] overflow-hidden">
              {/* Parchment Texture Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-30 pointer-events-none" />
              
              {/* Book Spine (Open) */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 sm:w-8 bg-gradient-to-r from-black/20 via-black/40 to-black/20 z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] hidden sm:block" />

              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={page}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    rotateY: { type: "spring", stiffness: 100, damping: 20 },
                    opacity: { duration: 0.3 }
                  }}
                  className="absolute inset-0 flex flex-col sm:grid sm:grid-cols-2 gap-0 overflow-y-auto sm:overflow-hidden preserve-3d pb-24 sm:pb-0"
                >
                  {/* Left Page */}
                  <div className="p-4 sm:p-12 flex flex-col items-center border-b sm:border-b-0 sm:border-r border-black/5 relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full relative z-10">
                      {currentItems.slice(0, 4).map((s) => (
                        <StickerSlot key={s.id} sticker={s} owned={!!userStickers[s.id]} onOpen={() => setSelected(s)} buying={buyingId === s.id} />
                      ))}
                    </div>
                  </div>

                  {/* Right Page */}
                  <div className="p-4 sm:p-12 flex flex-col items-center border-t sm:border-t-0 sm:border-l border-black/5 relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full relative z-10">
                      {currentItems.slice(4, 8).map((s) => (
                        <StickerSlot key={s.id} sticker={s} owned={!!userStickers[s.id]} onOpen={() => setSelected(s)} buying={buyingId === s.id} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 items-center z-30 px-4">
                <button 
                  onClick={() => paginate(-1)} 
                  disabled={page === 0}
                  className="w-12 h-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center hover:bg-black/10 transition-all disabled:opacity-20 group"
                >
                  <ChevronLeft className="text-black/60 group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <div className="flex flex-col items-center">
                  <div className="px-6 py-2 rounded-full bg-black/10 border border-black/5 font-heading text-[10px] tracking-[0.2em] text-black/60 uppercase font-bold">
                    Página {page + 1} / {totalPages}
                  </div>
                  <button 
                    onClick={() => setIsOpened(false)}
                    className="mt-2 text-[8px] text-black/40 hover:text-black/80 uppercase tracking-[0.04em] sm:tracking-widest font-heading transition-colors"
                  >
                    Fechar Álbum
                  </button>
                </div>

                <button 
                  onClick={() => paginate(1)} 
                  disabled={page === totalPages - 1}
                  className="w-12 h-12 rounded-full bg-black/5 border border-black/10 flex items-center justify-center hover:bg-black/10 transition-all disabled:opacity-20 group"
                >
                  <ChevronRight className="text-black/60 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Visual Hint */}
      <div className="mt-8 flex justify-center gap-4 text-white/20 text-[10px] uppercase font-heading tracking-[0.4em]">
        <Sparkles size={14} className="animate-pulse" />
        <span>Colecione as Relíquias de Hogwarts</span>
        <Sparkles size={14} className="animate-pulse" />
      </div>

      <StickerDetailDialog
        sticker={selected}
        owned={selected ? !!userStickers[selected.id] : false}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onBuy={onBuy}
        buying={selected ? buyingId === selected.id : false}
        profileLevel={profileLevel}
        profileGaleons={profileGaleons}
      />
    </div>
  );
}

function StickerSlot({ sticker, owned, onOpen, buying }: { 
  sticker: Sticker; 
  owned: boolean; 
  onOpen: () => void;
  buying: boolean;
}) {
  const rarityColors = {
    gold: { border: 'border-yellow-500/70', text: 'text-yellow-300', bg: 'bg-yellow-600/20', label: 'LENDÁRIA' },
    silver: { border: 'border-slate-300/60', text: 'text-slate-100', bg: 'bg-slate-400/20', label: 'INCOMUM' },
    bronze: { border: 'border-amber-700/60', text: 'text-amber-300', bg: 'bg-amber-800/20', label: 'COMUM' },
  } as const;
  const rc = rarityColors[sticker.rarity as keyof typeof rarityColors] ?? rarityColors.bronze;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={buying}
      aria-label={owned ? `Ver figurinha de ${sticker.character_name}` : `Adquirir ${sticker.character_name}`}
      className={`relative aspect-[3/4.2] w-full rounded-xl overflow-hidden border-2 transition-all duration-300 group shadow-lg text-left active:scale-95 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl ${rc.border} ${!owned ? 'opacity-95' : ''}`}
    >
      {/* Rarity badge - top */}
      <div className={`absolute top-1 right-1 z-40 px-1.5 py-0.5 rounded ${rc.bg} ${rc.text} text-[7px] font-heading tracking-widest border ${rc.border}`}>
        {rc.label}
      </div>

      {/* Artwork */}
      {owned && sticker.image_url ? (
        <div className="absolute inset-0 z-10">
          <img
            src={sticker.image_url}
            alt={sticker.character_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        </div>
      ) : owned ? (
        <div className="absolute inset-0 z-10">
          <StickerVisual name={sticker.character_name} rarity={sticker.rarity as any} unlocked={true} imageUrl={sticker.image_url} />
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-black/85 via-zinc-900 to-black gap-2 p-3">
          {sticker.image_url ? (
            <img src={sticker.image_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-md grayscale opacity-20" />
          ) : null}
          <Lock size={26} className={`relative ${rc.text} drop-shadow animate-pulse`} />
          <span className="relative text-[8px] font-heading tracking-widest text-white/70 uppercase">Bloqueada</span>
          <span className="relative text-[9px] font-heading text-white/50 uppercase tracking-wider mt-1">Toque para adquirir</span>
        </div>
      )}

      {/* Name label always visible */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2 z-40">
        <p className="text-[10px] font-heading text-center leading-tight text-white uppercase tracking-tight line-clamp-2">
          {sticker.character_name}
        </p>
      </div>
    </button>
  );
}
