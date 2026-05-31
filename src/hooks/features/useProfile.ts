import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

export function useProfile(userId?: string, isMe?: boolean) {
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();
      
      if (profile) setTargetProfile(profile as unknown as Profile);

      const [badgesRes, itemsRes] = await Promise.all([
        supabase.from("user_badges").select("*, badges(*)").eq("user_id", id),
        supabase.from("user_items").select("*, store_items(*)").eq("user_id", id),
      ]);
      
      setUserBadges(badgesRes.data || []);
      setUserItems(itemsRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMe && userId) {
      fetchProfileData(userId);
    }
  }, [userId, isMe, fetchProfileData]);

  return {
    targetProfile,
    userBadges,
    userItems,
    loading,
    fetchProfileData
  };
}
