
// Audio presets for the magic experience
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
  | 'cauldron';

const AUDIO_URLS: Record<AudioPreset, string> = {
  magic: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=magic-wand-6214.mp3",
  door: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_b8c9103bc6.mp3?filename=door-opening-and-closing-113856.mp3",
  levelUp: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8b9d03bc6.mp3?filename=level-up-113856.mp3", // Fallback, real URL in build
  coin: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_1025c1539c.mp3?filename=coins-1.mp3",
  notify: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_24e3ec2d5e.mp3?filename=glitch-interference-104886.mp3",
  error: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_error.mp3",
  whoosh: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_whoosh.mp3",
  quill: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_quill.mp3",
  bookFlip: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_book.mp3",
  wandSwish: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_wand.mp3",
  owlHoot: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_owl.mp3",
  cauldron: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_cauldron.mp3"
};

// Simplified AudioEngine using HTMLAudioElement for better caching
class AudioEngine {
  private cache: Map<AudioPreset, HTMLAudioElement> = new Map();
  private masterVolume = 0.5;

  private isEnabled(): boolean {
    return localStorage.getItem("sound_enabled") !== "false";
  }

  public play(preset: AudioPreset, volumeScale = 1) {
    if (!this.isEnabled()) return;

    try {
      let audio = this.cache.get(preset);
      if (!audio) {
        audio = new Audio(AUDIO_URLS[preset]);
        audio.preload = "auto";
        this.cache.set(preset, audio);
      }

      // Clone for overlapping sounds
      const playInstance = audio.cloneNode() as HTMLAudioElement;
      playInstance.volume = this.masterVolume * volumeScale;
      playInstance.play().catch(() => {});
    } catch (e) {
      console.warn("AudioEngine failed to play:", preset, e);
    }
  }

  public setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
  }
}

export const audioEngine = new AudioEngine();
