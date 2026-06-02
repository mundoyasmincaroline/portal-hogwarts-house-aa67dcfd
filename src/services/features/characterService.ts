import { supabase } from "@/integrations/supabase/client";
import { Character } from "@/types";

export const characterService = {
  async getByUserId(userId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from("characters")
      .select("id, full_name, avatar_url, house, character_type, level, xp")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return (data as Character[]) || [];
  },

  async setActiveCharacter(userId: string, characterId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ active_character_id: characterId } as any)
      .eq("user_id", userId);
    
    if (error) throw error;
  }
};
