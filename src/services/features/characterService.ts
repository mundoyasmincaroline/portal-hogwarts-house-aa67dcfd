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
    // Carrega a casa do personagem alvo para manter o perfil sincronizado
    // (toda a UI usa profile.house para temas, brasões e rankings).
    const { data: target, error: charErr } = await supabase
      .from("characters")
      .select("id, house")
      .eq("id", characterId)
      .eq("user_id", userId)
      .maybeSingle();
    if (charErr) throw charErr;
    if (!target) throw new Error("Personagem não encontrado ou não pertence a você.");

    const updates: any = { active_character_id: characterId };
    if (target.house) updates.house = target.house;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);

    if (error) throw error;
  }
};
