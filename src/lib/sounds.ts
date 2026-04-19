export const playMagicSound = () => {
  try {
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=magic-wand-6214.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play prevented", e));
  } catch (e) {}
};

export const playDoorSound = () => {
  try {
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_b8c9103bc6.mp3?filename=door-opening-and-closing-113856.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play prevented", e));
  } catch (e) {}
};

export const playGlitchSound = () => {
  try {
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_24e3ec2d5e.mp3?filename=glitch-interference-104886.mp3");
    audio.volume = 0.6;
    audio.play().catch(e => console.log("Audio play prevented", e));
  } catch (e) {}
};
