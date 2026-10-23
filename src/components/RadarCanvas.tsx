import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import type { GameState, LevelListener, Vec2 } from '../types';
import { RADAR_MAX_M, bearingDeg, clampToRadius, clientToMeters, toRadarPosition } from '../utils/radarMath';
import { playHoverSound } from '../utils/audioHelper';
import { BearingTicks, Radar, RadarPoint, RadarSweep } from './Radar';

// Keep a dragged marker this many pixels inside the edge so it stays fully visible
const DRAG_EDGE_MARGIN_PX = 6;

// Shared with HomeScreen's ambient radar so it morphs into this one when the game starts
export const RADAR_LAYOUT_ID = 'main-radar';

// Reveal choreography timings, in seconds after the guess is confirmed
const LINE_DELAY = 0.15;
const LINE_DURATION = 0.45;
const TARGET_DELAY = LINE_DELAY + LINE_DURATION;

const SWEEP_OPACITY: Record<GameState, number> = {
  INIT: 1,
  AUDIO_PLAYING: 0,
  GUESSING: 0.35,
  ROUND_REVEAL: 0,
  MATCH_OVER: 0,
};

const easeOut = [0.16, 1, 0.3, 1] as const;

interface RadarCanvasProps {
  gameState: GameState;
  // The guess to draw (owned by App): movable while GUESSING, the confirmed one during ROUND_REVEAL
  guess: Vec2 | null;
  onGuessChange: (guess: Vec2) => void;
  targetCoordinates: Vec2;
  subscribeLevel: (listener: LevelListener) => () => void;
  onPlay: () => void;
  canPlay: boolean;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  gameState, guess, onGuessChange, targetCoordinates, subscribeLevel, onPlay, canPlay
}) => {
  const radarRef = useRef<HTMLDivElement>(null);
  const listenerDotRef = useRef<HTMLDivElement>(null);
  const levelRingRef = useRef<HTMLDivElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const isGuessing = gameState === 'GUESSING';
  const isRevealing = gameState === 'ROUND_REVEAL';

  // Pulse the listener dot and rim ring with the audio level (direct DOM writes, no re-render)
  useEffect(() => subscribeLevel((level) => {
    if (listenerDotRef.current) {
      listenerDotRef.current.style.transform = `translate(-50%, -50%) scale(${1 + level * 2.5})`;
    }
    if (levelRingRef.current) {
      levelRingRef.current.style.opacity = String(Math.min(1, level * 1.6));
      levelRingRef.current.style.transform = `scale(${1 + level * 0.06})`;
    }
  }), [subscribeLevel]);

  // Hide the crosshair whenever we leave GUESSING
  useEffect(() => {
    if (!isGuessing && crosshairRef.current) crosshairRef.current.style.opacity = '0';
  }, [isGuessing]);

  const updateCrosshair = (clientX: number, clientY: number) => {
    const radar = radarRef.current;
    if (!radar || !crosshairRef.current || !hLineRef.current || !vLineRef.current || !readoutRef.current) return;
    const rect = radar.getBoundingClientRect();
    const pos = clientToMeters(clientX, clientY, rect);
    const distance = Math.hypot(pos.x, pos.z);
    if (distance > RADAR_MAX_M) {
      crosshairRef.current.style.opacity = '0';
      return;
    }
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    crosshairRef.current.style.opacity = '1';
    hLineRef.current.style.transform = `translateY(${py}px)`;
    vLineRef.current.style.transform = `translateX(${px}px)`;
    readoutRef.current.style.transform = `translate(${px + 14}px, ${py + 14}px)`;
    readoutRef.current.textContent = `${distance.toFixed(1)}m · ${Math.round(bearingDeg(pos)).toString().padStart(3, '0')}°`;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isGuessing) return;
    updateCrosshair(e.clientX, e.clientY);
    if (!isDraggingRef.current || !radarRef.current) return;

    wasDraggingRef.current = true;
    const rect = radarRef.current.getBoundingClientRect();
    const radiusPx = rect.width / 2;
    const maxM = RADAR_MAX_M * (radiusPx - DRAG_EDGE_MARGIN_PX) / radiusPx;
    onGuessChange(clampToRadius(clientToMeters(e.clientX, e.clientY, rect), maxM));
  };

  const handlePointerLeave = () => {
    if (crosshairRef.current && !isDraggingRef.current) crosshairRef.current.style.opacity = '0';
  };

  const handleSelect = (pos: Vec2) => {
    if (!isGuessing) return;
    // A drag ends with a click on the radar; don't treat it as a new placement
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    if (Math.hypot(pos.x, pos.z) > RADAR_MAX_M) return; // corner of the bounding box, outside the disc
    onGuessChange(pos);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isGuessing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
  };

  const endDrag = () => {
    isDraggingRef.current = false;
    // The click that ends a drag normally clears this in handleSelect; this covers releases where no click follows
    setTimeout(() => { wasDraggingRef.current = false; }, 50);
  };

  const t = toRadarPosition(targetCoordinates);
  const g = guess ? toRadarPosition(guess) : null;

  return (
    <motion.div
      layoutId={RADAR_LAYOUT_ID}
      className="relative"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Radar
        ref={radarRef}
        className={`size-[min(62vh,86vw)] border border-line bg-surface/40 ${isGuessing ? 'cursor-none touch-none' : ''}`}
        showRingLabels
        onSelect={handleSelect}
      >
        <BearingTicks />
        <RadarSweep opacity={SWEEP_OPACITY[gameState]} />

        {/* Audio level ring on the rim */}
        <div
          ref={levelRingRef}
          className="absolute -inset-px rounded-full border-2 border-accent pointer-events-none opacity-0 shadow-[0_0_40px_-4px_var(--color-accent)]"
        />

        {/* Crosshair + distance/bearing readout, positioned by updateCrosshair */}
        <div ref={crosshairRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150">
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div ref={hLineRef} className="absolute left-0 top-0 h-px w-full bg-fg/20" />
            <div ref={vLineRef} className="absolute left-0 top-0 h-full w-px bg-fg/20" />
          </div>
          <div ref={readoutRef} className="absolute left-0 top-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-fg/80" />
        </div>

        {/* Listener / play button */}
        <button
          type="button"
          aria-label="Play sound"
          disabled={!canPlay}
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          onMouseEnter={canPlay ? playHoverSound : undefined}
          className="group absolute left-1/2 top-1/2 z-20 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full enabled:cursor-pointer disabled:cursor-default"
        >
          {canPlay && (
            <span className="absolute left-1/2 top-1/2 size-8 rounded-full border border-accent/70 animate-breathe" />
          )}
          <span
            ref={listenerDotRef}
            className={`absolute left-1/2 top-1/2 size-2.5 rounded-full transition-colors ${canPlay ? 'bg-accent group-hover:scale-125' : 'bg-fg'}`}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </button>

        {/* Reveal: line from guess to target */}
        {isRevealing && g && (
          <svg className="absolute inset-0 size-full pointer-events-none overflow-visible">
            <motion.line
              x1={g.left}
              y1={g.top}
              x2={t.left}
              y2={t.top}
              stroke="var(--color-fg)"
              strokeOpacity={0.5}
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: LINE_DELAY, duration: LINE_DURATION, ease: 'easeInOut' }}
            />
          </svg>
        )}

        {/* Guess marker */}
        {guess && (
          <RadarPoint
            pos={guess}
            className={`z-30 -translate-x-1/2 -translate-y-1/2 p-2 ${isGuessing ? 'cursor-grab active:cursor-grabbing touch-none' : ''}`}
            onPointerDown={startDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <motion.div
              className={`size-3 rounded-full border-2 border-accent ${isRevealing ? 'bg-transparent' : 'bg-accent'}`}
              initial={{ scale: 0 }}
              animate={{ scale: isRevealing ? [1, 1.6, 1] : 1 }}
              transition={isRevealing ? { duration: 0.35, ease: easeOut } : { type: 'spring', stiffness: 600, damping: 22 }}
            />
          </RadarPoint>
        )}

        {/* Target with ripples */}
        {isRevealing && (
          <RadarPoint pos={targetCoordinates} className="z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {[0, 0.25].map((d) => (
              <motion.span
                key={d}
                className="absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 size-3 rounded-full border border-fg"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 5, opacity: [0, 0.8, 0] }}
                transition={{ delay: TARGET_DELAY + d, duration: 1, ease: 'easeOut' }}
              />
            ))}
            <motion.div
              className="size-3 rounded-full bg-fg shadow-[0_0_12px_rgba(255,255,255,0.6)]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: TARGET_DELAY, type: 'spring', stiffness: 500, damping: 18 }}
            />
          </RadarPoint>
        )}
      </Radar>
    </motion.div>
  );
};
