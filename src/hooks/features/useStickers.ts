import { useState, useEffect, useCallback } from "react";
import { stickerService } from "@/services/features/stickerService";
import { useAuth } from "@/lib/auth";
import { Sticker } from "@/types";
import { toast } from "sonner";
import { RARITY_COST } from "@/constants/gameConstants";

export function useStickers() {
  const { user, profile, fetchProfile } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [userStickers, setUserStickers] = useState<Record<string, boolean>>({});
  const [buyingIdInternal, setBuyingIdInternal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAlbum = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allStickers, myStickerIds] = await Promise.all([
        stickerService.getAllStickers(),
        stickerService.getUserStickers(user.id)
      ]);

      setStickers(allStickers);
      const myMap: Record<string, boolean> = {};
      myStickerIds.forEach(id => myMap[id] = true);
      setUserStickers(myMap);
    } catch (error: any) {
      toast.error("Erro ao carregar álbum: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const buySticker = async (sticker: Sticker) => {
    if (!user || !profile || userStickers[sticker.id] || buyingIdInternal) return;
    setBuyingIdInternal(sticker.id);
    const cost = RARITY_COST[sticker.rarity];
    if ((profile.galeons ?? 0) < cost) {
      toast.error(`Você precisa de ${cost} galeões! Você tem ${profile.galeons ?? 0}.`);
      setBuyingIdInternal(null);
      return false;
    }
    try {
      const r = await stickerService.buySticker(user.id, sticker.id);
      const newMap = { ...userStickers, [sticker.id]: true };
      setUserStickers(newMap);
      await fetchProfile(user.id);
      toast.success(`✨ ${sticker.character_name} desbloqueada! -${r.cost} galeões`);
      if (Object.keys(newMap).length >= stickers.length) {
        await stickerService.completeAlbumReward(user.id);
        toast.success("🏆 Álbum completo! Bônus enviado!");
      }
      return true;
    } catch (error: any) {
      toast.error(error.message || "Erro ao comprar figurinha");
      return false;
    } finally {
      setBuyingIdInternal(null);
    }
  };

  return {
    stickers,
    userStickers,
    loading,
    loadAlbum,
    buySticker,
    buyingId: buyingIdInternal
  };
}
