import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Sparkles, Trophy } from "lucide-react";
import { useAuth, isUserOnline } from "@/lib/auth";
import { HOUSES, type House } from "@/types";
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
import { useFeed } from "@/hooks/features/useFeed";
import { useRealtime } from "@/hooks/core/useRealtime";
import { feedService } from "@/services/features/feedService";
import { FeedPost } from "@/types";
import PostCard from "@/components/PostCard";


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
  // Memoize house scores for performance
  const sortedHouses = useMemo(() => {
    return Object.values(HOUSES)
      .map((h) => ({ ...h, points: houseStats[h.id] || 0 }))
      .sort((a, b) => b.points - a.points);
  }, [houseStats]);
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [showWelcomeChest, setShowWelcomeChest] = useState(false);
  
  // Throttle sidebar loading if needed
  const sidebarLoaded = useRef(false);

  const loadSidebar = useCallback(async () => {
    // Combine queries to reduce RTT
    const [{ data: hp }, { data: ch }, { data: users }] = await Promise.all([
      supabase.from("house_points").select("house, points"),
      supabase.from("challenges").select("id, title, xp_reward, type").eq("active", true).limit(5),
      supabase.from("profiles").select("id, user_id, full_name, username, house, avatar_url, online, last_seen").eq("approved", true).order("online", { ascending: false }).limit(10)
    ]);

    const stats: Record<House, number> = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    (hp || []).forEach((row: any) => {
      const house = row.house as House;
      stats[house] = (stats[house] || 0) + row.points;
    });
    setHouseStats(stats);
    setActiveChallenges(ch || []);
    setOnlineUsers(users || []);
  }, []);

  useEffect(() => {
    loadFeed();
    if (!sidebarLoaded.current) {
        loadSidebar();
        sidebarLoaded.current = true;
    }
    
    // Buscar palavras proibidas
    supabase.from("banned_words").select("word").then(({ data }) => {
      if (data) setBannedWords(data.map(d => d.word.toLowerCase()));
    });
  }, [loadFeed, loadSidebar]);

  // Use centralized realtime hooks
  useRealtime("posts", "*", loadFeed);
  useRealtime("post_comments", "*", loadFeed);
  useRealtime("post_reactions", "*", loadFeed);

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
    await supabase.rpc("award_galeons" as any, { _user_id: user.id, _amount: 2, _reason: "post" });
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="glass rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="O que está acontecendo no castelo?"
              maxLength={1000}
              className="w-full bg-transparent resize-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[80px] sm:min-h-[100px] font-serif italic"
            />
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="flex-1 relative group/input">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-50 group-focus-within/input:opacity-100 transition-opacity">🎵</div>
                <input 
                  type="text" 
                  value={newMusicUrl} 
                  onChange={(e) => setNewMusicUrl(e.target.value)} 
                  placeholder="Link do Spotify ou MP3..." 
                  className="w-full bg-black/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground focus:outline-none border border-white/5 focus:border-primary/30 transition-all" 
                />
              </div>
              <div className="flex justify-between items-center sm:justify-end gap-4">
                <span className="text-[10px] text-muted-foreground/60 font-mono tracking-widest">{newPost.length}/1000</span>
                <Button variant="magical" size="sm" className="font-heading text-xs px-8 h-10 rounded-xl shadow-lg" disabled={!newPost.trim() || posting} onClick={submitPost}>
                  {posting ? "Conjurando..." : "Publicar"}
                </Button>
              </div>
            </div>
          </div>

          {loading && <p className="text-center text-muted-foreground text-sm py-6">Carregando feed...</p>}
          {!loading && posts.length === 0 && (
            <div className="glass rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">Ainda não há publicações. Seja o primeiro! ✨</p>
            </div>
          )}

          {posts.map((post, index) => (
            <div key={post.id} className="min-h-[150px]">
              {index > 0 && index % 10 === 0 && <MagicAdBanner />}
              <ErrorBoundary fallback={
                <div className="glass rounded-xl p-4 min-h-[100px] flex items-center justify-center border-red-500/20">
                  <p className="text-xs text-red-400 font-heading">Erro ao carregar pergaminho 📜</p>
                </div>
              }>
                <PostCard 
                  post={post} 
                  user={user} 
                  onToggleReaction={toggleReaction} 
                  onToggleComments={toggleComments}
                  onCommentDraftChange={(text: string) => setCommentDrafts(d => ({ ...d, [post.id]: text }))}
                  commentDraft={commentDrafts[post.id] || ""}
                  onSubmitComment={() => submitComment(post.id)}
                  reactions={REACTIONS}
                />
              </ErrorBoundary>
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

// PostCard component moved to @/components/PostCard.tsx

