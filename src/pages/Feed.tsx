import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useAuth } from "@/lib/auth";
import { type House } from "@/types";
import { HOUSES } from "@/types/house";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MagicAdBanner from "@/components/MagicAdBanner";
import { useFeed } from "@/hooks/features/useFeed";
import { useRealtime } from "@/hooks/core/useRealtime";
import PostCard from "@/components/feed/PostCard";
import MagicalDashboardHeader from "@/components/shared/MagicalDashboardHeader";
import { PostComposer } from "@/components/feed/PostComposer";
import { ActiveWizardsSidebar } from "@/components/feed/ActiveWizardsSidebar";
import { ChallengesSidebar } from "@/components/feed/ChallengesSidebar";

const REACTIONS = ["⚡", "❤️", "🔥", "🦁", "🦅", "🐍", "🦡"];

export default function Feed() {
  const { user } = useAuth();
  const { posts, setPosts, loading, loadFeed } = useFeed();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [houseStats, setHouseStats] = useState<Record<House, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  
  const sidebarLoaded = useRef(false);

  const loadSidebar = useCallback(async () => {
    const [{ data: hp }, { data: ch }, { data: users }] = await Promise.all([
      supabase.from("house_points").select("house, points"),
      supabase.from("challenges").select("id, title, xp_reward, type").eq("active", true).limit(5),
      supabase.from("profiles")
        .select("id, user_id, full_name, username, house, avatar_url, online, last_seen")
        .eq("approved", true)
        .order("last_seen", { ascending: false })
        .limit(15)
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
    
    supabase.from("banned_words").select("word").then(({ data }) => {
      if (data) setBannedWords(data.map(d => d.word.toLowerCase()));
    });
  }, [loadFeed, loadSidebar]);

  useRealtime("posts", "*", loadFeed);
  useRealtime("post_comments", "*", loadFeed);
  useRealtime("post_reactions", "*", loadFeed);

  const toggleReaction = async (postId: string, emoji: string, mine: boolean) => {
    if (!user) return;
    if (mine) {
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("emoji", emoji);
    } else {
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji } as any);
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

    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content: text } as any);
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
      <MagicalDashboardHeader />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <PostComposer bannedWords={bannedWords} />

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
          <ActiveWizardsSidebar onlineUsers={onlineUsers} />
          <ChallengesSidebar activeChallenges={activeChallenges} />
        </div>
      </div>
    </div>
  );
}


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
          <div className="glass rounded-[2rem] p-6 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl">
            <h3 className="font-heading text-xs uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-primary/20" />
              Bruxos Ativos
            </h3>
            
            <div className="space-y-4 mb-8">
              {/* Morpheus - Arquiteto */}
              <div className="flex items-center gap-3 p-3 bg-black/40 border border-green-500/20 rounded-2xl group transition-all hover:border-green-500/40">
                <div className="w-10 h-10 rounded-xl shrink-0 border border-green-500/30 relative bg-black flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                  <span className="text-green-500 font-mono text-sm font-bold">M</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-green-500 font-bold font-mono tracking-widest uppercase">Morpheus</p>
                  <p className="text-[8px] font-mono text-green-500/40 uppercase">System Architect</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              </div>

              {/* Yasmin Caroline - A Fundadora */}
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-yellow-500/20 rounded-2xl group transition-all hover:border-yellow-500/40 hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-yellow-500/30 relative">
                  <SafeImage src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Yasmin" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-yellow-500 font-bold font-heading uppercase tracking-wider">Yasmin Caroline</p>
                  <p className="text-[8px] text-yellow-500/40 font-black uppercase tracking-[0.2em]">A Fundadora</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-bounce" />
              </div>

              {/* Filch - O Vigilante */}
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-red-500/10 rounded-2xl group opacity-60 hover:opacity-100 transition-all">
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-red-500/20 grayscale group-hover:grayscale-0 transition-all">
                  <SafeImage src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" alt="Filch" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-red-500 font-bold font-heading uppercase tracking-wider">Argus Filch</p>
                  <p className="text-[8px] text-red-500/30 font-black uppercase tracking-[0.2em]">O Vigilante</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-900 shadow-[0_0_8px_rgba(153,27,27,0.8)]" />
              </div>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border-t border-white/5 pt-6">
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

          <div className="glass rounded-[2rem] p-7 border-white/5 bg-gradient-to-tr from-primary/10 via-transparent to-transparent shadow-2xl overflow-hidden relative group/challenges">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] group-hover/challenges:bg-primary/10 transition-colors" />
            <h3 className="font-heading text-xs uppercase tracking-[0.3em] text-primary/60 mb-6 flex items-center gap-3 relative z-10">
              <span className="w-8 h-[1px] bg-primary/20" />
              Desafios Ativos
            </h3>
            <div className="space-y-4 relative z-10">
              {activeChallenges.length === 0 && (
                <p className="text-[10px] text-muted-foreground uppercase text-center py-6 tracking-[0.4em] opacity-30">Vazio por enquanto</p>
              )}
              {activeChallenges.map((c) => (
                <div key={c.id} className="group/item relative glass rounded-2xl p-5 border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer overflow-hidden hover:-translate-y-1">
                  <div className="absolute inset-y-0 left-0 w-[2px] bg-primary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:scale-110 transition-transform">
                       <MagicalEmoji emoji={c.type === 'daily' ? '⚡' : '🔥'} size="sm" />
                    </div>
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

