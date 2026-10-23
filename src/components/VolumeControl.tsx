import React from 'react';

interface VolumeControlProps {
  volume: number; // 0 - MAX_VOLUME
  onVolumeChange: (vol: number) => void;
  compact?: boolean; // HUD version: slider stays short until hovered or focused
}

// The master gain slider goes to 0.5; shown to the user as 0-100%
const MAX_VOLUME = 0.5;

export const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange, compact = false }) => {
  const pct = Math.round((volume / MAX_VOLUME) * 100);
  const widthClass = compact ? 'w-16 group-hover:w-36 focus-visible:w-36' : 'flex-1';

  return (
    <div className={`group flex items-center gap-3 ${compact ? '' : 'w-full'}`}>
      <span className="label">Vol</span>
      <input
        type="range"
        min="0"
        max={MAX_VOLUME}
        step="0.01"
        value={volume}
        aria-label="Volume"
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        style={{ background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-line) ${pct}%)` }}
        className={`h-1 cursor-pointer appearance-none rounded-full outline-none transition-[width] duration-300
          [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fg
          [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-fg
          ${widthClass}`}
      />
      <span className="w-9 font-mono text-xs tabular-nums text-muted">{pct}%</span>
    </div>
  );
};
