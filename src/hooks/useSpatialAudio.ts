import { useRef, useEffect, useState } from 'react';
import { audioFiles } from '../audioConfig';

export const useSpatialAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const pannerNode = useRef<PannerNode | null>(null);
  const buffers = useRef<Map<string, AudioBuffer>>(new Map());
  const [loaded, setLoaded] = useState(false);

  // Pre-load buffers on mount
  useEffect(() => {
    const loadBuffers = async () => {
      // Temporary context just to decode audio data without playing
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      for (const file of audioFiles) {
        const response = await fetch(`/${file}`);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        buffers.current.set(file, audioBuffer);
      }
      setLoaded(true);
      await ctx.close();
    };
    loadBuffers();
  }, []);

  // Ensure AudioContext is initialized and resumed
  const ensureContextReady = async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNode.current = audioContext.current.createGain();
      pannerNode.current = audioContext.current.createPanner();
      
      pannerNode.current.panningModel = 'HRTF';
      pannerNode.current.distanceModel = 'linear';
      pannerNode.current.refDistance = 1;
      pannerNode.current.maxDistance = 10000;
      pannerNode.current.rolloffFactor = 0; 

      pannerNode.current.connect(gainNode.current);
      gainNode.current.connect(audioContext.current.destination);
    }
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
  };

  const playAudio = async (x: number, z: number, volume: number, soundName: string) => {
    await ensureContextReady();
    if (!audioContext.current || !gainNode.current || !pannerNode.current || !buffers.current.has(soundName)) return;

    const distance = Math.sqrt(x * x + z * z);
    const attenuation = Math.max(0, 1 - Math.pow(distance / 50, 0.75)); 
    const finalVolume = volume * attenuation;

    gainNode.current.gain.setValueAtTime(finalVolume, audioContext.current.currentTime);
    
    pannerNode.current.positionX.value = x;
    pannerNode.current.positionY.value = 0;
    pannerNode.current.positionZ.value = z;

    const source = audioContext.current.createBufferSource();
    source.buffer = buffers.current.get(soundName)!;
    source.connect(pannerNode.current);
    source.start();
  };

  const setVolume = (volume: number) => {
    if (audioContext.current && gainNode.current) {
      gainNode.current.gain.setValueAtTime(volume, audioContext.current.currentTime);
    }
  };

  return { playAudio, setVolume, soundFiles: audioFiles, loaded };
};
