import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useParams } from "react-router-dom";
import { ProfileAboutTab } from "./Profile/ProfileAboutTab";
import SafeImage from "@/components/SafeImage";
import CharacterSheetView from "@/components/profile/CharacterSheetView";
import ProfileAlbum from "@/components/profile/ProfileAlbum";
import { useProfile } from "@/hooks/features/useProfile";

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: currentUserProfile, user } = useAuth();
  const isMe = !userId || userId === user?.id;
  
  const { targetProfile, userBadges, userItems, fetchProfileData } = useProfile(userId, isMe);
  
  const profile = isMe ? currentUserProfile : targetProfile;
  const profileUserId = (isMe ? user?.id : userId) as string | undefined;

  useEffect(() => {
    if (isMe && user?.id) {
        fetchProfileData(user.id);
    }
  }, [isMe, user?.id, fetchProfileData]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="glass rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 text-center relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 relative">
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
