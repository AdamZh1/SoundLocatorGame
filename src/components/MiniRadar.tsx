import React, { useRef, useState } from 'react';

interface MiniRadarProps {
  onSelectCoordinate: (x: number, z: number) => void;
}

export const MiniRadar: React.FC<MiniRadarProps> = ({ onSelectCoordinate }) => {
  const radarRef = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<{ x: number; z: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!radarRef.current) return;
    const rect = radarRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Canvas is 200px, represents 40m total (20m radius)
    const maxMeters = 40;
    const metersPerPixel = maxMeters / rect.width;

    const dx = e.clientX - (rect.left + centerX);
    const dz = e.clientY - (rect.top + centerY);

    const x = dx * metersPerPixel;
    const z = dz * metersPerPixel;

    setMarker({ x, z });
    onSelectCoordinate(x, z);
  };

  return (
    <div className="flex justify-center mb-6">
      <div 
        ref={radarRef}
        className="w-[200px] h-[200px] rounded-full border border-gray-500 bg-gray-900 relative cursor-crosshair overflow-hidden"
        onClick={handleClick}
      >
        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 w-[50px] h-[50px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute top-1/2 left-1/2 w-[100px] h-[100px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />
        <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />

        {/* Center */}
        <div className="absolute top-1/2 left-1/2 w-[6px] h-[6px] bg-white rounded-full translate-x-[-50%] translate-y-[-50%] z-20" />
        
        {/* Marker */}
        {marker && (
          <div 
            className="w-[8px] h-[8px] bg-blue-500 rounded-full absolute translate-x-[-50%] translate-y-[-50%] z-30"
            style={{ 
                left: `calc(50% + ${(marker.x / 40) * 200}px)`, 
                top: `calc(50% + ${(marker.z / 40) * 200}px)` 
            }}
          />
        )}
      </div>
    </div>
  );
};
