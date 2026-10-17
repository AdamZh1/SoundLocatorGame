import React from 'react';
import type { Vec2 } from '../types';
import { RING_DISTANCES_M, clientToMeters, metersToRadiusPercent, toRadarPosition } from '../utils/radarMath';

interface RadarProps {
  ref?: React.Ref<HTMLDivElement>;
  sizePx: number;
  className?: string; // border, background, cursor, etc. for the radar disc
  ringClassName?: string;
  showRingLabels?: boolean;
  // Called with the clicked point in meters
  onSelect?: (pos: Vec2) => void;
  children?: React.ReactNode;
}

// Base radar used by RadarCanvas, ResultRadar and MiniRadar. Everything inside is positioned
// in percentages of the disc, so the same meters map to the same spot at any size.
export const Radar: React.FC<RadarProps> = ({
  ref, sizePx, className = '', ringClassName = 'border-white/10', showRingLabels = false, onSelect, children
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    onSelect(clientToMeters(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()));
  };

  return (
    <div
      ref={ref}
      className={`rounded-full relative ${className}`}
      style={{ width: sizePx, height: sizePx }}
      onClick={handleClick}
    >
      {RING_DISTANCES_M.map((d) => {
        const radiusPct = metersToRadiusPercent(d) / 2; // as a percentage of the disc's width
        return (
          <React.Fragment key={d}>
            <div
              className={`absolute top-1/2 left-1/2 border rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none ${ringClassName}`}
              style={{ width: `${radiusPct * 2}%`, height: `${radiusPct * 2}%` }}
            />
            {showRingLabels && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-[10px] text-gray-500 pointer-events-none"
                style={{ top: `calc(${50 - radiusPct}% - 5px)` }}
              >
                {d}m
              </div>
            )}
          </React.Fragment>
        );
      })}
      {children}
    </div>
  );
};

interface RadarPointProps {
  pos: Vec2;
  className?: string; // size, color, z-index, and the translate that anchors it
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

// Absolutely positioned element at a point in meters. Must be a child of <Radar>.
export const RadarPoint: React.FC<RadarPointProps> = ({ pos, className = '', onMouseDown, children }) => (
  <div className={`absolute ${className}`} style={toRadarPosition(pos)} onMouseDown={onMouseDown}>
    {children}
  </div>
);
