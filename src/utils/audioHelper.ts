
export const playUiSound = () => {
  const audio = new Audio('/ui_audio/switch10.ogg');
  audio.volume = 0.2; // Adjust volume as needed
  audio.play().catch(e => console.error("UI Audio playback failed:", e));
};
