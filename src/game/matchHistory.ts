import type { HistoryStore, MatchRecord, RoundResult, SavedMatch, Vec2 } from '../types';
import { HISTORY_LIMIT, HISTORY_STORAGE_KEY } from '../gameConfig';

// Last-N match history plus an all-time best, persisted in localStorage.
// Everything except loadStore/saveStore is pure, so it can be unit-tested without a browser.

export const emptyStore = (): HistoryStore => ({ version: 1, matches: [], best: null });

// --- Validation of untrusted stored data ---

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const isVec2 = (v: unknown): v is Vec2 => isRecord(v) && isNum(v.x) && isNum(v.z);

const isRoundResult = (v: unknown): v is RoundResult =>
  isRecord(v) && isNum(v.round) && isNum(v.score) && isNum(v.error) && isVec2(v.guess) && isVec2(v.target);

const isSavedMatch = (v: unknown): v is SavedMatch =>
  isRecord(v) &&
  typeof v.id === 'string' &&
  isNum(v.playedAt) &&
  isNum(v.total) &&
  Array.isArray(v.rounds) &&
  v.rounds.every(isRoundResult);

// Parses the stored JSON. Never throws: anything unreadable becomes an empty history,
// and individual invalid matches are dropped.
export const parseStore = (raw: string | null): HistoryStore => {
  if (raw === null) return emptyStore();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyStore();
  }
  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.matches)) return emptyStore();

  const matches = data.matches.filter(isSavedMatch).slice(0, HISTORY_LIMIT);
  const best = isSavedMatch(data.best) ? data.best : null;
  return { version: 1, matches, best };
};

// --- Updates ---

export const createSavedMatch = (rounds: RoundResult[], id: string, playedAt: number): SavedMatch => ({
  id,
  playedAt,
  total: rounds.reduce((sum, r) => sum + r.score, 0),
  rounds,
});

// Adds a finished match (newest first, trimmed to HISTORY_LIMIT). The best is replaced only by a strictly higher total.
export const appendMatch = (store: HistoryStore, match: SavedMatch): { store: HistoryStore } & MatchRecord => {
  const previousBest = store.best?.total ?? null;
  const isNewBest = previousBest === null || match.total > previousBest;
  return {
    store: {
      version: 1,
      matches: [match, ...store.matches].slice(0, HISTORY_LIMIT),
      best: isNewBest ? match : store.best,
    },
    isNewBest,
    previousBest,
  };
};

// Average total over the stored matches, optionally leaving out one (e.g. the match just played)
export const averageTotal = (matches: SavedMatch[], excludeId?: string): number | null => {
  const pool = matches.filter((m) => m.id !== excludeId);
  if (pool.length === 0) return null;
  return pool.reduce((sum, m) => sum + m.total, 0) / pool.length;
};

// --- localStorage (can be unavailable or full: private mode, blocked storage, quota) ---

export const loadStore = (): HistoryStore => {
  try {
    return parseStore(window.localStorage.getItem(HISTORY_STORAGE_KEY));
  } catch {
    return emptyStore();
  }
};

export const saveStore = (store: HistoryStore): void => {
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // History just won't persist this session
  }
};
