import React, { useRef, useState, useEffect } from 'react';
import type { GameState, LevelListener, Vec2 } from '../types';
import { RADAR_MAX_M, clampToRadius, clientToMeters } from '../utils/radarMath';
import { Radar, RadarPoint } from './Radar';

const RADAR_SIZE_PX = 400;
// Keep a dragged marker this many pixels inside the edge so it stays fully visible
const DRAG_EDGE_MARGIN_PX = 6;

interface RadarCanvasProps {
  gameState: GameState;
  // The guess to draw (owned by App): movable while GUESSING, the confirmed one during ROUND_REVEAL
  guess: Vec2 | null;
  onGuessChange: (guess: Vec2) => void;
  targetCoordinates: Vec2;
  subscribeLevel: (listener: LevelListener) => () => void;
}

const labelClass = 'z-40 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded -translate-x-1/2';

export const RadarCanvas: React.FC<RadarCanvasProps> = ({ gameState, guess, onGuessChange, targetCoordinates, subscribeLevel }) => {
  const [isDragging, setIsDragging] = useState(false);

  const radarRef = useRef<HTMLDivElement>(null);
  const listenerDotRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);

  // Pulse the listener dot and radar ring with the audio level (direct DOM writes, no re-render)
  useEffect(() => subscribeLevel((level) => {
    if (listenerDotRef.current) {
      listenerDotRef.current.style.transform = `translate(-50%, -50%) scale(${1 + level * 1.5})`;
    }
    if (radarRef.current) {
      radarRef.current.style.transform = `scale(${1 + level * 0.2})`;
    }
  }), [subscribeLevel]);

  const handleSelect = (pos: Vec2) => {
    if (gameState !== 'GUESSING') return; // Only allow clicks in GUESSING state

    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

    onGuessChange(pos);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !radarRef.current || gameState !== 'GUESSING') return;
    wasDraggingRef.current = true;

    const rect = radarRef.current.getBoundingClientRect();
    const radiusPx = rect.width / 2;
    const maxM = RADAR_MAX_M * (radiusPx - DRAG_EDGE_MARGIN_PX) / radiusPx;
    onGuessChange(clampToRadius(clientToMeters(e.clientX, e.clientY, rect), maxM));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 50);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full h-full flex justify-center items-center relative">
      {/* Underglow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="size-full rounded-full bg-gradient-to-br from-zinc-600 via-zinc-700 to-black opacity-75 blur-[80px] animate-slow-breathe"></div>
      </div>

      <Radar
        ref={radarRef}
        sizePx={RADAR_SIZE_PX}
        className="border border-white/10 bg-black cursor-crosshair z-10"
        showRingLabels
        onSelect={handleSelect}
      >
        {/* Listener */}
        <div ref={listenerDotRef} className="absolute top-1/2 left-1/2 w-[10px] h-[10px] bg-white rounded-full z-20" style={{ transform: 'translate(-50%, -50%)' }} />

        {/* Guess Marker */}
        {guess && (
          <RadarPoint
            pos={guess}
            className="w-[12px] h-[12px] bg-green-500 rounded-full z-30 cursor-grab shadow-md -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => {
              if (gameState !== 'GUESSING') return;
              e.stopPropagation(); // Prevent canvas click
              setIsDragging(true);
            }}
          />
        )}

        {/* Guess Label */}
        {gameState === 'ROUND_REVEAL' && guess && (
          <RadarPoint pos={guess} className={`${labelClass} translate-y-[-250%]`}>
            ({Math.round(guess.x)}, {Math.round(guess.z)})
          </RadarPoint>
        )}

        {/* Actual Location Blue Dot */}
        {gameState === 'ROUND_REVEAL' && (
          <>
            <RadarPoint
              pos={targetCoordinates}
              className="w-[12px] h-[12px] bg-blue-500 rounded-full z-30 -translate-x-1/2 -translate-y-1/2"
            />
            {/* Actual Location Label */}
            <RadarPoint pos={targetCoordinates} className={`${labelClass} translate-y-[150%]`}>
              ({Math.round(targetCoordinates.x)}, {Math.round(targetCoordinates.z)})
            </RadarPoint>
          </>
        )}
      </Radar>
    </div>
  );
};
