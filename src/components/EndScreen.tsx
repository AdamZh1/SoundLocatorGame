import React from 'react';

interface EndScreenProps {
  history: { round: number; score: number; error: number; guess: { x: number; z: number } }[];
  onPlayAgain: () => void;
}

const EndScreen: React.FC<EndScreenProps> = ({ history, onPlayAgain }) => {
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-50">
      <div className="max-w-md w-full p-8 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-white">Match Complete</h1>
        
        <div className="mb-6">
          <p className="text-gray-400">Final Score</p>
          <p className="text-5xl font-bold text-blue-400">{totalScore} / 50000</p>
        </div>

        <div className="text-left mb-8 border-t border-gray-700 pt-4">
          <h3 className="font-semibold text-gray-300 mb-2">Round Summary</h3>
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li key={index} className="flex justify-between text-sm bg-gray-900 p-2 rounded">
                <span>Round {item.round}</span>
                <span className="font-mono">{item.score} pts - {item.error}m</span>
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
