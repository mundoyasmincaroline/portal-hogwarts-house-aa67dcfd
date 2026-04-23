import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { addXP } from "@/lib/xpSystem";
import MagicalEmoji from "./MagicalEmoji";
import { playMagicSound } from "@/lib/sounds";

const MOODS = [
  { emoji: "⚡", label: "Animado(a)" },
  { emoji: "📖", label: "Estudioso(a)" },
  { emoji: "🔮", label: "Místico(a)" },
  { emoji: "✨", label: "Radiante" },
  { emoji: "🐍", label: "Astuto(a)" },
  { emoji: "🔥", label: "Poderoso(a)" },
];

export default function MoodSession() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [hasShared, setHasShared] = useState(false);

  const handleShareMood = async (mood: string) => {
    if (!user) return;
    
    setSelectedMood(mood);
    setHasShared(true);
    
    // Concede XP pelo compartilhamento de humor
    const res = await addXP(user.id, 10, 'message');
    if (res.success) {
      toast.success(`Humor compartilhado! +10 XP ⚡`);
    } else {
      toast.info("Humor registrado! (Aguarde o cooldown para ganhar mais XP)");
    }
  };

  if (hasShared) {
    return (
      <div className="glass rounded-[2rem] p-6 text-center my-6 border-white/5 bg-gradient-to-br from-primary/5 to-transparent">
        <p className="text-sm text-muted-foreground">Você está se sentindo <span className="text-2xl mx-2 align-middle inline-block animate-bounce"><MagicalEmoji emoji={selectedMood || "✨"} size="sm" /></span> hoje!</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2rem] p-6 my-6 border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <p className="text-[10px] font-heading text-center text-primary uppercase tracking-[0.3em] mb-5 font-bold">Estado de Espírito Místico</p>
      <div className="flex justify-center gap-3 flex-wrap relative z-10">
        {MOODS.map((m) => (
          <button
            key={m.label}
            className="hover:scale-125 transition-all duration-300 active:scale-95"
            onClick={() => { handleShareMood(m.emoji); playMagicSound(); }}
            title={m.label}
          >
            <MagicalEmoji emoji={m.emoji} size="md" />
          </button>
        ))}
      </div>
    </div>
  );
}
