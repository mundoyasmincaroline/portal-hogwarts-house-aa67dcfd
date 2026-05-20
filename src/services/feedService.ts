import { supabase } from "@/integrations/supabase/client";
import { House } from "@/lib/auth";

export interface PostAuthor {
  full_name: string;
  username: string;
  house: House;
  avatar_url?: string | null;
  vip_plan?: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  music_url?: string;
  created_at: string;
  author?: PostAuthor;
  reactions: { emoji: string; count: number; mine: boolean }[];
  comments: { id: string; user_id: string; content: string; created_at: string; author?: PostAuthor }[];
  showComments?: boolean;
}

export const feedService = {
  async getPosts(limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from("posts")
      .select("*, author:profiles!posts_user_id_fkey(user_id, full_name, username, house, avatar_url, vip_plan)")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getProfiles(userIds: string[]) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, house, avatar_url, vip_plan")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    
    if (error) throw error;
    return data || [];
  },

  async getReactionsAndComments(postIds: string[]) {
    const safeIds = postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"];
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from("post_reactions").select("post_id, emoji, user_id").in("post_id", safeIds),
      supabase.from("post_comments").select("*").in("post_id", safeIds).order("created_at", { ascending: true }),
    ]);

    return { reactions: reactions || [], comments: comments || [] };
  },

  async createPost(userId: string, content: string, musicUrl?: string) {
    const { data, error } = await supabase.from("posts").insert({
      user_id: userId,
      content,
      music_url: musicUrl || null,
    }).select().single();
    
    if (error) throw error;
    return data;
  }
};
