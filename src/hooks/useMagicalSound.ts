
import { useCallback } from 'react';

const SOUNDS = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Magical click
  hover: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // Subtle magic
  gold: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Coin sound
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3', // Flourish
  success: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Sparkle success
};

export const useMagicalSound = () => {
  const play = useCallback((soundName: keyof typeof SOUNDS) => {
    try {
      const audio = new Audio(SOUNDS[soundName]);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore autoplay block errors
      });
    } catch (e) {
      console.warn("Magical sound could not be played:", e);
    }
  }, []);

  return { play };
};
