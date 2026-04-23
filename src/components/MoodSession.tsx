import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { addXP } from "@/lib/xpSystem";

const MOODS = [
  { emoji: "⚡", label: "Animado(a)" },
  { emoji: "📖", label: "Estudioso(a)" },
  { emoji: "😴", label: "Cansado(a)" },
  { emoji: "🧙‍♂️", label: "Mágico(a)" },
  { emoji: "🐍", label: "Astuto(a)" },
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
      <div className="glass rounded-xl p-4 text-center my-4">
        <p className="text-sm text-muted-foreground">Você está se sentindo <span className="text-lg mx-1">{selectedMood}</span> hoje!</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 my-4">
      <p className="text-sm font-heading text-center text-foreground mb-3">Como está seu humor mágico hoje?</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {MOODS.map((m) => (
          <Button
            key={m.label}
            variant="outline"
            className="text-xl hover:bg-primary/20 hover:scale-110 transition-transform p-2 h-auto"
            onClick={() => handleShareMood(m.emoji)}
            title={m.label}
          >
            {m.emoji}
          </Button>
        ))}
      </div>
    </div>
  );
}
