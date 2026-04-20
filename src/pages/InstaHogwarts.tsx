import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import SafeImage from "@/components/SafeImage";
import { House } from "@/lib/store";
import { UserPlus, UserCheck, Heart } from "lucide-react";

interface Character {
  id: string;
  full_name: string;
  avatar_url: string | null;
  house: string;
  character_type: string;
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
  } | null;
  profiles: {
    full_name: string;
    username: string;
    house: House;
    avatar_url: string | null;
  };
}

const XP_LIKE = 5;
const XP_FOLLOW = 30;

export default function InstaHogwarts() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [spotifyUri, setSpotifyUri] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followCounts, setFollowCounts] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchMyChars();
      fetchFollowed();
    }
  }, [user]);

  const fetchMyChars = async () => {
    const { data } = await supabase.from("characters").select("id, full_name, avatar_url, house, character_type").eq("user_id", user!.id);
    if (data && data.length > 0) {
      setMyChars(data);
      setSelectedCharId(data[0].id);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("insta_posts")
      .select("*, characters(id, full_name, avatar_url, house, character_type), profiles(full_name, username, house, avatar_url)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as unknown as InstaPost[]);
    setLoading(false);
  };

  const fetchFollowed = async () => {
    const { data } = await supabase.from("insta_follows").select("followed_user_id").eq("follower_user_id", user!.id);
    if (data) setFollowedIds(new Set(data.map(f => f.followed_user_id)));
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
    const { error: upErr } = await supabase.storage.from("avatars").upload(`instaposts/${fileName}`, selectedFile, { upsert: true });
    if (upErr) { toast.error("Erro no upload."); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(`instaposts/${fileName}`);
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
      // XP for posting
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

    // Optimistic
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    await supabase.from("insta_posts").update({ likes: newLikes } as never).eq("id", post.id);

    // XP on like (only when liking, not unliking)
    if (!hasLiked && post.user_id !== user.id) {
      await supabase.rpc("award_xp_action", { _action: "insta_like", _user_id: post.user_id, _xp: XP_LIKE });
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;
    const isFollowing = followedIds.has(targetUserId);

    if (isFollowing) {
      await supabase.from("insta_follows").delete().eq("follower_user_id", user.id).eq("followed_user_id", targetUserId);
      setFollowedIds(prev => { const s = new Set(prev); s.delete(targetUserId); return s; });
    } else {
      await supabase.from("insta_follows").insert({ follower_user_id: user.id, followed_user_id: targetUserId } as never);
      setFollowedIds(prev => new Set([...prev, targetUserId]));
      // XP for being followed
      await supabase.rpc("award_xp_action", { _action: "insta_follow", _user_id: targetUserId, _xp: XP_FOLLOW });
      toast.success("Seguindo! +" + XP_FOLLOW + " XP para este membro ✨");
    }
  };

  // Display info: prefer character, fall back to profile
  const getPostDisplay = (post: InstaPost) => {
    if (post.characters) {
      return {
        name: post.characters.full_name,
        avatar: post.characters.avatar_url,
        house: post.characters.house as House,
        type: post.characters.character_type === "oc" ? "⭐ OC" : "📖 Canon",
        username: post.profiles?.username || "",
      };
    }
    return {
      name: post.profiles?.full_name || "Bruxo",
      avatar: post.profiles?.avatar_url || null,
      house: post.profiles?.house,
      type: "",
      username: post.profiles?.username || "",
    };
  };

  const activeChar = myChars.find(c => c.id === selectedCharId);

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10">
      <div className="glass rounded-2xl p-6 text-center mb-2">
        <h1 className="font-heading text-3xl text-gold-gradient mb-1">📸 Insta Hogwarts</h1>
        <p className="text-muted-foreground text-sm">O feed dos personagens do castelo.</p>
      </div>

      {/* Área de postagem */}
      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Seletor de personagem */}
        {myChars.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-2">Crie uma ficha de personagem para poder postar aqui.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <SafeImage
                src={activeChar?.avatar_url}
                alt={activeChar?.full_name || ""}
                fallbackEmoji="🧙"
                className="w-10 h-10 rounded-full object-cover border border-primary/30 shrink-0"
              />
              <select
                value={selectedCharId}
                onChange={e => setSelectedCharId(e.target.value)}
                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {myChars.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.character_type === "oc" ? "⭐" : "📖"} {c.full_name}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none border border-border resize-none"
              placeholder={`O que ${activeChar?.full_name || "seu personagem"} está fazendo?`}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={2}
            />
            {selectedFile && (
              <div className="relative inline-block">
                <img src={URL.createObjectURL(selectedFile)} className="h-36 rounded-xl object-cover border border-border" />
                <button
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  onClick={() => setSelectedFile(null)}
                >✕</button>
              </div>
            )}
            <Input
              placeholder="Link do Spotify (opcional)..."
              value={spotifyUri}
              onChange={e => setSpotifyUri(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            <div className="flex justify-between items-center">
              <label className="cursor-pointer text-muted-foreground hover:text-primary text-sm flex items-center gap-2 transition-colors">
                <span>📷 Foto</span>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
              <Button variant="magical" size="sm" onClick={handleUpload} disabled={!selectedFile || uploading || !selectedCharId}>
                {uploading ? "Publicando..." : "Publicar ✨"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Revelando fotografias...</p>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3 opacity-50">📷</div>
            <p className="text-muted-foreground text-sm">Nenhuma foto no Profeta Diário de hoje.</p>
          </div>
        ) : (
          posts.map(post => {
            const disp = getPostDisplay(post);
            const isMyPost = post.user_id === user?.id;
            const isFollowing = followedIds.has(post.user_id);
            const hasLiked = post.likes.includes(user?.id || "");

            return (
              <div key={post.id} className="glass rounded-2xl overflow-hidden border border-border/30">
                {/* Post Header */}
                <div className="p-4 flex items-center gap-3 border-b border-border/50">
                  <SafeImage
                    src={disp.avatar}
                    alt={disp.name}
                    fallbackText={disp.name}
                    className="w-11 h-11 rounded-full object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading text-sm text-foreground truncate">{disp.name}</p>
                      {disp.type && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">{disp.type}</span>}
                      {disp.house && <HouseCrest house={disp.house} size="sm" />}
                    </div>
                    <p className="text-xs text-muted-foreground">@{disp.username} · {new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {/* Follow button — only on other's posts */}
                  {!isMyPost && (
                    <button
                      onClick={() => toggleFollow(post.user_id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-heading transition-all ${
                        isFollowing
                          ? "bg-secondary text-muted-foreground border border-border hover:border-destructive/50"
                          : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                      }`}
                    >
                      {isFollowing ? <><UserCheck size={12} /> Seguindo</> : <><UserPlus size={12} /> Seguir</>}
                    </button>
                  )}
                </div>

                {/* Image */}
                <div className="relative w-full bg-black flex items-center justify-center max-h-[540px] overflow-hidden">
                  <img
                    src={post.image_url}
                    className="max-w-full max-h-[540px] object-contain w-full"
                    alt="Post"
                    onError={e => { e.currentTarget.src = ""; e.currentTarget.style.display = "none"; }}
                  />
                </div>

                {/* Spotify */}
                {post.spotify_uri && (
                  <div className="px-4 pt-4">
                    <iframe
                      src={post.spotify_uri.replace("open.spotify.com", "open.spotify.com/embed")}
                      width="100%" height="80" frameBorder="0" allow="encrypted-media"
                      className="rounded-lg border border-border/50"
                    />
                  </div>
                )}

                {/* Actions + Caption */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      onClick={() => toggleLike(post)}
                      className={`flex items-center gap-1.5 transition-all hover:scale-110 ${hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"}`}
                    >
                      <Heart size={20} fill={hasLiked ? "currentColor" : "none"} />
                      <span className="text-sm font-heading">{post.likes.length}</span>
                    </button>
                    {!hasLiked && !isMyPost && (
                      <span className="text-[10px] text-muted-foreground">+{XP_LIKE} XP ao curtir</span>
                    )}
                  </div>
                  {post.caption && (
                    <p className="text-sm">
                      <span className="font-heading font-medium mr-2 text-foreground">{disp.name}</span>
                      <span className="text-foreground/85">{post.caption}</span>
                    </p>
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
