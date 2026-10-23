import React from 'react';
import { CountUp } from './CountUp';

interface ScoreTickerProps {
  total: number;
}

// Running match total; rolls up after the reveal readout has shown the round score
export const ScoreTicker: React.FC<ScoreTickerProps> = ({ total }) => (
  <div className="flex flex-col items-end gap-1">
    <span className="label">Score</span>
    <CountUp value={total} delay={0.9} duration={1.2} className="text-2xl font-medium tracking-tight" />
  </div>
);
