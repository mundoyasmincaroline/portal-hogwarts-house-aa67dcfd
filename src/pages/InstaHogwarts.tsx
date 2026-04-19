import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import HouseCrest from "@/components/HouseCrest";
import { House } from "@/lib/store";

interface InstaPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  spotify_uri?: string;
  likes: string[];
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    house: House;
    avatar_url: string | null;
  };
}

export default function InstaHogwarts() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [spotifyUri, setSpotifyUri] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("insta_posts")
      .select("*, profiles(full_name, username, house, avatar_url)")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as unknown as InstaPost[]);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    
    setUploading(true);
    const ext = selectedFile.name.split(".").pop();
    const fileName = `${user.id}_${Date.now()}.${ext}`;
    
    // Using the existing 'avatars' bucket for simplicity, or ideally an 'instaposts' bucket
    const { error: upErr } = await supabase.storage.from("avatars").upload(`instaposts/${fileName}`, selectedFile, { upsert: true });
    
    if (upErr) {
      toast.error("Erro ao fazer upload da imagem.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(`instaposts/${fileName}`);

    const { error: insertErr } = await supabase.from("insta_posts").insert({
      user_id: user.id,
      image_url: publicUrl,
      caption: caption,
      spotify_uri: spotifyUri || null
    });

    if (insertErr) {
      toast.error(insertErr.message);
    } else {
      toast.success("Postagem publicada no Insta Hogwarts!");
      setSelectedFile(null);
      setCaption("");
      setSpotifyUri("");
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
    
    // Optimistic update
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    
    await supabase.from("insta_posts").update({ likes: newLikes }).eq("id", post.id);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10">
      <div className="glass rounded-2xl p-6 text-center mb-6">
        <h1 className="font-heading text-3xl text-gold-gradient mb-2">📸 Insta Hogwarts</h1>
        <p className="text-muted-foreground text-sm">Compartilhe momentos mágicos com a comunidade.</p>
      </div>

      {/* Upload Area */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center font-heading text-primary">
                {profile?.full_name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border resize-none"
              placeholder="Descreva este momento..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
            />
            {selectedFile && (
              <div className="relative inline-block">
                <img src={URL.createObjectURL(selectedFile)} className="h-32 rounded-md object-cover border border-border" />
                <button 
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  onClick={() => setSelectedFile(null)}
                >
                  ✕
                </button>
              </div>
            )}
            <Input
              className="w-full bg-secondary/50 rounded-md px-3 py-2 text-sm text-foreground focus:outline-none border border-border"
              placeholder="Link do Spotify (opcional)..."
              value={spotifyUri}
              onChange={(e) => setSpotifyUri(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2">
                <span>📷 Adicionar Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
              <Button 
                variant="magical" 
                size="sm" 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Publicando..." : "Publicar ✨"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Revelando fotografias...</p>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3 opacity-50">📷</div>
            <p className="text-muted-foreground text-sm">Nenhuma foto encontrada no profeta de hoje.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="glass rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center gap-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                  {post.profiles.avatar_url ? (
                    <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center font-heading text-primary">
                      {post.profiles.full_name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-sm text-foreground">{post.profiles.full_name}</p>
                    <HouseCrest house={post.profiles.house} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="relative aspect-square md:aspect-auto md:max-h-[500px] w-full bg-black flex items-center justify-center">
                <img src={post.image_url} className="max-w-full max-h-[500px] object-contain" alt="Post" />
              </div>

              {post.spotify_uri && (
                <div className="px-4 pt-4">
                  <iframe 
                    src={post.spotify_uri.replace("open.spotify.com", "open.spotify.com/embed")} 
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allow="encrypted-media"
                    className="rounded-lg shadow-sm border border-border/50"
                  ></iframe>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <button 
                    onClick={() => toggleLike(post)} 
                    className={`text-2xl transition-transform hover:scale-110 ${post.likes.includes(user?.id || '') ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
                  >
                    {post.likes.includes(user?.id || '') ? '❤️' : '🤍'}
                  </button>
                  <span className="text-sm font-heading text-foreground">{post.likes.length} curtidas</span>
                </div>
                <p className="text-sm">
                  <span className="font-heading font-medium mr-2">{post.profiles.username}</span>
                  <span className="text-foreground/90">{post.caption}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
