import { MAX_ROUND_SCORE } from '../gameConfig';

export type GradeTone = 'good' | 'ok' | 'bad';

export interface Grade {
  label: string;
  tone: GradeTone;
}

// Grade word for a round score (0 to MAX_ROUND_SCORE), highest threshold first
const GRADES: { min: number; grade: Grade }[] = [
  { min: 0.9 * MAX_ROUND_SCORE, grade: { label: 'DEAD ON', tone: 'good' } },
  { min: 0.7 * MAX_ROUND_SCORE, grade: { label: 'SHARP', tone: 'good' } },
  { min: 0.4 * MAX_ROUND_SCORE, grade: { label: 'CLOSE', tone: 'ok' } },
  { min: 1, grade: { label: 'WIDE', tone: 'bad' } },
];

const MISS: Grade = { label: 'MISS', tone: 'bad' };

export const gradeFor = (score: number): Grade => GRADES.find(({ min }) => score >= min)?.grade ?? MISS;

// Tailwind text/background classes per tone, so components don't each spell them out
export const toneText: Record<GradeTone, string> = {
  good: 'text-good',
  ok: 'text-ok',
  bad: 'text-bad',
};

export const toneBg: Record<GradeTone, string> = {
  good: 'bg-good',
  ok: 'bg-ok',
  bad: 'bg-bad',
};
