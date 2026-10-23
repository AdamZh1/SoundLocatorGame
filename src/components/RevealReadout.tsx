import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import type { RoundResult } from '../types';
import { gradeFor, toneText } from '../game/grading';
import { CountUp } from './CountUp';
import { formatInt } from '../utils/format';

interface RevealReadoutProps {
  result: RoundResult;
}

// Seconds after the guess is confirmed; lines up with the line/target animation in RadarCanvas
const READOUT_DELAY = 0.6;

const formatScore = (n: number) => `+${formatInt(n)}`;
const formatMeters = (n: number) => n.toFixed(1);

// Grade word, score and error shown under the radar during ROUND_REVEAL
export const RevealReadout: React.FC<RevealReadoutProps> = ({ result }) => {
  const grade = gradeFor(result.score);

  useEffect(() => {
    const jingle = new Audio('/ui_audio/jingles_STEEL10.ogg');
    jingle.volume = 0.2;
    const t = setTimeout(() => {
      jingle.play().catch((e) => console.error('Audio playback failed:', e));
    }, READOUT_DELAY * 1000);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.span
        className={`text-4xl font-semibold tracking-tighter sm:text-5xl ${toneText[grade.tone]}`}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay: READOUT_DELAY + 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {grade.label}
      </motion.span>
      <motion.div
        className="flex items-baseline gap-4 text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: READOUT_DELAY, duration: 0.3 }}
      >
        <span>
          <CountUp value={result.score} delay={READOUT_DELAY} format={formatScore} className="text-lg text-fg" />
          <span className="ml-1 text-xs">pts</span>
        </span>
        <span>
          <CountUp value={result.error} delay={READOUT_DELAY} format={formatMeters} className="text-lg text-fg" />
          <span className="ml-1 text-xs">m off</span>
        </span>
      </motion.div>
    </div>
  );
};
