import { useRef, useEffect } from 'react';

export const useSpatialAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const pannerNode = useRef<PannerNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext only once
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode.current = audioContext.current.createGain();
      pannerNode.current = audioContext.current.createPanner();
      
      pannerNode.current.panningModel = 'HRTF';
      pannerNode.current.distanceModel = 'linear';
      pannerNode.current.refDistance = 1;
      pannerNode.current.maxDistance = 10000;
      pannerNode.current.rolloffFactor = 0; // Disable built-in attenuation

      pannerNode.current.connect(gainNode.current);
      gainNode.current.connect(audioContext.current.destination);
    }
  }, []);

  const playAudio = (x: number, z: number, volume: number) => {
    if (!audioContext.current || !gainNode.current || !pannerNode.current) return;

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    // Manual distance-based volume calculation
    const distance = Math.sqrt(x * x + z * z);
    // Custom curve: adjusted to make close-range differences more perceptible
    // while maintaining a similar fall-off profile at longer distances.
    const attenuation = Math.max(0, 1 - Math.pow(distance / 50, 0.75)); 
    const finalVolume = volume * attenuation;

    gainNode.current.gain.setValueAtTime(finalVolume, audioContext.current.currentTime);
    
    // Set panner position (x, y, z)
    pannerNode.current.positionX.value = x;
    pannerNode.current.positionY.value = 0;
    pannerNode.current.positionZ.value = z;

    // Create a short beep sound
    const oscillator = audioContext.current.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.current.currentTime);
    
    oscillator.connect(pannerNode.current);
    
    oscillator.start();
    oscillator.stop(audioContext.current.currentTime + 1); // 1 second
  };

  const setVolume = (volume: number) => {
    if (audioContext.current && gainNode.current) {
      gainNode.current.gain.setValueAtTime(volume, audioContext.current.currentTime);
    }
  };

  return { playAudio, setVolume };
};
