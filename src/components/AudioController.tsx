import React from 'react';

interface AudioControllerProps {
  onPlay: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  disabled?: boolean;
  manualX: string;
  manualZ: string;
  onManualXChange: (val: string) => void;
  onManualZChange: (val: string) => void;
  selectedSound: string;
  onSelectedSoundChange: (val: string) => void;
  soundFiles: string[];
}

export const AudioController: React.FC<AudioControllerProps> = ({ 
  onPlay, volume, onVolumeChange, disabled, 
  manualX, manualZ, onManualXChange, onManualZChange,
  selectedSound, onSelectedSoundChange, soundFiles
}) => {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Audio Controller</h2>
      <button 
        onClick={onPlay}
        disabled={disabled}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition active:translate-y-[2px] disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Play Audio
      </button>

      <div className="p-4 border border-gray-600 rounded-xl bg-gray-800">
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

      <div className="p-4 border border-gray-600 rounded-xl bg-gray-800">
        <h3 className="text-sm font-semibold mb-2">Debug Coordinates</h3>
        <div className="flex gap-2 mb-2">
          <input 
            type="number" 
            placeholder="X" 
            value={manualX}
            onChange={(e) => onManualXChange(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded text-sm"
          />
          <input 
            type="number" 
            placeholder="Z" 
            value={manualZ}
            onChange={(e) => onManualZChange(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded text-sm"
          />
        </div>
      </div>

      <div className="p-4 border border-gray-600 rounded-xl bg-gray-800">
        <label className="block mb-2 text-sm">Volume</label>
        <input 
          type="range" 
          min="0" 
          max=".5" 
          step="0.01" 
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full appearance-none bg-gray-700 h-[6px] rounded-[3px] outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[15px] [&::-webkit-slider-thumb]:h-[15px] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
};
