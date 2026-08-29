
export const playUiSound = () => {
  const audio = new Audio('/ui_audio/switch10Trim.ogg');
  audio.volume = 0.2; // Adjust volume as needed
  audio.play().catch(e => console.error("UI Audio playback failed:", e));
};

export const playHoverSound = () => {
  const audio = new Audio('/ui_audio/mouserelease1.ogg');
  audio.volume = 0.1; // Quieter for hover
  audio.play().catch(e => console.error("Hover Audio playback failed:", e));
};

