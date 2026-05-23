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

  async buySticker(userId: string, stickerId: string, cost: number): Promise<void> {
    const { error: xpErr } = await supabase.rpc("award_xp_action", { 
      _action: "buy_sticker", 
      _user_id: userId, 
      _xp: -cost 
    });
    if (xpErr) throw xpErr;

    const { error: insertErr } = await supabase
      .from("user_stickers")
      .insert({ user_id: userId, sticker_id: stickerId } as any);
    if (insertErr) throw insertErr;
  },

  async completeAlbumReward(userId: string): Promise<void> {
    await supabase.rpc("award_xp_action", { 
      _action: "album_complete", 
      _user_id: userId, 
      _xp: 500 
    });
  }
};
