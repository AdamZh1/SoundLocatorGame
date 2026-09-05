import { useRef, useEffect, useState } from 'react';
import { audioFiles } from '../audioConfig';

export const useSpatialAudio = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const pannerNode = useRef<PannerNode | null>(null);
  const filterNode = useRef<BiquadFilterNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isGraphFullyConnected = useRef(false);
  const buffers = useRef<Map<string, AudioBuffer>>(new Map());
  const [loaded, setLoaded] = useState(false);
  
  // Pre-load buffers on mount
  useEffect(() => {
    const loadBuffers = async () => {
      // Temporary context just to decode audio data without playing
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      for (const { file } of audioFiles) {
        const response = await fetch(`/game_audio_comp/${file}`);
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
      filterNode.current = audioContext.current.createBiquadFilter();
      analyserNode.current = audioContext.current.createAnalyser();
      
      analyserNode.current.fftSize = 32;

      filterNode.current.type = 'highshelf';
      filterNode.current.frequency.value = 5500;
      
      pannerNode.current.panningModel = 'HRTF';
      pannerNode.current.distanceModel = 'linear';
      pannerNode.current.refDistance = 1;
      pannerNode.current.maxDistance = 10000;
      pannerNode.current.rolloffFactor = 0; 

      // Connect filter -> panner, but Panner -> Gain will be deferred until first play
      filterNode.current.connect(pannerNode.current);
      // Chain: Gain -> Analyser -> Destination
      gainNode.current.connect(analyserNode.current);
      analyserNode.current.connect(audioContext.current.destination);
    }
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
  };

  const playAudio = async (
    x: number, 
    z: number, 
    volume: number, 
    soundName: string, 
    dotRef: React.RefObject<HTMLDivElement | null>,
    ringRef: React.RefObject<HTMLDivElement | null>
  ) => {
    await ensureContextReady();
    if (!audioContext.current || !gainNode.current || !pannerNode.current || !filterNode.current || !analyserNode.current || !buffers.current.has(soundName)) return;

    const distance = Math.sqrt(x * x + z * z);
    const attenuation = Math.max(0, 1 - Math.pow(distance / 50, 0.75)); 
    const finalVolume = volume * attenuation;

    gainNode.current.gain.setValueAtTime(finalVolume, audioContext.current.currentTime);
    
    // Pinna Filter logic - linear ramp for backward sounds
    const MAX_DISTANCE = 35;
    filterNode.current.gain.value = z > 0 ? -5 * Math.min(z / MAX_DISTANCE, 1) : 0;
    
    // Explicitly schedule position updates to prevent race conditions
    const now = audioContext.current.currentTime;
    pannerNode.current.positionX.setValueAtTime(x, now);
    pannerNode.current.positionY.setValueAtTime(0, now);
    pannerNode.current.positionZ.setValueAtTime(z, now);
    
    // Connect panner -> gain ONLY when playing for the first time
    // This ensures position is set BEFORE the audio reaches the destination
    if (!isGraphFullyConnected.current && pannerNode.current && gainNode.current) {
        pannerNode.current.connect(gainNode.current);
        isGraphFullyConnected.current = true;
    }

    const source = audioContext.current.createBufferSource();
    source.buffer = buffers.current.get(soundName)!;
    source.connect(filterNode.current);
    source.start();

    // Start animation loop
    const bufferLength = analyserNode.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const animate = () => {
      if (!analyserNode.current) return;
      analyserNode.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const dotScale = 1 + (average / 255) * 1.5; // Scale between 1 and 2.5
      const ringScale = 1 + (average / 255) * 0.2; // Smaller pulse for ring
      
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(-50%, -50%) scale(${dotScale})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `scale(${ringScale})`;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    source.onended = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (dotRef.current) {
        dotRef.current.style.transform = 'translate(-50%, -50%) scale(1.0)';
      }
      if (ringRef.current) {
        ringRef.current.style.transform = 'scale(1.0)';
      }
    };
  };

  const setVolume = (volume: number) => {
    if (audioContext.current && gainNode.current) {
      gainNode.current.gain.setValueAtTime(volume, audioContext.current.currentTime);
    }
  };

  return { playAudio, setVolume, initAudio: ensureContextReady, soundFiles: audioFiles, loaded };
};
