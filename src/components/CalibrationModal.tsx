import React, { useState } from 'react';
import { audioFiles } from '../audioConfig';
import { MiniRadar } from './MiniRadar';

interface CalibrationModalProps {
  onClose: () => void;
  playAudio: (x: number, z: number, volume: number, soundName: string) => Promise<void>;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onSelectedSoundChange: (val: string) => void;
  selectedSound: string;
  soundFiles: string[];
  loaded: boolean;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({ 
  onClose, playAudio, volume, onVolumeChange, selectedSound, onSelectedSoundChange, soundFiles, loaded 
}) => {
  const [targetPos, setTargetPos] = useState({ x: 0, z: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handlePlay = async () => {
    const soundToPlay = selectedSound !== '' ? selectedSound : audioFiles[0];
    setIsPlaying(true);
    await playAudio(targetPos.x, targetPos.z, volume, soundToPlay);
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 w-[500px]">
        <h2 className="text-xl font-bold mb-4">Calibration</h2>
        
        <MiniRadar onSelectCoordinate={(x, z) => setTargetPos({ x, z })} />

        <div className="mb-6 p-4 border border-gray-600 rounded-xl bg-gray-900">
          <h3 className="text-sm font-semibold mb-2">Test Sound</h3>
          <select 
            value={selectedSound}
            onChange={(e) => onSelectedSoundChange(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded text-sm text-white"
          >
            <option value="">Random</option>
            {soundFiles.map(file => (
              <option key={file} value={file}>{file}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 p-4 border border-gray-600 rounded-xl bg-gray-900">
          <label className="block mb-2 text-sm">Volume ({volume.toFixed(3)})</label>
          <input 
            type="range" 
            min="0" 
            max=".5" 
            step="0.01" 
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-[6px] bg-gray-700 rounded-full appearance-none cursor-pointer"
          />
        </div>

        <button 
          onClick={handlePlay}
          disabled={!loaded || isPlaying}
          className="w-full bg-blue-600 text-white py-2 rounded mb-2 font-bold hover:bg-blue-700 transition disabled:bg-gray-500"
        >
          {isPlaying ? 'Playing...' : !loaded ? 'Loading...' : `Play Audio at (${Math.round(targetPos.x)}, ${Math.round(targetPos.z)})`}
        </button>

        <button onClick={onClose} className="w-full bg-red-600 text-white py-2 rounded">Close</button>
      </div>
    </div>
  );
};

