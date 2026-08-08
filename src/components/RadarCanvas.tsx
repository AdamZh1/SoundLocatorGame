import React, { useRef, useState, useEffect } from 'react';

interface RadarCanvasProps {
  onPendingGuess: (x: number, z: number) => void;
  gameState: 'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER';
  targetCoordinates: { x: number; z: number };
  finalGuess: { x: number; z: number } | null;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({ onPendingGuess, gameState, targetCoordinates, finalGuess }) => {
  const radarRef = useRef<HTMLDivElement>(null);
  const [markerPos, setMarkerPos] = useState({ x: 0, y: 0 }); // Relative to center
  const [isDragging, setIsDragging] = useState(false);

  const wasDraggingRef = useRef(false);
  const markerPosRef = useRef({ x: 0, y: 0 });

  // Use finalGuess if in ROUND_REVEAL, otherwise markerPos
  const displayPos = gameState === 'ROUND_REVEAL' && finalGuess ? finalGuess : markerPos;

  // Convert marker position from meters to pixels for rendering
  // Note: Using z for vertical (Y) position
  const renderX = (displayPos.x / 40) * (radarRef.current ? radarRef.current.offsetWidth / 2 : 200);
  const renderY = (displayPos.z / 40) * (radarRef.current ? radarRef.current.offsetHeight / 2 : 200);

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
    <div className="w-full h-full flex justify-center items-center">
      <div 
        ref={radarRef} 
        className="w-[400px] h-[400px] rounded-full border-2 border-white relative bg-gray-900 cursor-crosshair"
        onClick={handleCanvasClick}
      >
        {/* Listener */}
        <div className="absolute top-1/2 left-1/2 w-[10px] h-[10px] bg-white rounded-full translate-x-[-50%] translate-y-[-50%] z-20" />
        
        {/* Guess Marker */}
        {(gameState === 'GUESSING' || gameState === 'ROUND_REVEAL') && (
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

        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 w-[100px] h-[100px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-55px)] left-1/2 translate-x-[-50%]">10m</div>

        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-105px)] left-1/2 translate-x-[-50%]">20m</div>

        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute text-[10px] text-gray-500 top-[calc(50%-155px)] left-1/2 translate-x-[-50%]">30m</div>
      </div>
    </div>
  );
};
