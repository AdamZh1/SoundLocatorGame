import React, { useState, useEffect } from 'react';
import { AudioController } from './components/AudioController';
import { RadarCanvas } from './components/RadarCanvas';
import { MatchHistory } from './components/MatchHistory';
import { CalibrationModal } from './components/CalibrationModal';
import HomeScreen from './components/HomeScreen';
import EndScreen from './components/EndScreen';
import { useSpatialAudio } from './hooks/useSpatialAudio';

const App: React.FC = () => {
  const [appStage, setAppStage] = useState<'HOME' | 'GAME'>('HOME');
  const [gameState, setGameState] = useState<'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER'>('INIT');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [matchHistory, setMatchHistory] = useState<{ round: number; score: number; error: number; guess: { x: number; z: number }; target: { x: number; z: number } }[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [targetCoordinates, setTargetCoordinates] = useState({ x: 0, z: 0 });
  const [pendingGuess, setPendingGuess] = useState<{ x: number; z: number } | null>(null);
  const [finalGuess, setFinalGuess] = useState<{ x: number; z: number } | null>(null);
  const [manualX, setManualX] = useState('');
  const [manualZ, setManualZ] = useState('');
  const [selectedSound, setSelectedSound] = useState('');

  const { playAudio, setVolume: setAudioVolume, initAudio, soundFiles, loaded } = useSpatialAudio();

  const handleStartGame = async () => {
    await initAudio();
    setAppStage('GAME');
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setAudioVolume(newVolume);
  };

  const generateTarget = () => {
    const maxRadius = 35;
    const theta = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * maxRadius;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    setTargetCoordinates({ x, z });
  };

  useEffect(() => {
    generateTarget();
  }, []);

  const handlePlay = async () => {
    setGameState('AUDIO_PLAYING');
    const x = manualX !== '' ? parseFloat(manualX) : targetCoordinates.x;
    const z = manualZ !== '' ? parseFloat(manualZ) : targetCoordinates.z;
    
    // Select sound: use dropdown if set, otherwise pick random
    const soundToPlay = selectedSound !== '' ? selectedSound : soundFiles[Math.floor(Math.random() * soundFiles.length)];
    
    console.log(`Playing ${soundToPlay} at (${x}, ${z})`);
    await playAudio(x, z, volume, soundToPlay);
    setTimeout(() => setGameState('GUESSING'), 1000);
  };

  const handlePlayAgain = () => {
    setMatchHistory([]);
    setCurrentRound(1);
    setGameState('INIT');
    generateTarget();
  };

  const handleGuessSubmit = (x: number, z: number) => {
    const distance = Math.sqrt(Math.pow(targetCoordinates.x - x, 2) + Math.pow(targetCoordinates.z - z, 2));
    const score = Math.max(0, Math.round(10000 * (1 - Math.pow(distance / 40, 2))));
    
    setFinalGuess({ x, z });
    setMatchHistory([...matchHistory, { round: currentRound, score, error: Math.round(distance), guess: { x, z }, target: targetCoordinates }]);
    setGameState('ROUND_REVEAL');
  };

  const handleNextRound = () => {
    if (currentRound < 5) {
      setCurrentRound(currentRound + 1);
      generateTarget();
      setGameState('INIT');
      setFinalGuess(null);
    } else {
      setGameState('MATCH_OVER');
    }
  };

  const handlePendingGuess = (x: number, z: number) => {
    setPendingGuess({ x, z });
  };

  const handleConfirmGuess = () => {
    if (pendingGuess) {
      handleGuessSubmit(pendingGuess.x, pendingGuess.z);
      setPendingGuess(null); // Reset pending guess
    }
  };

  return (
    appStage === 'HOME' ? (
      <HomeScreen onStartGame={handleStartGame} />
    ) : (
      <div className="flex h-screen bg-gray-900 text-white w-full">
        {/* Left Panel */}
        <div className="w-1/4 h-full border-r border-gray-700 bg-gray-900">
          <AudioController 
            onPlay={handlePlay} 
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            volume={volume} 
            onVolumeChange={handleVolumeChange}
            disabled={gameState !== 'INIT' || !loaded}
            manualX={manualX}
            manualZ={manualZ}
            onManualXChange={setManualX}
            onManualZChange={setManualZ}
            selectedSound={selectedSound}
            onSelectedSoundChange={setSelectedSound}
            soundFiles={soundFiles}
          />
        </div>

        {isCalibrationOpen && (
          <CalibrationModal 
            onClose={() => setIsCalibrationOpen(false)}
            playAudio={playAudio}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            selectedSound={selectedSound}
            onSelectedSoundChange={setSelectedSound}
            soundFiles={soundFiles}
            loaded={loaded}
          />
        )}

        {gameState === 'MATCH_OVER' && (
          <EndScreen history={matchHistory} onPlayAgain={handlePlayAgain} />
        )}

        {/* Center Panel */}
        <div className="w-1/2 h-full p-4 flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            <RadarCanvas 
              onPendingGuess={handlePendingGuess} 
              gameState={gameState}
              targetCoordinates={targetCoordinates}
              finalGuess={finalGuess}
            />
            {gameState === 'GUESSING' && (
              <button 
                onClick={handleConfirmGuess}
                disabled={!pendingGuess}
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-all font-bold text-white shadow-lg whitespace-nowrap"
              >
                Confirm Guess
              </button>
            )}
            {gameState === 'ROUND_REVEAL' && (
              <button 
                onClick={handleNextRound}
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all font-bold text-white shadow-lg whitespace-nowrap"
              >
                {currentRound < 5 ? 'Next Round' : 'See Final Score'}
              </button>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/4 h-full border-l border-gray-700 bg-gray-900">
          <MatchHistory 
            history={matchHistory} 
            currentRound={currentRound} 
          />
        </div>
      </div>
    )
  );
};

export default App;
