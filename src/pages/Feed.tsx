import { useState, useEffect, useCallback, useRef } from "react";
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
