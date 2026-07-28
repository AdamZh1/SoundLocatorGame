import React from 'react';

interface MatchHistoryProps {
  history: string[]; // Simplification for now, should be objects later
  currentRound: number;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ history, currentRound }) => {
  return (
    <div className="w-full h-full p-4 flex flex-col gap-4">
      <h2 className="border-2 border-gray-600 rounded-[15px] p-2.5 text-center font-bold">Match History</h2>
      <ul className="list-none p-0 flex flex-col gap-2">
        {history.map((item, index) => (
          <li key={index} className="border border-gray-600 rounded-[10px] p-3 text-sm">
            {item}
          </li>
        ))}
        {history.length === 0 && <li className="text-gray-500 text-sm text-center italic">No rounds played yet.</li>}
      </ul>
    </div>
  );
};
