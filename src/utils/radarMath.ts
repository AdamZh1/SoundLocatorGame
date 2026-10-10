// Distance from radar center to its edge, in meters
export const RADAR_MAX_M = 40;

// Labeled distance rings drawn on every radar
export const RING_DISTANCES_M = [10, 20, 30] as const;

// radiusPx is the radar's on-screen radius (half its width)
export const metersToPx = (meters: number, radiusPx: number): number =>
  (meters / RADAR_MAX_M) * radiusPx;

export const pxToMeters = (px: number, radiusPx: number): number =>
  (px / radiusPx) * RADAR_MAX_M;
