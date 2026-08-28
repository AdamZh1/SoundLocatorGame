import React from 'react';

interface AudioControllerProps {
  onPlay: () => void;
  onOpenCalibration: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  disabled?: boolean;
}

export const AudioController: React.FC<AudioControllerProps> = ({ 
  onPlay, onOpenCalibration, volume, onVolumeChange, disabled
}) => {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-4 items-center">
      <h2 className="text-xl font-bold uppercase tracking-widest text-gray-500">Audio</h2>
      <div className="flex flex-row gap-4 items-center">
        <div className="btn-primary-border">
          <button 
            onClick={onPlay}
            disabled={disabled}
            className="btn-circle bg-gray-900 text-blue-400"
          >
            Play
          </button>
        </div>

        <button 
          onClick={onOpenCalibration}
          className="btn-circle bg-gray-800 text-purple-400 hover:bg-gray-700"
        >
          Setup
        </button>
      </div>

      <div className="w-full p-2">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm lowercase tracking-tighter text-gray-400">volume</label>
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
    </div>
  );
};
