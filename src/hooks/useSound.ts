import { useCallback } from 'react';

/**
 * useSound Hook - Monster Quality Audio System
 * Provides cinematic sounds for the Hogwarts Portal experience.
 */
export const useSound = () => {
  const playSound = useCallback((type: 'magic' | 'success' | 'click' | 'dark' | 'cash') => {
    const sounds: Record<string, string> = {
      magic: 'https://www.soundjay.com/buttons/sounds/button-37.mp3', // Sparkling magic
      success: 'https://www.soundjay.com/buttons/sounds/button-09.mp3', // Achievement
      click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3', // Premium click
      dark: 'https://www.soundjay.com/ambient/sounds/wind-chime-1.mp3', // Eerie ambient
      cash: 'https://www.soundjay.com/buttons/sounds/button-30.mp3', // Money/Galeon sound
    };

    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio playback blocked by browser policy.", e));
  }, []);

  return { playSound };
};
