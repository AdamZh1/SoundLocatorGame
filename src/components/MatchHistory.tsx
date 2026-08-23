import React from 'react';

interface MatchHistoryProps {
  history: { round: number; score: number; error: number; guess: { x: number; z: number }; target: { x: number; z: number } }[];
  currentRound: number;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ history }) => {
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);

  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      <h2 className="border-2 border-gray-600 rounded-[15px] p-2.5 text-center font-bold">Match History</h2>
      <ul className="list-none p-0 flex flex-col gap-2">
        {history.map((item, index) => (
          <li key={index} className="border border-gray-600 rounded-[10px] p-3 text-sm">
            Round {item.round}: {item.score} pts - {item.error}m Error
          </li>
        ))}
        {history.length === 0 && <li className="text-gray-500 text-sm text-center italic">No rounds played yet.</li>}
      </ul>
      <div className="mt-auto border-t border-gray-700 pt-4 text-center font-bold">
        Total Score: {totalScore} / 50000
      </div>
    </div>
  );
};
