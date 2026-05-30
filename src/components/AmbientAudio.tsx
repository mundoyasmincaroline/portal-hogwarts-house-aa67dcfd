import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/core-utils";

// Trilha contínua suave (Archive.org — Hogwarts ambient long-form, CC)
const AMBIENT_URL = "https://archive.org/download/hogwartsambience/Hogwarts%20Ambience.mp3";

export default function AmbientAudio({ className }: { className?: string }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Carrega preferência (default: off)
  useEffect(() => {
    if (!user) { setLoaded(true); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("user_audio_prefs")
        .select("ambient_enabled, volume")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.ambient_enabled) setEnabled(true);
      setLoaded(true);
    })();
  }, [user?.id]);

  // Toca/pausa conforme estado
  useEffect(() => {
    if (!loaded) return;
    
    // Lazy initialize audio only if enabled to save initial bandwidth/memory
    if (enabled && !audioRef.current) {
      try {
        const a = new Audio();
        // Verifica suporte antes de atribuir a src para evitar NotSupportedError silencioso
        const canMp3 = a.canPlayType("audio/mpeg");
        if (!canMp3) {
          // Navegador sem suporte a MP3 — desliga silenciosamente
          return;
        }
        a.src = AMBIENT_URL;
        a.loop = true;
        a.volume = 0.18;
        a.preload = "none";
        a.addEventListener("error", () => {
          // Falha de rede/origem: pausa e libera
          audioRef.current = null;
        });
        audioRef.current = a;
      } catch {
        return;
      }
    }

    if (enabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [enabled, loaded]);

  // Cleanup on unmount to avoid memory leak
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    if (user) {
      await (supabase as any)
        .from("user_audio_prefs")
        .upsert({ user_id: user.id, ambient_enabled: next }, { onConflict: "user_id" });
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Desligar trilha mágica" : "Ligar trilha mágica do castelo"}
      title={enabled ? "Desligar trilha mágica" : "Ligar trilha mágica do castelo"}
      className={cn(
        "touch-target w-9 h-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all active:scale-90",
        enabled && "text-primary bg-primary/10 border-primary/20",
        className
      )}
    >
      {enabled ? <Volume2 size={16} className="animate-pulse" /> : <VolumeX size={16} className="opacity-70" />}
    </button>
  );
}
