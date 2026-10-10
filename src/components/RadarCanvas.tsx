import React, { useRef, useState, useEffect } from 'react';
import type { GameState, LevelListener, Vec2 } from '../types';
import { metersToPx, pxToMeters } from '../utils/radarMath';

interface RadarCanvasProps {
  gameState: GameState;
  // The guess to draw (owned by App): movable while GUESSING, the confirmed one during ROUND_REVEAL
  guess: Vec2 | null;
  onGuessChange: (guess: Vec2) => void;
  targetCoordinates: Vec2;
  subscribeLevel: (listener: LevelListener) => () => void;
}

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

  // Convert marker position from meters to pixels for rendering
  // Note: Using z for vertical (Y) position
  const radiusPx = radarRef.current ? radarRef.current.offsetWidth / 2 : 200;
  const renderX = guess ? metersToPx(guess.x, radiusPx) : 0;
  const renderY = guess ? metersToPx(guess.z, radiusPx) : 0;

  const targetRenderX = metersToPx(targetCoordinates.x, radiusPx);
  const targetRenderY = metersToPx(targetCoordinates.z, radiusPx);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState !== 'GUESSING') return; // Only allow clicks in GUESSING state
    
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

    if (!radarRef.current) return;
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = e.clientX - (rect.left + centerX);
    const dz = e.clientY - (rect.top + centerY);

    onGuessChange({ x: pxToMeters(dx, centerX), z: pxToMeters(dz, centerX) });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !radarRef.current || gameState !== 'GUESSING') return;
    wasDraggingRef.current = true;
    
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radiusPixels = rect.width / 2 - 6;

    const dx = e.clientX - (rect.left + centerX);
    const dz = e.clientY - (rect.top + centerY);
    const distancePixels = Math.sqrt(dx * dx + dz * dz);

    let finalXPixels = dx;
    let finalZPixels = dz;

    if (distancePixels > radiusPixels) {
      const angle = Math.atan2(dz, dx);
      finalXPixels = radiusPixels * Math.cos(angle);
      finalZPixels = radiusPixels * Math.sin(angle);
    }

    onGuessChange({ x: pxToMeters(finalXPixels, centerX), z: pxToMeters(finalZPixels, centerX) });
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

        <div 
        ref={radarRef} 
        className="w-[400px] h-[400px] rounded-full border border-white/10 relative bg-black cursor-crosshair z-10"
        onClick={handleCanvasClick}
      >


        {/* Listener */}
        <div ref={listenerDotRef} className="absolute top-1/2 left-1/2 w-[10px] h-[10px] bg-white rounded-full z-20" style={{ transform: 'translate(-50%, -50%)' }} />
        
        {/* Guess Marker */}
        {guess && (
            <div 
            className="w-[12px] h-[12px] bg-green-500 rounded-full absolute z-30 cursor-grab shadow-md translate-x-[-50%] translate-y-[-50%]"
            style={{ left: `calc(50% + ${renderX}px)`, top: `calc(50% + ${renderY}px)` }}
            onMouseDown={(e) => {
                if (gameState !== 'GUESSING') return;
                e.stopPropagation(); // Prevent canvas click
                setIsDragging(true);
            }}
            />
        )}
        
        {/* Guess Label */}
        {gameState === 'ROUND_REVEAL' && guess && (
          <div 
            className="absolute z-40 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded translate-x-[-50%] translate-y-[-250%]"
            style={{ left: `calc(50% + ${renderX}px)`, top: `calc(50% + ${renderY}px)` }}
          >
            ({Math.round(guess.x)}, {Math.round(guess.z)})
          </div>
        )}

        {/* Actual Location Blue Dot */}
        {gameState === 'ROUND_REVEAL' && (
          <>
            <div 
              className="w-[12px] h-[12px] bg-blue-500 rounded-full absolute z-30 translate-x-[-50%] translate-y-[-50%]"
              style={{ left: `calc(50% + ${targetRenderX}px)`, top: `calc(50% + ${targetRenderY}px)` }}
            />
            {/* Actual Location Label */}
            <div 
              className="absolute z-40 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded translate-x-[-50%] translate-y-[150%]"
              style={{ left: `calc(50% + ${targetRenderX}px)`, top: `calc(50% + ${targetRenderY}px)` }}
            >
              ({Math.round(targetCoordinates.x)}, {Math.round(targetCoordinates.z)})
            </div>
          </>
        )}

        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 w-[100px] h-[100px] border border-white/10 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-55px)] left-1/2 translate-x-[-50%]">10m</div>

        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] border border-white/10 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-105px)] left-1/2 translate-x-[-50%]">20m</div>

        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-white/10 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-155px)] left-1/2 translate-x-[-50%]">30m</div>
      </div>
    </div>
  );
};
