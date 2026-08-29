import React, { useState, useRef } from 'react';
import { ResultRadar } from './ResultRadar';
import { playUiSound } from '../utils/audioHelper';

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
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 p-4">
      <div className="max-w-md w-full p-8 bg-black border border-gray-800 rounded-2xl shadow-xl text-center overflow-y-auto max-h-[90vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <h1 className="main-header mb-6 text-white text-[3rem]">Match Complete</h1>
        
        <div className="mb-6">
          <p className="text-gray-500">Final Score</p>
          <p className="text-5xl font-bold text-blue-500">{totalScore} / 50000</p>
        </div>

        <div className="text-left mb-8 border-t border-gray-800 pt-4">
          <h3 className="font-semibold text-gray-400 mb-2">Round Summary (click round to expand)</h3>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.round} className="bg-gray-950 rounded overflow-hidden">
                <button
                  className="w-full flex justify-between items-center text-sm p-3 hover:bg-gray-900 transition-colors"
                  onClick={() => toggleRound(item.round)}
                >
                  <span>Round {item.round}</span>
                  <span className="font-mono text-gray-400">{item.score} pts - {item.error}m</span>
                </button>
                <div
                  ref={(el) => { contentRefs.current[item.round] = el; }}
                  style={{
                    maxHeight: expandedRounds.has(item.round) ? `${contentRefs.current[item.round]?.scrollHeight}px` : '0px',
                  }}
                  className="transition-all duration-300 ease-in-out"
                >
                  <div className="p-3 border-t border-gray-900">
                    <ResultRadar target={item.target} guess={item.guess} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>


        <div className="btn-primary-border">
          <button
            onClick={() => { playUiSound(); onPlayAgain(); }}
            className="btn-circle bg-black w-full rounded-full"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndScreen;
