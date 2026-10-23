// A point on the horizontal plane, in meters. Listener is at (0, 0); Y is always 0.
export interface Vec2 {
  x: number;
  z: number;
}

export type AppStage = 'HOME' | 'GAME';

export type GameState = 'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER';

export interface RoundResult {
  round: number;
  score: number;
  error: number; // meters, unrounded (round only for display)
  guess: Vec2;
  target: Vec2;
}

// Receives the audio output level, 0 (silent) to 1
export type LevelListener = (level: number) => void;

export interface SoundFile {
  name: string;
  file: string;
}
