import React from 'react';
import { motion } from 'motion/react';
import type { RoundResult } from '../types';
import { TOTAL_ROUNDS } from '../gameConfig';
import { gradeFor, toneBg } from '../game/grading';

interface RoundPipsProps {
  history: RoundResult[];
  round: number; // current round, 1-based
}

const pad = (n: number) => String(n).padStart(2, '0');

// "02/05" plus one segment per round, filled with the round's grade color once played
export const RoundPips: React.FC<RoundPipsProps> = ({ history, round }) => (
  <div className="flex flex-col gap-2">
    <span className="label">
      Round <span className="text-fg tabular-nums">{pad(round)}</span>/{pad(TOTAL_ROUNDS)}
    </span>
    <div className="flex gap-1">
      {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
        const result = history[i];
        const isCurrent = !result && i === round - 1;
        return (
          <div key={i} className={`relative h-1 w-8 overflow-hidden rounded-full ${isCurrent ? 'bg-fg/30' : 'bg-line'}`}>
            {result && (
              <motion.div
                className={`absolute inset-0 origin-left ${toneBg[gradeFor(result.score).tone]}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </div>
        );
      })}
    </div>
  </div>
);
