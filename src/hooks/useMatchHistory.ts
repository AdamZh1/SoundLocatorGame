import { useCallback, useRef, useState } from 'react';
import { appendMatch, createSavedMatch, loadStore, saveStore } from '../game/matchHistory';
import type { HistoryStore, MatchRecord, RoundResult } from '../types';

// crypto.randomUUID needs a secure context (https/localhost); fall back for plain-http hosts
const newId = (): string =>
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Match history state, read from localStorage once. Call from App only, so every screen shares it.
export const useMatchHistory = () => {
  const [store, setStore] = useState<HistoryStore>(loadStore);
  // The last recorded rounds array and its result. The reducer never mutates `history`, so a repeat call
  // with the same array (e.g. two key presses before a re-render) is the same match and isn't saved twice.
  const lastRecordedRef = useRef<{ rounds: RoundResult[]; record: MatchRecord & { id: string } } | null>(null);

  // Saves a finished match. Call from an event handler, not an effect (StrictMode runs effects twice).
  const recordMatch = useCallback((rounds: RoundResult[]): MatchRecord & { id: string } => {
    if (lastRecordedRef.current?.rounds === rounds) return lastRecordedRef.current.record;

    const match = createSavedMatch(rounds, newId(), Date.now());
    const result = appendMatch(store, match);
    saveStore(result.store);
    setStore(result.store);
    const record = { id: match.id, isNewBest: result.isNewBest, previousBest: result.previousBest };
    lastRecordedRef.current = { rounds, record };
    return record;
  }, [store]);

  return { store, recordMatch };
};
