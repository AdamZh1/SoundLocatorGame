import React from 'react';
import { CountUp } from './CountUp';
import { formatInt } from '../utils/format';

interface ScoreTickerProps {
  total: number;
  best: number | null; // all-time best match total, from the saved history
}

// Running match total; rolls up after the reveal readout has shown the round score
export const ScoreTicker: React.FC<ScoreTickerProps> = ({ total, best }) => (
  <div className="flex flex-col items-end gap-1">
    <span className="label">Score</span>
    <CountUp value={total} delay={0.9} duration={1.2} className="text-2xl font-medium tracking-tight" />
    {best !== null && (
      <span className="label">
        Best <span className="tabular-nums text-fg/70">{formatInt(best)}</span>
      </span>
    )}
  </div>
);
