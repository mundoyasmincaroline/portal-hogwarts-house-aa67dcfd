import { useState, useEffect, useCallback, useRef } from "react";
import { feedService } from "@/services/features/feedService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Button } from "@/components/ui/button";
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
import MonthlyCheckInCalendar from "@/components/MonthlyCheckInCalendar";
import DailyMissionsPanel from "@/components/DailyMissionsPanel";
import StreakFreezeCard from "@/components/StreakFreezeCard";
import { UpcomingBirthdays } from "@/components/UpcomingBirthdays";

import EmojiIcon from "@/components/shared/EmojiIcon";
const REACTIONS = ["⚡", "❤️", "🔥", "🦁", "🦅", "🐍", "🦡"];

export default function Feed() {
  const { user } = useAuth();
  const { posts, setPosts, loading, loadFeed, hasMore } = useFeed();
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [houseStats, setHouseStats] = useState<Record<House, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  
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

  useRealtime("posts", "*", () => loadFeed(true, true));
  useRealtime("post_comments", "*", () => loadFeed(true, true));
  useRealtime("post_reactions", "*", () => loadFeed(true, true));

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

  const handleDeletePost = async (postId: string) => {
    try {
      await feedService.deletePost(postId);
      setPosts(ps => ps.filter(p => p.id !== postId));
      toast.success("Pergaminho desintegrado com sucesso.");
    } catch (err: any) {
      toast.error("Erro ao excluir post: " + err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await feedService.deleteComment(commentId);
      setPosts(ps => ps.map(p => ({
        ...p,
        comments: p.comments.filter(c => c.id !== commentId)
      })));
      toast.success("Comentário removido.");
    } catch (err: any) {
      toast.error("Erro ao excluir comentário.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <MagicalDashboardHeader />
      <div className="space-y-4 text-center sm:text-left">
        <h1 className="text-4xl sm:text-6xl font-heading text-gold-gradient tracking-tighter drop-shadow-[0_10px_20px_rgba(212,175,55,0.3)]">Salão Principal</h1>
        <p className="text-foreground/85 text-sm sm:text-base italic uppercase tracking-[0.28em] font-light">Os pergaminhos que narram a história do castelo</p>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {["all", "social", "conquistas", "global"].map((c) => (
              <Button
                key={c}
                variant={category === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(c)}
                className="capitalize rounded-full min-w-[100px]"
              >
                {c}
              </Button>
            ))}
          </div>
          <PostComposer bannedWords={bannedWords} />

          {loading && <p className="text-center text-foreground/80 text-sm py-6">Carregando feed...</p>}
          {!loading && posts.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center space-y-3 border border-white/5">
              <div className="text-5xl"><EmojiIcon e="📜" /></div>
              <p className="font-heading text-foreground">O Salão Principal está em silêncio...</p>
              <p className="text-sm text-foreground/65 italic font-serif max-w-md mx-auto">
                "Seja o primeiro bruxo a inscrever suas palavras neste pergaminho — toda lenda começa com uma linha."
              </p>
            </div>
          )}

          {posts.map((post, index) => (
            <div key={post.id} className="min-h-[150px]">
              {index > 0 && index % 10 === 0 && <MagicAdBanner />}
              <ErrorBoundary fallback={
                <div className="glass rounded-xl p-4 min-h-[100px] flex items-center justify-center border-destructive/20">
                  <p className="text-xs text-destructive font-heading">Erro ao carregar pergaminho <EmojiIcon e="📜" /></p>
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
                  onDeletePost={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                  reactions={REACTIONS}
                />
              </ErrorBoundary>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center py-8">
              <button 
                onClick={() => loadFeed(false)} 
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-heading uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? "Invocando mais pergaminhos..." : "Carregar mais"}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-8 h-fit">
          <ActiveWizardsSidebar onlineUsers={onlineUsers} />
          <DailyMissionsPanel />
          <MonthlyCheckInCalendar />
          <StreakFreezeCard />
          <UpcomingBirthdays />
          <ChallengesSidebar activeChallenges={activeChallenges} />
        </div>
      </div>
    </div>
  );
}
