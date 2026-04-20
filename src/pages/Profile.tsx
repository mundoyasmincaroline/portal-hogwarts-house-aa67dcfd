import { useState, useEffect } from "react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, getLevelFromXP, type House } from "@/lib/store";
import HouseCrest from "@/components/HouseCrest";
import XPBar from "@/components/XPBar";
import MedalBadge, { getMedalForXP } from "@/components/MedalBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import ProfileAlbum from "@/components/ProfileAlbum";
import CharacterSheetView from "@/components/CharacterSheetView";
import MemberCard from "@/components/MemberCard";
import { Search } from "lucide-react";

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
  const { profile: currentUserProfile, user, updateProfile, updatePassword } = useAuth();
  
  const [targetProfile, setTargetProfile] = useState<any>(null);
  const [friendship, setFriendship] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "fichas" | "friends" | "members" | "security" | "album" | "referral">("about");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);

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
    } else if (userId) {
      loadTargetProfile();
      loadFriends(userId);
      loadReferrals(userId);
      loadBadges(userId);
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
      {/* Abas */}
      <div className="flex gap-4 border-b border-border mb-6">
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
          className={`pb-2 font-heading text-sm transition-colors ${activeTab === "album" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          Álbum
        </button>
        {isMe && (
          <button 
            onClick={() => { setActiveTab("referral"); setEditing(false); }} 
            className={`pb-2 font-heading text-sm transition-colors ${activeTab === "referral" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Recrutamento
          </button>
        )}
        {isMe && (
          <button 
            onClick={() => { setActiveTab("security"); setEditing(false); }} 
            className={`pb-2 font-heading text-sm transition-colors ${activeTab === "security" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Segurança
          </button>
        )}
      </div>

      <div className="glass rounded-2xl p-8 text-center">
        <div className="relative inline-block mb-4">
          {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover animate-pulse-glow" onError={(e) => { e.currentTarget.style.display='none'; }} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary flex items-center justify-center text-4xl font-heading text-primary animate-pulse-glow">
              {profile.full_name[0]}
            </div>
          )}
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
            </h1>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            <p className="text-sm text-muted-foreground mt-3 font-serif italic">{profile.bio || "Sem bio ainda..."}</p>
            {/* Saldo de Galeões — visível apenas no próprio perfil */}
            {isMe && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-900/10 text-yellow-400 text-sm font-heading">
                🪙 {((profile as any).galeons || 0).toLocaleString("pt-BR")} Galeões
              </div>
            )}
            
            <div className="mt-4 flex justify-center gap-2">
              {isMe ? (
                <Button variant="magical" size="sm" className="font-heading text-xs" onClick={startEdit}>
                  ✏️ Editar perfil
                </Button>
              ) : (
                <>
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
                  <img src={form.avatar_url} alt="preview" className="w-10 h-10 rounded-full object-cover border border-border" onError={(e) => (e.currentTarget.style.display = 'none')} />
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
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-heading text-primary">{profile.xp}</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-heading text-foreground">{levelInfo.level}</p>
              <p className="text-xs text-muted-foreground">Nível</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-heading text-foreground">{getMedalForXP(profile.xp) ? 1 : 0}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
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
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 text-center border border-primary/20 bg-primary/5">
            <h2 className="font-heading text-xl text-primary mb-2">Seu Link de Convite Mágico</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Convide novos bruxos e ganhe <strong>500 XP</strong> assim que eles chegarem ao Nível 2!
            </p>
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <Input readOnly value={profile.username} className="text-center font-bold text-lg bg-background" />
              <Button variant="magical" onClick={() => {
                navigator.clipboard.writeText(`Entre na Hogwarts House e use meu código de convite: ${profile.username}`);
                toast.success("Código copiado!");
              }}>Copiar</Button>
            </div>
          </div>

          <h3 className="font-heading text-lg text-foreground mt-8">Bruxos que você recrutou ({referrals.length})</h3>
          
          {referrals.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">
              Você ainda não recrutou ninguém. Compartilhe seu código!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {referrals.map(r => (
                <div key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
                  {r.profile?.avatar_url ? (
                    <img src={r.profile.avatar_url} alt={r.profile.full_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary">
                      {r.profile?.full_name?.[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading text-foreground truncate">{r.profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.status === 'completed' ? <span className="text-green-500">✅ 500 XP Ganhos</span> : <span className="text-amber-500">⏳ Pendente (Aguardando Nv. 2)</span>}
                    </p>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
