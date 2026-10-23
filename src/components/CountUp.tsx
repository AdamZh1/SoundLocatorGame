import React, { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { formatInt } from '../utils/format';

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  from?: number; // value shown before the first roll; later changes roll from the current value
  delay?: number; // seconds
  duration?: number; // seconds
  className?: string;
}

// Number that rolls to `value`. Writes textContent directly, so counting doesn't re-render React.
export const CountUp: React.FC<CountUpProps> = ({ value, format = formatInt, from = 0, delay = 0, duration = 1, className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(from);
  const reduceMotion = useReducedMotion();
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  });

  useEffect(() => {
    const write = (n: number) => {
      shownRef.current = n;
      if (ref.current) ref.current.textContent = formatRef.current(n);
    };
    if (reduceMotion) {
      write(value);
      return;
    }
    const controls = animate(shownRef.current, value, { delay, duration, ease: [0.16, 1, 0.3, 1], onUpdate: write });
    return () => controls.stop();
  }, [value, delay, duration, reduceMotion]);

  return <span ref={ref} className={`font-mono tabular-nums ${className}`}>{format(from)}</span>;
};
