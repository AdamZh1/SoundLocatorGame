import type { Vec2 } from '../types';
import { MAX_ROUND_SCORE, MAX_TARGET_DISTANCE_M, SCORE_ZERO_ERROR_M } from '../gameConfig';

export const distanceBetween = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.z - b.z);

// Quadratic falloff: full points at 0m error, 0 points at SCORE_ZERO_ERROR_M or more
export const scoreGuess = (target: Vec2, guess: Vec2): { score: number; error: number } => {
  const error = distanceBetween(target, guess);
  const score = Math.max(0, Math.round(MAX_ROUND_SCORE * (1 - (error / SCORE_ZERO_ERROR_M) ** 2)));
  return { score, error };
};

// Uniform over a disc of radius MAX_TARGET_DISTANCE_M (sqrt keeps it from clustering at the center)
export const randomTarget = (): Vec2 => {
  const theta = Math.random() * 2 * Math.PI;
  const r = Math.sqrt(Math.random()) * MAX_TARGET_DISTANCE_M;
  return { x: r * Math.cos(theta), z: r * Math.sin(theta) };
};
