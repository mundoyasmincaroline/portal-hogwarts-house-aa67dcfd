import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/core-utils";

/**
 * Trilha ambiente do Castelo — sintetizada via Web Audio API.
 *
 * Garantias cross-browser/cross-device:
 *  - Suporte a `webkitAudioContext` (iOS/Safari antigo).
 *  - O AudioContext só é CRIADO dentro de um gesto do usuário (clique no botão),
 *    nunca na montagem — respeita a política de autoplay de Chrome/Safari/Firefox.
 *  - Se o usuário já tinha ativado antes (preferência salva), instalamos um
 *    listener de "primeiro gesto" que retoma a música automaticamente.
 *  - Pausa quando a aba fica oculta e retoma quando volta (economia de bateria
 *    em mobile e evita estouro de polifonia no Safari).
 *  - Fade-in/out suaves para não estourar o tímpano.
 *
 * Preferência persistida em `localStorage.ambient_music_enabled`.
 * (Independente do `sound_enabled` que controla apenas SFX.)
 */

const PREF_KEY = "ambient_music_enabled";
const readPref = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "true";
};
const writePref = (v: boolean) => {
  try { localStorage.setItem(PREF_KEY, String(v)); } catch { /* quota */ }
};

export default function AmbientAudio({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState<boolean>(() => readPref());
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  /** Cria/retoma o AudioContext. Deve ser chamado DENTRO de um gesto. */
  const ensureCtx = useCallback((): AudioContext | null => {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) {
      try { ctxRef.current = new Ctor(); } catch { return null; }
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const startAmbient = useCallback(() => {
    if (nodesRef.current) return;
    const ctx = ensureCtx();
    if (!ctx) return;
    // Em alguns navegadores ainda fica "suspended" até a Promise resolver
    if (ctx.state !== "running") {
      ctx.resume().then(() => startAmbient()).catch(() => {});
      return;
    }

    try {
      const master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.5);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
      filter.connect(master);

      // Acorde aberto A — pad sustentado
      const freqs = [110, 164.81, 220]; // A2, E3, A3
      const oscs = freqs.map((f) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.5;
        o.connect(g).connect(filter);
        o.start();
        return { o, g };
      });

      // LFO suave no cutoff para movimento orgânico
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 250;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      nodesRef.current = {
        stop: () => {
          try {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
            setTimeout(() => {
              oscs.forEach(({ o }) => { try { o.stop(); } catch {} });
              try { lfo.stop(); } catch {}
            }, 1300);
          } catch { /* ignore */ }
        },
      };
    } catch (e) {
      console.warn("AmbientAudio start failed:", e);
    }
  }, [ensureCtx]);

  const stopAmbient = useCallback(() => {
    nodesRef.current?.stop();
    nodesRef.current = null;
  }, []);

  // Liga/desliga quando o usuário troca o estado (toggle = gesto válido)
  useEffect(() => {
    if (enabled) startAmbient();
    else stopAmbient();
    return () => stopAmbient();
  }, [enabled, startAmbient, stopAmbient]);

  // Se já estava ativado antes do reload, ativa no PRIMEIRO gesto do usuário
  // (autoplay seria bloqueado se tentássemos antes do gesto)
  useEffect(() => {
    if (!enabled) return;
    if (nodesRef.current) return;
    const tryStart = () => {
      startAmbient();
      if (nodesRef.current) cleanup();
    };
    const opts: AddEventListenerOptions = { passive: true };
    const cleanup = () => {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
      window.removeEventListener("touchstart", tryStart);
    };
    window.addEventListener("pointerdown", tryStart, opts);
    window.addEventListener("keydown", tryStart, opts);
    window.addEventListener("touchstart", tryStart, opts);
    return cleanup;
  }, [enabled, startAmbient]);

  // Pausa quando a aba fica oculta — economia de bateria/CPU em mobile
  useEffect(() => {
    const onVisibility = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (document.hidden) {
        ctx.suspend().catch(() => {});
      } else if (enabled) {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  // Limpeza ao desmontar
  useEffect(() => () => {
    stopAmbient();
    try { ctxRef.current?.close(); } catch { /* ignore */ }
    ctxRef.current = null;
  }, [stopAmbient]);

  const handleToggle = () => {
    const next = !enabled;
    // Tocar/parar imediatamente acontece via useEffect; aqui só persistimos
    writePref(next);
    setEnabled(next);
    // Garante que o contexto seja criado neste gesto (necessário no iOS)
    if (next) ensureCtx();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={enabled ? "Desligar trilha do castelo" : "Ligar trilha do castelo"}
      aria-pressed={enabled}
      title={enabled ? "Desligar trilha do castelo" : "Ligar trilha do castelo"}
      className={cn(
        "touch-target w-10 h-10 text-foreground/85 hover:bg-primary/15 hover:text-primary rounded-xl border border-transparent hover:border-primary/25 transition-all active:scale-90 flex items-center justify-center",
        enabled && "text-primary bg-primary/10 border-primary/20",
        className
      )}
    >
      {enabled ? <Volume2 size={16} className="animate-pulse" /> : <VolumeX size={16} className="opacity-70" />}
    </button>
  );
}
