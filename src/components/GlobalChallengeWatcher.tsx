import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Swords, Trophy, X, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function GlobalChallengeWatcher() {
  const { user } = useAuth();
  const [latestChallenge, setLatestChallenge] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Escutar por novos desafios criados (id único por instância)
    const channelId = `challenges_channel:global:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "challenges" }, (payload) => {
        if (payload.new && payload.new.active) {
            handleNewChallenge(payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleNewChallenge = (challenge: any) => {
    setLatestChallenge(challenge);
    setShowInvite(true);
    // Reutiliza instância única para evitar vazamento de memória
    if (!audioRef.current) {
      audioRef.current = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_c9c8a0e2a2.mp3");
      audioRef.current.volume = 0.3;
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  if (!showInvite || !latestChallenge) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[70] w-full max-w-sm animate-in slide-in-from-left-full duration-700">
        <div className="glass bg-black/80 backdrop-blur-xl border border-primary/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            
            <button 
                onClick={() => setShowInvite(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
                <X size={18} />
            </button>

            <div className="flex gap-4 items-start relative z-10">
                <div className="p-3 bg-primary/20 rounded-2xl text-primary animate-pulse">
                    <Swords size={24} />
                </div>
                <div className="flex-1 space-y-1">
                    <h4 className="font-heading text-lg text-white">NOVO DESAFIO!</h4>
                    <p className="text-xs text-primary/80 font-bold uppercase tracking-widest">{latestChallenge.title}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {latestChallenge.description}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-1 text-sm font-bold text-yellow-500">
                    <Zap size={14} /> +{latestChallenge.xp_reward} XP
                </div>
                <Button 
                    variant="magical" 
                    size="sm" 
                    className="rounded-xl px-6 h-9"
                    onClick={() => {
                        window.location.href = "/dashboard/challenges";
                        setShowInvite(false);
                    }}
                >
                    Aceitar <ChevronRight size={14} className="ml-1" />
                </Button>
            </div>
        </div>
    </div>
  );
}
