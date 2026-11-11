import { describe, expect, it } from 'vitest';
import { appendMatch, averageTotal, createSavedMatch, emptyStore, parseStore } from './matchHistory';
import { HISTORY_LIMIT } from '../gameConfig';
import type { HistoryStore, RoundResult, SavedMatch } from '../types';

const round = (score: number, n = 1): RoundResult => ({
  round: n,
  score,
  error: 3.2,
  guess: { x: 1, z: -2 },
  target: { x: 2, z: -4 },
});

const match = (id: string, total: number): SavedMatch => createSavedMatch([round(total)], id, 1000);

const appendAll = (totals: number[]): HistoryStore =>
  totals.reduce((store, total, i) => appendMatch(store, match(`m${i}`, total)).store, emptyStore());

describe('createSavedMatch', () => {
  it('sums round scores into the total', () => {
    expect(createSavedMatch([round(4000, 1), round(2500, 2)], 'a', 0).total).toBe(6500);
  });
});

describe('appendMatch', () => {
  it('puts the newest match first', () => {
    const store = appendAll([100, 200, 300]);
    expect(store.matches.map((m) => m.total)).toEqual([300, 200, 100]);
  });

  it(`keeps at most ${HISTORY_LIMIT} matches`, () => {
    const store = appendAll(Array.from({ length: HISTORY_LIMIT + 3 }, (_, i) => i));
    expect(store.matches).toHaveLength(HISTORY_LIMIT);
    expect(store.matches[0].id).toBe(`m${HISTORY_LIMIT + 2}`);
  });

  it('the first match is a new best with no previous best', () => {
    const result = appendMatch(emptyStore(), match('a', 10));
    expect(result.isNewBest).toBe(true);
    expect(result.previousBest).toBeNull();
    expect(result.store.best?.id).toBe('a');
  });

  it('replaces the best only on a strictly higher total', () => {
    const base = appendAll([5000]);
    const tie = appendMatch(base, match('tie', 5000));
    expect(tie.isNewBest).toBe(false);
    expect(tie.previousBest).toBe(5000);
    expect(tie.store.best?.id).toBe('m0');

    const higher = appendMatch(base, match('hi', 5001));
    expect(higher.isNewBest).toBe(true);
    expect(higher.store.best?.id).toBe('hi');
  });

  it('keeps the best after it drops out of the recent list', () => {
    const store = appendAll([40000, ...Array.from({ length: HISTORY_LIMIT }, () => 100)]);
    expect(store.matches.some((m) => m.total === 40000)).toBe(false);
    expect(store.best?.total).toBe(40000);
  });

  it('does not modify the input store', () => {
    const base = appendAll([1, 2]);
    const before = JSON.stringify(base);
    appendMatch(base, match('x', 3));
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('averageTotal', () => {
  it('returns null with no matches', () => {
    expect(averageTotal([])).toBeNull();
  });

  it('averages totals, optionally excluding one match', () => {
    const { matches } = appendAll([100, 200, 600]);
    expect(averageTotal(matches)).toBe(300);
    expect(averageTotal(matches, 'm2')).toBe(150);
    expect(averageTotal([matches[0]], matches[0].id)).toBeNull();
  });
});

describe('parseStore', () => {
  it('round-trips a saved store', () => {
    const store = appendAll([1000, 2000]);
    expect(parseStore(JSON.stringify(store))).toEqual(store);
  });

  it.each([
    ['null', null],
    ['garbage', '{not json'],
    ['a number', '42'],
    ['wrong version', JSON.stringify({ version: 2, matches: [], best: null })],
    ['missing matches', JSON.stringify({ version: 1, best: null })],
  ])('returns an empty store for %s', (_, raw) => {
    expect(parseStore(raw)).toEqual(emptyStore());
  });

  it('drops invalid matches but keeps valid ones', () => {
    const good = match('good', 500);
    const raw = JSON.stringify({
      version: 1,
      matches: [good, { id: 'bad', total: 'lots' }, { ...good, id: 'nan', rounds: [{ ...round(1), score: null }] }],
      best: { nope: true },
    });
    expect(parseStore(raw)).toEqual({ version: 1, matches: [good], best: null });
  });

  it('trims an oversized stored list', () => {
    const matches = Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => match(`m${i}`, i));
    expect(parseStore(JSON.stringify({ version: 1, matches, best: null })).matches).toHaveLength(HISTORY_LIMIT);
  });
});
