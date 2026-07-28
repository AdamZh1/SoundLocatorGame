import React, { useState } from 'react';
import { AudioController } from './components/AudioController';
import { RadarCanvas } from './components/RadarCanvas';
import { MatchHistory } from './components/MatchHistory';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER'>('INIT');
  const [volume, setVolume] = useState(0.5);
  const [matchHistory, setMatchHistory] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  const handlePlay = () => {
    setGameState('AUDIO_PLAYING');
    // Placeholder logic
    setTimeout(() => setGameState('GUESSING'), 2000);
  };

  const handleGuessSubmit = (x: number, z: number) => {
    const newEntry = `Round ${currentRound}: Guessed (${Math.round(x)}, ${Math.round(z)})`;
    setMatchHistory([...matchHistory, newEntry]);
    setCurrentRound(currentRound + 1);
    setGameState('ROUND_REVEAL');
    // Placeholder logic
    setTimeout(() => setGameState('GUESSING'), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white w-full">
      {/* Left Panel */}
      <div className="w-1/4 h-full border-r border-gray-700 bg-gray-900">
        <AudioController 
          onPlay={handlePlay} 
          volume={volume} 
          onVolumeChange={setVolume} 
        />
      </div>

      {/* Center Panel */}
      <div className="w-1/2 h-full p-4 flex justify-center items-center relative">
        <RadarCanvas 
          onGuessSubmit={handleGuessSubmit} 
          gameState={gameState} 
        />
      </div>

      {/* Right Panel */}
      <div className="w-1/4 h-full border-l border-gray-700 bg-gray-900">
        <MatchHistory 
          history={matchHistory} 
          currentRound={currentRound} 
        />
      </div>
    </div>
  );
};

export default App;
