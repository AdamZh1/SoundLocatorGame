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

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !radarRef.current) return;
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = rect.width / 2 - 6;

    const dx = e.clientX - (rect.left + centerX);
    const dy = e.clientY - (rect.top + centerY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    let finalX = dx;
    let finalY = dy;

    if (distance > radius) {
      const angle = Math.atan2(dy, dx);
      finalX = radius * Math.cos(angle);
      finalY = radius * Math.sin(angle);
    }
    setMarkerPos({ x: finalX, y: finalY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onGuessSubmit(markerPos.x, markerPos.y);
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
        className="w-[400px] h-[400px] rounded-full border-2 border-white relative bg-gray-900"
      >
        {/* Listener */}
        <div className="absolute top-1/2 left-1/2 w-[10px] h-[10px] bg-white rounded-full translate-x-[-50%] translate-y-[-50%] z-20" />
        
        {/* Guess Marker */}
        <div 
          className="w-[12px] h-[12px] bg-green-500 rounded-full absolute z-30 cursor-grab shadow-md translate-x-[-50%] translate-y-[-50%]"
          style={{ left: `calc(50% + ${markerPos.x}px)`, top: `calc(50% + ${markerPos.y}px)` }}
          onMouseDown={() => setIsDragging(true)}
        />
        
        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 w-[100px] h-[100px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] border border-dashed border-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />
      </div>
    </div>
  );
};
