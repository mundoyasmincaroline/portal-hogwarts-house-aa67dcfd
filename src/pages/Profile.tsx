import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ProfileAboutTab } from "./Profile/ProfileAboutTab";
import SafeImage from "@/components/SafeImage";
import CharacterSheetView from "@/components/CharacterSheetView";
import ProfileAlbum from "@/components/ProfileAlbum";

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUserProfile, user } = useAuth();
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const isMe = !userId || userId === user?.id;
  const profile = isMe ? currentUserProfile : targetProfile;

  useEffect(() => {
    if (!isMe && userId) {
      supabase.from("profiles").select("*").eq("user_id", userId).single().then(({ data }) => setTargetProfile(data));
    }
  }, [userId, isMe]);

  const profileUserId = (isMe ? user?.id : userId) as string | undefined;

  useEffect(() => {
    if (!profileUserId) return;
    (async () => {
      const [badgesRes, itemsRes] = await Promise.all([
        supabase.from("user_badges").select("*, badges(*)").eq("user_id", profileUserId),
        supabase.from("user_items").select("*, store_items(*)").eq("user_id", profileUserId),
      ]);
      setUserBadges(badgesRes.data || []);
      setUserItems(itemsRes.data || []);
    })();
  }, [profileUserId]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="glass rounded-[2.5rem] p-8 text-center relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <SafeImage src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover border-4 border-white/10" />
        </div>
        <h1 className="font-heading text-2xl text-foreground">{profile.full_name}</h1>
        <p className="text-muted-foreground text-sm">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-muted-foreground/90 mt-4 max-w-md mx-auto whitespace-pre-line italic">
            {profile.bio}
          </p>
        )}
      </div>

      <ProfileAboutTab profile={profile} userBadges={userBadges} userItems={userItems} />

      {profileUserId && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl text-primary px-1">📜 Fichas de Personagem</h2>
          <CharacterSheetView userId={profileUserId} isOwner={isMe} userItems={userItems} />
        </div>
      )}

      {profileUserId && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl text-primary px-1">🎴 Álbum de Figurinhas</h2>
          <ProfileAlbum userId={profileUserId} />
        </div>
      )}
    </div>
  );
}
