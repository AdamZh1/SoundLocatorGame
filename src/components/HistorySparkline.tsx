import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { SavedMatch } from '../types';
import { HISTORY_LIMIT, MAX_MATCH_SCORE } from '../gameConfig';
import { formatInt } from '../utils/format';

interface HistorySparklineProps {
  matches: SavedMatch[]; // newest first, as stored
  best: number | null;
  highlightId?: string; // drawn in the accent color (e.g. the match just played)
  delay?: number; // seconds before the bars grow in
  className?: string; // sets the chart's size
}

const MIN_BAR_PCT = 3;
const HOVER_LIFT_PX = 3;
const easeOut = [0.16, 1, 0.3, 1] as const;

const heightPct = (total: number) => Math.max(MIN_BAR_PCT, (total / MAX_MATCH_SCORE) * 100);

const formatDate = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Keeps the hover card on screen: bars near an edge align the card to that edge instead of centering it
const cardAlign = (slot: number): string => {
  if (slot < 3) return 'left-0';
  if (slot > HISTORY_LIMIT - 4) return 'right-0';
  return 'left-1/2 -translate-x-1/2';
};

// One bar per recent match (oldest left, newest right), scaled to the max match score, with a dashed best line.
// Hovering a bar lifts it, turns it accent, and shows a card with the match total and date.
export const HistorySparkline: React.FC<HistorySparklineProps> = ({ matches, best, highlightId, delay = 0, className = '' }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ordered = [...matches].reverse();
  const offset = HISTORY_LIMIT - ordered.length; // right-align, so the newest is always on the right

  return (
    <div
      className={`relative flex items-end ${className}`}
      role="img"
      aria-label={`Last ${ordered.length} match totals`}
      onPointerLeave={() => setHoveredId(null)}
    >
      {best !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg/40"
          style={{ bottom: `${heightPct(best)}%` }}
        />
      )}

      {Array.from({ length: HISTORY_LIMIT }, (_, slot) => {
        const match = ordered[slot - offset];
        if (!match) {
          // Empty slot, so the chart's width means the same thing however many matches exist
          return (
            <div key={`empty-${slot}`} className="flex h-full flex-1 items-end justify-center">
              <div className="h-px w-[55%] bg-line" />
            </div>
          );
        }

        const i = slot - offset;
        const hovered = hoveredId === match.id;
        const lit = hovered || match.id === highlightId;
        return (
          <div
            key={match.id}
            className="relative flex h-full flex-1 cursor-default items-end justify-center"
            onPointerEnter={() => setHoveredId(match.id)}
          >
            <motion.div
              className={`w-[55%] origin-bottom rounded-[2px] transition-colors duration-150 ${lit ? 'bg-accent' : 'bg-fg/30'}`}
              style={{ height: `${heightPct(match.total)}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1, y: hovered ? -HOVER_LIFT_PX : 0 }}
              transition={{
                scaleY: { delay: delay + 0.05 * i, duration: 0.5, ease: easeOut },
                y: { type: 'spring', stiffness: 500, damping: 30 },
              }}
            />

            <AnimatePresence>
              {hovered && (
                <motion.div
                  className={`pointer-events-none absolute bottom-full z-10 mb-2.5 ${cardAlign(slot)}`}
                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: easeOut }}
                >
                  <div className="flex flex-col gap-1 whitespace-nowrap rounded-xl border border-line bg-surface px-4 py-3 shadow-lg shadow-black/50">
                    <span className="font-mono text-base tabular-nums leading-none text-fg">{formatInt(match.total)}</span>
                    <span className="label">
                      {match.id === highlightId ? 'This match' : formatDate(match.playedAt)}
                      {best !== null && match.total === best && <span className="text-accent"> · Best</span>}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
