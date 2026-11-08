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

// A finished match as stored in the match history
export interface SavedMatch {
  id: string;
  playedAt: number; // epoch ms
  total: number;
  rounds: RoundResult[];
}

export interface HistoryStore {
  version: 1;
  matches: SavedMatch[]; // newest first, at most HISTORY_LIMIT
  best: SavedMatch | null; // all-time best, kept even after it leaves `matches`
}

// What recording a match changed, for the end screen
export interface MatchRecord {
  isNewBest: boolean;
  previousBest: number | null;
}
