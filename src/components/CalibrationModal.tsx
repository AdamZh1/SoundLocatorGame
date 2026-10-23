import React, { useEffect, useId, useState } from 'react';
import { motion } from 'motion/react';
import { MiniRadar } from './MiniRadar';
import { VolumeControl } from './VolumeControl';
import { playUiSound, playHoverSound } from '../utils/audioHelper';
import type { SoundFile, Vec2 } from '../types';

interface CalibrationModalProps {
  onClose: () => void;
  playAudio: (x: number, z: number, soundName: string) => Promise<void>;
  volume: number;
  onVolumeChange: (vol: number) => void;
  soundFiles: SoundFile[];
  loaded: boolean;
}

type Direction = 'forward' | 'backward' | 'left' | 'right';

interface SegmentedProps<T extends string | number> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}

// Pill row of mutually exclusive options; the active one gets a sliding highlight
const Segmented = <T extends string | number>({ options, value, onChange, format = String }: SegmentedProps<T>) => {
  const id = useId();
  return (
    <div className="flex rounded-full border border-line bg-surface p-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          onMouseEnter={playHoverSound}
          className={`relative flex-1 rounded-full px-3 py-1.5 text-sm transition-colors ${value === option ? 'text-bg' : 'text-muted hover:text-fg'}`}
        >
          {value === option && (
            <motion.span layoutId={`segment-${id}`} className="absolute inset-0 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
          )}
          <span className="relative">{format(option)}</span>
        </button>
      ))}
    </div>
  );
};

const MODES = ['selection', 'radar'] as const;
const DISTANCES = [5, 15, 25, 35] as const;
const DIRECTIONS: readonly Direction[] = ['forward', 'backward', 'left', 'right'];

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  onClose, playAudio, volume, onVolumeChange, soundFiles, loaded
}) => {
  const [mode, setMode] = useState<'radar' | 'selection'>('selection');
  const [selectedDistance, setSelectedDistance] = useState<typeof DISTANCES[number]>(15);
  const [selectedDirection, setSelectedDirection] = useState<Direction>('forward');
  const [targetPos, setTargetPos] = useState<Vec2 | null>(null); // picked on the MiniRadar
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('');

  const close = () => { playUiSound(); onClose(); };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handlePlay = async () => {
    let x = 0;
    let z = 0;
    if (mode === 'radar') {
      // Nothing picked yet plays at the listener's position
      x = targetPos?.x ?? 0;
      z = targetPos?.z ?? 0;
    } else {
      switch (selectedDirection) {
        case 'forward': z = -selectedDistance; break;
        case 'backward': z = selectedDistance; break;
        case 'left': x = -selectedDistance; break;
        case 'right': x = selectedDistance; break;
      }
    }

    // Pick selected sound or random
    const soundToPlay = selectedSound !== '' ? selectedSound : soundFiles[Math.floor(Math.random() * soundFiles.length)].file;
    setIsPlaying(true);
    await playAudio(x, z, soundToPlay);
    setIsPlaying(false);
  };

  const playLabel = () => {
    if (isPlaying) return 'Playing…';
    if (!loaded) return 'Loading…';
    return 'Play test sound';
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm"
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        role="dialog"
        aria-label="Calibration"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-8 overflow-y-auto border-l border-line bg-bg p-8"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      >
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Calibrate</h2>
          <button onClick={close} onMouseEnter={playHoverSound} className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-fg">
            Close <kbd className="kbd">Esc</kbd>
          </button>
        </header>

        <p className="-mt-4 text-sm text-muted">Play sounds at known positions to learn what distance and direction sound like.</p>

        <Segmented options={MODES} value={mode} onChange={setMode} format={(m) => (m === 'selection' ? 'Presets' : 'Pick on radar')} />

        {mode === 'radar' ? (
          <MiniRadar selected={targetPos} onSelectCoordinate={setTargetPos} />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="label">Distance</span>
              <Segmented options={DISTANCES} value={selectedDistance} onChange={setSelectedDistance} format={(d) => `${d}m`} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="label">Direction</span>
              <Segmented options={DIRECTIONS} value={selectedDirection} onChange={setSelectedDirection} format={(d) => d.charAt(0).toUpperCase() + d.slice(1)} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="calibration-sound" className="label">Sound</label>
          <select
            id="calibration-sound"
            value={selectedSound}
            onChange={(e) => setSelectedSound(e.target.value)}
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm text-fg outline-none focus-visible:border-accent"
          >
            <option value="">Random</option>
            {soundFiles.map((item) => (
              <option key={item.file} value={item.file}>{item.name}</option>
            ))}
          </select>
        </div>

        <VolumeControl volume={volume} onVolumeChange={onVolumeChange} />

        <button onClick={handlePlay} onMouseEnter={playHoverSound} disabled={!loaded || isPlaying} className="btn mt-auto h-12 w-full">
          {playLabel()}
        </button>
      </motion.aside>
    </>
  );
};
