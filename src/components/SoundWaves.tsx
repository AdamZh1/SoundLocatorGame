import React, { useEffect, useRef } from 'react';
import { useCanvasLoop, cssVar, hexToRgbTriplet, type DrawFn } from '../hooks/useCanvasLoop';
import { MAX_ROUND_SCORE } from '../gameConfig';
import type { GameState } from '../types';

// Ambient waves behind the game radar. They react only to game events (sound playing, points scored),
// never to the audio level or the target, so they can't hint at distance or direction.

interface SoundWavesProps {
  phase: GameState;
  // Changes once per revealed round; `key` identifies the round
  scoreEvent: { key: number; score: number } | null;
}

interface Layer {
  freq: number; // wave cycles across the screen width
  speed: number; // phase speed multiplier
  amp: number; // relative amplitude
  offsetY: number; // vertical offset, as a fraction of height from the center
  alpha: number;
  accent: boolean;
  phase: number;
  knots: number[]; // slow value noise across the width (the "randomness")
  goals: number[];
}

const KNOTS = 7;
const SAMPLE_STEP_PX = 8;

// Energy model (per 60fps frame). Idle is calm; playing sustains a surge; scoring adds a decaying impulse.
const BASELINE = 0.12;
const PLAYING_SUSTAIN = 0.65;
const PLAY_ATTACK = 0.35; // extra kick at the moment the sound starts
const MAX_ENERGY = 1.6;
const IMPULSE_HALF_LIFE = 50; // frames (~0.8s)
const EASE = 0.05; // how fast energy follows its target
// Matches ScoreTicker's roll-up delay, so the surge lands when the total starts counting
const SCORE_IMPULSE_DELAY_MS = 900;

const LAYER_SPECS: Omit<Layer, 'phase' | 'knots' | 'goals'>[] = [
  { freq: 1.1, speed: 1.0, amp: 1.0, offsetY: 0, alpha: 0.09, accent: true },
  { freq: 1.6, speed: -0.8, amp: 0.8, offsetY: -0.08, alpha: 0.06, accent: false },
  { freq: 0.8, speed: 0.6, amp: 1.2, offsetY: 0.1, alpha: 0.05, accent: false },
  { freq: 2.3, speed: 1.4, amp: 0.55, offsetY: -0.18, alpha: 0.04, accent: false },
  { freq: 1.9, speed: -1.2, amp: 0.65, offsetY: 0.2, alpha: 0.04, accent: false },
];

const rand = () => Math.random() * 2 - 1;

const createLayers = (): Layer[] =>
  LAYER_SPECS.map((spec) => ({
    ...spec,
    phase: Math.random() * Math.PI * 2,
    knots: Array.from({ length: KNOTS }, rand),
    goals: Array.from({ length: KNOTS }, rand),
  }));

// Smooth (cosine) interpolation of the layer's noise knots at u in [0, 1]
const noiseAt = (knots: number[], u: number): number => {
  const pos = u * (knots.length - 1);
  const i = Math.min(Math.floor(pos), knots.length - 2);
  const t = (1 - Math.cos((pos - i) * Math.PI)) / 2;
  return knots[i] * (1 - t) + knots[i + 1] * t;
};

export const SoundWaves: React.FC<SoundWavesProps> = ({ phase, scoreEvent }) => {
  const layersRef = useRef<Layer[]>(createLayers());
  const energyRef = useRef(BASELINE);
  const sustainRef = useRef(0);
  const impulseRef = useRef(0);
  const colorsRef = useRef({ fg: '245, 245, 245', accent: '212, 255, 58' });

  const draw: DrawFn = (ctx, { width, height }, dt) => {
    // Energy: ease toward baseline + sustain + decaying impulse
    impulseRef.current *= Math.pow(0.5, dt / IMPULSE_HALF_LIFE);
    const target = Math.min(MAX_ENERGY, BASELINE + sustainRef.current + impulseRef.current);
    const energy = (energyRef.current += (target - energyRef.current) * (1 - Math.pow(1 - EASE, dt)));

    const phaseStep = dt * (0.006 + 0.045 * energy);
    const knotEase = 1 - Math.pow(1 - (0.015 + 0.04 * energy), dt);
    const rerollChance = dt * (0.02 + 0.12 * energy);
    const baseAmp = height * (0.025 + 0.06 * energy);
    const centerY = height / 2;
    const { fg, accent } = colorsRef.current;

    ctx.lineWidth = 1.25;
    for (const layer of layersRef.current) {
      layer.phase += phaseStep * layer.speed;

      // Drift the noise knots toward their goals; occasionally pick a new goal (more often when energetic)
      for (let k = 0; k < KNOTS; k++) layer.knots[k] += (layer.goals[k] - layer.knots[k]) * knotEase;
      if (Math.random() < rerollChance) layer.goals[Math.floor(Math.random() * KNOTS)] = rand();

      const rgb = layer.accent ? accent : fg;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`);
      gradient.addColorStop(0.2, `rgba(${rgb}, ${layer.alpha})`);
      gradient.addColorStop(0.8, `rgba(${rgb}, ${layer.alpha})`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      ctx.strokeStyle = gradient;

      const y0 = centerY + layer.offsetY * height;
      const amp = baseAmp * layer.amp;
      const noiseGain = 0.25 + 0.75 * Math.min(1, energy);
      ctx.beginPath();
      for (let x = 0; x <= width + SAMPLE_STEP_PX; x += SAMPLE_STEP_PX) {
        const u = Math.min(1, x / width);
        const a = u * layer.freq * Math.PI * 2;
        const wave = Math.sin(a + layer.phase) + 0.4 * Math.sin(a * 2.3 - layer.phase * 1.3);
        const y = y0 + amp * (wave * 0.7 + noiseAt(layer.knots, u) * noiseGain);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return true; // always animating while the game screen is mounted
  };

  const { canvasRef, wake } = useCanvasLoop(draw);

  useEffect(() => {
    colorsRef.current = {
      fg: hexToRgbTriplet(cssVar('--color-fg') || '#f5f5f5'),
      accent: hexToRgbTriplet(cssVar('--color-accent') || '#d4ff3a'),
    };
    wake();
  }, [wake]);

  // Surge while the sound plays
  useEffect(() => {
    const playing = phase === 'AUDIO_PLAYING';
    sustainRef.current = playing ? PLAYING_SUSTAIN : 0;
    if (playing) impulseRef.current = Math.max(impulseRef.current, PLAY_ATTACK);
  }, [phase]);

  // Surge on points, scaled by the round score (a miss is a small bump, dead on a big one)
  const scoreKey = scoreEvent?.key;
  const score = scoreEvent?.score;
  useEffect(() => {
    if (scoreKey === undefined || score === undefined) return;
    const timer = setTimeout(() => {
      impulseRef.current = Math.max(impulseRef.current, 0.2 + 1.2 * (score / MAX_ROUND_SCORE));
    }, SCORE_IMPULSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [scoreKey, score]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full" />;
};
