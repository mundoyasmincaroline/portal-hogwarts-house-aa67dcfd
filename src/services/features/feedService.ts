import { supabase } from "@/integrations/supabase/client";
import { FeedPost } from "@/types";

export const feedService = {
  /**
   * getPosts — Busca posts e já tenta resolver autores básicos para reduzir requests subsequentes.
   */
  async getPosts(limit = 20, offset = 0): Promise<any[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const posts = data || [];
    if (posts.length === 0) return posts;

    // Otimização: Busca autores em lote
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];
    const authors = await this.getProfiles(userIds);
    const authorMap = new Map(authors.map((a: any) => [a.user_id, a]));
    
    return posts.map((p: any) => ({ ...p, author: authorMap.get(p.user_id) }));
  },

  /**
   * getProfiles — Busca perfis em lote de forma otimizada.
   */
  async getProfiles(userIds: string[]) {
    if (!userIds.length) return [];
    
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, house, avatar_url, vip_plan")
      .in("user_id", userIds);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * getReactionsAndComments — Busca todas as interações dos posts visíveis em apenas 2 queries.
   */
  async getReactionsAndComments(postIds: string[]) {
    if (!postIds.length) return { reactions: [], comments: [] };

    const [reactionsRes, commentsRes] = await Promise.all([
      supabase.from("post_reactions").select("post_id, emoji, user_id").in("post_id", postIds),
      supabase.from("post_comments").select("*").in("post_id", postIds).order("created_at", { ascending: true }),
    ]);

    return { 
      reactions: reactionsRes.data || [], 
      comments: commentsRes.data || [] 
    };
  },

  async createPost(userId: string, content: string, musicUrl?: string) {
    const { data, error } = await supabase.from("posts").insert({
      user_id: userId,
      content,
      music_url: musicUrl || null,
    } as any).select().single();
    
    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
    if (error) throw error;
  }
};
