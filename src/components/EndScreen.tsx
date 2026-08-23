import React, { useState, useRef } from 'react';
import { ResultRadar } from './ResultRadar';

interface EndScreenProps {
  history: { round: number; score: number; error: number; guess: { x: number; z: number }; target: { x: number; z: number } }[];
  onPlayAgain: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ history, onPlayAgain }) => {
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const contentRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
      } else {
        next.add(round);
      }
      return next;
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-95 z-50 p-4">
      <div className="max-w-md w-full p-8 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl text-center overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="text-3xl font-bold mb-6 text-white">Match Complete</h1>
        
        <div className="mb-6">
          <p className="text-gray-400">Final Score</p>
          <p className="text-5xl font-bold text-blue-400">{totalScore} / 50000</p>
        </div>

        <div className="text-left mb-8 border-t border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-300 mb-2">Round Summary</h3>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.round} className="bg-gray-900 rounded overflow-hidden">
                <button
                  className="w-full flex justify-between items-center text-sm p-3 hover:bg-gray-800 transition-colors"
                  onClick={() => toggleRound(item.round)}
                >
                  <span>Round {item.round}</span>
                  <span className="font-mono">{item.score} pts - {item.error}m</span>
                </button>
                <div
                  ref={(el) => { contentRefs.current[item.round] = el; }}
                  style={{
                    maxHeight: expandedRounds.has(item.round) ? `${contentRefs.current[item.round]?.scrollHeight}px` : '0px',
                  }}
                  className="transition-all duration-300 ease-in-out"
                >
                  <div className="p-3 border-t border-gray-800">
                    <ResultRadar target={item.target} guess={item.guess} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>


        <button
          onClick={onPlayAgain}
          className="w-full px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default EndScreen;
