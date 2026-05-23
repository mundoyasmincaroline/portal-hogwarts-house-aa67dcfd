import { useState, useEffect, useCallback } from "react";
import { stickerService, Sticker } from "@/services/features/stickerService";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { RARITY_COST } from "@/constants/gameConstants";

export function useStickers() {
  const { user, profile, fetchProfile } = useAuth();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [userStickers, setUserStickers] = useState<Record<string, boolean>>({});
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
    if (!user || !profile) return;
    const cost = RARITY_COST[sticker.rarity];
    if (profile.xp < cost) {
      toast.error(`Você precisa de ${cost} XP para esta figurinha! Você tem ${profile.xp} XP.`);
      return false;
    }

    try {
      await stickerService.buySticker(user.id, sticker.id, cost);
      
      const newMap = { ...userStickers, [sticker.id]: true };
      setUserStickers(newMap);
      await fetchProfile(user.id);
      
      toast.success(`✨ Figurinha de ${sticker.character_name} desbloqueada! -${cost} XP`);
      
      if (Object.keys(newMap).length >= stickers.length) {
        await stickerService.completeAlbumReward(user.id);
      }
      return true;
    } catch (error: any) {
      toast.error("Erro ao comprar figurinha: " + error.message);
      return false;
    }
  };

  return {
    stickers,
    userStickers,
    loading,
    loadAlbum,
    buySticker
  };
}
