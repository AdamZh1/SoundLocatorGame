import React from 'react';
import type { Vec2 } from '../types';
import { toRadarPosition } from '../utils/radarMath';
import { Radar, RadarPoint } from './Radar';

interface ResultRadarProps {
  target: Vec2;
  guess: Vec2;
}

const dotClass = 'w-[8px] h-[8px] rounded-full -translate-x-1/2 -translate-y-1/2';

export const ResultRadar: React.FC<ResultRadarProps> = ({ target, guess }) => {
  const t = toRadarPosition(target);
  const g = toRadarPosition(guess);

  return (
    <Radar
      sizePx={200}
      className="border border-gray-600 bg-gray-950 mx-auto my-4 overflow-hidden"
      ringClassName="border-dashed border-gray-700"
    >
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 w-[6px] h-[6px] bg-gray-500 rounded-full -translate-x-1/2 -translate-y-1/2" />

      <RadarPoint pos={target} className={`${dotClass} bg-blue-500`} />
      <RadarPoint pos={guess} className={`${dotClass} bg-green-500`} />

      {/* Line connecting */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line
          x1={t.left}
          y1={t.top}
          x2={g.left}
          y2={g.top}
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      </svg>
    </Radar>
  );
};
