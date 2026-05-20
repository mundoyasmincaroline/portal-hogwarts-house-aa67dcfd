import { useState, useEffect, useCallback } from "react";
import { Sparkles, Trophy } from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import HouseCrest from "@/components/HouseCrest";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DailyHighlight from "@/components/DailyHighlight";
import MoodSession from "@/components/MoodSession";
import BirthdayBanner from "@/components/BirthdayBanner";
import MagicAdBanner from "@/components/MagicAdBanner";
import StoriesBar from "@/components/StoriesBar";
import DynamicGreeting from "@/components/DynamicGreeting";
import VipUpsellBanner from "@/components/VipUpsellBanner";
import SafeImage from "@/components/SafeImage";
import MagicalIcon from "@/components/MagicalIcon";
import MagicalEmoji from "@/components/MagicalEmoji";
import MagicalGaleon from "@/components/MagicalGaleon";
import MagicalMemories from "@/components/MagicalMemories";
import { useFeed } from "@/hooks/useFeed";
import { FeedPost } from "@/services/feedService";

const REACTIONS = ["⚡", "❤️", "🔥", "🦁", "🦅", "🐍", "🦡"];

export default function Feed() {
  const { profile, user } = useAuth();
  const { posts, setPosts, loading, loadFeed } = useFeed();
  const [newPost, setNewPost] = useState("");
  const [newMusicUrl, setNewMusicUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [houseStats, setHouseStats] = useState<Record<House, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [showWelcomeChest, setShowWelcomeChest] = useState(false);

  const loadSidebar = useCallback(async () => {
    const { data: hp } = await supabase.from("house_points").select("house, points");
    const stats: Record<House, number> = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    (hp || []).forEach((row: { house: House; points: number }) => {
      stats[row.house] = (stats[row.house] || 0) + row.points;
    });
    setHouseStats(stats);

    const { data: ch } = await supabase.from("challenges").select("id, title, xp_reward, type").eq("active", true).limit(5);
    setActiveChallenges(ch || []);
    const { data: users } = await supabase.from("profiles").select("id, user_id, full_name, username, house, avatar_url, online, last_seen").eq("approved", true).order("online", { ascending: false }).limit(10);
    setOnlineUsers(users || []);
  }, []);

  useEffect(() => {
    loadFeed();
    loadSidebar();
    
    // Buscar palavras proibidas
    supabase.from("banned_words").select("word").then(({ data }) => {
      if (data) setBannedWords(data.map(d => d.word.toLowerCase()));
    });

    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, () => loadFeed())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadFeed, loadSidebar]);

  useEffect(() => {
    if (profile && (profile as any).has_seen_intro === false) {
      // Pequeno delay para não abrir instantaneamente no fade-in da página
      const timer = setTimeout(() => setShowWelcomeChest(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const submitPost = async () => {
    if (!newPost.trim() || !user) return;
    
    const content = newPost.trim();
    const lowerContent = content.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    const isAllCaps = content.length > 20 && content === content.toUpperCase();
    const hasSpamChars = /(.)\1{5,}/.test(content);
    
    if (hasBannedWord || isAllCaps || hasSpamChars) {
      let reason = hasBannedWord ? "Palavra proibida" : isAllCaps ? "Gritaria (CAPS LOCK)" : "Spam (letras repetidas)";
      toast.error(
        <div className="flex gap-3 items-center">
          <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Filch" className="w-10 h-10 rounded-full border border-red-500 object-cover" />
          <div>
            <p className="font-bold text-red-500">Argus Filch</p>
            <p className="text-sm">Publicação bloqueada: {reason}</p>
          </div>
        </div>,
        { duration: 8000 }
      );
      await supabase.from("moderation_log").insert({ user_id: user.id, content_type: "post", original_content: content, reason: reason, action: "block" });
      await supabase.rpc("award_xp_action", { _action: "spam_penalty", _user_id: user.id, _xp: -10 });
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("posts").insert({ 
      user_id: user.id, 
      content: content,
      music_url: newMusicUrl.trim() || null 
    } as never);
    setPosting(false);
    if (error) {
      toast.error(error.message.includes("Filch") ? error.message : "Erro ao publicar: " + error.message);
      return;
    }
    setNewPost("");
    setNewMusicUrl("");
    toast.success("Publicado! ✨");
    // +2 Galeões por publicar
    supabase.rpc("award_galeons" as any, { _user_id: user.id, _amount: 2, _reason: "post" }).then(() => {});
  };

  const toggleReaction = async (postId: string, emoji: string, mine: boolean) => {
    if (!user) return;
    if (mine) {
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji } as never);
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text || !user) return;
    
    const lowerContent = text.toLowerCase();
    const hasBannedWord = bannedWords.some(word => lowerContent.includes(word));
    const isAllCaps = text.length > 15 && text === text.toUpperCase();
    const hasSpamChars = /(.)\1{5,}/.test(text);

    if (hasBannedWord || isAllCaps || hasSpamChars) {
      toast.error("Comentário bloqueado pelo Filch! Mantenha a ordem no castelo.");
      await supabase.from("moderation_log").insert({ user_id: user.id, content_type: "comment", original_content: text, reason: "Spam/Palavra proibida", action: "block" });
      await supabase.rpc("award_xp_action", { _action: "spam_penalty", _user_id: user.id, _xp: -5 });
      return;
    }

    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content: text } as never);
    if (error) {
      toast.error(error.message.includes("Filch") ? error.message : "Erro: " + error.message);
      return;
    }
    setCommentDrafts((d) => ({ ...d, [postId]: "" }));
  };

  const toggleComments = (postId: string) => {
    setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, showComments: !p.showComments } : p)));
  };

  const sortedHouses = Object.values(HOUSES)
    .map((h) => ({ ...h, points: houseStats[h.id] }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <MagicalMemories />
      <StoriesBar />
      <DynamicGreeting />

      
      <BirthdayBanner />
      <VipUpsellBanner
        currentVip={(profile as any)?.vip_plan}
        galeons={(profile as any)?.galeons ?? 0}
        username={profile?.full_name}
      />
      <DailyHighlight />
      <MoodSession />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="glass rounded-xl p-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe algo mágico... (Filch está vigiando 🧹)"
              maxLength={1000}
              className="w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[80px]"
            />
            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
              <input 
                type="text" 
                value={newMusicUrl} 
                onChange={(e) => setNewMusicUrl(e.target.value)} 
                placeholder="🎵 Link de Música (Spotify ou MP3)..." 
                className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none" 
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-muted-foreground">{newPost.length}/1000</span>
              <Button variant="magical" size="sm" className="font-heading text-xs" disabled={!newPost.trim() || posting} onClick={submitPost}>
                {posting ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>

          {loading && <p className="text-center text-muted-foreground text-sm py-6">Carregando feed...</p>}
          {!loading && posts.length === 0 && (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">Ainda não há publicações. Seja o primeiro! ✨</p>
            </div>
          )}

          {posts.map((post, index) => (
            <div key={post.id}>
              {index > 0 && index % 3 === 0 && <MagicAdBanner />}
              <div className="glass rounded-xl p-4 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary overflow-hidden border-2 shrink-0 ${post.author?.house === 'gryffindor' ? 'border-red-500' : post.author?.house === 'slytherin' ? 'border-green-500' : post.author?.house === 'ravenclaw' ? 'border-blue-500' : 'border-yellow-500'}`}>
                    <SafeImage 
                      src={post.author?.avatar_url} 
                      alt={post.author?.full_name || "Bruxo"} 
                      className="w-full h-full object-cover" 
                      fallbackText={post.author?.full_name}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      {post.author?.full_name || "Bruxo desconhecido"}
                      {post.author?.vip_plan === "founder" && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-heading">👑 Fundador</span>}
                      {post.author?.vip_plan === "vip" && <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full font-heading">💜 VIP</span>}
                      {post.author?.vip_plan === "premium" && <span className="text-[10px] bg-slate-500/20 text-slate-300 border border-slate-400/30 px-1.5 py-0.5 rounded-full font-heading">⭐ Premium</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">@{post.author?.username} • {new Date(post.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  {post.author?.house && <HouseCrest house={post.author.house} size="sm" />}
                </div>
                <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
                
                {post.music_url && (
                  <div className="mb-4">
                    {post.music_url.includes("spotify.com/track/") ? (
                      <iframe 
                        src={post.music_url.replace("open.spotify.com/track/", "open.spotify.com/embed/track/")} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allow="encrypted-media" 
                        className="rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                      ></iframe>
                    ) : (
                      <audio controls src={post.music_url} className="w-full h-8" />
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {post.reactions.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => toggleReaction(post.id, r.emoji, r.mine)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${r.mine ? "bg-primary/30 text-primary" : "glass hover:bg-secondary/80"}`}
                    >
                      {r.emoji} {r.count}
                    </button>
                  ))}
                  <div className="flex gap-1 glass rounded-full px-2 py-1">
                    {REACTIONS.map((emoji) => {
                      const existing = post.reactions.find((r) => r.emoji === emoji);
                      if (existing) return null;
                      return (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(post.id, emoji, false)}
                          className="text-xs hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="glass px-3 py-1 rounded-full text-xs text-muted-foreground hover:bg-secondary/80 transition-colors"
                  >
                    💬 {post.comments.length} {post.comments.length === 1 ? "comentário" : "comentários"}
                  </button>
                </div>

                {post.showComments && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {post.comments.map((c) => (
                      <div key={c.id} className="flex gap-2 items-start">
                        <div className={`w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-heading text-xs text-primary overflow-hidden shrink-0 border border-primary/30`}>
                          <SafeImage 
                            src={c.author?.avatar_url} 
                            alt={c.author?.full_name || "Bruxo"} 
                            className="w-full h-full object-cover" 
                            fallbackText={c.author?.full_name}
                          />
                        </div>
                        <div className="flex-1 bg-secondary/40 rounded-lg px-3 py-2">
                          <p className="text-xs font-medium text-foreground">{c.author?.full_name}</p>
                          <p className="text-xs text-foreground">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={commentDrafts[post.id] || ""}
                        onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                        placeholder="Comente..."
                        maxLength={500}
                        className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground"
                      />
                      <Button size="sm" variant="magical" className="text-xs" onClick={() => submitComment(post.id)}>
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">🏰 Bruxos no Castelo</h3>
            
            {/* Morpheus - Arquiteto */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-black border border-green-500/50 rounded-lg group shadow-[0_0_10px_rgba(34,197,94,0.2)]">
              <div className="w-8 h-8 rounded-none shrink-0 border border-green-500 relative bg-black flex items-center justify-center">
                <div className="absolute inset-0 bg-green-500/10 z-10"></div>
                <span className="text-green-500 font-mono text-xs font-bold animate-pulse">M</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-500 font-bold font-mono truncate tracking-widest">&gt; MORPHEUS</p>
                <p className="text-[9px] font-mono text-green-500/70 truncate">SYSTEM_ARCHITECT</p>
              </div>
              <div className="w-2 h-2 rounded-none bg-green-500 animate-[ping_3s_linear_infinite]"></div>
            </div>

            {/* Yasmin Caroline - A Fundadora */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-yellow-500/10 border border-yellow-400/50 rounded-lg group shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:scale-105 transition-transform cursor-default">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-yellow-400 relative">
                <div className="absolute inset-0 bg-yellow-400/30 mix-blend-overlay z-10 animate-pulse"></div>
                <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Yasmin Caroline" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-400 font-bold truncate">✨ Yasmin Caroline</p>
                <p className="text-[9px] text-yellow-500/80 truncate font-bold">A FUNDADORA GENIAL</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce"></div>
            </div>

            {/* Carolina Assis - A Guardiã */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-blue-500/10 border border-blue-400/50 rounded-lg group shadow-[0_0_10px_rgba(96,165,250,0.2)]">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-blue-400 relative">
                <div className="absolute inset-0 bg-blue-400/20 mix-blend-overlay z-10 animate-pulse"></div>
                <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Carolina Assis" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-400 font-bold truncate">🛡️ Carolina Assis</p>
                <p className="text-[9px] text-blue-400/80 truncate font-bold">MÃE ZELOSA • VIGIANDO</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            </div>

            {/* Argus Filch - Sempre Online */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-red-950/30 border border-red-900/50 rounded-lg group">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-red-500/50">
                <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Argus Filch" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-red-500 font-bold truncate">Argus Filch</p>
                <p className="text-[10px] text-muted-foreground truncate">Vigiando os corredores...</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {onlineUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">Ninguém à vista.</p>
              )}
              {onlineUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full overflow-hidden border-2 shrink-0 ${u.house === 'gryffindor' ? 'border-red-500' : u.house === 'slytherin' ? 'border-green-500' : u.house === 'ravenclaw' ? 'border-blue-500' : 'border-yellow-500'}`}>
                    <SafeImage 
                      src={u.avatar_url} 
                      alt={u.username} 
                      className="w-full h-full object-cover" 
                      fallbackText={u.full_name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{u.full_name.split(' ')[0]}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${isUserOnline(u) ? 'bg-green-500' : 'bg-muted'}`} title={isUserOnline(u) ? 'Online' : 'Offline'} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[2rem] p-6 border-white/5 bg-gradient-to-br from-black/40 to-transparent shadow-2xl">
            <h3 className="font-heading text-sm text-primary mb-5 flex items-center gap-2">
              <Sparkles size={16} /> Desafios Ativos
            </h3>
            <div className="space-y-4">
              {activeChallenges.length === 0 && (
                <p className="text-[10px] text-muted-foreground uppercase text-center py-4 tracking-widest opacity-50">Nenhum desafio ativo agora.</p>
              )}
              {activeChallenges.map((c) => (
                <div key={c.id} className="group relative glass rounded-2xl p-4 border border-white/5 bg-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 relative z-10">
                    <MagicalIcon size="sm">
                       <MagicalEmoji emoji={c.type === 'daily' ? '⚡' : '🔥'} size="sm" />
                    </MagicalIcon>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.type === "daily" ? "Diário" : "Semanal"}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] text-primary font-bold">{c.xp_reward} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
