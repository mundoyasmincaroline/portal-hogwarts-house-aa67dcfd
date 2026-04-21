import { useState, useEffect, useCallback } from "react";
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

const REACTIONS = ["⚡", "❤️", "🔥", "🦁", "🦅", "🐍", "🦡"];

interface PostAuthor {
  full_name: string;
  username: string;
  house: House;
  avatar_url?: string | null;
  vip_plan?: string | null;
}

interface FeedPost {
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

export default function Feed() {
  const { profile, user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [newMusicUrl, setNewMusicUrl] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [houseStats, setHouseStats] = useState<Record<House, number>>({
    gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0,
  });
  const [activeChallenges, setActiveChallenges] = useState<{ id: string; title: string; xp_reward: number; type: string }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [bannedWords, setBannedWords] = useState<string[]>([]);

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
      .select("user_id, full_name, username, house, avatar_url, vip_plan")
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
      .select("user_id, full_name, username, house, avatar_url")
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
        music_url: p.music_url,
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
    supabase.rpc("award_galeons", { _user_id: user.id, _amount: 2, _reason: "post" }).then(() => {});
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
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* MONSTER QUALITY STORIES */}
      <div className="animate-in fade-in slide-in-from-top-10 duration-1000">
         <StoriesBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          {/* PREMIUM GREETING & STATUS */}
          <div className="space-y-6">
             <DynamicGreeting />
             <BirthdayBanner />
             <VipUpsellBanner
               currentVip={(profile as any)?.vip_plan}
               galeons={(profile as any)?.galeons ?? 0}
               username={profile?.full_name}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <DailyHighlight />
             <MoodSession />
          </div>

          {/* MONSTER POST COMPOSER */}
          <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] p-8 md:p-10 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group transition-all duration-700 hover:border-primary/40">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] group-focus-within:bg-primary/20 transition-all duration-700" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex gap-6">
                 <div className="relative shrink-0">
                    <div className="absolute -inset-1 bg-primary blur-md opacity-20 rounded-2xl" />
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
                       <SafeImage src={profile?.avatar_url} alt="Me" className="w-full h-full object-cover" />
                    </div>
                 </div>
                 <textarea
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                   placeholder="Que feitiço você realizou hoje? ✨"
                   maxLength={1000}
                   className="w-full bg-transparent resize-none text-lg text-white placeholder:text-white/20 focus:outline-none min-h-[120px] py-2 scrollbar-hide font-serif italic"
                 />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-white/5">
                <div className="flex-1 relative group/music">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/music:text-primary transition-colors">
                      <Zap size={18} />
                   </div>
                   <input 
                     type="text" 
                     value={newMusicUrl} 
                     onChange={(e) => setNewMusicUrl(e.target.value)} 
                     placeholder="Invoque uma música (Link)..." 
                     className="w-full bg-black/40 rounded-2xl pl-12 pr-4 py-4 text-xs text-white placeholder:text-white/20 focus:outline-none border border-white/5 focus:border-primary/50 transition-all shadow-inner" 
                   />
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                  <span className="text-[10px] font-heading text-white/20 uppercase tracking-[0.3em]">{newPost.length}/1000</span>
                  <button 
                    disabled={!newPost.trim() || posting} 
                    onClick={submitPost}
                    className="px-10 py-4 bg-primary text-white font-heading text-[10px] tracking-[0.3em] rounded-2xl shadow-[0_15px_30px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 uppercase"
                  >
                    {posting ? "LANÇANDO..." : "PUBLICAR"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* POSTS FEED */}
          <div className="space-y-12">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                 <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 border border-white/5" />
                 <p className="text-[10px] font-heading text-white/20 uppercase tracking-[0.5em]">Consultando os Pergaminhos...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-black/40 backdrop-blur-3xl rounded-[3rem] p-20 text-center border border-white/10 opacity-40">
                 <p className="text-[10px] font-heading uppercase tracking-[0.5em]">O silêncio ecoa pelo castelo...</p>
              </div>
            ) : (
              posts.map((post, index) => (
                <div key={post.id} className="animate-in fade-in slide-in-from-bottom-10 duration-1000" style={{ animationDelay: `${index * 150}ms` }}>
                  {index > 0 && index % 3 === 0 && <MagicAdBanner />}
                  
                  <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group/post transition-all duration-700 hover:border-white/20">
                    {/* Dynamic House Aura */}
                    <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-[0.08] transition-opacity duration-1000 group-hover/post:opacity-[0.15] ${
                       post.author?.house === 'gryffindor' ? 'bg-red-600' :
                       post.author?.house === 'slytherin' ? 'bg-green-600' :
                       post.author?.house === 'ravenclaw' ? 'bg-blue-600' : 'bg-yellow-600'
                    }`} />

                    <div className="relative z-10 p-8 md:p-12">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative group/author cursor-pointer shrink-0" onClick={() => navigate(`/dashboard/profile/${post.user_id}`)}>
                          <div className={`absolute -inset-2 rounded-[2rem] blur-xl opacity-20 group-hover/author:opacity-60 transition-opacity duration-500 ${
                             post.author?.house === 'gryffindor' ? 'bg-red-500' :
                             post.author?.house === 'slytherin' ? 'bg-green-500' :
                             post.author?.house === 'ravenclaw' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`} />
                          <div className="w-16 h-16 rounded-[1.5rem] bg-black/60 border border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl">
                            {post.author?.avatar_url ? (
                              <img src={post.author.avatar_url} alt={post.author?.full_name} className="w-full h-full object-cover group-hover/author:scale-110 transition-transform duration-700" />
                            ) : (
                              <span className="text-xl font-heading text-primary">{post.author?.full_name?.[0] || "?"}</span>
                            )}
                          </div>
                          <div className="absolute -bottom-2 -right-2 z-20 scale-125 md:scale-150 drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]">
                             <HouseCrest house={post.author?.house as House} size="xs" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-lg font-heading text-white tracking-tight">{post.author?.full_name || "Bruxo Incógnito"}</p>
                            {post.author?.vip_plan === "founder" && <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-yellow-600 to-amber-400 text-black font-heading text-[8px] tracking-[0.2em] shadow-lg">FUNDADOR</div>}
                            {post.author?.vip_plan === "vip" && <div className="px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-400 text-white font-heading text-[8px] tracking-[0.2em] shadow-lg">VIP</div>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] text-white/30 font-heading uppercase tracking-[0.3em]">@{post.author?.username}</p>
                             <span className="w-1 h-1 rounded-full bg-white/10" />
                             <p className="text-[10px] text-white/30 font-heading uppercase tracking-[0.3em]">
                                {new Date(post.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="relative">
                           <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-transparent to-transparent rounded-full" />
                           <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-serif italic whitespace-pre-wrap pl-2">{post.content}</p>
                        </div>
                        
                        {post.music_url && (
                          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/60 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] group/player">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-1000" />
                            {post.music_url.includes("spotify.com/track/") ? (
                              <iframe 
                                src={post.music_url.replace("open.spotify.com/track/", "open.spotify.com/embed/track/")} 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allow="encrypted-media" 
                                className="relative z-10 grayscale hover:grayscale-0 transition-all duration-700"
                              ></iframe>
                            ) : (
                              <div className="p-6">
                                 <audio controls src={post.music_url} className="w-full h-10 opacity-60 hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/5">
                          <div className="flex flex-wrap gap-2.5">
                            {post.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction(post.id, r.emoji, r.mine)}
                                className={`px-5 py-2 rounded-2xl text-[10px] font-heading tracking-widest transition-all duration-500 border shadow-2xl ${
                                   r.mine 
                                    ? "bg-primary border-primary text-white shadow-primary/30 scale-105" 
                                    : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/30"
                                }`}
                              >
                                {r.emoji} <span className="ml-2 opacity-60">{r.count}</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                            {REACTIONS.slice(0, 5).map((emoji) => {
                              const existing = post.reactions.find((r) => r.emoji === emoji);
                              if (existing) return null;
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(post.id, emoji, false)}
                                  className="text-lg hover:scale-150 hover:rotate-12 transition-all duration-500 p-1"
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => toggleComments(post.id)}
                            className="ml-auto flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-heading text-white/30 hover:text-white hover:bg-white/10 transition-all tracking-[0.4em] uppercase"
                          >
                            <MessageCircle size={16} />
                            {post.comments.length} DIÁLOGOS
                          </button>
                        </div>
                      </div>

                      {post.showComments && (
                        <div className="mt-10 pt-10 border-t border-white/5 space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
                          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {post.comments.map((c) => (
                              <div key={c.id} className="flex gap-4 items-start group/comment">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                                  {c.author?.avatar_url ? (
                                    <img src={c.author.avatar_url} alt={c.author?.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-heading text-primary">{c.author?.full_name?.[0] || "?"}</span>
                                  )}
                                </div>
                                <div className="flex-1 bg-white/[0.03] rounded-[2rem] px-6 py-4 border border-white/5 group-hover/comment:border-white/10 transition-all duration-500 shadow-inner">
                                  <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] font-heading text-primary uppercase tracking-[0.3em]">{c.author?.full_name}</p>
                                    <span className="text-[8px] text-white/20 font-heading tracking-widest">{new Date(c.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-sm text-white/60 leading-relaxed italic">"{c.content}"</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-4 pt-4">
                            <input
                              value={commentDrafts[post.id] || ""}
                              onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                              placeholder="Sussurre sua resposta..."
                              maxLength={500}
                              className="flex-1 bg-black/40 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none border border-white/5 focus:border-primary/50 transition-all shadow-inner"
                            />
                            <button 
                               onClick={() => submitComment(post.id)}
                               className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-[0_10px_20px_rgba(251,191,36,0.3)] hover:scale-105 active:scale-95 transition-all"
                            >
                               <ChevronRight size={24} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MONSTER SIDEBAR */}
        <div className="lg:col-span-4 space-y-8">
          <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                  <Users size={24} className="text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
               </div>
               <div>
                  <h3 className="font-heading text-sm text-white tracking-[0.3em] uppercase">No Castelo</h3>
                  <p className="text-[10px] text-white/20 font-heading uppercase tracking-widest">Bruxos Ativos</p>
               </div>
            </div>
            
            <div className="space-y-6">
              {/* MORPHEUS STATUS */}
              <div className="relative group overflow-hidden rounded-[2rem] bg-black border border-green-500/20 p-5 shadow-[0_10px_30px_rgba(34,197,94,0.1)] hover:border-green-500/50 transition-all duration-700 cursor-help">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-black border border-green-500/40 flex items-center justify-center font-mono text-green-500 shadow-inner group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all">
                      <span className="animate-pulse text-lg font-bold">M</span>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-green-500 tracking-[0.4em] font-bold">MORPHEUS</p>
                      <p className="text-[9px] font-mono text-green-500/30 truncate mt-1">ONLINE_SYSTEM_READY</p>
                   </div>
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]" />
                </div>
              </div>

              {/* YASMIN FOUNDER STATUS */}
              <div className="relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-yellow-500/10 to-amber-900/30 border border-yellow-500/20 p-5 shadow-2xl hover:scale-105 transition-all duration-700">
                <div className="flex items-center gap-4 relative z-10">
                   <div className="relative shrink-0">
                      <div className="absolute -inset-1 bg-yellow-400 blur-lg opacity-20 animate-pulse" />
                      <div className="w-12 h-12 rounded-[1.2rem] border-2 border-yellow-400/50 overflow-hidden relative z-10 shadow-2xl">
                         <img src="https://i.pinimg.com/736x/8e/31/b0/8e31b0a8801d4a04d55cc3b89b88cfbb.jpg" className="w-full h-full object-cover" />
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-heading text-yellow-400 tracking-[0.3em] uppercase">Yasmin Caroline</p>
                      <p className="text-[9px] font-heading text-yellow-500/40 uppercase tracking-widest mt-1">A Fundadora</p>
                   </div>
                   <Sparkles size={16} className="text-yellow-400 animate-spin-slow opacity-60" />
                </div>
              </div>

              {/* ONLINE USERS LIST */}
              <div className="pt-8 space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar border-t border-white/5">
                {onlineUsers.map((u) => (
                  <div key={u.id} className="group flex items-center gap-4 p-2 hover:bg-white/[0.03] rounded-2xl transition-all duration-500 cursor-pointer" onClick={() => navigate(`/dashboard/profile/${u.user_id}`)}>
                    <div className={`relative w-10 h-10 rounded-xl overflow-hidden border shrink-0 transition-all duration-500 group-hover:scale-110 shadow-lg ${
                       u.house === 'gryffindor' ? 'border-red-500/30' :
                       u.house === 'slytherin' ? 'border-green-500/30' :
                       u.house === 'ravenclaw' ? 'border-blue-500/30' : 'border-yellow-500/30'
                    }`}>
                      <SafeImage src={u.avatar_url} className="w-full h-full object-cover" fallbackText={u.full_name[0]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-heading text-white/80 truncate group-hover:text-primary transition-colors tracking-tight">{u.full_name.split(' ')[0]}</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-heading mt-0.5">@{u.username}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${isUserOnline(u) ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-white/5 border border-white/10'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CHALLENGES WIDGET */}
          <div className="relative overflow-hidden bg-black/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] group transition-all duration-700 hover:border-primary/20">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/40 shadow-inner">
                  <Trophy size={20} className="text-primary drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
               </div>
               <div>
                  <h3 className="font-heading text-xs text-white tracking-[0.3em] uppercase leading-none">Desafios</h3>
                  <p className="text-[9px] text-white/20 font-heading uppercase tracking-widest mt-1">Conquiste o Prestígio</p>
               </div>
            </div>
            
            <div className="space-y-4">
              {activeChallenges.map((c) => (
                <div key={c.id} className="relative p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-500 group/ch overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/ch:opacity-100 transition-opacity" />
                   <div className="relative z-10 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-heading text-white/80 group-hover/ch:text-primary transition-colors leading-tight">{c.title}</p>
                         <Star size={14} className="text-yellow-500/20 group-hover/ch:text-yellow-500 group-hover/ch:rotate-12 transition-all duration-500" />
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-heading text-[8px] tracking-[0.2em] border border-primary/20">{c.xp_reward} XP</span>
                         <span className="text-[8px] font-heading text-white/20 uppercase tracking-[0.3em]">{c.type === "daily" ? "DIÁRIO" : "SEMANAL"}</span>
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
