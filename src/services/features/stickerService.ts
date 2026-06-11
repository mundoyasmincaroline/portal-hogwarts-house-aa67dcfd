import { supabase } from "@/integrations/supabase/client";
import { Sticker } from "@/types";

export const stickerService = {
  async getAllStickers(): Promise<Sticker[]> {
    const { data, error } = await supabase
      .from("stickers")
      .select("*")
      .order("level_required", { ascending: true });
    
    if (error) throw error;
    return (data as Sticker[]) || [];
  },

  async getUserStickers(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_stickers")
      .select("sticker_id")
      .eq("user_id", userId);
    
    if (error) throw error;
    return (data || []).map(s => s.sticker_id);
  },

  async buySticker(userId: string, stickerId: string): Promise<{ cost: number; new_balance: number }> {
    const { data, error } = await supabase.rpc("buy_sticker_with_galeons" as any, {
      _user_id: userId,
      _sticker_id: stickerId,
    });
    if (error) throw error;
    const r = data as any;
    if (!r?.ok) {
      if (r?.error === "insufficient_galeons") {
        throw new Error(`Galeões insuficientes: precisa de ${r.need}, você tem ${r.have}.`);
      }
      if (r?.error === "already_owned") {
        throw new Error("Você já possui esta figurinha.");
      }
      throw new Error(r?.error || "Falha na compra");
    }
    return { cost: r.cost, new_balance: r.new_balance };
  },

  async completeAlbumReward(userId: string): Promise<void> {
    await supabase.rpc("award_xp_action", { 
      _action: "album_complete", 
      _user_id: userId, 
      _xp: 500 
    });
  }
};
