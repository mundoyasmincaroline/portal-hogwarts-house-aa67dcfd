import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Share2, Sparkles, X, Twitter, MessageCircle, Coins } from "lucide-react";
import { Sticker } from "@/types";
import { RARITY_COST, RARITY_LABELS_PT } from "@/constants/gameConstants";
import { shareContent, buildStickerShareText } from "@/lib/share";
import { toast } from "sonner";

interface Props {
  sticker: Sticker | null;
  owned: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (s: Sticker) => Promise<any> | any;
  buying: boolean;
  profileLevel: number;
  profileGaleons: number;
}

const RARITY_META: Record<string, { label: string; ring: string; glow: string; text: string }> = {
  gold:   { label: "Lendária", ring: "ring-yellow-400/70",  glow: "shadow-[0_0_80px_rgba(234,179,8,0.55)]", text: "text-yellow-300" },
  silver: { label: "Incomum",  ring: "ring-slate-300/60",   glow: "shadow-[0_0_60px_rgba(203,213,225,0.4)]", text: "text-slate-200" },
  bronze: { label: "Comum",    ring: "ring-amber-700/60",   glow: "shadow-[0_0_50px_rgba(180,83,9,0.4)]",    text: "text-amber-400" },
};

export default function StickerDetailDialog({ sticker, owned, open, onOpenChange, onBuy, buying, profileLevel, profileGaleons }: Props) {
  const [celebrate, setCelebrate] = useState(false);

  if (!sticker) return null;

  const meta = RARITY_META[sticker.rarity] ?? RARITY_META.bronze;
  const cost = RARITY_COST[sticker.rarity as keyof typeof RARITY_COST] || 100;
  const levelOk = profileLevel >= sticker.level_required;
  const galeonsOk = profileGaleons >= cost;

  const handleBuy = async () => {
    const result = await onBuy(sticker);
    if (result !== false) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2200);
    }
  };

  const handleShare = async (channel: "native" | "twitter" | "whatsapp") => {
    const text = buildStickerShareText(sticker.character_name, sticker.rarity, (sticker as any).house);
    const url = "https://portal-hogwarts-house.lovable.app";
    if (channel === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
      return;
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
      return;
    }
    const r = await shareContent({ title: `Figurinha: ${sticker.character_name}`, text });
    if (r === "copied") toast.success("✨ Link copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[#1a0f02] border-yellow-600/40">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{ scale: 1, x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600, opacity: 0 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="absolute text-yellow-300 text-2xl"
                >
                  ✨
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          {/* Big preview */}
          <motion.div
            key={owned ? "owned" : "locked"}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            className={`relative aspect-[3/4] w-full overflow-hidden flex items-center justify-center ${meta.glow}`}
          >
            {owned && sticker.image_url ? (
              <img src={sticker.image_url} alt={sticker.character_name} className="w-full h-full object-cover" />
            ) : owned ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-900/40 to-black text-7xl">🪄</div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-black/60 to-black/90 gap-4 relative">
                {sticker.image_url && (
                  <img src={sticker.image_url} alt="" className="absolute inset-0 w-full h-full object-cover grayscale blur-[2px] opacity-40 mix-blend-luminosity" />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <Lock size={64} className="text-white/40 z-10 drop-shadow-2xl" />
                <p className="font-heading text-2xl text-white/60 uppercase tracking-widest z-10 drop-shadow-2xl">Bloqueada</p>
              </div>
            )}
            <div className={`absolute inset-0 ring-4 ring-inset ${meta.ring} pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </motion.div>

          {/* Info & actions */}
          <div className="p-5 space-y-4">
            <div className="text-center">
              <p className={`text-[10px] font-heading uppercase tracking-[0.4em] ${meta.text}`}>{meta.label}</p>
              <h3 className="font-heading text-2xl text-gold-gradient mt-1">
                {sticker.character_name}
              </h3>
              {(sticker as any).house && (
                <p className="text-xs text-white/60 uppercase tracking-widest mt-1">
                  Casa: {(sticker as any).house}
                </p>
              )}
            </div>

            {owned ? (
              <div className="space-y-3">
                <p className="text-center text-xs text-white/60 italic">
                  ✨ Você possui esta figurinha. Mostre para o mundo bruxo!
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare("twitter")} className="gap-1">
                    <Twitter size={14} /> X
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")} className="gap-1">
                    <MessageCircle size={14} /> WhatsApp
                  </Button>
                  <Button variant="magical" size="sm" onClick={() => handleShare("native")} className="gap-1">
                    <Share2 size={14} /> Mais
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!levelOk && (
                  <p className="text-center text-xs text-amber-400/90">
                    Requer nível {sticker.level_required} (você está no {profileLevel}).
                  </p>
                )}
                {levelOk && !galeonsOk && (
                  <p className="text-center text-xs text-red-400/90">
                    Galeões insuficientes: precisa de {cost}, você tem {profileGaleons}.
                  </p>
                )}
                <Button
                  variant="magical"
                  size="lg"
                  className="w-full"
                  disabled={!levelOk || !galeonsOk || buying}
                  onClick={handleBuy}
                >
                  {buying ? (
                    <span className="flex items-center gap-2"><Sparkles className="animate-spin" size={16} /> Conjurando…</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Coins size={16} /> Desbloquear por {cost} galeões
                    </span>
                  )}
                </Button>
                <p className="text-center text-[10px] text-white/40 uppercase tracking-widest">
                  Seu saldo: {profileGaleons} galeões
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}