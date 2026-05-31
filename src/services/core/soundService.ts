import { audioEngine } from "./audioEngine";

export const isSoundEnabled = () => localStorage.getItem("sound_enabled") !== "false";

export const toggleSound = () => {
  const current = isSoundEnabled();
  localStorage.setItem("sound_enabled", (!current).toString());
  return !current;
};

export const playMagicSound = () => {
  audioEngine.play('magic');
};

export const playDoorSound = () => {
  audioEngine.play('door');
};

export const playGlitchSound = () => {
  audioEngine.play('notify');
};
