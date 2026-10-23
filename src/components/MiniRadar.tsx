import React from 'react';
import type { Vec2 } from '../types';
import { BearingTicks, Radar, RadarPoint } from './Radar';

interface MiniRadarProps {
  selected: Vec2 | null;
  onSelectCoordinate: (pos: Vec2) => void;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({ selected, onSelectCoordinate }) => (
  <div className="flex justify-center">
    <Radar
      sizePx={240}
      className="border border-line bg-surface/40 cursor-crosshair overflow-hidden"
      showRingLabels
      onSelect={onSelectCoordinate}
    >
      <BearingTicks className="text-fg/15" />
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 size-1.5 bg-fg rounded-full -translate-x-1/2 -translate-y-1/2 z-20" />

      {selected && (
        <RadarPoint pos={selected} className="size-2.5 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 z-30" />
      )}
    </Radar>
  </div>
);
