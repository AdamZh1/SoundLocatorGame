import React from 'react';
import type { Vec2 } from '../types';
import { RING_DISTANCES_M, clientToMeters, metersToRadiusPercent, toRadarPosition } from '../utils/radarMath';

interface RadarProps {
  ref?: React.Ref<HTMLDivElement>;
  sizePx?: number; // omit to size the disc with className instead (e.g. a viewport-relative size)
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
  ref, sizePx, className = '', ringClassName = 'border-line', showRingLabels = false, onSelect, children
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    onSelect(clientToMeters(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()));
  };

  return (
    <div
      ref={ref}
      className={`rounded-full relative ${className}`}
      style={sizePx ? { width: sizePx, height: sizePx } : undefined}
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
                className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] text-muted/70 pointer-events-none"
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

interface RadarPointProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  pos: Vec2;
  className?: string; // size, color, z-index, and the translate that anchors it
}

// Absolutely positioned element at a point in meters. Must be a child of <Radar>.
export const RadarPoint: React.FC<RadarPointProps> = ({ pos, className = '', children, ...rest }) => (
  <div className={`absolute ${className}`} style={toRadarPosition(pos)} {...rest}>
    {children}
  </div>
);

const TICK_STEP_DEG = 10;
const MAJOR_TICK_DEG = 30;

// Compass ticks around the rim (0° = forward/up), every 10°, longer every 30°
export const BearingTicks: React.FC<{ className?: string }> = ({ className = 'text-fg/25' }) => (
  <svg viewBox="0 0 100 100" className={`absolute inset-0 size-full pointer-events-none ${className}`}>
    {Array.from({ length: 360 / TICK_STEP_DEG }, (_, i) => {
      const deg = i * TICK_STEP_DEG;
      const major = deg % MAJOR_TICK_DEG === 0;
      const rad = (deg * Math.PI) / 180;
      const inner = major ? 46.5 : 48;
      return (
        <line
          key={deg}
          x1={50 + Math.sin(rad) * inner}
          y1={50 - Math.cos(rad) * inner}
          x2={50 + Math.sin(rad) * 49.5}
          y2={50 - Math.cos(rad) * 49.5}
          stroke="currentColor"
          strokeWidth={major ? 0.35 : 0.2}
        />
      );
    })}
  </svg>
);

// Rotating sonar wedge. Fades via the opacity prop (0 hides it).
export const RadarSweep: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    className="absolute inset-0 rounded-full pointer-events-none animate-sweep transition-opacity duration-700"
    style={{
      opacity,
      background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, color-mix(in oklab, var(--color-accent) 18%, transparent) 360deg)',
    }}
  />
);
