import { useState, useEffect, useCallback } from "react";
import { feedService, FeedPost, PostAuthor } from "@/services/feedService";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useFeed() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    try {
      const postsData = await feedService.getPosts();
      if (postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = postsData.map((p) => p.id);
      const { reactions, comments } = await feedService.getReactionsAndComments(postIds);

      const commentUserIds = [...new Set(comments.map((c) => c.user_id))];
      const commentAuthors = await feedService.getProfiles(commentUserIds);
      const commentAuthorMap = new Map(commentAuthors.map((a) => [a.user_id, a as PostAuthor & { user_id: string }]));

      const enriched: FeedPost[] = postsData.map((p) => {
        const postReactions = reactions.filter((r) => r.post_id === p.id);
        const grouped: Record<string, { count: number; mine: boolean }> = {};
        postReactions.forEach((r) => {
          if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
          grouped[r.emoji].count++;
          if (r.user_id === user?.id) grouped[r.emoji].mine = true;
        });

        const postComments = comments.filter((c) => c.post_id === p.id).map((c) => ({
          ...c,
          author: commentAuthorMap.get(c.user_id),
        }));

        return {
          ...p,
          author: p.author, // Already joined in service
          reactions: Object.entries(grouped).map(([emoji, data]) => ({ emoji, ...data })),
          comments: postComments,
          showComments: false,
        };
      });

      setPosts(enriched);
    } catch (error: any) {
      toast.error("Erro ao carregar o feed: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    posts,
    setPosts,
    loading,
    loadFeed,
  };
}
