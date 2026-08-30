import React from 'react';

interface ResultRadarProps {
  target: { x: number; z: number };
  guess: { x: number; z: number };
}

export const ResultRadar: React.FC<ResultRadarProps> = ({ target, guess }) => {
  // Use a smaller size (e.g., 200px) for the mini radar
  const size = 200;
  const maxMeters = 40;

  const getPos = (pos: { x: number; z: number }) => ({
    // Map maxMeters (40) to radius (size/2 = 100px)
    left: `calc(50% + ${(pos.x / maxMeters) * (size / 2)}px)`,
    top: `calc(50% + ${(pos.z / maxMeters) * (size / 2)}px)`
  });

  // Helper for line coordinates to match point mapping
  const getLinePos = (pos: { x: number; z: number }) => ({
    x: `calc(50% + ${(pos.x / maxMeters) * (size / 2)}px)`,
    y: `calc(50% + ${(pos.z / maxMeters) * (size / 2)}px)`
  });

  const targetLine = getLinePos(target);
  const guessLine = getLinePos(guess);

  return (
    <div className="w-[200px] h-[200px] rounded-full border border-gray-600 bg-gray-950 relative mx-auto my-4 overflow-hidden">
      {/* Rings */}
      <div className="absolute top-1/2 left-1/2 w-[50px] h-[50px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />
      <div className="absolute top-1/2 left-1/2 w-[100px] h-[100px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />
      <div className="absolute top-1/2 left-1/2 w-[150px] h-[150px] border border-dashed border-gray-700 rounded-full translate-x-[-50%] translate-y-[-50%]" />

      {/* Center */}
      <div className="absolute top-1/2 left-1/2 w-[6px] h-[6px] bg-gray-500 rounded-full translate-x-[-50%] translate-y-[-50%]" />

      {/* Target (Blue) */}
      <div 
        className="w-[8px] h-[8px] bg-blue-500 rounded-full absolute translate-x-[-50%] translate-y-[-50%]"
        style={getPos(target)}
      />

      {/* Guess (Green) */}
      <div 
        className="w-[8px] h-[8px] bg-green-500 rounded-full absolute translate-x-[-50%] translate-y-[-50%]"
        style={getPos(guess)}
      />

      {/* Line connecting */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line 
          x1={targetLine.x}
          y1={targetLine.y}
          x2={guessLine.x}
          y2={guessLine.y}
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      </svg>
    </div>
  );
};
