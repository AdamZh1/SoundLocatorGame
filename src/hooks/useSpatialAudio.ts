import { useRef, useEffect, useState } from 'react';
import { audioFiles } from '../audioConfig';

export const useSpatialAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const pannerNode = useRef<PannerNode | null>(null);
  const buffers = useRef<Map<string, AudioBuffer>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initAudio = async () => {
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

      for (const file of audioFiles) {
        const response = await fetch(`/${file}`);
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
        buffers.current.set(file, audioBuffer);
      }
      setLoaded(true);
    };

    initAudio();
  }, []);

  const playAudio = (x: number, z: number, volume: number, soundName: string) => {
    if (!audioContext.current || !gainNode.current || !pannerNode.current || !buffers.current.has(soundName)) return;

    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

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
