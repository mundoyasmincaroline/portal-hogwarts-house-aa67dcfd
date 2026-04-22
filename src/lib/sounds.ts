export const playSound = (type: 'click' | 'hover' | 'success' | 'chest_open' | 'chest_reward' | 'spell' | 'azkaban_wind') => {
  const sounds: Record<string, string> = {
    click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3',
    hover: 'https://www.soundjay.com/buttons/sounds/button-21.mp3',
    success: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
    chest_open: 'https://www.soundjay.com/misc/sounds/magic-wand-01.mp3',
    chest_reward: 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3',
    spell: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3',
    azkaban_wind: 'https://www.soundjay.com/misc/sounds/wind-chime-1.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.volume = type === 'azkaban_wind' ? 0.1 : 0.2;
  if (type === 'azkaban_wind') audio.loop = true;
  audio.play().catch(() => {
    console.warn("Audio interaction requires user gesture.");
  });
  return audio;
};

export const playDoorSound = () => {
  const audio = new Audio('https://www.soundjay.com/door/sounds/door-open-1.mp3');
  audio.volume = 0.2;
  audio.play().catch(() => {});
};

export const playMagicSound = () => {
  const audio = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3');
  audio.volume = 0.2;
  audio.play().catch(() => {});
};

let soundEnabled = true;
export const isSoundEnabled = () => soundEnabled;
export const toggleSound = () => { soundEnabled = !soundEnabled; return soundEnabled; };

let ambientAudio: HTMLAudioElement | null = null;
export const playAmbientMusic = () => {
  if (ambientAudio) return;
  ambientAudio = new Audio('https://www.soundjay.com/nature/sounds/wind-chime-1.mp3'); // Placeholder místico loopable
  ambientAudio.volume = 0.05;
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
