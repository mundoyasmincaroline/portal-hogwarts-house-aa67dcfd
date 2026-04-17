import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
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

const REACTIONS = ["⚡", "❤️", "🔥", "🦁", "🦅", "🐍", "🦡"];

interface PostAuthor {
  full_name: string;
  username: string;
  house: House;
}

interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: PostAuthor;
  reactions: { emoji: string; count: number; mine: boolean }[];
  comments: { id: string; user_id: string; content: string; created_at: string; author?: PostAuthor }[];
  showComments?: boolean;
}

export default function Feed() {
  const { profile, user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [houseStats, setHouseStats] = useState<Record<House, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);

  const loadFeed = useCallback(async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!postsData) { setLoading(false); return; }

    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: authors } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, house")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    const postIds = postsData.map((p) => p.id);
    const safeIds = postIds.length ? postIds : ["00000000-0000-0000-0000-000000000000"];
    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabase.from("post_reactions").select("post_id, emoji, user_id").in("post_id", safeIds),
      supabase.from("post_comments").select("*").in("post_id", safeIds).order("created_at", { ascending: true }),
    ]);

    const commentUserIds = [...new Set((comments || []).map((c) => c.user_id))];
    const { data: commentAuthors } = await supabase
      .from("profiles")
      .select("user_id, full_name, username, house")
      .in("user_id", commentUserIds.length ? commentUserIds : ["00000000-0000-0000-0000-000000000000"]);

    const authorMap = new Map((authors || []).map((a) => [a.user_id, a as PostAuthor & { user_id: string }]));
    const commentAuthorMap = new Map((commentAuthors || []).map((a) => [a.user_id, a as PostAuthor & { user_id: string }]));

    const enriched: FeedPost[] = postsData.map((p) => {
      const postReactions = (reactions || []).filter((r) => r.post_id === p.id);
      const grouped: Record<string, { count: number; mine: boolean }> = {};
      postReactions.forEach((r) => {
        if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
        grouped[r.emoji].count++;
        if (r.user_id === user?.id) grouped[r.emoji].mine = true;
      });

      const postComments = (comments || []).filter((c) => c.post_id === p.id).map((c) => ({
        ...c,
        author: commentAuthorMap.get(c.user_id),
      }));

      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        created_at: p.created_at,
        author: authorMap.get(p.user_id),
        reactions: Object.entries(grouped).map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
        comments: postComments,
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user?.id]);

  const loadSidebar = useCallback(async () => {
    const { data: hp } = await supabase.from("house_points").select("house, points");
    const stats: Record<House, number> = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
    (hp || []).forEach((row: { house: House; points: number }) => {
      stats[row.house] = (stats[row.house] || 0) + row.points;
    });
    setHouseStats(stats);

    const { data: ch } = await supabase.from("challenges").select("id, title, xp_reward, type").eq("active", true).limit(5);
    setActiveChallenges(ch || []);
  }, []);

  useEffect(() => {
    loadFeed();
    loadSidebar();
    const channel = supabase
      .channel("feed-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_reactions" }, () => loadFeed())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadFeed, loadSidebar]);

  const submitPost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from("posts").insert({ user_id: user.id, content: newPost.trim() } as never);
    setPosting(false);
    if (error) {
      toast.error(error.message.includes("Filch") ? error.message : "Erro ao publicar: " + error.message);
      return;
    }
    setNewPost("");
    toast.success("Publicado! ✨");
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
      <StoriesBar />
      <div className="glass rounded-2xl p-6">
        <h1 className="font-heading text-2xl text-gold-gradient mb-1">
          Bem-vindo, {profile?.full_name?.split(" ")[0] || "Bruxo"}! ⚡
        </h1>
        <p className="text-muted-foreground text-sm">O que você vai fazer hoje no mundo mágico?</p>
      </div>

      <BirthdayBanner />
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
            <div className="flex justify-between items-center mt-2">
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
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-heading text-primary">
                    {post.author?.full_name?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{post.author?.full_name || "Bruxo desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">@{post.author?.username} • {new Date(post.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                  {post.author?.house && <HouseCrest house={post.author.house} size="sm" />}
                </div>
                <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>

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
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-heading text-primary shrink-0">
                          {c.author?.full_name?.[0] || "?"}
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
            <h3 className="font-heading text-sm text-primary mb-3">🏆 Ranking das Casas</h3>
            <div className="space-y-2">
              {sortedHouses.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <HouseCrest house={h.id} size="sm" />
                  <span className="text-sm flex-1 text-foreground">{h.name}</span>
                  <span className="text-xs font-heading text-primary">{h.points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="font-heading text-sm text-primary mb-3">⚔️ Desafios Ativos</h3>
            <div className="space-y-2">
              {activeChallenges.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum desafio ativo agora.</p>
              )}
              {activeChallenges.map((c) => (
                <div key={c.id} className="p-2 bg-secondary/30 rounded-lg">
                  <p className="text-xs font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.xp_reward} XP • {c.type === "daily" ? "Diário" : "Semanal"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
