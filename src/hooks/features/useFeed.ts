import { useState, useEffect, useCallback } from "react";
import { feedService } from "@/services/features/feedService";
import { useAuth } from "@/lib/auth";
import { FeedPost, PostAuthor } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * useFeed — Hook otimizado para carregar e gerenciar o feed.
 * Utiliza enriquecimento de dados em lote para evitar o problema N+1.
 */
export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const loadFeed = useCallback(async (isSilent = false, reset = false) => {
    if (!isSilent) setLoading(true);
    const currentOffset = reset ? 0 : offset;
    
    try {
      const postsData = await feedService.getPosts(LIMIT, currentOffset);
      
      if (postsData.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (postsData.length === 0) {
        if (reset) setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = postsData.map((p) => p.id);
      const { reactions, comments } = await feedService.getReactionsAndComments(postIds);

      // Resolve autores dos comentários em lote
      const commentUserIds = [...new Set(comments.map((c) => c.user_id))];
      const commentAuthors = await feedService.getProfiles(commentUserIds);
      const commentAuthorMap = new Map(commentAuthors.map((a) => [a.user_id, a as PostAuthor & { user_id: string }]));

      // Enriquecimento final
      const enriched: FeedPost[] = postsData.map((p) => {
        const postReactions = reactions.filter((r) => r.post_id === p.id);
        const grouped: Record<string, { count: number; mine: boolean }> = {};
        
        postReactions.forEach((r) => {
          if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
          grouped[r.emoji].count++;
          if (r.user_id === user?.id) grouped[r.emoji].mine = true;
        });

        const postComments = comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            ...c,
            author: commentAuthorMap.get(c.user_id),
          }));

        return {
          ...p,
          reactions: Object.entries(grouped).map(([emoji, data]) => ({ emoji, ...data })),
          comments: postComments,
          showComments: false,
        };
      });

      if (reset) {
        setPosts(enriched);
        setOffset(LIMIT);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const fresh = enriched.filter(p => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
        setOffset(prev => prev + LIMIT);
      }
    } catch (error: any) {
      console.error("Erro no feed:", error);
      toast.error("Erro ao carregar o feed.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, offset]);

  useEffect(() => {
    loadFeed(false, true);
  }, []); // Só carrega na montagem original

  // Realtime simples para novos posts (opcional, mas melhora UX)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase.channel(`feed-updates:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        // Debounce para evitar recarregar várias vezes em rajadas
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { loadFeed(true, true); }, 2000);
      })
      .subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadFeed]);

  return {
    posts,
    setPosts,
    loading,
    loadFeed,
    hasMore,
    setOffset,
  };
}