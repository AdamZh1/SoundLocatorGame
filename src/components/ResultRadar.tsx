import React from 'react';
import type { Vec2 } from '../types';
import { toRadarPosition } from '../utils/radarMath';
import { Radar, RadarPoint } from './Radar';

interface ResultRadarProps {
  target: Vec2;
  guess: Vec2;
}

const dotClass = 'size-2 rounded-full -translate-x-1/2 -translate-y-1/2';

export const ResultRadar: React.FC<ResultRadarProps> = ({ target, guess }) => {
  const t = toRadarPosition(target);
  const g = toRadarPosition(guess);

  return (
    <Radar sizePx={160} className="border border-line bg-surface/40 overflow-hidden">
      {/* Center */}
      <div className="absolute top-1/2 left-1/2 size-1 bg-muted rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* Line connecting */}
      <svg className="absolute inset-0 size-full pointer-events-none">
        <line x1={t.left} y1={t.top} x2={g.left} y2={g.top} stroke="var(--color-fg)" strokeOpacity={0.4} strokeWidth="1" strokeDasharray="3 2" />
      </svg>

      <RadarPoint pos={target} className={`${dotClass} bg-fg`} />
      <RadarPoint pos={guess} className={`${dotClass} border-[1.5px] border-accent`} />
    </Radar>
  );
};
