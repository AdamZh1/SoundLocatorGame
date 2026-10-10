import { useRef, useEffect, useState, useCallback } from 'react';
import { audioFiles } from '../audioConfig';
import { ATTENUATION_ZERO_DISTANCE_M, MAX_TARGET_DISTANCE_M } from '../gameConfig';
import type { LevelListener } from '../types';

// Decoding uses an OfflineAudioContext so no real AudioContext exists before the
// user's first click. The promise is module-level so buffers are fetched once per
// page load, even when StrictMode mounts the hook twice.
let bufferPromise: Promise<Map<string, AudioBuffer>> | null = null;

const loadBuffers = (): Promise<Map<string, AudioBuffer>> => {
  if (!bufferPromise) {
    const decoder = new OfflineAudioContext(1, 1, 44100);
    bufferPromise = Promise.allSettled(
      audioFiles.map(async ({ file }) => {
        const response = await fetch(`/game_audio_comp/${file}`);
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        const buffer = await decoder.decodeAudioData(await response.arrayBuffer());
        return [file, buffer] as const;
      })
    ).then((results) => {
      const buffers = new Map<string, AudioBuffer>();
      for (const result of results) {
        if (result.status === 'fulfilled') {
          buffers.set(result.value[0], result.value[1]);
        } else {
          console.error('Failed to load sound:', result.reason);
        }
      }
      return buffers;
    });
  }
  return bufferPromise;
};

// masterVolume only drives the master gain node; it never touches the spatial math.
export const useSpatialAudio = (masterVolume: number) => {
  const audioContext = useRef<AudioContext | null>(null);
  const masterGain = useRef<GainNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const masterVolumeRef = useRef(masterVolume);
  const buffers = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSources = useRef(new Set<AudioBufferSourceNode>());
  const levelListeners = useRef(new Set<LevelListener>());
  const levelFrame = useRef<number | null>(null);
  const [loadedFiles, setLoadedFiles] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBuffers()
      .then((loadedBuffers) => {
        if (cancelled) return;
        buffers.current = loadedBuffers;
        setLoadedFiles([...loadedBuffers.keys()]);
        if (loadedBuffers.size === 0) {
          setLoadError('Could not load sounds. Check your connection and reload.');
        }
      })
      .catch((e) => {
        console.error('Audio loading failed:', e);
        if (!cancelled) setLoadError('Audio is not supported in this browser.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    masterVolumeRef.current = masterVolume;
    if (audioContext.current && masterGain.current) {
      masterGain.current.gain.setValueAtTime(masterVolume, audioContext.current.currentTime);
    }
  }, [masterVolume]);

  useEffect(() => () => {
    if (levelFrame.current !== null) cancelAnimationFrame(levelFrame.current);
    audioContext.current?.close();
    audioContext.current = null;
  }, []);

  // Must be called from a user gesture (browser autoplay policy)
  const ensureContextReady = async () => {
    if (!audioContext.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      gain.gain.value = masterVolumeRef.current;

      // Shared bus: Master Gain -> Analyser -> Destination
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      audioContext.current = ctx;
      masterGain.current = gain;
      analyserNode.current = analyser;
    }
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
  };

  // One rAF loop at most, running only while something is playing
  const startLevelLoop = () => {
    const analyser = analyserNode.current;
    if (levelFrame.current !== null || !analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (const value of data) sum += value;
      const level = sum / data.length / 255;
      levelListeners.current.forEach((listener) => listener(level));
      levelFrame.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopLevelLoop = () => {
    if (levelFrame.current !== null) {
      cancelAnimationFrame(levelFrame.current);
      levelFrame.current = null;
    }
    levelListeners.current.forEach((listener) => listener(0));
  };

  // Resolves when the sound has finished playing
  const playAudio = async (x: number, z: number, soundName: string): Promise<void> => {
    await ensureContextReady();
    const ctx = audioContext.current;
    const master = masterGain.current;
    const buffer = buffers.current.get(soundName);
    if (!ctx || !master || !buffer) return;

    // Per-sound chain: Source -> Pinna Filter -> Panner -> Distance Gain -> Master Gain
    const filter = ctx.createBiquadFilter();
    filter.type = 'highshelf';
    filter.frequency.value = 5500;
    // Pinna filter: linear treble cut for sounds behind the listener
    filter.gain.value = z > 0 ? -5 * Math.min(z / MAX_TARGET_DISTANCE_M, 1) : 0;

    // Panner handles direction only; distance falloff is the manual curve below
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 0;
    panner.positionX.value = x;
    panner.positionY.value = 0;
    panner.positionZ.value = z;

    const distance = Math.sqrt(x * x + z * z);
    const distanceGain = ctx.createGain();
    distanceGain.gain.value = Math.max(0, 1 - Math.pow(distance / ATTENUATION_ZERO_DISTANCE_M, 0.75));

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(panner);
    panner.connect(distanceGain);
    distanceGain.connect(master);

    activeSources.current.add(source);
    startLevelLoop();

    await new Promise<void>((resolve) => {
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        panner.disconnect();
        distanceGain.disconnect();
        activeSources.current.delete(source);
        if (activeSources.current.size === 0) stopLevelLoop();
        resolve();
      };
      source.start();
    });
  };

  // Listener receives the output level (0-1) every frame while audio plays, then 0 when it stops
  const subscribeLevel = useCallback((listener: LevelListener) => {
    levelListeners.current.add(listener);
    return () => {
      levelListeners.current.delete(listener);
    };
  }, []);

  const soundFiles = audioFiles.filter(({ file }) => loadedFiles.includes(file));

  return {
    playAudio,
    initAudio: ensureContextReady,
    subscribeLevel,
    soundFiles,
    loaded: soundFiles.length > 0,
    loadError,
  };
};
