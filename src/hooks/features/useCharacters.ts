import { useState, useEffect, useCallback } from "react";
import { characterService } from "@/services/features/characterService";
import { useAuth } from "@/lib/auth";
import { Character } from "@/types";
import { toast } from "sonner";

export function useCharacters() {
  const { user, profile } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await characterService.getByUserId(user.id);
      setCharacters(data);
    } catch (error: any) {
      toast.error("Erro ao carregar personagens: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchCharacter = async (characterId: string) => {
    if (!user || characterId === profile?.active_character_id) return;
    
    setSwitchingId(characterId);
    try {
      await characterService.setActiveCharacter(user.id, characterId);
      const target = characters.find(c => c.id === characterId);
      
      useAuth.setState((s) => ({
        profile: s.profile ? {
          ...s.profile,
          active_character_id: characterId,
          house: (target?.house as any) ?? s.profile.house,
        } : null
      }));

      toast.success(`✨ Turno: ${target?.full_name}`);
      // Refresca o perfil sem recarregar a página (preserva scroll/estado)
      try { await useAuth.getState().fetchProfile(user.id); } catch { /* ignore */ }
    } catch (error: any) {
      toast.error("Erro ao trocar de personagem: " + error.message);
    } finally {
      setSwitchingId(null);
    }
  };

  return {
    characters,
    loading,
    switchingId,
    loadCharacters,
    switchCharacter,
    activeId: profile?.active_character_id
  };
}
