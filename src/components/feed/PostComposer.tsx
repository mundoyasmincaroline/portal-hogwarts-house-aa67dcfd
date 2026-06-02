import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { reward } from "@/services/core/rewardService";

interface PostComposerProps {
  bannedWords: string[];
}

export function PostComposer({ bannedWords }: PostComposerProps) {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState("");
  const [newMusicUrl, setNewMusicUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const submitPost = async () => {
    if (!newPost.trim() || !user || posting) return;
    setPosting(true);
    try {
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

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content,
        music_url: newMusicUrl.trim() || null
      } as any);

      if (error) {
        toast.error(error.message.includes("Filch") ? error.message : "Erro ao publicar: " + error.message);
        return;
      }
      setNewPost("");
      setNewMusicUrl("");
      toast.success("Publicado! ✨");
      await reward(user.id, 'post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="glass rounded-[2rem] p-6 sm:p-8 border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent shadow-2xl relative overflow-hidden group/compose transition-all duration-500 hover:border-primary/20">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      
      <textarea
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
        placeholder={[
          "O que os corredores de Hogwarts estão sussurrando hoje?",
          "Qual feitiço você praticou esta manhã?",
          "Alguma fofoca do Profeta Diário para compartilhar?",
          "O que o Chapéu Seletor diria sobre seu dia?",
        ][new Date().getMinutes() % 4]}
        maxLength={1000}
        className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 focus:border-primary/40 transition-all resize-none text-base sm:text-lg text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-h-[140px] font-serif italic shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed"
      />
      
      <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="flex-1 relative group/input">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within/input:text-primary transition-colors duration-300">🎵</div>
          <input 
            type="text" 
            value={newMusicUrl} 
            onChange={(e) => setNewMusicUrl(e.target.value)} 
            placeholder="Link do Spotify ou MP3..." 
            className="w-full bg-black/40 rounded-xl pl-11 pr-4 py-4 text-xs text-foreground focus:outline-none border border-white/5 focus:border-primary/30 transition-all placeholder:text-muted-foreground/20" 
          />
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground/40 font-mono tracking-widest">{newPost.length}/1000</span>
            <span className="text-[8px] text-primary/50 uppercase tracking-tighter font-bold">Encantamento de texto</span>
          </div>
          <Button 
            variant="magical" 
            size="lg" 
            className="font-heading text-xs uppercase tracking-[0.2em] px-12 h-14 rounded-2xl shadow-[0_12px_24px_-8px_rgba(212,175,55,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(212,175,55,0.6)] hover:-translate-y-1" 
            disabled={!newPost.trim() || posting} 
            onClick={submitPost}
          >
            {posting ? "Conjurando..." : "Publicar"}
          </Button>
        </div>
      </div>
    </div>

  );
}
