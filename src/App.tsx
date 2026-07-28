import React, { useState, useEffect } from 'react';
import { AudioController } from './components/AudioController';
import { RadarCanvas } from './components/RadarCanvas';
import { MatchHistory } from './components/MatchHistory';
import { useSpatialAudio } from './hooks/useSpatialAudio';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER'>('INIT');
  const [volume, setVolume] = useState(0.5);
  const [matchHistory, setMatchHistory] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [targetCoordinates, setTargetCoordinates] = useState({ x: 0, z: 0 });

  const { playAudio, setVolume: setAudioVolume } = useSpatialAudio();

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setAudioVolume(newVolume);
  };

  const generateTarget = () => {
    const x = (Math.random() * 34 + 1) * (Math.random() > 0.5 ? 1 : -1);
    const z = (Math.random() * 34 + 1) * (Math.random() > 0.5 ? 1 : -1);
    setTargetCoordinates({ x, z });
  };

  useEffect(() => {
    generateTarget();
  }, []);

  const handlePlay = () => {
    setGameState('AUDIO_PLAYING');
    playAudio(targetCoordinates.x, targetCoordinates.z, volume);
    setTimeout(() => setGameState('GUESSING'), 1000);
  };

  const handleGuessSubmit = (x: number, z: number) => {
    const newEntry = `Round ${currentRound}: Guessed (${Math.round(x)}, ${Math.round(z)})`;
    setMatchHistory([...matchHistory, newEntry]);
    
    if (currentRound < 5) {
      setCurrentRound(currentRound + 1);
      generateTarget();
      setGameState('ROUND_REVEAL');
      setTimeout(() => setGameState('INIT'), 2000); // Wait 2s to show result then reset
    } else {
      setGameState('MATCH_OVER');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white w-full">
      {/* Left Panel */}
      <div className="w-1/4 h-full border-r border-gray-700 bg-gray-900">
        <AudioController 
          onPlay={handlePlay} 
          volume={volume} 
          onVolumeChange={handleVolumeChange}
          disabled={gameState !== 'INIT'}
        />
      </div>

      {/* Center Panel */}
      <div className="w-1/2 h-full p-4 flex justify-center items-center relative">
        <RadarCanvas 
          onGuessSubmit={handleGuessSubmit} 
          gameState={gameState}
          targetCoordinates={targetCoordinates}
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
