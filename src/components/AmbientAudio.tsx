import { useEffect, useRef, useState } from "react";
import { Music, Music2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

// Trilha contínua suave (Archive.org — Hogwarts ambient long-form, CC)
const AMBIENT_URL = "https://archive.org/download/hogwartsambience/Hogwarts%20Ambience.mp3";

export default function AmbientAudio() {
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
      const a = new Audio(AMBIENT_URL);
      a.loop = true;
      a.volume = 0.18;
      audioRef.current = a;
    }

    if (enabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [enabled, loaded]);

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
      title={enabled ? "Desligar trilha mágica" : "Ligar trilha mágica do castelo"}
      className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full glass border border-primary/30 hover:border-primary/60 flex items-center justify-center text-primary transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(201,168,76,0.4)]"
    >
      {enabled ? <Music2 size={16} className="animate-pulse" /> : <Music size={16} className="opacity-60" />}
    </button>
  );
}
