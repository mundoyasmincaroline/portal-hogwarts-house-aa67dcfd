import { memo } from "react";
import HouseCrest from "@/components/HouseCrest";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import { motion } from "framer-motion";

interface PostCardProps {
  post: any;
  user: any;
  onToggleReaction: (postId: string, emoji: string, mine: boolean) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (text: string) => void;
  commentDraft: string;
  onSubmitComment: () => void;
  reactions: string[];
}

const PostCard = memo(({ 
  post, 
  user, 
  onToggleReaction, 
  onToggleComments, 
  onCommentDraftChange, 
  commentDraft, 
  onSubmitComment, 
  reactions 
}: PostCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 transition-all duration-500 border-white/5 hover:border-primary/20"
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center font-heading text-primary overflow-hidden border-2 shrink-0 ${post.author?.house === 'gryffindor' ? 'border-red-500/50' : post.author?.house === 'slytherin' ? 'border-green-500/50' : post.author?.house === 'ravenclaw' ? 'border-blue-500/50' : 'border-yellow-500/50'}`}>
        <SafeImage 
          src={post.author?.avatar_url} 
          alt={post.author?.full_name || "Bruxo"} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
          fallbackText={post.author?.full_name}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-foreground truncate">
            {post.author?.full_name || "Bruxo desconhecido"}
          </p>
          {post.author?.vip_plan === "founder" && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-heading tracking-widest uppercase">👑 Fundador</span>}
          {post.author?.vip_plan === "vip" && <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-heading tracking-widest uppercase">💜 VIP</span>}
        </div>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">@{post.author?.username} • {new Date(post.created_at).toLocaleDateString("pt-BR")} às {new Date(post.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      {post.author?.house && <div className="hidden sm:block shrink-0 opacity-80 hover:opacity-100 transition-opacity"><HouseCrest house={post.author.house} size="sm" /></div>}
    </div>

    <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 mb-5 whitespace-pre-wrap font-serif italic border-l-2 border-primary/20 pl-4 py-1">
      {post.content}
    </p>
    
    {post.music_url && (
      <div className="mb-5 overflow-hidden rounded-2xl shadow-xl border border-white/5">
        {post.music_url.includes("spotify.com/track/") ? (
          <iframe 
            src={post.music_url.replace("open.spotify.com/track/", "open.spotify.com/embed/track/")} 
            width="100%" 
            height="80" 
            frameBorder="0" 
            allow="encrypted-media" 
            loading="lazy"
            className="rounded-xl opacity-90 hover:opacity-100 transition-opacity"
          ></iframe>
        ) : (
          <audio controls src={post.music_url} className="w-full h-10 bg-secondary/30 rounded-xl" />
        )}
      </div>
    )}

    <div className="flex flex-wrap items-center gap-2 pt-2">
      <div className="flex flex-wrap gap-2">
        {post.reactions.map((r: any) => (
          <button
            key={r.emoji}
            onClick={() => onToggleReaction(post.id, r.emoji, r.mine)}
            className={`px-3 sm:px-4 py-1.5 rounded-2xl text-[10px] sm:text-xs transition-all duration-300 flex items-center gap-1 sm:gap-1.5 active:scale-90 ${r.mine ? "bg-primary/20 text-primary border border-primary/40 shadow-[0_5px_15px_rgba(212,175,55,0.2)]" : "glass hover:bg-white/5 border-white/5"}`}
          >
            <span className="text-sm">{r.emoji}</span>
            <span className="font-bold">{r.count}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 bg-black/30 rounded-2xl px-3 py-1.5 border border-white/5">
        {reactions.map((emoji: string) => {
          const existing = post.reactions.find((r: any) => r.emoji === emoji);
          if (existing) return null;
          return (
            <button
              key={emoji}
              onClick={() => onToggleReaction(post.id, emoji, false)}
              className="text-sm hover:scale-125 transition-all duration-300 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 p-0.5"
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onToggleComments(post.id)}
        className="glass px-3 sm:px-4 py-1.5 rounded-2xl text-[10px] sm:text-[11px] font-heading uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all active:scale-95 ml-auto sm:ml-0 flex items-center gap-2"
      >
        <span className="text-sm">💬</span> {post.comments.length}
      </button>
    </div>

    {post.showComments && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-5 pt-5 border-t border-white/5 space-y-4"
      >
        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {post.comments.map((c: any) => (
            <div key={c.id} className="flex gap-3 items-start group">
              <div className={`w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0 border border-primary/20 transition-transform group-hover:scale-110`}>
                <SafeImage 
                  src={c.author?.avatar_url} 
                  alt={c.author?.full_name || "Bruxo"} 
                  className="w-full h-full object-cover" 
                  fallbackText={c.author?.full_name}
                />
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5 group-hover:border-primary/10 transition-colors shadow-inner">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tighter">{c.author?.full_name}</p>
                <p className="text-sm text-foreground/80 leading-relaxed font-serif italic">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-white/10 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-2xl">
          <input
            value={commentDraft}
            onChange={(e) => onCommentDraftChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmitComment()}
            placeholder="Escreva um comentário mágico..."
            maxLength={500}
            className="flex-1 bg-transparent rounded-xl px-4 py-2.5 text-xs focus:outline-none text-foreground placeholder:text-muted-foreground/50 italic"
          />
          <Button size="sm" variant="magical" className="rounded-xl px-6 font-heading text-[10px] tracking-widest uppercase shadow-none" onClick={onSubmitComment}>
            Enviar
          </Button>
        </div>
      </motion.div>
    )}
  </motion.div>
));

PostCard.displayName = "PostCard";

export default PostCard;