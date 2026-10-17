import React from 'react';
import type { Vec2 } from '../types';
import { Radar, RadarPoint } from './Radar';

interface MiniRadarProps {
  selected: Vec2 | null;
  onSelectCoordinate: (pos: Vec2) => void;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({ selected, onSelectCoordinate }) => (
  <div className="flex justify-center mb-6">
    <Radar
      sizePx={200}
      className="border border-gray-500 bg-gray-900 cursor-crosshair overflow-hidden"
      ringClassName="border-dashed border-gray-700"
      showRingLabels
      onSelect={onSelectCoordinate}
    >
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 w-[6px] h-[6px] bg-white rounded-full -translate-x-1/2 -translate-y-1/2 z-20" />

      {selected && (
        <RadarPoint pos={selected} className="w-[8px] h-[8px] bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-30" />
      )}
    </Radar>
  </div>
);
