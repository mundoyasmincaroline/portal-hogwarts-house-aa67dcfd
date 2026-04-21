import { useState, useEffect } from "react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, getLevelFromXP, type House } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";
import MedalBadge, { getMedalForXP } from "@/components/MedalBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import ProfileAlbum from "@/components/ProfileAlbum";
import CharacterSheetView from "@/components/CharacterSheetView";
import MemberCard from "@/components/MemberCard";
import AdminMemberModal from "@/components/AdminMemberModal";
import { Info, Users, Search, Scroll, Book, Lock, Trophy, ShoppingBag, Flame, Sparkles, Star, CheckCircle2, Crown, ChevronRight, Zap } from "lucide-react";
import SafeImage from "@/components/SafeImage";

// ---- Componente embutido: lista de membros para solicitar amizade ----
function MembersTab({ currentUserId }: { currentUserId?: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, house, level, xp, last_seen")
        .eq("approved", true)
        .order("level", { ascending: false });
      setMembers((data || []).map(m => ({ ...m, online: isUserOnline(m) })));

      if (currentUserId) {
        const { data: fData } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);
        const map: Record<string, string> = {};
        (fData || []).forEach((f: any) => {
          const other = f.user_id === currentUserId ? f.friend_id : f.user_id;
          if (f.status === "accepted") map[other] = "accepted";
          else if (f.status === "blocked") map[other] = "blocked";
          else map[other] = f.user_id === currentUserId ? "pending_sent" : "pending_received";
        });
        setFriendships(map);
      }
      setLoading(false);
    };
    load();
  }, [currentUserId]);

  const filtered = members.filter(m =>
    !search.trim() ||
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar membro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>
      {loading ? (
        <p className="text-center text-muted-foreground py-8 animate-pulse">Convocando os bruxos...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(m => (
            <MemberCard
              key={m.user_id}
              member={m}
              friendshipStatus={(friendships[m.user_id] as any) || "none"}
              onFriendshipChange={() => {
                if (!currentUserId) return;
                supabase
                  .from("friendships")
                  .select("user_id, friend_id, status")
                  .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
                  .then(({ data: fData }) => {
                    const map: Record<string, string> = {};
                    (fData || []).forEach((f: any) => {
                      const other = f.user_id === currentUserId ? f.friend_id : f.user_id;
                      if (f.status === "accepted") map[other] = "accepted";
                      else if (f.status === "blocked") map[other] = "blocked";
                      else map[other] = f.user_id === currentUserId ? "pending_sent" : "pending_received";
                    });
                    setFriendships(map);
                  });
              }}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile: currentUserProfile, user, updateProfile, updatePassword, isAdmin } = useAuth();
  
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [friendship, setFriendship] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"about" | "fichas" | "friends" | "members" | "security" | "album" | "referral" | "achievements" | "inventory">("about");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    age: 11,
    birth_date: "",
    avatar_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [adminEditModal, setAdminEditModal] = useState(false);

  const isMe = !userId || userId === user?.id;
  const profile = isMe ? currentUserProfile : targetProfile;

  useEffect(() => {
    if (isMe && currentUserProfile) {
      setForm({
        full_name: currentUserProfile.full_name,
        username: currentUserProfile.username,
        bio: currentUserProfile.bio || "",
        age: currentUserProfile.age || 11,
        birth_date: currentUserProfile.birth_date || "",
        avatar_url: currentUserProfile.avatar_url || "",
      });
      loadFriends(user!.id);
      loadReferrals(user!.id);
      loadBadges(user!.id);
      loadExtras(user!.id);
    } else if (userId) {
      loadTargetProfile();
      loadFriends(userId);
      loadReferrals(userId);
      loadBadges(userId);
      loadExtras(userId);
    }
  }, [userId, isMe, currentUserProfile]);

  const loadTargetProfile = async () => {
    setLoadingTarget(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    if (data) setTargetProfile(data);
    
    if (user && data) {
      const { data: fData } = await supabase.from("friendships")
        .select("*")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${data.user_id}),and(user_id.eq.${data.user_id},friend_id.eq.${user.id})`)
        .maybeSingle();
      if (fData) setFriendship(fData);
    }
    setLoadingTarget(false);
  };

  const loadFriends = async (targetId: string) => {
    const { data } = await supabase.from("friendships")
      .select("*, friend_profiles:profiles!friendships_friend_id_fkey(*), user_profiles:profiles!friendships_user_id_fkey(*)")
      .or(`user_id.eq.${targetId},friend_id.eq.${targetId}`)
      .eq("status", "accepted");
    
    if (data) {
      const mapped = data.map(d => d.user_id === targetId ? d.friend_profiles : d.user_profiles);
      setFriends(mapped);
    }
  };

  const loadReferrals = async (targetId: string) => {
    const { data: refs } = await supabase.from("referrals").select("*").eq("inviter_id", targetId);
    if (refs && refs.length > 0) {
      const invitedIds = refs.map(r => r.invited_id);
      const { data: profs } = await supabase.from("profiles").select("*").in("user_id", invitedIds);
      const enriched = refs.map(r => ({
        ...r,
        profile: profs?.find(p => p.user_id === r.invited_id)
      }));
      setReferrals(enriched);
    } else {
      setReferrals([]);
    }
  };

  const loadBadges = async (targetId: string) => {
    const { data } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", targetId);
    if (data) {
      setUserBadges(data.map(d => d.badges).filter(Boolean));
    }
  };

  const loadExtras = async (targetId: string) => {
    setLoadingExtras(true);
    try {
      const [challengesRes, itemsRes] = await Promise.all([
        supabase
          .from("user_challenges")
          .select("*, challenges(*)")
          .eq("user_id", targetId)
          .in("status", ["approved", "completed"]),
        supabase
          .from("user_items")
          .select("*, store_items(*)")
          .eq("user_id", targetId)
      ]);
      
      setUserChallenges(challengesRes.data || []);
      setUserItems(itemsRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar extras:", err);
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleAddFriend = async () => {
    if (!user || !profile) return;
    const { data, error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: profile.user_id,
      status: "pending"
    }).select().single();
    
    if (error) {
      toast.error("Erro ao enviar convite.");
    } else {
      setFriendship(data);
      toast.success("Convite de amizade enviado!");
    }
  };

  const handleAcceptFriend = async () => {
    if (!friendship) return;
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendship.id);
    if (!error) {
      setFriendship({ ...friendship, status: "accepted" });
      toast.success("Convite aceito!");
      loadFriends(profile.user_id);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendship) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendship.id);
    if (!error) {
      setFriendship(null);
      toast.success("Amizade desfeita.");
      loadFriends(profile.user_id);
    }
  };

  const handleRejectFriend = async () => {
    if (!friendship) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendship.id);
    if (!error) {
      setFriendship(null);
      toast.success("Pedido recusado.");
    }
  };

  const toggleEquip = async (itemId: string, currentStatus: boolean) => {
    if (!isMe) return;
    const { error } = await supabase.from("user_items").update({ is_equipped: !currentStatus } as never).eq("id", itemId);
    if (error) toast.error("Erro ao equipar item.");
    else {
      toast.success(!currentStatus ? "Item equipado! ⚔️" : "Item removido.");
      loadExtras(user!.id);
    }
  };

  if (loadingTarget) return <div className="text-center py-20 text-muted-foreground">Procurando bruxo...</div>;
  if (!profile) return null;
  const house = HOUSES[profile.house as House] || HOUSES.gryffindor;
  const levelInfo = getLevelFromXP(profile.xp);

  const startEdit = () => {
    setForm({ full_name: profile.full_name, username: profile.username, bio: profile.bio || "", age: profile.age || 11, birth_date: profile.birth_date || "", avatar_url: profile.avatar_url || "" });
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const updates: any = { ...form };
    if (!updates.avatar_url) delete updates.avatar_url;
    const result = await updateProfile(updates);
    setSaving(false);
    if (result.success) {
      toast.success("Perfil atualizado! ✨");
      setEditing(false);
    } else {
      toast.error(result.error || "Erro ao salvar");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    const res = await updatePassword(newPassword);
    setSavingPassword(false);
    if (res.success) {
      toast.success("Senha atualizada com sucesso! 🔒");
      setNewPassword("");
    } else {
      toast.error(res.error || "Erro ao atualizar senha.");
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;
    await updateProfile({ avatar_url: bustedUrl });
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  let tabContent = null;

  if (activeTab === "about") {
    tabContent = (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "XP Total", value: profile.xp, icon: <Zap size={24} />, color: "from-amber-400 to-yellow-600", glow: "shadow-amber-500/20" },
            { label: "Nível Bruxo", value: levelInfo.level, icon: <Trophy size={24} />, color: "from-blue-400 to-indigo-600", glow: "shadow-blue-500/20" },
            { label: "Insígnias", value: userBadges.length, icon: <Crown size={24} />, color: "from-purple-400 to-fuchsia-600", glow: "shadow-purple-500/20" }
          ].map((stat, i) => (
            <div key={i} className={`relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 hover:border-white/20 group ${stat.glow}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {stat.icon}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-heading text-white tracking-tighter">{stat.value.toLocaleString()}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-heading mt-1">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] p-10 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 mb-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-primary/20 border border-primary/40 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-500">
                   <Scroll size={32} className="text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-2xl text-white tracking-tighter">Caminho da Maestria</h3>
                  <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-heading opacity-60">{levelInfo.name}</p>
                </div>
             </div>
             <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-heading">
                  Faltam <span className="text-primary font-bold">{levelInfo.next - profile.xp} XP</span> para o Próximo Nível
                </p>
             </div>
          </div>
          <div className="relative z-10">
            <XPBar xp={profile.xp} />
          </div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        </div>

        <div className={`relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] p-8 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group transition-all duration-700 hover:border-white/20`}>
          <div className={`absolute inset-0 bg-gradient-to-r ${
            profile.house === 'gryffindor' ? 'from-red-900/10' :
            profile.house === 'slytherin' ? 'from-green-900/10' :
            profile.house === 'ravenclaw' ? 'from-blue-900/10' : 'from-yellow-900/10'
          } to-transparent opacity-50`} />
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 text-center md:text-left">
            <div className="relative">
               <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <HouseCrest house={profile.house as House} size="lg" className="relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                 <h3 className="font-heading text-4xl text-gold-gradient tracking-tighter">{house.name.toUpperCase()}</h3>
                 <div className="h-1 w-20 bg-primary/40 rounded-full mx-auto md:mx-0" />
              </div>
              <p className="text-lg text-white/40 italic font-serif leading-relaxed">"{house.motto}"</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 opacity-20 group-hover:opacity-100 group-hover:bg-primary/20 transition-all duration-500">
               <ChevronRight size={32} className="text-white group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-6">
            <h3 className="font-heading text-xs text-primary tracking-[0.3em] uppercase opacity-60">Registros Oficiais</h3>
            <div className="space-y-4">
              {[
                { label: "Idade Bruxa", value: `${profile.age} anos`, icon: "🎂" },
                { label: "Membro Desde", value: new Date(profile.created_at).toLocaleDateString("pt-BR"), icon: "📅" },
                { label: "Status de Presença", value: isUserOnline(profile) ? "No Castelo" : "Fora do Castelo", icon: "📍", color: isUserOnline(profile) ? "text-green-400" : "text-white/40" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                     <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                     <span className="text-[10px] font-heading text-white/40 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className={`text-xs font-medium ${item.color || "text-white/80"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-6">
            <h3 className="font-heading text-xs text-primary tracking-[0.3em] uppercase opacity-60">Coleção Borgin & Burkes</h3>
            {userBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-20">
                 <div className="w-12 h-12 rounded-full border border-dashed border-white/40 mb-3" />
                 <p className="text-[10px] font-heading uppercase tracking-widest">Nenhum Artefato</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {userBadges.map(badge => (
                  <div key={badge.id} className="aspect-square bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all group/badge cursor-help" title={badge.name}>
                    <span className="text-2xl drop-shadow-xl group-hover/badge:scale-125 transition-transform duration-500">{badge.icon}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  } else if (activeTab === "friends") {
    tabContent = (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                 <Users size={28} className="text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
              </div>
              <div>
                 <h2 className="font-heading text-2xl text-white tracking-tighter">Círculo de Amizade</h2>
                 <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-heading">Bruxos e Bruxas de Confiança</p>
              </div>
           </div>
           <div className="px-6 py-2 bg-primary/10 rounded-full border border-primary/20 text-center">
              <span className="text-xs font-heading text-primary tracking-widest">{friends.length} Conexões Mágicas</span>
           </div>
        </div>
        {friends.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-3xl rounded-[3rem] p-16 text-center border border-white/10 shadow-inner space-y-6">
            <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-20">
               <span className="text-5xl">🤝</span>
            </div>
            <div className="space-y-2">
               <p className="text-white/60 font-serif italic text-lg text-center">"Amizade é a magia mais poderosa de todas."</p>
               <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.3em]">Você ainda não possui amigos registrados</p>
            </div>
            <button onClick={() => setActiveTab("members")} className="px-8 py-3 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-heading text-[10px] tracking-widest hover:bg-primary/20 transition-all uppercase">
              Explorar o Castelo →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map(f => f && (
              <MemberCard key={f.user_id} member={{ ...f, online: isUserOnline(f) }} compact />
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeTab === "members") {
    tabContent = (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                  <Search size={28} className="text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
               </div>
               <div>
                  <h2 className="font-heading text-2xl text-white tracking-tighter uppercase">Diretório de Hogwarts</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-heading">Encontre seus Aliados e Rivais</p>
               </div>
            </div>
            <MembersTab currentUserId={user?.id} />
         </div>
      </div>
    );
  } else if (activeTab === "fichas") {
    tabContent = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
         <CharacterSheetView userId={profile.user_id} isOwner={isMe} />
      </div>
    );
  } else if (activeTab === "album") {
    tabContent = (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
         <ProfileAlbum userId={profile.user_id} />
      </div>
    );
  } else if (activeTab === "referral" && isMe) {
    tabContent = (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-amber-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-primary/30 shadow-[0_30px_60px_rgba(0,0,0,0.5)] group text-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center border border-primary/40 shadow-inner mb-4">
               <Scroll size={40} className="text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-3xl text-white tracking-tighter uppercase">Link de Recrutamento Mágico</h2>
              <p className="text-sm text-white/50 max-w-md mx-auto italic font-serif leading-relaxed">
                "Expanda a nossa comunidade. Convide novos bruxos e seja recompensado com <strong className="text-primary">500 XP</strong> por cada alma corajosa que alcançar o Nível 2!"
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto pt-4">
              <div className="flex-1 w-full bg-black/40 rounded-2xl border border-white/10 p-4 font-mono text-xl text-primary tracking-widest shadow-inner">
                 {profile.username}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`Entre na Hogwarts House e use meu código de convite: ${profile.username}`);
                  toast.success("Código copiado! ✨");
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-white font-heading text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                COPIAR CÓDIGO
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <Users size={20} className="text-white/60" />
             </div>
             <h3 className="font-heading text-xl text-white tracking-tight">Bruxos Recrutados por Você <span className="text-primary/40 ml-2">({referrals.length})</span></h3>
          </div>
          {referrals.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-3xl rounded-[2.5rem] p-12 text-center border border-white/10 opacity-40">
              <p className="text-[10px] font-heading uppercase tracking-[0.4em]">Nenhum recrutamento registrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {referrals.map(r => (
                <div key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0">
                    <SafeImage src={r.profile?.avatar_url} alt={r.profile?.full_name || "Membro"} className="w-full h-full rounded-full object-cover" fallbackText={r.profile?.full_name?.[0]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading text-foreground truncate">{r.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.status === 'completed' ? <span className="text-green-500">✅ 500 XP Ganhos</span> : <span className="text-amber-500">⏳ Pendente (Nv. 2)</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } else if (activeTab === "achievements") {
    tabContent = (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
              <h2 className="font-heading text-2xl text-foreground">🏆 Sala de Troféus</h2>
              <p className="text-sm text-muted-foreground">Suas glórias e conquistas eternizadas no castelo.</p>
          </div>
          <div className="flex gap-2">
              <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-heading">Conquistas</p>
                  <p className="text-xl font-heading text-primary">{userChallenges.length}</p>
              </div>
          </div>
        </div>
        {loadingExtras ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="glass h-32 rounded-2xl animate-pulse" />)}
          </div>
        ) : userChallenges.length === 0 ? (
          <div className="glass rounded-[3rem] p-16 text-center border-dashed border-2 border-primary/20 bg-primary/5">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy size={48} className="text-primary/30" />
            </div>
            <h3 className="font-heading text-xl text-foreground mb-2">O Mural está em branco</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto italic">Explore o mapa e vença desafios!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userChallenges.map(uc => (
              <div key={uc.id} className="relative group perspective">
                  <div className="glass rounded-[2rem] p-6 border border-primary/20 bg-gradient-to-br from-indigo-950/20 to-transparent hover:border-primary/50 transition-all duration-500 overflow-hidden">
                      <div className="absolute top-4 right-4 p-1.5 bg-green-500/20 rounded-full text-green-500"><CheckCircle2 size={14} /></div>
                      <div className="space-y-4 relative z-10">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/10"><Star size={24} /></div>
                          <div>
                              <h4 className="font-heading text-lg text-foreground mb-1 line-clamp-1">{uc.challenges?.title || "Desafio Místico"}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed italic">"{uc.challenges?.description}"</p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-primary/30 text-primary">+{uc.challenges?.xp_reward} XP</Badge>
                              <span className="text-[10px] text-muted-foreground font-mono">{new Date(uc.completed_at || uc.created_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                      </div>
                  </div>
              </div>
            ))}
          </div>
        )}
        <div className="pt-10">
          <h3 className="font-heading text-sm text-primary mb-6 flex items-center gap-2 uppercase tracking-widest"><Crown size={16} /> Graus de Prestígio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl">🏅</div>
              <div><p className="font-heading text-sm text-yellow-400">Veterano de Hogwarts</p><p className="text-[10px] text-muted-foreground">XP Total</p></div>
            </div>
            {profile.vip_plan && (
              <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl">✨</div>
                  <div><p className="font-heading text-sm text-purple-400">Membro Honorário</p><p className="text-[10px] text-muted-foreground">{profile.vip_plan.toUpperCase()}</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else if (activeTab === "inventory") {
    tabContent = (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-foreground">🎒 Itens do Inventário</h2>
          <span className="text-xs text-muted-foreground">{userItems.length} Itens Adquiridos</span>
        </div>
        {loadingExtras ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="glass aspect-square rounded-2xl animate-pulse" />)}
          </div>
        ) : userItems.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center border-dashed border-2 border-border/50">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground text-sm italic">O baú está vazio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {userItems.map(ui => {
              const item = ui.store_items;
              if (!item) return null;
              const isEquipped = ui.is_equipped;
              return (
                <div key={ui.id} className={`group glass rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 ${isEquipped ? 'border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]' : 'border-border/50 hover:border-primary/40'}`}>
                  <div className="relative aspect-square">
                    <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" fallbackEmoji="📦" />
                    {isEquipped && <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest z-10">Equipado</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-3 gap-2">
                       <Button size="sm" variant={isEquipped ? "outline" : "magical"} className="w-full h-7 text-[10px] rounded-lg" onClick={() => toggleEquip(ui.id, isEquipped)}>
                          {isEquipped ? "Desequipar" : "Equipar"}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <h4 className="font-heading text-xs text-foreground truncate">{item.name}</h4>
                    <p className="text-[10px] text-primary uppercase tracking-tighter mt-1">{item.category}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    );
  } else if (activeTab === "security" && isMe) {
    tabContent = (
      <div className="glass rounded-2xl p-6">
        <h2 className="font-heading text-xl text-foreground mb-1">🔐 Segurança</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm mx-auto">
          <div>
            <label className="text-xs font-heading text-muted-foreground block mb-1">Nova Senha</label>
            <Input type="password" placeholder="Mínimo 6 caracteres..." value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="magical" className="w-full" disabled={savingPassword || !newPassword.trim()}>
            {savingPassword ? "Atualizando..." : "Salvar Nova Senha"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className={`fixed inset-0 pointer-events-none opacity-[0.07] transition-all duration-[2000ms] ease-in-out z-0 ${
        profile.house === 'gryffindor' ? 'bg-red-600' :
        profile.house === 'slytherin' ? 'bg-green-600' :
        profile.house === 'ravenclaw' ? 'bg-blue-600' : 'bg-yellow-600'
      }`} />
      
      <div className="relative z-20 flex gap-2 md:gap-4 border-b border-white/5 mb-10 overflow-x-auto pb-4 scrollbar-hide whitespace-nowrap px-2">
        {(["about", "fichas", "friends", "members", "album", "achievements", "inventory", "referral", "security"] as const).map((tab) => {
           const labels: any = { about: "Sobre", fichas: "Fichas 📜", friends: `Amigos (${friends.length})`, members: "Membros 👥", album: "Álbum", achievements: "Conquistas 🏆", inventory: "Inventário 🎒", referral: "Recrutamento", security: "Segurança" };
           if (!isMe && (tab === "security" || tab === "referral")) return null;
           return (
            <button key={tab} onClick={() => { setActiveTab(tab); setEditing(false); }} className={`px-6 py-3 font-heading text-[10px] tracking-[0.3em] uppercase transition-all duration-500 rounded-2xl border ${activeTab === tab ? "bg-primary text-white border-primary shadow-lg scale-105" : "text-white/30 border-transparent hover:text-white hover:bg-white/5"}`}>
              {labels[tab]}
            </button>
           )
        })}
      </div>

      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-white/[0.08] to-black/60 backdrop-blur-3xl p-8 md:p-12 border border-white/10 shadow-2xl text-center group">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8 group/avatar">
            <div className="w-32 h-32 md:w-40 h-40 shrink-0 relative z-10">
              <SafeImage src={profile.avatar_url} alt={profile.full_name} className="w-full h-full rounded-full object-cover border-2 border-white/10 shadow-inner" fallbackText={profile.full_name[0]} />
            </div>
            <div className="absolute -bottom-2 -right-2 z-20 scale-125 md:scale-150">
              <HouseCrest house={profile.house as House} size="sm" />
            </div>
            {isMe && (
              <label className="absolute -top-2 -right-2 z-20 w-10 h-10 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center cursor-pointer border border-white/20">
                <Sparkles size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
            )}
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="font-heading text-3xl md:text-5xl text-gold-gradient tracking-tight flex items-center justify-center gap-4 flex-wrap">
                  {profile.full_name}
                  <MedalBadge xp={profile.xp} />
                </h1>
                <p className="text-primary/60 font-heading text-lg tracking-widest uppercase opacity-80">@{profile.username}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {profile.vip_plan && (
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white font-heading text-xs shadow-lg uppercase">
                    <Crown size={14} /> {profile.vip_plan}
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-heading text-[10px] tracking-widest">
                   {isUserOnline(profile) ? "● ONLINE" : "○ OFFLINE"}
                </div>
              </div>

              <div className="max-w-lg mx-auto py-4">
                <p className="text-lg text-white/70 font-serif italic leading-relaxed">{profile.bio || "Este bruxo ainda não escreveu sua lenda..."}</p>
              </div>

              {isMe && (
                <div className="inline-flex items-center gap-4 px-8 py-4 rounded-[2rem] bg-gradient-to-b from-yellow-500/10 to-black/60 border border-yellow-500/20 shadow-lg group/galeon">
                  <div className="text-left">
                     <p className="text-[9px] text-yellow-500/60 font-heading uppercase tracking-[0.4em]">Cofre em Gringotes</p>
                     <p className="text-3xl font-heading text-yellow-400 tracking-tighter leading-none mt-1">
                        {((profile as any).galeons || 0).toLocaleString("pt-BR")}
                        <span className="text-[10px] ml-2 opacity-60 uppercase tracking-widest font-heading">Galeões</span>
                     </p>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap justify-center gap-4 pt-6">
                {isMe ? (
                  <>
                    <button onClick={startEdit} className="px-8 py-3 rounded-2xl bg-primary text-white font-heading text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">EDITAR PERFIL</button>
                    {isAdmin && (
                      <button onClick={() => setAdminEditModal(true)} className="px-8 py-3 rounded-2xl bg-white/5 border border-primary/40 text-primary font-heading text-sm tracking-widest hover:bg-primary/10 transition-all">EDIÇÃO SUPREMA</button>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate(`/dashboard/dm/${profile.user_id}`)} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/20 text-white font-heading text-sm tracking-widest hover:bg-white/10 transition-all">ENVIAR CORUJA</button>
                    {friendship?.status === "accepted" ? (
                      <div className="flex gap-2">
                        <div className="px-6 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-500 font-heading text-sm tracking-widest">AMIGO ✓</div>
                        <button onClick={handleRemoveFriend} className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all"><Users size={20} /></button>
                      </div>
                    ) : friendship?.status === "pending" && friendship.friend_id === user?.id ? (
                      <div className="flex gap-2">
                        <button onClick={handleAcceptFriend} className="px-6 py-3 rounded-2xl bg-primary text-white font-heading text-sm tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">ACEITAR ✓</button>
                        <button onClick={handleRejectFriend} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">RECUSAR</button>
                      </div>
                    ) : (
                      <button onClick={handleAddFriend} className="px-8 py-3 rounded-2xl bg-primary text-white font-heading text-sm tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">ADICIONAR AMIGO +</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-md mx-auto text-left">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-heading text-muted-foreground block mb-1">Nome completo</label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-heading text-muted-foreground block mb-1">@Username</label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-heading text-muted-foreground block mb-1">Aniversário</label>
                    <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-heading text-muted-foreground block mb-1">Idade</label>
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 11 })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-heading text-muted-foreground block mb-1">Bio</label>
                  <textarea value={form.bio} maxLength={200} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground focus:outline-none min-h-[100px] border border-white/5" />
                </div>
              </div>
              <div className="flex gap-2 justify-center pt-4">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="rounded-xl px-8">Cancelar</Button>
                <Button variant="magical" size="sm" onClick={save} disabled={saving} className="rounded-xl px-8">{saving ? "Salvando..." : "Salvar"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {tabContent}
      </div>

      {adminEditModal && profile && (
        <AdminMemberModal
          memberId={profile.user_id}
          memberName={profile.full_name}
          onClose={() => setAdminEditModal(false)}
          onSaved={() => {
            if (isMe) window.location.reload();
            else loadTargetProfile();
          }}
        />
      )}
    </div>
  );
}
