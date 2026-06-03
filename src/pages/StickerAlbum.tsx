import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trophy, Sparkles, Gift, Share2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StickerVisual from "@/components/StickerVisual";
import MagicalEmoji from "@/components/shared/MagicalEmoji";
import StickerAlbumBook from "@/components/StickerAlbumBook";
import { useStickers } from "@/hooks/features/useStickers";
import { Sticker } from "@/types";
import { RARITY_COST, PACK_COST } from "@/constants/gameConstants";
import { shareContent, buildStickerShareText, buildAlbumShareText } from "@/lib/share";
import EmojiIcon from "@/components/shared/EmojiIcon";

const RARITY_ORDER = { bronze: 0, silver: 1, gold: 2 };

export default function StickerAlbum() {
  const { profile, user, fetchProfile } = useAuth();
  const { stickers, userStickers, loading, loadAlbum, buySticker: handleBuySticker } = useStickers();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeRarity, setActiveRarity] = useState<"all" | "bronze" | "silver" | "gold">("all");
  const [activeHouse, setActiveHouse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openingPack, setOpeningPack] = useState(false);
  const [packReveal, setPackReveal] = useState<Sticker | null>(null);
  const [packPhase, setPackPhase] = useState<"idle" | "shaking" | "reveal">("idle");
  const navigate = useNavigate();

  const handleShareSticker = async (s: Sticker) => {
    const text = buildStickerShareText(s.character_name, s.rarity, (s as any).house);
    const res = await shareContent({ title: `Figurinha: ${s.character_name}`, text });
    if (res === "copied") toast.success("✨ Link copiado!");
  };

  const handleShareAlbum = async () => {
    const text = buildAlbumShareText(owned, total, goldOwned);
    const res = await shareContent({ title: "Meu Álbum Mágico", text });
    if (res === "copied") toast.success("✨ Progresso copiado!");
  };

  const completedBanner = useMemo(() => stickers.length > 0 && Object.keys(userStickers).length >= stickers.length, [stickers, userStickers]);

  const buySticker = async (sticker: Sticker) => {
    if (buyingId) return;
    setBuyingId(sticker.id);
    const success = await handleBuySticker(sticker);
    setBuyingId(null);
    if (success) toast.success("Figurinha liberada! ✨");
  };

  const openSurprisePack = async () => {
    if (!user || !profile || openingPack) return;
    if (profile.xp < PACK_COST) { toast.error("XP insuficiente!"); return; }
    setOpeningPack(true); setPackPhase("shaking");
    try {
      const { data, error } = await supabase.rpc("open_sticker_pack" as any, { _user_id: user.id });
      if (error) throw error;
      const picked = (data as any).sticker as Sticker;
      await fetchProfile(user.id); await loadAlbum();
      setTimeout(() => { setPackPhase("reveal"); setPackReveal(picked); }, 1500);
    } catch (err) { setOpeningPack(false); setPackPhase("idle"); }
  };

  const closePack = () => { setOpeningPack(false); setPackPhase("idle"); setPackReveal(null); };
  const owned = Object.keys(userStickers).length;
  const total = stickers.length;
  const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
  const goldOwned = stickers.filter(s => s.rarity === "gold" && userStickers[s.id]).length;

  const filtered = stickers.filter(s => {
    const matchesRarity = activeRarity === "all" || s.rarity === activeRarity;
    const matchesHouse = activeHouse === "all" || (s as any).house === activeHouse;
    const matchesSearch = s.character_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRarity && matchesHouse && matchesSearch;
  }).sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);

  if (loading) return <div className="text-center py-20 font-heading">Carregando Álbum...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 p-12 text-center bg-[#1a0f02]">
        <h1 className="font-heading text-4xl sm:text-6xl text-gold-gradient">{completedBanner ? "🏆 ÁLBUM LENDÁRIO 🏆" : "Álbum de Magia"}</h1>
        <div className="flex justify-center gap-4 mt-8">
           <Button variant="magical" size="lg" onClick={openSurprisePack} disabled={openingPack || profile.xp < PACK_COST}>Abrir Pacote ({PACK_COST} XP)</Button>
        </div>
      </div>

      {openingPack && packReveal && packPhase === "reveal" && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={closePack}>
          <h2 className="text-white font-heading text-3xl mb-8">Você ganhou: {packReveal.character_name}</h2>
          <Button variant="plaque" onClick={closePack}>Fechar</Button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between glass p-6 rounded-2xl">
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-2" />
        <div className="flex gap-2">
          {["all", "bronze", "silver", "gold"].map(r => (
            <Button key={r} variant={activeRarity === r ? "magical" : "outline"} size="sm" onClick={() => setActiveRarity(r as any)}>{r}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "gryffindor", "slytherin", "ravenclaw", "hufflepuff"].map(h => (
            <Button key={h} variant={activeHouse === h ? "magical" : "outline"} size="sm" onClick={() => setActiveHouse(h)}>{h}</Button>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-2xl flex justify-between items-center">
        <div>
          <h3 className="font-heading text-2xl">Progresso: {pct}%</h3>
          <p>{owned} de {total} cartas</p>
        </div>
        <Button variant="outline" onClick={handleShareAlbum}>Compartilhar</Button>
      </div>

      <StickerAlbumBook stickers={filtered} userStickers={userStickers} onBuy={buySticker} buyingId={buyingId} profileLevel={profile?.level || 1} profileXp={profile?.xp || 0} />
    </div>
  );
}
