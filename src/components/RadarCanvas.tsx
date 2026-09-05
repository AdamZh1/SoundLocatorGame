import React, { useRef, useState, useEffect } from 'react';

interface RadarCanvasProps {
  onPendingGuess: (x: number, z: number) => void;
  gameState: 'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER';
  targetCoordinates: { x: number; z: number };
  finalGuess: { x: number; z: number } | null;
  listenerDotRef: React.RefObject<HTMLDivElement | null>;
  radarRef: React.RefObject<HTMLDivElement | null>;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({ onPendingGuess, gameState, targetCoordinates, finalGuess, listenerDotRef, radarRef }) => {
  const [markerPos, setMarkerPos] = useState({ x: 0, z: 0 }); // Relative to center
  const [isDragging, setIsDragging] = useState(false);
  const [hasPlacedGuess, setHasPlacedGuess] = useState(false);

  const wasDraggingRef = useRef(false);
  const markerPosRef = useRef({ x: 0, z: 0 });

  // Reset guess state when round changes
  useEffect(() => {
    if (gameState === 'INIT') {
      setHasPlacedGuess(false);
      setMarkerPos({ x: 0, z: 0 });
      markerPosRef.current = { x: 0, z: 0 };
    }
  }, [gameState]);


  // Use finalGuess if in ROUND_REVEAL, otherwise markerPos
  const displayPos = gameState === 'ROUND_REVEAL' && finalGuess ? finalGuess : markerPos;

  // Convert marker position from meters to pixels for rendering
  // Note: Using z for vertical (Y) position
  const renderX = (displayPos.x / 40) * (radarRef.current ? radarRef.current.offsetWidth / 2 : 200);
  const renderY = (displayPos.z / 40) * (radarRef.current ? radarRef.current.offsetHeight / 2 : 200);

  const targetRenderX = (targetCoordinates.x / 40) * (radarRef.current ? radarRef.current.offsetWidth / 2 : 200);
  const targetRenderY = (targetCoordinates.z / 40) * (radarRef.current ? radarRef.current.offsetHeight / 2 : 200);

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
    const maxMeters = 40;
    const metersPerPixel = maxMeters / (rect.width / 2);

    const dx = e.clientX - (rect.left + centerX);
    const dz = e.clientY - (rect.top + centerY);

    const newX = dx * metersPerPixel;
    const newZ = dz * metersPerPixel;

    markerPosRef.current = { x: newX, z: newZ };
    setMarkerPos({ x: newX, z: newZ });
    setHasPlacedGuess(true);
    onPendingGuess(newX, newZ);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !radarRef.current || gameState !== 'GUESSING') return;
    wasDraggingRef.current = true;
    
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radiusPixels = rect.width / 2 - 6;
    const maxMeters = 40;
    const metersPerPixel = maxMeters / (rect.width / 2);

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

    const newPos = { x: finalXPixels * metersPerPixel, z: finalZPixels * metersPerPixel };
    markerPosRef.current = newPos; // Update ref
    setMarkerPos(newPos);
    setHasPlacedGuess(true);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPendingGuess(markerPosRef.current.x, markerPosRef.current.z); // Use ref
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
        {(gameState === 'ROUND_REVEAL' || (gameState === 'GUESSING' && hasPlacedGuess)) && (
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
        {gameState === 'ROUND_REVEAL' && finalGuess && (
          <div 
            className="absolute z-40 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded translate-x-[-50%] translate-y-[-250%]"
            style={{ left: `calc(50% + ${renderX}px)`, top: `calc(50% + ${renderY}px)` }}
          >
            ({Math.round(finalGuess.x)}, {Math.round(finalGuess.z)})
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
