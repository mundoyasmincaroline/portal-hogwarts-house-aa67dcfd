import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/core/useRealtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/rpg/HouseCrest";
import SafeImage from "@/components/SafeImage";
import { House } from "@/types";
import { UserPlus, UserCheck, Heart, Users, Camera, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import EmojiIcon from "@/components/shared/EmojiIcon";
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

  useRealtime("insta_posts", "*", () => fetchPosts());

  const fetchMyChars = async () => {
    const { data } = await supabase.from("characters").select("id, full_name, avatar_url, house, character_type, user_id").eq("user_id", user!.id);
    if (data && data.length > 0) {
      setMyChars(data);
      setSelectedCharId(data[0].id);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("insta_posts")
      .select("*, characters(id, full_name, avatar_url, house, character_type, user_id), profiles(full_name, username, house, avatar_url)")
      .order("created_at", { ascending: false });
    if (error) { console.error("[InstaHogwarts] fetchPosts error:", error); setLoading(false); return; }
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

    // Fetch follow counts only for chars in current posts (evita varrer a tabela toda)
    const charIds = Array.from(new Set(posts.map((p: any) => p.character_id).filter(Boolean)));
    if (charIds.length === 0) { setCharFollowCounts({}); return; }
    const { data: counts } = await supabase
      .from("insta_character_follows")
      .select("followed_char_id")
      .in("followed_char_id", charIds)
      .limit(2000);
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
      await fetchPosts();
    }
    setUploading(false);
  };

  const toggleLike = async (post: InstaPost) => {
    if (!user) return;
    const hasLiked = post.likes.includes(user.id);
    const newLikes = hasLiked
      ? post.likes.filter(id => id !== user.id)
      : [...post.likes, user.id];

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    
    try {
      const { error } = await supabase.rpc("toggle_insta_like", { 
        p_post_id: post.id, 
        p_user_id: user.id 
      });
      if (error) throw error;

      if (!hasLiked && post.user_id !== user.id) {
        await supabase.rpc("award_xp_action", { _action: "insta_like", _user_id: post.user_id, _xp: XP_LIKE });
      }
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast.error("Erro ao curtir pergaminho.");
      // Rollback optimistic update
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: post.likes } : p));
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
    <div className="max-w-xl mx-auto space-y-8 sm:space-y-10 pb-20 px-2 sm:px-0">
      {/* ── CINEMATIC HEADER ── */}
      <div className="relative glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-center overflow-hidden border border-primary/20 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-amber-900/20 opacity-80" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
           <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-full px-4 py-1 mb-2">
            <span className="text-[9px] font-heading text-primary uppercase tracking-widest font-bold">Edição Especial</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-gold-gradient drop-shadow-2xl">O Profeta Diário</h1>
          <p className="text-muted-foreground text-xs font-serif italic italic italic">"Toda a magia capturada em um só lugar."</p>
        </div>
      </div>

      {/* ── UPLOAD PLAQUE ── */}
      <div className="relative glass rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-white/10 shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

        {myChars.length === 0 ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
              <Users size={32} className="text-white/20" />
            </div>
            <p className="text-center text-muted-foreground font-serif italic text-sm italic">"Apenas bruxos com ficha podem estampar as capas do Profeta."</p>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group/avatar">
                <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                <SafeImage
                  src={activeChar?.avatar_url}
                  alt={activeChar?.full_name || ""}
                  fallbackEmoji="🧙"
                  className="relative w-14 h-14 rounded-full object-cover border-2 border-primary/30 shrink-0 shadow-2xl transition-transform group-hover/avatar:scale-110"
                />
              </div>
              <div className="flex-1">
                 <p className="text-[10px] font-heading text-primary uppercase tracking-widest mb-1 font-bold">Publicar como:</p>
                 <select
                  value={selectedCharId}
                  onChange={e => setSelectedCharId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-foreground focus:border-primary/50 transition-colors appearance-none cursor-pointer"
                >
                  {myChars.map(c => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.character_type === "oc" ? "⭐" : "📖"} {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full bg-black/40 rounded-2xl px-4 py-4 text-sm text-foreground focus:outline-none border border-white/10 focus:border-primary/30 resize-none min-h-[100px] placeholder:text-muted-foreground/50 transition-all"
                placeholder={`Qual é a fofoca de hoje, ${activeChar?.full_name?.split(" ")[0] || "bruxo"}?`}
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              
              <div className="relative group/spotify">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-2" />
                </div>
                <Input
                  placeholder="Trilha Sonora (Link do Spotify)..."
                  value={spotifyUri}
                  onChange={e => setSpotifyUri(e.target.value)}
                  className="bg-black/40 border-white/10 rounded-xl pl-8 focus:border-green-500/30 text-xs h-10 transition-all"
                />
              </div>

              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group/preview inline-block"
                >
                  <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-3xl opacity-0 group-hover/preview:opacity-100 transition-opacity" />
                  <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-black">
                    <motion.img 
                      initial={{ scale: 1 }}
                      animate={{ scale: 1.1 }}
                      transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                      src={URL.createObjectURL(selectedFile)} 
                      className="h-48 w-48 object-cover opacity-80" 
                    />
                    <button
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 backdrop-blur-md text-white rounded-full w-8 h-8 text-xs flex items-center justify-center transition-all border border-white/10"
                      onClick={() => setSelectedFile(null)}
                    ><EmojiIcon e="✕" /></button>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm group/btn"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover/btn:scale-110 transition-transform">
                    <Camera size={18} className="text-primary" />
                  </div>
                  <span className="text-muted-foreground font-heading uppercase tracking-widest text-[10px] font-bold">Capturar Foto</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                </button>
                
                <Button 
                  variant="magical" 
                  size="lg" 
                  onClick={handleUpload} 
                  disabled={!selectedFile || uploading || !selectedCharId}
                  className="px-10 rounded-2xl h-12 shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.4)] transition-all scale-105 active:scale-95"
                >
                  {uploading ? "Conjurando..." : "Lançar Capa ✨"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FEED (THE PROPHET PAGES) ── */}
      <div className="space-y-12">
        {loading ? (
          <div className="py-20 text-center space-y-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
             <p className="text-muted-foreground font-serif italic animate-pulse italic">"Revelando fotografias mágicas..."</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-[3rem] p-20 text-center border border-white/5 shadow-2xl">
            <div className="text-6xl mb-6 opacity-20"><EmojiIcon e="📜" /></div>
            <p className="text-muted-foreground font-serif italic text-lg italic">"Ainda não há novas histórias no Profeta."</p>
          </div>
        ) : (
          posts.map(post => {
            const disp = getPostDisplay(post);
            const isMyPost = post.user_id === user?.id;
            const isFollowingUser = followedUserIds.has(post.user_id);
            const isFollowingChar = disp.charId ? followedCharIds.has(disp.charId) : false;
            const hasLiked = post.likes.includes(user?.id || "");

            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-[#f4f1ea] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] border-b-4 border-black/10 group/card"
              >
                {/* Daily Prophet Newspaper Texture Overlay */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')] opacity-10 pointer-events-none mix-blend-multiply" />
                
                {/* Card Header (News Style) */}
                <div className="p-6 border-b-2 border-black/80 mx-4 mt-4 flex justify-between items-end">
                  <div className="space-y-1">
                    <h2 className="font-heading text-3xl text-black uppercase tracking-tighter leading-none">
                      {disp.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 uppercase">
                        {disp.type || "CIDADÃO"}
                      </span>
                      <span className="text-[10px] text-black/60 font-serif italic">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Edição Extra</p>
                    <p className="text-xs font-serif italic font-bold text-black">Vol. {Math.floor(Math.random() * 99) + 1}</p>
                  </div>
                </div>

                {/* Magical Photo (Image) */}
                <div className="p-4 relative">
                   <div className="relative aspect-square overflow-hidden bg-zinc-900 border-2 border-black/10 shadow-inner group/photo">
                    <motion.img 
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                      src={post.image_url} 
                      alt="" 
                      className="w-full h-full object-cover grayscale-[20%] sepia-[10%] group-hover/photo:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none" />
                    
                    {/* Floating Char Info */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-3">
                      <div className="relative">
                        <SafeImage src={disp.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-white shadow-xl" />
                        <div className="absolute -top-1 -right-1">
                          <HouseCrest house={disp.house} size="xs" />
                        </div>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20">
                        <p className="text-[10px] font-heading text-white truncate max-w-[120px]">{disp.name}</p>
                        <p className="text-[8px] text-primary uppercase font-bold tracking-widest">@{disp.username}</p>
                      </div>
                    </div>

                    {/* Follow Action */}
                    {!isMyPost && disp.charId && (
                      <button 
                        onClick={() => toggleFollowChar(disp.charId!, disp.charOwnerId)}
                        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${isFollowingChar ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white hover:bg-black/60'}`}
                      >
                        {isFollowingChar ? <UserCheck size={18} /> : <UserPlus size={18} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content & Actions */}
                <div className="p-6 pt-2 space-y-4">
            <div className="relative">
                    <span className="absolute -left-2 top-0 text-4xl text-black/10 font-serif italic">"</span>
                    <p className="text-black font-serif italic leading-relaxed text-sm px-4">
                      {post.caption}
                    </p>
                    <span className="absolute -right-2 bottom-0 text-4xl text-black/10 font-serif italic rotate-180">"</span>
                  </div>

                  {post.spotify_uri && post.spotify_uri.includes("spotify.com") && post.spotify_uri.match(/track\/([a-zA-Z0-9]+)/) && (
                    <div className="mt-2 w-full max-w-sm">
                      <iframe 
                        src={`https://open.spotify.com/embed/track/${post.spotify_uri.match(/track\/([a-zA-Z0-9]+)/)?.[1]}`} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="encrypted-media" 
                        loading="lazy"
                        className="rounded-xl opacity-90 hover:opacity-100 transition-opacity"
                      ></iframe>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-black/10">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => toggleLike(post)}
                        className={`flex items-center gap-2 group/like transition-colors ${hasLiked ? 'text-red-600' : 'text-black/60 hover:text-red-600'}`}
                      >
                        <motion.div whileTap={{ scale: 1.5 }}>
                          <Heart size={20} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "animate-pulse" : ""} />
                        </motion.div>
                        <span className="text-xs font-bold">{post.likes.length} Curtidas</span>
                      </button>
                      
                      <div className="flex items-center gap-2 text-black/60">
                         <MessageSquare size={20} />
                         <span className="text-xs font-bold">Comentar</span>
                      </div>
                    </div>
                    
                    <button className="text-black/40 hover:text-black transition-colors">
                      <EmojiIcon e="🔖" />
                    </button>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="h-2 bg-black/5 flex">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="flex-1 border-r border-black/10" />
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
