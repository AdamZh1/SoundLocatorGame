import React, { useState } from 'react';
import { audioFiles } from '../audioConfig';
import { MiniRadar } from './MiniRadar';
import { playUiSound } from '../utils/audioHelper';

interface CalibrationModalProps {
  onClose: () => void;
  playAudio: (
    x: number, 
    z: number, 
    volume: number, 
    soundName: string, 
    dotRef: React.RefObject<HTMLDivElement | null>, 
    ringRef: React.RefObject<HTMLDivElement | null>
  ) => Promise<void>;
  volume: number;
  onVolumeChange: (vol: number) => void;
  soundFiles: string[];
  loaded: boolean;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ 
  onClose, playAudio, volume, onVolumeChange, soundFiles, loaded 
}) => {
  const [mode, setMode] = useState<'radar' | 'selection'>('selection');
  const [selectedDistance, setSelectedDistance] = useState(15);
  const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward' | 'left' | 'right'>('forward');
  const [targetPos, setTargetPos] = useState({ x: 0, z: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('');
  const distances = [5, 15, 25, 35];
  
  const handlePlay = async () => {
    let x = 0;
    let z = 0;
    if (mode === 'radar') {
      x = targetPos.x;
      z = targetPos.z;
    } else {
      switch (selectedDirection) {
        case 'forward': z = -selectedDistance; break;
        case 'backward': z = selectedDistance; break;
        case 'left': x = -selectedDistance; break;
        case 'right': x = selectedDistance; break;
      }
    }
    
    // Pick selected sound or random
    const soundToPlay = selectedSound !== '' ? selectedSound : audioFiles[Math.floor(Math.random() * audioFiles.length)];
    setIsPlaying(true);
    await playAudio(x, z, volume, soundToPlay, { current: null }, { current: null });
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex justify-center items-center">
      <div className="bg-black p-6 rounded-xl border border-gray-600 w-[500px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 uppercase tracking-widest text-center text-gray-400">Calibration</h2>
        
        <div className="flex gap-2 mb-6 justify-center">
          <button 
            onClick={() => setMode('selection')}
            className={`btn-circle ${mode === 'selection' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Select
          </button>
          <button 
            onClick={() => setMode('radar')}
            className={`btn-circle ${mode === 'radar' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Radar
          </button>
        </div>

        {mode === 'radar' ? (
          <MiniRadar onSelectCoordinate={(x, z) => setTargetPos({ x, z })} />
        ) : (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">Distance ({selectedDistance}m)</h3>
            <div className="flex gap-2 mb-4 justify-center">
              {distances.map(d => (
                <button 
                  key={d} 
                  onClick={() => setSelectedDistance(d)}
                  className={`btn-circle ${selectedDistance === d ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  {d}m
                </button>
              ))}
            </div>

            <h3 className="text-sm font-semibold mb-2 text-center">Direction</h3>
            <div className="flex gap-2 justify-center">
              {(['forward', 'backward', 'left', 'right'] as const).map(dir => (
                <button 
                  key={dir} 
                  onClick={() => setSelectedDirection(dir)}
                  className={`btn-circle ${selectedDirection === dir ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  {dir.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 p-4 border border-gray-600 rounded-xl bg-black">
          <label className="block mb-2 text-sm text-gray-400">Select Sound</label>
          <select 
            value={selectedSound}
            onChange={(e) => setSelectedSound(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded text-sm text-white"
          >
            <option value="">Random</option>
            {soundFiles.map(file => (
              <option key={file} value={file}>{file}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 p-2">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm lowercase tracking-tighter text-gray-400">volume ({volume.toFixed(3)})</label>
            <span className="text-xs font-mono text-gray-500">{(volume * 200).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max=".5" 
            step="0.01" 
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full appearance-none bg-black h-2 rounded-full cursor-pointer 
              [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-cyan-500 [&::-webkit-slider-runnable-track]:to-purple-500 [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
          />
        </div>

        <div className="btn-primary-border mb-2">
          <button 
            onClick={handlePlay}
            disabled={!loaded || isPlaying}
            className="btn-circle bg-gray-900 w-full rounded-full"
          >
            {isPlaying ? 'Playing...' : !loaded ? 'Loading...' : 'Play'}
          </button>
        </div>

        <button onClick={() => { playUiSound(); onClose(); }} className="btn-circle bg-red-600 text-white w-full rounded-full">Close</button>
      </div>
    </div>
  );
};

