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
import { Info, Users, Search, Scroll, Book, Lock, Trophy, ShoppingBag, Flame, Sparkles, Star, CheckCircle2, Crown } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import RecruitmentWidget from "@/components/RecruitmentWidget";
import MagicalIcon from "@/components/MagicalIcon";

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
                // Reload friendships after action
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
// -----------------------------------------------------------------------

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
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
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
    
    // Check friendship status
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

  const handleBlockUser = async () => {
    if (!user || !targetProfile) return;
    if (friendship) {
      await supabase.from("friendships").delete().eq("id", friendship.id);
    }
    const { data, error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: targetProfile.user_id,
      status: "blocked",
    }).select().single();
    if (error) return toast.error("Erro ao bloquear.");
    setFriendship(data);
    toast.success("Usuário bloqueado. 🚫");
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

  const handleUnblock = async () => {
    if (!friendship) return;
    const { error } = await supabase.from("friendships").delete().eq("id", friendship.id);
    if (!error) {
      setFriendship(null);
      toast.success("Desbloqueado.");
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
    // Only update avatar_url from the URL field if it was changed
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── HOUSE THEMED BACKGROUND OVERLAY ── */}
      <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 opacity-30 ${
        profile.house === 'gryffindor' ? 'bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.15),transparent_70%)]' :
        profile.house === 'slytherin' ? 'bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15),transparent_70%)]' :
        profile.house === 'ravenclaw' ? 'bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.15),transparent_70%)]' :
        'bg-[radial-gradient(circle_at_center,_rgba(217,119,6,0.15),transparent_70%)]'
      }`} />
      
      {/* Abas */}
      <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto pb-1 scrollbar-hide whitespace-nowrap relative z-10">
        <button 
          onClick={() => { setActiveTab("about"); setEditing(false); }} 
          className={`pb-2 font-heading text-sm transition-colors ${activeTab === "about" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Sobre
        </button>
        <button
          onClick={() => { setActiveTab("friends"); setEditing(false); }}
          className={`pb-2 font-heading text-sm transition-colors ${activeTab === "friends" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Amigos ({friends.length})
        </button>
        <button
          onClick={() => { setActiveTab("members"); setEditing(false); }}
          className={`pb-2 font-heading text-sm transition-colors ${activeTab === "members" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          👥 Membros
        </button>
        <button 
          onClick={() => { setActiveTab("fichas"); setEditing(false); }} 
          className={`pb-2 font-heading text-sm transition-colors ${activeTab === "fichas" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Fichas 📜
        </button>
        <button 
          onClick={() => { setActiveTab("album"); setEditing(false); }} 
          className={`pb-2 font-heading text-sm transition-colors shrink-0 ${activeTab === "album" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Álbum
        </button>
        <button 
          onClick={() => { setActiveTab("achievements"); setEditing(false); }} 
          className={`pb-2 font-heading text-sm transition-colors shrink-0 ${activeTab === "achievements" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          🏆 Conquistas
        </button>
        <button 
          onClick={() => { setActiveTab("inventory"); setEditing(false); }} 
          className={`pb-2 font-heading text-sm transition-colors shrink-0 ${activeTab === "inventory" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          🎒 Inventário
        </button>
        {isMe && (
          <button 
            onClick={() => { setActiveTab("referral"); setEditing(false); }} 
            className={`pb-2 font-heading text-sm transition-colors shrink-0 ${activeTab === "referral" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Recrutamento
          </button>
        )}
        {isMe && (
          <button 
            onClick={() => { setActiveTab("security"); setEditing(false); }} 
            className={`pb-2 font-heading text-sm transition-colors shrink-0 ${activeTab === "security" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Segurança
          </button>
        )}
        {(isMe && (isAdmin || profile?.username === 'morpheus')) && (
          <button 
            onClick={() => navigate("/dashboard/matrix")} 
            className="pb-2 font-heading text-sm transition-colors shrink-0 text-cyan-400 hover:text-cyan-300 flex items-center gap-2 animate-pulse"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            Revolution
          </button>
        )}
      </div>

      <div className="glass rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden border-2 border-primary/20 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        {/* Floating Magic Dust */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-float-slow blur-[1px]" />
           <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-float-slow delay-700 blur-[1px]" />
           <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-white/50 rounded-full animate-float-slow delay-1000 blur-[2px]" />
        </div>

        <div className="relative inline-block mb-8">
          <div className="w-24 h-24 shrink-0 mx-auto">
            <SafeImage
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-full h-full rounded-full object-cover animate-pulse-glow"
              fallbackText={profile.full_name[0]}
            />
          </div>
          <div className="absolute -bottom-1 -right-1">
            <HouseCrest house={profile.house as House} size="sm" />
          </div>
          {isMe && (
            <label className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" title="Trocar foto">
              📷
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          )}
        </div>

        {!editing ? (
          <>
            <h1 className="font-heading text-2xl text-foreground flex items-center justify-center gap-2 flex-wrap">
              {profile.full_name}
              <MedalBadge xp={profile.xp} />
              {/* Badge VIP */}
              {profile.vip_plan === "founder" && (
                <span className="text-xs font-heading px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 text-black">👑 Fundador</span>
              )}
              {profile.vip_plan === "vip" && (
                <span className="text-xs font-heading px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 text-white">🥇 VIP</span>
              )}
              {profile.vip_plan === "premium" && (
                <span className="text-xs font-heading px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white">✨ Premium</span>
              )}
              {profile.username === 'morpheus' && (
                <span className="text-xs font-heading px-3 py-1 rounded-full bg-black border border-cyan-500 text-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse">
                  [ THE_ARCHITECT ]
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            <p className="text-sm text-muted-foreground mt-3 font-serif italic">{profile.bio || "Sem bio ainda..."}</p>
            {/* Saldo de Galeões — visível apenas no próprio perfil */}
            {isMe && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-900/10 text-yellow-400 text-sm font-heading">
              <span className="flex items-center gap-2">
                <MagicalGaleon size="xs" /> {((profile as any).galeons || 0).toLocaleString("pt-BR")} Galeões
              </span>
              </div>
            )}
            
            <div className="mt-4 flex justify-center gap-2">
              {isMe ? (
                <>
                  <Button variant="magical" size="sm" className="font-heading text-xs" onClick={startEdit}>
                    ✏️ Editar perfil
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="font-heading text-xs text-primary border-primary hover:bg-primary/10" onClick={() => setAdminEditModal(true)}>
                      🪄 Edição Suprema (Admin)
                    </Button>
                  )}
                </>
              ) : (
                <>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="font-heading text-xs text-primary border-primary hover:bg-primary/10" onClick={() => setAdminEditModal(true)}>
                    🪄 Edição Suprema (Admin)
                  </Button>
                )}
                {/* Botão de MENSAGEM sempre visível para qualquer perfil que não seja o meu */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/dm/${profile.user_id}`)}
                >
                  💬 Mensagem
                </Button>

                {/* Botoes de amizade conforme estado */}
                {friendship?.status === "blocked" && friendship.user_id === user?.id ? (
                  <Button variant="outline" size="sm" onClick={handleUnblock}>Desbloquear</Button>
                ) : friendship?.status === "accepted" ? (
                  <>
                    <Button variant="outline" size="sm" className="text-green-500 border-green-500/30">✓ Amigos</Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={handleRemoveFriend}>Desfazer</Button>
                  </>
                ) : friendship?.status === "pending" && friendship.friend_id === user?.id ? (
                  <>
                    <Button variant="magical" size="sm" onClick={handleAcceptFriend}>Aceitar ✅</Button>
                    <Button variant="outline" size="sm" onClick={handleRejectFriend}>Recusar ❌</Button>
                  </>
                ) : friendship?.status === "pending" && friendship.user_id === user?.id ? (
                  <Button variant="outline" size="sm" onClick={handleRemoveFriend}>Cancelar ⏳</Button>
                ) : (
                  <>
                    <Button variant="magical" size="sm" onClick={handleAddFriend}>Adicionar Amigo +</Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={handleBlockUser}>Bloquear 🚫</Button>
                  </>
                )}
              </>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Nome completo</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">@Username</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Data de Nascimento (Aniversário)</label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className="bg-secondary/50 border-border" />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Idade</label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 11 })} />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Bio</label>
              <textarea
                value={form.bio}
                maxLength={200}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none min-h-[80px]"
              />
            </div>
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">📷 Foto de Perfil</label>
              {/* Upload de arquivo — botão grande e visível */}
              <label className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-sm font-heading text-primary mb-2">
                {uploading ? "⏳ Fazendo upload..." : "📁 Clique aqui para fazer upload da sua foto"}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
              <p className="text-[10px] text-muted-foreground text-center mb-2">ou cole o link direto abaixo ↓</p>
              <div className="flex gap-2 items-center">
                <Input
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  className="flex-1"
                />
                {form.avatar_url && (
                  <div className="w-10 h-10 shrink-0">
                    <SafeImage 
                      src={form.avatar_url} 
                      alt="preview" 
                      className="w-full h-full rounded-full object-cover border border-border" 
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button variant="magical" size="sm" onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        )}
      </div>

      {activeTab === "about" ? (
        <>
          <div className="grid grid-cols-4 gap-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xl font-heading text-primary">{profile.xp}</p>
              <p className="text-[8px] text-muted-foreground uppercase">XP Total</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xl font-heading text-foreground">{levelInfo.level}</p>
              <p className="text-[8px] text-muted-foreground uppercase">Nível</p>
            </div>
            <div className="glass rounded-xl p-4 text-center border-blue-500/20 bg-blue-500/5">
              <p className="text-xl font-heading text-blue-400">{Math.floor(profile.xp / 10 + userItems.length * 50)}</p>
              <p className="text-[8px] text-blue-300/60 uppercase">Força Mágica</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xl font-heading text-foreground">{userBadges.length}</p>
              <p className="text-[8px] text-muted-foreground uppercase">Badges</p>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">Progresso</h3>
            <XPBar xp={profile.xp} />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {levelInfo.name} → Faltam {levelInfo.next - profile.xp} XP para o próximo nível
            </p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <HouseCrest house={profile.house} size="md" />
              <div>
                <h3 className="font-heading text-foreground">{house.name}</h3>
                <p className="text-xs text-muted-foreground italic font-serif">"{house.motto}"</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">Informações</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Idade</span>
                <span className="text-foreground">{profile.age} anos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Membro desde</span>
                <span className="text-foreground">{new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{isUserOnline(profile) ? "🟢 Online" : "⚫ Offline"}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">Coleção Borgin & Burkes</h3>
            {userBadges.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center italic py-2">Nenhuma insígnia adquirida ainda.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {userBadges.map(badge => (
                  <div key={badge.id} className="bg-secondary/50 rounded-lg p-2 flex items-center justify-center gap-2 border border-border" title={badge.name}>
                    <span className="text-2xl drop-shadow-md">{badge.icon}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeTab === "friends" ? (
        <div className="space-y-4">
          <h2 className="font-heading text-xl text-foreground">Amigos de {profile.full_name}</h2>
          {friends.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-4xl mb-3">🤝</p>
              <p className="text-muted-foreground text-sm">Nenhum amigo adicionado ainda.</p>
              <button
                onClick={() => setActiveTab("members")}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Ver todos os membros para adicionar →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map(f => f && (
                <MemberCard
                  key={f.user_id}
                  member={{ ...f, online: isUserOnline(f) }}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "members" ? (
        <MembersTab currentUserId={user?.id} />
      ) : activeTab === "fichas" ? (
        <CharacterSheetView userId={profile.user_id} isOwner={isMe} />
      ) : activeTab === "album" ? (
        <ProfileAlbum userId={profile.user_id} />
      ) : activeTab === "referral" && isMe ? (
        <div className="space-y-8">
          <RecruitmentWidget />
          
          <div className="glass rounded-[2.5rem] p-8 border border-white/5">
            <h3 className="font-heading text-lg text-foreground mb-6 flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" /> Bruxos que você recrutou ({referrals.length})
            </h3>
            
            {referrals.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm italic">
                Sua lista de recrutamento está vazia. Comece a espalhar a magia!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map(r => (
                  <div key={r.id} className="glass rounded-2xl p-4 flex items-center gap-4 border border-white/5 bg-black/20">
                    <div className="w-12 h-12 shrink-0 rounded-full border-2 border-primary/20 p-0.5">
                      <SafeImage 
                        src={r.profile?.avatar_url} 
                        alt={r.profile?.full_name || "Membro"} 
                        className="w-full h-full rounded-full object-cover" 
                        fallbackText={r.profile?.full_name?.[0]}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading text-foreground truncate">{r.profile?.full_name}</p>
                      <p className="text-[10px] uppercase tracking-wider">
                        {r.status === 'completed' ? <span className="text-green-500 font-bold">✓ RECUTADO</span> : <span className="text-amber-500/60">⏳ EM TREINAMENTO</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "achievements" ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="glass h-48 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : userChallenges.length === 0 ? (
            <div className="glass rounded-[3.5rem] p-20 text-center border-dashed border-2 border-primary/20 bg-primary/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_70%)]" />
              <div className="w-28 h-28 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                <Trophy size={56} className="text-primary/20" />
              </div>
              <h3 className="font-heading text-2xl text-foreground mb-3 tracking-tight italic">O Mural das Glórias está vazio</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto font-serif leading-relaxed">
                "As lendas de Hogwarts não nascem, elas são forjadas no fogo dos desafios. Comece sua jornada agora."
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userChallenges.map(uc => (
                <div key={uc.id} className="relative group perspective h-full">
                    <div className="h-full glass rounded-[2.5rem] p-8 border border-white/5 bg-gradient-to-br from-indigo-950/20 to-transparent hover:border-primary/40 transition-all duration-700 hover:-translate-y-2 shadow-xl hover:shadow-primary/10 overflow-hidden relative">
                        {/* Status Check - Floating Badge */}
                        <div className="absolute top-6 right-6 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-2xl backdrop-blur-md z-20">
                            <CheckCircle2 size={12} /> CONQUISTADO
                        </div>
                        
                        {/* Golden Aura for big rewards */}
                        {(uc.challenges?.xp_reward || 0) >= 100 && (
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl group-hover:bg-yellow-400/10 transition-all" />
                        )}

                        <div className="space-y-6 relative z-10 flex flex-col h-full">
                            <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                                <Star size={28} className="fill-primary/20" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-heading text-xl text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{uc.challenges?.title || "Desafio Místico"}</h4>
                                <p className="text-xs text-muted-foreground font-serif italic leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">
                                    "{uc.challenges?.description}"
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-5 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-heading text-primary uppercase tracking-[0.2em] font-bold">+{uc.challenges?.xp_reward} XP</span>
                                </div>
                                <span className="text-[10px] text-white/20 font-mono italic">
                                    {new Date(uc.completed_at || uc.created_at).toLocaleDateString("pt-BR")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}

          {/* Seção de Medalhas de Nível */}
          <div className="pt-10">
            <h3 className="font-heading text-sm text-primary mb-6 flex items-center gap-2 uppercase tracking-widest">
               <Crown size={16} /> Graus de Prestígio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl">🏅</div>
                <div>
                  <p className="font-heading text-sm text-yellow-400">Veterano de Hogwarts</p>
                  <p className="text-[10px] text-muted-foreground">Conquistado pelo seu XP total</p>
                </div>
              </div>
              
              {profile.vip_plan && (
                <div className="glass rounded-2xl p-5 flex items-center gap-4 border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-2xl">✨</div>
                    <div>
                        <p className="font-heading text-sm text-purple-400">Membro Honorário</p>
                        <p className="text-[10px] text-muted-foreground">Assinante do Plano {profile.vip_plan.toUpperCase()}</p>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "inventory" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-foreground">🎒 Mochila de Relíquias</h2>
          </div>
          {loadingExtras ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="glass aspect-[3/4] rounded-[2rem] animate-pulse" />)}
            </div>
          ) : userItems.length === 0 ? (
            <div className="glass rounded-[3.5rem] p-24 text-center border-dashed border-2 border-white/10 bg-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_70%)]" />
              <div className="w-28 h-28 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl group-hover:rotate-6 transition-transform duration-700">
                <ShoppingBag size={56} className="text-white/10" />
              </div>
              <h3 className="font-heading text-2xl text-foreground mb-3 italic">O Baú de Relíquias está Trancado</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto font-serif leading-relaxed opacity-60">
                "Equipamentos lendários e artefatos de poder esperam por você em Gringotts. Não ande desarmado pelo castelo."
              </p>
              <Button variant="ghost" className="mt-8 text-primary uppercase tracking-[0.2em] font-bold text-[10px] hover:underline" onClick={() => navigate("/dashboard/shop")}>
                Visitar Gringotts Store →
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {userItems.map(ui => {
                const item = ui.store_items;
                if (!item) return null;
                const isEquipped = (ui as any).is_equipped;
                const stats = (item as any).stats;
                const rarityColor = item.rarity === 'legendary' ? 'border-yellow-400/50 shadow-yellow-400/20' : 
                                  item.rarity === 'epic' ? 'border-purple-500/50 shadow-purple-500/20' : 
                                  'border-white/10 shadow-white/5';

                return (
                  <div key={ui.id} className={`group glass rounded-[2rem] overflow-hidden border transition-all duration-700 hover:-translate-y-3 flex flex-col h-full ${
                      isEquipped ? 'border-primary ring-2 ring-primary/20 shadow-2xl' : rarityColor
                  }`}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <SafeImage 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000"
                        fallbackEmoji="📦"
                      />
                      {isEquipped && (
                          <div className="absolute top-4 left-4 bg-primary text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest z-10 shadow-2xl animate-pulse">
                              EQUIPADO
                          </div>
                      )}
                      
                      {/* Rarity Flare */}
                      {item.rarity === 'legendary' && (
                          <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-end p-5 gap-4 backdrop-blur-[2px]">
                         {stats && (stats.atk > 0 || stats.def > 0 || stats.mana > 0 || stats.hp > 0) && (
                             <div className="grid grid-cols-2 gap-2 w-full">
                                 {stats.atk > 0 && <div className="text-[9px] font-bold text-red-400 bg-black/60 px-2 py-1 rounded-lg border border-red-400/30 text-center">⚔️ +{stats.atk}</div>}
                                 {stats.def > 0 && <div className="text-[9px] font-bold text-blue-400 bg-black/60 px-2 py-1 rounded-lg border border-blue-400/30 text-center">🛡️ +{stats.def}</div>}
                                 {stats.mana > 0 && <div className="text-[9px] font-bold text-indigo-400 bg-black/60 px-2 py-1 rounded-lg border border-indigo-400/30 text-center">✨ +{stats.mana}</div>}
                                 {stats.hp > 0 && <div className="text-[9px] font-bold text-green-400 bg-black/60 px-2 py-1 rounded-lg border border-green-400/30 text-center">❤️ +{stats.hp}</div>}
                             </div>
                          )}
                         <Button 
                            size="sm" 
                            variant={isEquipped ? "outline" : "magical"} 
                            className="w-full h-10 text-[10px] rounded-xl shadow-2xl font-heading"
                            onClick={() => toggleEquip(ui.id, isEquipped)}
                        >
                            {isEquipped ? "DESEQUIPAR" : "EQUIPAR ITEM"}
                        </Button>
                      </div>
                    </div>
                    <div className="p-5 text-center flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading text-sm text-white mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">{item.category}</p>
                      </div>
                      <div className="mt-4 h-1 w-12 bg-white/5 mx-auto rounded-full group-hover:w-20 group-hover:bg-primary/50 transition-all duration-700" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "security" && isMe ? (
        <div className="glass rounded-2xl p-6">
          <h2 className="font-heading text-xl text-foreground mb-1">🔐 Segurança e Acesso</h2>
          <p className="text-sm text-muted-foreground mb-6">Altere sua senha mágica para manter sua conta protegida.</p>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm mx-auto">
            <div>
              <label className="text-xs font-heading text-muted-foreground block mb-1">Nova Senha</label>
              <Input 
                type="password" 
                placeholder="No mínimo 6 caracteres..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="magical" className="w-full" disabled={savingPassword || !newPassword.trim()}>
              {savingPassword ? "Atualizando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </div>
      ) : null}

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
