import React from 'react';
import type { Vec2 } from '../types';
import { metersToPx } from '../utils/radarMath';

interface ResultRadarProps {
  target: Vec2;
  guess: Vec2;
}

export const ResultRadar: React.FC<ResultRadarProps> = ({ target, guess }) => {
  // Use a smaller size (e.g., 200px) for the mini radar
  const size = 200;
  const radiusPx = size / 2;

  const getPos = (pos: Vec2) => ({
    left: `calc(50% + ${metersToPx(pos.x, radiusPx)}px)`,
    top: `calc(50% + ${metersToPx(pos.z, radiusPx)}px)`
  });

  // Helper for line coordinates to match point mapping
  const getLinePos = (pos: Vec2) => ({
    x: `calc(50% + ${metersToPx(pos.x, radiusPx)}px)`,
    y: `calc(50% + ${metersToPx(pos.z, radiusPx)}px)`
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
