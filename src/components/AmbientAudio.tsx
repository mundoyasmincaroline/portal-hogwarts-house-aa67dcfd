import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/core-utils";
import { isSoundEnabled, toggleSound } from "@/services/core/soundService";

/**
 * Som unificado: controla SFX (cliques, mágicas) + trilha ambiente sintetizada.
 * A trilha é gerada via Web Audio API (sem dependência de CDN/rede), garantindo
 * que sempre funcione. Preferência persistida em localStorage via soundService.
 */
export default function AmbientAudio({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState<boolean>(() => isSoundEnabled());
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void } | null>(null);

  const startAmbient = () => {
    if (nodesRef.current) return;
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return;
      const ctx: AudioContext = ctxRef.current || new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      // Pad suave: 3 osciladores em intervalo (acorde sustenido) + filtro passa-baixa + LFO
      const master = ctx.createGain();
      master.gain.value = 0.0;
      master.connect(ctx.destination);
      // fade-in
      master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2.5);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.6;
      filter.connect(master);

      const freqs = [110, 164.81, 220]; // A2, E3, A3 — acorde aberto
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

      // LFO no filtro para movimento suave
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
          } catch {}
        },
      };
    } catch {}
  };

  const stopAmbient = () => {
    nodesRef.current?.stop();
    nodesRef.current = null;
  };

  useEffect(() => {
    if (enabled) startAmbient(); else stopAmbient();
    return () => stopAmbient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => () => {
    stopAmbient();
    try { ctxRef.current?.close(); } catch {}
  }, []);

  const handleToggle = () => {
    // sincroniza com o sound service (SFX)
    const current = isSoundEnabled();
    if (current !== enabled) {
      // estado fora de sync — alinha
    }
    const next = !current;
    toggleSound(); // flips localStorage
    setEnabled(next);
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={enabled ? "Desligar sons do castelo" : "Ligar sons do castelo"}
      title={enabled ? "Desligar sons do castelo" : "Ligar sons do castelo"}
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
