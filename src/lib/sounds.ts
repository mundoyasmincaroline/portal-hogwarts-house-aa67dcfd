export const playSound = (type: 'click' | 'hover' | 'success' | 'chest_open' | 'chest_reward' | 'spell' | 'azkaban_wind') => {
  if (!soundEnabled) return;

  const sounds: Record<string, string> = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Crystal click
    hover: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Subtle shimmer
    success: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Magic Chime Epic
    chest_open: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3', // Heavy lock opening
    chest_reward: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3', // Heavenly reveal
    spell: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Energy blast
    azkaban_wind: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3' // Eerie wind
  };

  const audio = new Audio(sounds[type]);
  audio.volume = type === 'azkaban_wind' ? 0.08 : 0.15;
  if (type === 'azkaban_wind') audio.loop = true;
  audio.play().catch(() => {
    console.warn("Audio interaction requires user gesture.");
  });
  return audio;
};

export const playDoorSound = () => {
  if (!soundEnabled) return;
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2180/2180-preview.mp3');
  audio.volume = 0.15;
  audio.play().catch(() => {});
};

export const playMagicSound = () => {
  if (!soundEnabled) return;
  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  audio.volume = 0.15;
  audio.play().catch(() => {});
};

let soundEnabled = true;
export const isSoundEnabled = () => soundEnabled;
export const toggleSound = () => { 
  soundEnabled = !soundEnabled; 
  if (!soundEnabled) stopAmbientMusic();
  return soundEnabled; 
};

let ambientAudio: HTMLAudioElement | null = null;
export const playAmbientMusic = () => {
  if (ambientAudio || !soundEnabled) return;
  // Trilha épica: Cinematic Mysterious
  ambientAudio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c35f992a6c.mp3?filename=mysterious-celestial-ambient-11005.mp3'); 
  ambientAudio.volume = 0.04;
  ambientAudio.loop = true;
  ambientAudio.play().catch(() => {
    console.warn("Ambient music blocked by browser. Interaction needed.");
    ambientAudio = null;
  });
};

export const stopAmbientMusic = () => {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio = null;
  }
};
