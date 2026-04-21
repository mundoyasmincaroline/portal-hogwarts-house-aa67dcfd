import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import SafeImage from "@/components/SafeImage";
import { House } from "@/lib/store";
import { UserPlus, UserCheck, Heart, Users } from "lucide-react";

interface Character {
  id: string;
  full_name: string;
  avatar_url: string | null;
  house: string;
  character_type: string;
  user_id: string;
}

interface InstaPost {
  id: string;
  user_id: string;
  character_id: string | null;
  image_url: string;
  caption: string;
  spotify_uri?: string;
  likes: string[];
  created_at: string;
  characters: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    house: string;
    character_type: string;
    user_id: string;
  } | null;
  profiles: {
    full_name: string;
    username: string;
    house: House;
    avatar_url: string | null;
  };
}

const XP_LIKE = 5;
const XP_FOLLOW_USER = 30;
const XP_FOLLOW_CHAR = 15;

export default function InstaHogwarts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [spotifyUri, setSpotifyUri] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // User follows (by user_id)
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  // Character follows (by character_id)
  const [followedCharIds, setFollowedCharIds] = useState<Set<string>>(new Set());
  // Character follower counts
  const [charFollowCounts, setCharFollowCounts] = useState<Record<string, number>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchMyChars();
      fetchFollowed();
      fetchCharFollows();
    }
  }, [user]);

  const fetchMyChars = async () => {
    const { data } = await supabase.from("characters").select("id, full_name, avatar_url, house, character_type, user_id").eq("user_id", user!.id);
    if (data && data.length > 0) {
      setMyChars(data);
      setSelectedCharId(data[0].id);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("insta_posts")
      .select("*, characters(id, full_name, avatar_url, house, character_type, user_id), profiles(full_name, username, house, avatar_url)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as unknown as InstaPost[]);
    setLoading(false);
  };

  const fetchFollowed = async () => {
    const { data } = await supabase.from("insta_follows").select("followed_user_id").eq("follower_user_id", user!.id);
    if (data) setFollowedUserIds(new Set(data.map(f => f.followed_user_id)));
  };

  const fetchCharFollows = async () => {
    // Fetch character follows
    const { data } = await supabase.from("insta_character_follows").select("followed_char_id").eq("follower_user_id", user!.id);
    if (data) setFollowedCharIds(new Set(data.map(f => f.followed_char_id)));

    // Fetch follow counts for all chars in posts
    const { data: counts } = await supabase.from("insta_character_follows").select("followed_char_id");
    if (counts) {
      const countMap: Record<string, number> = {};
      counts.forEach(c => {
        countMap[c.followed_char_id] = (countMap[c.followed_char_id] || 0) + 1;
      });
      setCharFollowCounts(countMap);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !selectedCharId) {
      if (!selectedCharId) toast.error("Selecione um personagem para postar!");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
    setUploading(true);

    const ext = selectedFile.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(`${user.id}/instaposts/${fileName}`, selectedFile, { upsert: true });
    if (upErr) { toast.error("Erro no upload."); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(`${user.id}/instaposts/${fileName}`);
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: insertErr } = await supabase.from("insta_posts").insert({
      user_id: user.id,
      character_id: selectedCharId || null,
      image_url: bustedUrl,
      caption,
      spotify_uri: spotifyUri || null,
    } as never);

    if (insertErr) { toast.error(insertErr.message); }
    else {
      toast.success("Publicado no Insta Hogwarts! ✨");
      setSelectedFile(null);
      setCaption("");
      setSpotifyUri("");
      await supabase.rpc("award_xp_action", { _action: "insta_post", _user_id: user.id, _xp: 10 });
      fetchPosts();
    }
    setUploading(false);
  };

  const toggleLike = async (post: InstaPost) => {
    if (!user) return;
    const hasLiked = post.likes.includes(user.id);
    const newLikes = hasLiked
      ? post.likes.filter(id => id !== user.id)
      : [...post.likes, user.id];

    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    await supabase.from("insta_posts").update({ likes: newLikes } as never).eq("id", post.id);

    if (!hasLiked && post.user_id !== user.id) {
      await supabase.rpc("award_xp_action", { _action: "insta_like", _user_id: post.user_id, _xp: XP_LIKE });
    }
  };

  // Follow user (not character)
  const toggleFollowUser = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;
    const isFollowing = followedUserIds.has(targetUserId);

    if (isFollowing) {
      await supabase.from("insta_follows").delete().eq("follower_user_id", user.id).eq("followed_user_id", targetUserId);
      setFollowedUserIds(prev => { const s = new Set(prev); s.delete(targetUserId); return s; });
    } else {
      await supabase.from("insta_follows").insert({ follower_user_id: user.id, followed_user_id: targetUserId } as never);
      setFollowedUserIds(prev => new Set([...prev, targetUserId]));
      await supabase.rpc("award_xp_action", { _action: "insta_follow", _user_id: targetUserId, _xp: XP_FOLLOW_USER });
      toast.success(`Seguindo! +${XP_FOLLOW_USER} XP para este membro ✨`);
    }
  };

  // Follow character
  const toggleFollowChar = async (charId: string, charOwnerId: string) => {
    if (!user || charOwnerId === user.id) return;
    const isFollowing = followedCharIds.has(charId);

    if (isFollowing) {
      await supabase.from("insta_character_follows").delete().eq("follower_user_id", user.id).eq("followed_char_id", charId);
      setFollowedCharIds(prev => { const s = new Set(prev); s.delete(charId); return s; });
      setCharFollowCounts(prev => ({ ...prev, [charId]: Math.max(0, (prev[charId] || 1) - 1) }));
    } else {
      await supabase.from("insta_character_follows").insert({ follower_user_id: user.id, followed_char_id: charId } as never);
      setFollowedCharIds(prev => new Set([...prev, charId]));
      setCharFollowCounts(prev => ({ ...prev, [charId]: (prev[charId] || 0) + 1 }));
      if (charOwnerId !== user.id) {
        await supabase.rpc("award_xp_action", { _action: "char_follow", _user_id: charOwnerId, _xp: XP_FOLLOW_CHAR });
        toast.success(`Personagem seguido! +${XP_FOLLOW_CHAR} XP para o criador ⭐`);
      }
    }
  };

  const getPostDisplay = (post: InstaPost) => {
    if (post.characters) {
      return {
        name: post.characters.full_name,
        avatar: post.characters.avatar_url,
        house: post.characters.house as House,
        type: post.characters.character_type === "oc" ? "⭐ OC" : "📖 Canon",
        username: post.profiles?.username || "",
        charId: post.characters.id,
        charOwnerId: post.characters.user_id,
      };
    }
    return {
      name: post.profiles?.full_name || "Bruxo",
      avatar: post.profiles?.avatar_url || null,
      house: post.profiles?.house,
      type: "",
      username: post.profiles?.username || "",
      charId: null,
      charOwnerId: post.user_id,
    };
  };

  const activeChar = myChars.find(c => c.id === selectedCharId);

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3rem] p-10 text-center border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
        <div className="relative z-10 space-y-2">
          <h1 className="font-heading text-4xl text-white tracking-tighter uppercase drop-shadow-2xl">📸 Insta Hogwarts</h1>
          <p className="text-white/30 text-[10px] font-heading uppercase tracking-[0.4em]">O Profeta Fotográfico do Castelo</p>
        </div>
      </div>

      {/* ÁREA DE POSTAGEM - PREMIUM COMPOSER */}
      <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-2xl group transition-all duration-700 hover:border-primary/30">
        {myChars.length === 0 ? (
          <div className="py-6 text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-full mx-auto flex items-center justify-center border border-white/5 opacity-20">
                <Users size={32} />
             </div>
             <p className="text-[10px] font-heading text-white/20 uppercase tracking-widest">Crie uma identidade bruxa para poder postar aqui.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="relative shrink-0 group/avatar">
                  <div className="absolute -inset-1 bg-primary blur-md opacity-20 group-hover/avatar:opacity-50 transition-opacity rounded-2xl" />
                  <SafeImage
                    src={activeChar?.avatar_url}
                    alt={activeChar?.full_name || ""}
                    fallbackEmoji="🧙"
                    className="w-16 h-16 rounded-2xl object-cover border border-white/10 relative z-10 shadow-2xl"
                  />
               </div>
               <div className="flex-1 w-full space-y-2">
                  <p className="text-[10px] font-heading text-primary uppercase tracking-[0.3em] ml-1">Postar como:</p>
                  <select
                    value={selectedCharId}
                    onChange={e => setSelectedCharId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/40 transition-all font-heading tracking-tight"
                  >
                    {myChars.map(c => (
                      <option key={c.id} value={c.id} className="bg-neutral-900 text-white">
                        {c.character_type === "oc" ? "⭐" : "📖"} {c.full_name}
                      </option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="relative group/caption">
               <textarea
                 className="w-full bg-black/40 rounded-[2rem] px-6 py-5 text-base text-white placeholder:text-white/20 focus:outline-none border border-white/5 focus:border-primary/30 transition-all resize-none font-serif italic shadow-inner"
                 placeholder={`O que ${activeChar?.full_name?.split(' ')[0] || "seu bruxo"} está aprontando?`}
                 value={caption}
                 onChange={e => setCaption(e.target.value)}
                 rows={3}
               />
            </div>

            {selectedFile && (
              <div className="relative animate-in zoom-in duration-500">
                <div className="absolute -inset-2 bg-primary/20 blur-2xl rounded-[2.5rem] opacity-50" />
                <img src={URL.createObjectURL(selectedFile)} className="w-full h-64 rounded-[2rem] object-cover border border-white/10 relative z-10 shadow-2xl" />
                <button
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-2xl w-10 h-10 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-20 border border-white/20"
                  onClick={() => setSelectedFile(null)}
                >✕</button>
              </div>
            )}

            <div className="space-y-4">
               <div className="relative group/spotify">
                  <Zap size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/spotify:text-primary transition-colors" />
                  <input
                    placeholder="Link do Spotify ou MP3 (opcional)..."
                    value={spotifyUri}
                    onChange={e => setSpotifyUri(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/30 transition-all"
                  />
               </div>

               <div className="flex justify-between items-center pt-2">
                 <label className="cursor-pointer group/photo">
                    <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 group-hover/photo:bg-white/10 group-hover/photo:border-primary/40 transition-all shadow-inner">
                       <span className="text-xl">📷</span>
                       <span className="text-[10px] font-heading text-white/40 group-hover/photo:text-white tracking-widest uppercase">Anexar Fotografia</span>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.files?.[0] || null)} />
                 </label>
                 <button 
                   disabled={!selectedFile || uploading || !selectedCharId} 
                   onClick={handleUpload}
                   className="px-8 py-3 bg-primary text-white font-heading text-[10px] tracking-[0.3em] rounded-2xl shadow-[0_15px_30px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase"
                 >
                   {uploading ? "TRANSFIGURANDO..." : "PUBLICAR ✨"}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* FEED - MONSTER QUALITY POSTS */}
      <div className="space-y-12">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
             <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 border border-white/5" />
             <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.5em]">Invocando Memórias...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-3xl rounded-[3rem] p-20 text-center border border-white/10 opacity-40">
             <p className="text-[10px] font-heading uppercase tracking-[0.5em]">O Profeta Diário está vazio hoje.</p>
          </div>
        ) : (
          posts.map((post, index) => {
            const disp = getPostDisplay(post);
            const isMyPost = post.user_id === user?.id;
            const isFollowingUser = followedUserIds.has(post.user_id);
            const isFollowingChar = disp.charId ? followedCharIds.has(disp.charId) : false;
            const hasLiked = post.likes.includes(user?.id || "");
            const charFollowers = disp.charId ? (charFollowCounts[disp.charId] || 0) : 0;

            return (
              <div key={post.id} className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group/post animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: `${index * 200}ms` }}>
                {/* House Glow Backdrop */}
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-[0.05] transition-opacity duration-1000 group-hover/post:opacity-[0.12] ${
                   disp.house === 'gryffindor' ? 'bg-red-600' :
                   disp.house === 'slytherin' ? 'bg-green-600' :
                   disp.house === 'ravenclaw' ? 'bg-blue-600' : 'bg-yellow-600'
                }`} />

                {/* Header */}
                <div className="relative z-10 p-6 md:p-8 flex items-center gap-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <div className="relative group/author cursor-pointer shrink-0" onClick={() => navigate(`/dashboard/profile/${post.user_id}`)}>
                    <div className={`absolute -inset-1.5 rounded-2xl blur-lg opacity-20 group-hover/author:opacity-60 transition-opacity ${
                       disp.house === 'gryffindor' ? 'bg-red-500' :
                       disp.house === 'slytherin' ? 'bg-green-500' :
                       disp.house === 'ravenclaw' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <SafeImage
                      src={disp.avatar}
                      alt={disp.name}
                      fallbackText={disp.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10 relative z-10 shadow-2xl group-hover/author:scale-105 transition-transform"
                    />
                    <div className="absolute -bottom-2 -right-2 z-20 scale-125 drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                       {disp.house && <HouseCrest house={disp.house} size="sm" />}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-heading text-lg text-white tracking-tight truncate">{disp.name}</p>
                      {disp.type && <span className="text-[8px] font-heading bg-primary/10 text-primary border border-primary/20 px-3 py-0.5 rounded-full uppercase tracking-widest">{disp.type}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-white/30 font-heading uppercase tracking-widest">@{disp.username}</p>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <p className="text-[10px] text-white/30 font-heading uppercase tracking-widest">
                        {new Date(post.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {disp.charId && charFollowers > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <div className="flex items-center gap-1.5 text-[10px] font-heading text-primary/60 uppercase tracking-widest">
                            <Users size={12} className="opacity-40" />
                            {charFollowers} SEGUIDORES
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!isMyPost && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => toggleFollowUser(post.user_id)}
                        className={`px-4 py-1.5 rounded-xl text-[8px] font-heading uppercase tracking-widest transition-all border ${
                          isFollowingUser
                            ? "bg-white/5 text-white/40 border-white/10 hover:border-red-500/50 hover:text-red-500"
                            : "bg-primary/20 text-primary border-primary/40 hover:bg-primary hover:text-white"
                        }`}
                      >
                        {isFollowingUser ? "Seguindo Bruxo" : "Seguir Bruxo"}
                      </button>
                      {disp.charId && (
                        <button
                          onClick={() => toggleFollowChar(disp.charId!, disp.charOwnerId)}
                          className={`px-4 py-1.5 rounded-xl text-[8px] font-heading uppercase tracking-widest transition-all border ${
                            isFollowingChar
                              ? "bg-white/5 text-white/40 border-white/10"
                              : "bg-amber-500/20 text-amber-400 border-amber-400/40 hover:bg-amber-500 hover:text-black"
                          }`}
                        >
                          {isFollowingChar ? "Seguindo Ficha" : "Seguir Ficha"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Main Content Image - MONSTER QUALITY */}
                <div className="relative aspect-square md:aspect-[4/5] bg-black/60 overflow-hidden group/image cursor-pointer">
                  {/* Premium Glass Frame Overlay */}
                  <div className="absolute inset-0 border-[12px] border-black/20 z-20 pointer-events-none" />
                  <div className="absolute inset-4 border border-white/10 z-20 pointer-events-none" />
                  
                  {/* Cinematic Shadow/Glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 opacity-40 z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)] z-10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-1000" />
                  
                  <SafeImage
                    src={post.image_url}
                    alt="Post"
                    className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-[2000ms]"
                    fallbackEmoji="📸"
                  />
                  
                  {/* 3D Reflection Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover/image:animate-[shimmer_3s_infinite] z-20 pointer-events-none" />

                  {/* Floating Action Hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 z-30 pointer-events-none">
                     <div className="relative">
                        <div className={`absolute -inset-10 blur-3xl opacity-40 rounded-full ${hasLiked ? 'bg-red-500' : 'bg-white'}`} />
                        <Heart size={80} className={`relative z-10 transition-all duration-700 ${hasLiked ? 'scale-110 fill-red-500 text-red-500' : 'scale-90 text-white opacity-40'}`} />
                     </div>
                  </div>
                </div>

                {/* Spotify Player - MONSTER QUALITY */}
                {post.spotify_uri && (
                  <div className="relative px-8 pt-8 -mb-4">
                    <div className="absolute inset-x-12 top-8 h-20 bg-primary/10 blur-[50px] rounded-full opacity-30 pointer-events-none" />
                    <div className="relative z-10 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40 group/spotify-frame">
                       <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/spotify-frame:opacity-100 transition-opacity" />
                       <iframe
                         src={post.spotify_uri.replace("open.spotify.com", "open.spotify.com/embed")}
                         width="100%" height="80" frameBorder="0" allow="encrypted-media"
                         className="relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
                       />
                    </div>
                  </div>
                )}

                {/* Footer Actions - MONSTER QUALITY */}
                <div className="p-10 md:p-12 space-y-8">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggleLike(post)}
                      className={`group/like flex items-center gap-4 transition-all ${hasLiked ? "text-red-500" : "text-white/30 hover:text-red-400"}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                        hasLiked 
                          ? 'bg-red-500/20 border-red-500/40 shadow-[0_10px_30px_rgba(239,68,68,0.4)]' 
                          : 'bg-white/5 border-white/10 group/like:bg-red-500/10 group/like:border-red-500/30'
                      }`}>
                         <Heart size={28} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "animate-heartbeat" : "group/like:scale-110 transition-transform"} />
                      </div>
                      <div className="flex flex-col text-left">
                         <span className="text-2xl font-heading text-white tracking-tighter leading-none">{post.likes.length}</span>
                         <span className="text-[9px] font-heading uppercase tracking-[0.3em] opacity-30">Pulsos de Magia</span>
                      </div>
                    </button>

                    {!hasLiked && !isMyPost && (
                      <div className="px-6 py-2 rounded-full bg-primary/5 border border-primary/20 text-[9px] font-heading text-primary/60 tracking-[0.3em] uppercase animate-pulse">
                         Manifestar +{XP_LIKE} XP
                      </div>
                    )}
                  </div>

                  {post.caption && (
                    <div className="relative p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 group-hover/post:border-white/10 transition-all shadow-inner overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/40 to-transparent" />
                       <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-serif italic relative z-10">
                         "{post.caption}"
                       </p>
                       {/* Decorative Quote Mark */}
                       <span className="absolute -bottom-4 -right-2 text-8xl font-serif text-white/5 italic select-none">"</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
