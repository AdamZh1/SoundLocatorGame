import React, { useRef, useState, useEffect } from 'react';

interface RadarCanvasProps {
  onGuessSubmit: (x: number, z: number) => void;
  gameState: 'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER';
  targetCoordinates: { x: number; z: number };
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({ onGuessSubmit }) => {
  const radarRef = useRef<HTMLDivElement>(null);
  const [markerPos, setMarkerPos] = useState({ x: 0, y: 0 }); // Relative to center
  const [isDragging, setIsDragging] = useState(false);

  const wasDraggingRef = useRef(false);

  const markerPosRef = useRef({ x: 0, y: 0 }); // Track latest position synchronously

  const handleCanvasClick = (e: React.MouseEvent) => {
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
    const dy = e.clientY - (rect.top + centerY);

    const newX = dx * metersPerPixel;
    const newY = dy * metersPerPixel;

    markerPosRef.current = { x: newX, y: newY };
    setMarkerPos({ x: newX, y: newY });
    onGuessSubmit(newX, newY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !radarRef.current) return;
    wasDraggingRef.current = true;
    
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radiusPixels = rect.width / 2 - 6;
    const maxMeters = 40;
    const metersPerPixel = maxMeters / (rect.width / 2);

    const dx = e.clientX - (rect.left + centerX);
    const dy = e.clientY - (rect.top + centerY);
    const distancePixels = Math.sqrt(dx * dx + dy * dy);

    let finalXPixels = dx;
    let finalYPixels = dy;

    if (distancePixels > radiusPixels) {
      const angle = Math.atan2(dy, dx);
      finalXPixels = radiusPixels * Math.cos(angle);
      finalYPixels = radiusPixels * Math.sin(angle);
    }

    const newPos = { x: finalXPixels * metersPerPixel, y: finalYPixels * metersPerPixel };
    markerPosRef.current = newPos; // Update ref
    setMarkerPos(newPos);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onGuessSubmit(markerPosRef.current.x, markerPosRef.current.y); // Use ref
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 50);
    }
  };

  // Convert marker position from meters to pixels for rendering
  const renderX = (markerPos.x / 40) * (radarRef.current ? radarRef.current.offsetWidth / 2 : 200);
  const renderY = (markerPos.y / 40) * (radarRef.current ? radarRef.current.offsetHeight / 2 : 200);

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
        <div 
          className="w-[12px] h-[12px] bg-green-500 rounded-full absolute z-30 cursor-grab shadow-md translate-x-[-50%] translate-y-[-50%]"
          style={{ left: `calc(50% + ${renderX}px)`, top: `calc(50% + ${renderY}px)` }}
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent canvas click
            setIsDragging(true);
          }}
        />
        
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
