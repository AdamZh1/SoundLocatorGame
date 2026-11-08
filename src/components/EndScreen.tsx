import React from 'react';
import { motion } from 'motion/react';
import { ResultRadar } from './ResultRadar';
import { LiquidButton } from './LiquidButton';
import { CountUp } from './CountUp';
import { formatInt } from '../utils/format';
import { KeyHint } from './KeyHint';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { playUiSound } from '../utils/audioHelper';
import { gradeFor, toneText } from '../game/grading';
import { HistorySparkline } from './HistorySparkline';
import { averageTotal } from '../game/matchHistory';
import type { HistoryStore, MatchRecord, RoundResult } from '../types';
import { MAX_MATCH_SCORE, TOTAL_ROUNDS } from '../gameConfig';

interface EndScreenProps {
  history: RoundResult[];
  onPlayAgain: () => void;
  saved: HistoryStore;
  record: (MatchRecord & { id: string }) | null; // how saving this match changed the history
}

const COUNT_DURATION = 1.6;
const easeOut = [0.16, 1, 0.3, 1] as const;

const signed = (n: number) => `${n >= 0 ? '+' : '−'}${formatInt(Math.abs(n))}`;

// One line comparing this match to the saved history
const ComparisonLine: React.FC<{ total: number; saved: HistoryStore; record: MatchRecord & { id: string } }> = ({ total, saved, record }) => {
  if (record.isNewBest && record.previousBest === null) {
    return <span className="label">First match saved</span>;
  }
  if (record.isNewBest && record.previousBest !== null) {
    return (
      <span className="label text-accent">
        New best <span className="tabular-nums">{signed(total - record.previousBest)}</span>
      </span>
    );
  }
  const average = averageTotal(saved.matches, record.id);
  if (average === null) return null;
  const delta = total - average;
  return (
    <span className="label">
      <span className={`tabular-nums ${delta >= 0 ? 'text-good' : 'text-bad'}`}>{signed(delta)}</span> vs. recent avg
    </span>
  );
};

const EndScreen: React.FC<EndScreenProps> = ({ history, onPlayAgain, saved, record }) => {
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);
  // Overall grade uses the average round score, on the same scale as a single round
  const grade = gradeFor(totalScore / TOTAL_ROUNDS);

  useKeyboardShortcuts({ Enter: () => { playUiSound(); onPlayAgain(); } }, true);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 overflow-y-auto px-4 py-12">
      <div className="flex flex-col items-center gap-3">
        <span className="label">Match complete</span>
        <CountUp
          value={totalScore}
          duration={COUNT_DURATION}
          className="text-[clamp(4rem,14vw,9rem)] font-medium leading-none tracking-[-0.06em]"
        />
        <span className="font-mono text-sm text-muted">/ {formatInt(MAX_MATCH_SCORE)}</span>
        <motion.span
          className={`mt-2 text-3xl font-semibold tracking-tighter ${toneText[grade.tone]}`}
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ delay: COUNT_DURATION, duration: 0.5, ease: easeOut }}
        >
          {grade.label}
        </motion.span>
        {record && (
          <motion.div
            className="mt-3 flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: COUNT_DURATION + 0.3, duration: 0.4, ease: easeOut }}
          >
            <ComparisonLine total={totalScore} saved={saved} record={record} />
            <HistorySparkline
              matches={saved.matches}
              best={saved.best?.total ?? null}
              highlightId={record.id}
              delay={COUNT_DURATION + 0.3}
              className="h-10 w-48"
            />
          </motion.div>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {history.map((item, i) => (
          <motion.li
            key={item.round}
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: easeOut }}
          >
            <ResultRadar target={item.target} guess={item.guess} />
            <div className="flex w-full items-baseline justify-between gap-3 px-1">
              <span className="label">R{item.round}</span>
              <span className={`text-xs font-semibold tracking-tight ${toneText[gradeFor(item.score).tone]}`}>
                {gradeFor(item.score).label}
              </span>
            </div>
            <div className="-mt-2 flex w-full justify-between px-1 font-mono text-xs tabular-nums text-muted">
              <span className="text-fg">{formatInt(item.score)}</span>
              <span>{item.error.toFixed(1)}m</span>
            </div>
          </motion.li>
        ))}
      </ul>

      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: COUNT_DURATION, duration: 0.4 }}
      >
        <LiquidButton onClick={onPlayAgain}>Play again</LiquidButton>
        <KeyHint keys={['⏎']} label="to play again" />
      </motion.div>
    </div>
  );
};

export default EndScreen;
