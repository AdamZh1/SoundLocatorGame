import type { Vec2 } from '../types';

// Distance from radar center to its edge, in meters. Every radar uses this scale, whatever its pixel size.
export const RADAR_MAX_M = 40;

// Labeled distance rings drawn on every radar
export const RING_DISTANCES_M = [10, 20, 30] as const;

// A distance as a percentage of the radar's radius (40m -> 100)
export const metersToRadiusPercent = (meters: number): number => (meters / RADAR_MAX_M) * 100;

// CSS left/top for a point, as percentages of the radar box (center = 50%, 50%).
// +X is right, +Z is down. Works for a radar of any size.
export const toRadarPosition = (pos: Vec2): { left: string; top: string } => ({
  left: `${50 + metersToRadiusPercent(pos.x) / 2}%`,
  top: `${50 + metersToRadiusPercent(pos.z) / 2}%`,
});

// Screen point -> meters, given the radar element's bounding rect
export const clientToMeters = (clientX: number, clientY: number, rect: DOMRect): Vec2 => {
  const radiusPx = rect.width / 2;
  const dx = clientX - (rect.left + radiusPx);
  const dz = clientY - (rect.top + rect.height / 2);
  return { x: (dx / radiusPx) * RADAR_MAX_M, z: (dz / radiusPx) * RADAR_MAX_M };
};

// Pulls a point back onto the circle of radius maxM if it's outside it
export const clampToRadius = (pos: Vec2, maxM: number): Vec2 => {
  const d = Math.hypot(pos.x, pos.z);
  if (d <= maxM) return pos;
  return { x: (pos.x / d) * maxM, z: (pos.z / d) * maxM };
};

// Compass bearing of a point from the listener, 0-360°: 0 = forward (-Z), 90 = right (+X), clockwise
export const bearingDeg = (pos: Vec2): number => ((Math.atan2(pos.x, -pos.z) * 180) / Math.PI + 360) % 360;
