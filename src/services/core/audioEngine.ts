/**
 * Motor de SFX 100% sintetizado via Web Audio API.
 * Zero dependência de rede / CDN / arquivos externos: funciona em qualquer
 * navegador (Chrome, Safari/iOS, Firefox, Edge), não sofre com CORS, ad-blocker,
 * 404 ou latência. Respeita a política de autoplay: só toca depois de um gesto
 * do usuário (o AudioContext é criado/retomado preguiçosamente).
 */
export type AudioPreset =
  | 'magic'
  | 'door'
  | 'levelUp'
  | 'coin'
  | 'notify'
  | 'error'
  | 'whoosh'
  | 'quill'
  | 'bookFlip'
  | 'wandSwish'
  | 'owlHoot'
  | 'cauldron'
  | 'tap';

type Ctx = AudioContext;

class AudioEngine {
  private ctx: Ctx | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume = 0.5;
  private unlockBound = false;

  private isEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sound_enabled") !== "false";
  }

  /** Garante AudioContext + tenta retomar (necessário em Safari/iOS após gesto). */
  private ensureCtx(): Ctx | null {
    if (typeof window === "undefined") return null;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;

    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.ctx.destination);
        this.bindUnlock();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Em iOS/Safari um AudioContext criado fora de um gesto fica "suspended" para sempre. */
  private bindUnlock() {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;
    const unlock = () => {
      if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
    };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
  }

  public play(preset: AudioPreset, volumeScale = 1) {
    if (!this.isEnabled()) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    // Se o contexto ainda está suspenso (sem gesto), evita silently fail
    if (ctx.state !== "running") return;
    try {
      const out = ctx.createGain();
      out.gain.value = Math.max(0, Math.min(1, volumeScale));
      out.connect(this.masterGain);
      PRESETS[preset](ctx, out);
    } catch (e) {
      console.warn("AudioEngine play failed:", preset, e);
    }
  }

  public setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }
}

/* ───────────── Síntese dos SFX ───────────── */

const env = (ctx: Ctx, gain: GainNode, peak: number, attack: number, release: number, t0 = ctx.currentTime) => {
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
};

const tone = (ctx: Ctx, out: GainNode, freq: number, type: OscillatorType, peak: number, attack: number, release: number, slideTo?: number) => {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo !== undefined) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + attack + release);
  o.connect(g).connect(out);
  env(ctx, g, peak, attack, release);
  o.start();
  o.stop(ctx.currentTime + attack + release + 0.05);
};

const noise = (ctx: Ctx, out: GainNode, peak: number, attack: number, release: number, filter?: { type: BiquadFilterType; freq: number; q?: number }) => {
  const dur = attack + release + 0.05;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  let node: AudioNode = src;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type;
    f.frequency.value = filter.freq;
    if (filter.q !== undefined) f.Q.value = filter.q;
    src.connect(f);
    node = f;
  }
  node.connect(g).connect(out);
  env(ctx, g, peak, attack, release);
  src.start();
  src.stop(ctx.currentTime + dur);
};

const PRESETS: Record<AudioPreset, (ctx: Ctx, out: GainNode) => void> = {
  magic: (ctx, out) => {
    tone(ctx, out, 880, "sine", 0.35, 0.01, 0.25, 1760);
    tone(ctx, out, 1318, "triangle", 0.18, 0.02, 0.35, 2637);
  },
  wandSwish: (ctx, out) => {
    noise(ctx, out, 0.25, 0.005, 0.18, { type: "bandpass", freq: 2200, q: 1.2 });
  },
  whoosh: (ctx, out) => {
    noise(ctx, out, 0.3, 0.04, 0.35, { type: "lowpass", freq: 900 });
  },
  door: (ctx, out) => {
    tone(ctx, out, 180, "sawtooth", 0.25, 0.02, 0.45, 80);
    noise(ctx, out, 0.12, 0.01, 0.4, { type: "lowpass", freq: 600 });
  },
  levelUp: (ctx, out) => {
    const t0 = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      o.connect(g).connect(out);
      const start = t0 + i * 0.09;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.3, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      o.start(start);
      o.stop(start + 0.45);
    });
  },
  coin: (ctx, out) => {
    tone(ctx, out, 988, "square", 0.22, 0.005, 0.08);
    setTimeout(() => tone(ctx, out, 1319, "square", 0.22, 0.005, 0.12), 60);
  },
  notify: (ctx, out) => {
    tone(ctx, out, 880, "sine", 0.25, 0.01, 0.12);
    setTimeout(() => tone(ctx, out, 1175, "sine", 0.25, 0.01, 0.18), 90);
  },
  error: (ctx, out) => {
    tone(ctx, out, 220, "square", 0.3, 0.005, 0.18, 110);
  },
  quill: (ctx, out) => {
    noise(ctx, out, 0.18, 0.005, 0.09, { type: "highpass", freq: 3500 });
  },
  bookFlip: (ctx, out) => {
    noise(ctx, out, 0.22, 0.005, 0.12, { type: "bandpass", freq: 1500, q: 0.7 });
  },
  owlHoot: (ctx, out) => {
    tone(ctx, out, 392, "sine", 0.3, 0.05, 0.35, 330);
    setTimeout(() => tone(ctx, out, 392, "sine", 0.28, 0.05, 0.4, 311), 320);
  },
  cauldron: (ctx, out) => {
    noise(ctx, out, 0.18, 0.02, 0.5, { type: "lowpass", freq: 350 });
    tone(ctx, out, 90, "sine", 0.12, 0.05, 0.6);
  },
  tap: (ctx, out) => {
    tone(ctx, out, 1200, "sine", 0.2, 0.002, 0.05);
  },
};

export const audioEngine = new AudioEngine();
