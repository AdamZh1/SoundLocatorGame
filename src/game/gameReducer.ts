import type { RoundResult, Vec2 } from '../types';
import { TOTAL_ROUNDS } from '../gameConfig';
import { scoreGuess } from './scoring';

// The round state machine. Data that only makes sense in one phase lives on that phase,
// so e.g. a guess can't exist outside GUESSING.
//
//   INIT --PLAY_STARTED--> AUDIO_PLAYING --PLAY_ENDED--> GUESSING --GUESS_CONFIRMED--> ROUND_REVEAL
//   ROUND_REVEAL --NEXT_ROUND--> INIT (rounds 1-4) or MATCH_OVER (last round)
//   any phase --RESTART--> INIT, round 1
export type GamePhase =
  | { name: 'INIT' }
  | { name: 'AUDIO_PLAYING' }
  | { name: 'GUESSING'; guess: Vec2 | null }
  | { name: 'ROUND_REVEAL' } // the round's result is the last entry of `history`
  | { name: 'MATCH_OVER' };

export interface Game {
  phase: GamePhase;
  round: number; // 1-based
  target: Vec2;
  history: RoundResult[];
}

// Targets are passed in so the reducer stays pure (no Math.random inside)
export type GameAction =
  | { type: 'PLAY_STARTED' }
  | { type: 'PLAY_ENDED' }
  | { type: 'GUESS_MOVED'; guess: Vec2 }
  | { type: 'GUESS_CONFIRMED' }
  | { type: 'NEXT_ROUND'; target: Vec2 }
  | { type: 'RESTART'; target: Vec2 };

export const createGame = (target: Vec2): Game => ({
  phase: { name: 'INIT' },
  round: 1,
  target,
  history: [],
});

// Actions that don't apply to the current phase are ignored (state returned unchanged)
export const gameReducer = (game: Game, action: GameAction): Game => {
  const { phase } = game;

  switch (action.type) {
    case 'PLAY_STARTED':
      if (phase.name !== 'INIT') return game;
      return { ...game, phase: { name: 'AUDIO_PLAYING' } };

    case 'PLAY_ENDED':
      if (phase.name !== 'AUDIO_PLAYING') return game;
      return { ...game, phase: { name: 'GUESSING', guess: null } };

    case 'GUESS_MOVED':
      if (phase.name !== 'GUESSING') return game;
      return { ...game, phase: { name: 'GUESSING', guess: action.guess } };

    case 'GUESS_CONFIRMED': {
      if (phase.name !== 'GUESSING' || !phase.guess) return game;
      const { score, error } = scoreGuess(game.target, phase.guess);
      const result: RoundResult = { round: game.round, score, error, guess: phase.guess, target: game.target };
      return { ...game, phase: { name: 'ROUND_REVEAL' }, history: [...game.history, result] };
    }

    case 'NEXT_ROUND':
      if (phase.name !== 'ROUND_REVEAL') return game;
      if (game.round >= TOTAL_ROUNDS) return { ...game, phase: { name: 'MATCH_OVER' } };
      return { ...game, phase: { name: 'INIT' }, round: game.round + 1, target: action.target };

    case 'RESTART':
      return createGame(action.target);
  }
};

export const lastResult = (game: Game): RoundResult | undefined => game.history[game.history.length - 1];

// The guess the radar should draw: the movable one while guessing, the confirmed one during reveal
export const displayedGuess = (game: Game): Vec2 | null => {
  switch (game.phase.name) {
    case 'GUESSING':
      return game.phase.guess;
    case 'ROUND_REVEAL':
      return lastResult(game)?.guess ?? null;
    default:
      return null;
  }
};
