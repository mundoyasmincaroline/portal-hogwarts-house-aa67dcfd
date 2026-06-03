import { memo } from "react";
import HouseCrest from "@/components/rpg/HouseCrest";
import { Button } from "@/components/ui/button";
import SafeImage from "@/components/SafeImage";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EmojiIcon from "@/components/shared/EmojiIcon";
interface PostCardProps {
  post: any;
  user: any;
  onToggleReaction: (postId: string, emoji: string, mine: boolean) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (text: string) => void;
  commentDraft: string;
  onSubmitComment: () => void;
  onDeletePost?: (postId: string) => void;
  onDeleteComment?: (commentId: string) => void;
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
  onDeletePost,
  onDeleteComment,
  reactions 
}: PostCardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="glass rounded-[2.5rem] p-6 sm:p-10 border border-primary/15 hover:border-primary/40 shadow-2xl group/card relative mb-8 transition-all duration-700 hover:shadow-primary/20"
  >
    <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary/30 flex items-center justify-center overflow-hidden border-2 shrink-0 transition-all duration-500 group-hover/card:scale-105 ${post.author?.house === 'gryffindor' ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : post.author?.house === 'slytherin' ? 'border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : post.author?.house === 'ravenclaw' ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'}`}>
        <SafeImage 
          src={post.author?.avatar_url} 
          alt={post.author?.full_name || "Bruxo"} 
          className="w-full h-full object-cover" 
          fallbackText={post.author?.full_name}
        />
      </div>
      <div className="flex-1 min-w-0 py-0.5 sm:py-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-0.5 sm:mb-0">
          <p className="text-sm sm:text-base font-heading text-foreground font-semibold tracking-tight truncate">
            {post.author?.full_name || "Bruxo desconhecido"}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.author?.vip_plan === "founder" && <span className="text-[7px] sm:text-[8px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 sm:px-2 py-0.5 rounded-full font-heading tracking-widest uppercase shadow-[0_0_10px_rgba(234,179,8,0.1)]"><EmojiIcon e="👑" /> Fundador</span>}
            {post.author?.vip_plan === "vip" && <span className="text-[7px] sm:text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 sm:px-2 py-0.5 rounded-full font-heading tracking-widest uppercase"><EmojiIcon e="💜" /> VIP</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[10px] sm:text-[11px] text-primary/90 font-semibold uppercase tracking-wider truncate max-w-[100px] sm:max-w-none">@{post.author?.username}</span>
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span className="text-[10px] sm:text-[11px] text-foreground/70">{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      {post.author?.house && <div className="shrink-0 scale-75 sm:scale-90 origin-right transition-transform group-hover/card:scale-100 duration-500 ml-auto sm:ml-0 mr-2"><HouseCrest house={post.author.house} size="sm" /></div>}
      
      {user?.id === post.user_id && onDeletePost && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/50 hover:text-destructive transition-colors">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur border-white/10">
            <DropdownMenuItem 
              onClick={() => onDeletePost(post.id)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir Pergaminho
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>

    <div className="relative mb-6 group/content">
      <p className="text-base sm:text-lg leading-relaxed text-foreground whitespace-pre-wrap font-serif italic border-l-2 border-primary/40 pl-5 py-3 transition-all group-hover/content:border-primary group-hover/content:pl-7 duration-500 bg-gradient-to-r from-primary/10 via-primary/[0.03] to-transparent rounded-r-xl">
        {post.content}
      </p>
      <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-primary/30 blur-sm opacity-0 group-hover/content:opacity-100 transition-opacity" />
    </div>

    
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
        className="px-3 sm:px-4 py-2 rounded-2xl text-[10px] sm:text-[11px] font-heading uppercase tracking-[0.04em] sm:tracking-widest text-foreground/85 bg-black/40 border border-white/10 hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 ml-auto sm:ml-0 flex items-center gap-2 min-h-[36px]"
      >
        <span className="text-sm"><EmojiIcon e="💬" /></span> {post.comments?.length || 0}
      </button>
    </div>

    <AnimatePresence>
      {post.showComments && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-5 pt-5 border-t border-white/5 space-y-4 overflow-hidden"
        >
        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {post.comments?.map((c: any) => (
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
              {user?.id === c.user_id && onDeleteComment && (
                <button 
                  onClick={() => onDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-foreground/30 hover:text-destructive transition-all"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 bg-black/60 p-3 rounded-2xl border border-white/10 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-2xl">
          <input
            value={commentDraft}
            onChange={(e) => onCommentDraftChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && commentDraft.trim()) onSubmitComment(); }}
            placeholder="Escreva um comentário mágico..."
            maxLength={500}
            className="flex-1 bg-transparent rounded-xl px-4 py-2.5 text-xs focus:outline-none text-foreground placeholder:text-muted-foreground/50 italic"
          />
          <Button size="sm" variant="magical" className="rounded-xl px-4 sm:px-6 font-heading text-[10px] uppercase shadow-none" onClick={onSubmitComment}>
            Enviar
          </Button>
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  </motion.div>
));

PostCard.displayName = "PostCard";

export default PostCard;