import React, { useState, useReducer } from 'react';
import { AudioController } from './components/AudioController';
import { RadarCanvas } from './components/RadarCanvas';
import { MatchHistory } from './components/MatchHistory';
import { CalibrationModal } from './components/CalibrationModal';
import HomeScreen from './components/HomeScreen';
import EndScreen from './components/EndScreen';
import { ScorePopup } from './components/ScorePopup';
import { useSpatialAudio } from './hooks/useSpatialAudio';
import { playUiSound, playHoverSound } from './utils/audioHelper';
import { TOTAL_ROUNDS } from './gameConfig';
import { gameReducer, createGame, displayedGuess, lastResult } from './game/gameReducer';
import { randomTarget } from './game/scoring';
import type { AppStage, Vec2 } from './types';

const App: React.FC = () => {
  const [appStage, setAppStage] = useState<AppStage>('HOME');
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [volume, setVolume] = useState(0.25);
  const [game, dispatch] = useReducer(gameReducer, undefined, () => createGame(randomTarget()));
  const { phase } = game;

  const { playAudio, initAudio, subscribeLevel, soundFiles, loaded, loadError } = useSpatialAudio(volume);

  const handleStartGame = async () => {
    await initAudio();
    setAppStage('GAME');
  };

  const handlePlay = async () => {
    if (soundFiles.length === 0) return;
    const { x, z } = game.target;
    const soundToPlay = soundFiles[Math.floor(Math.random() * soundFiles.length)].file;

    dispatch({ type: 'PLAY_STARTED' });
    console.log(`Playing ${soundToPlay} at (${x}, ${z})`);
    await playAudio(x, z, soundToPlay);
    dispatch({ type: 'PLAY_ENDED' });
  };

  const handleGuessChange = (guess: Vec2) => dispatch({ type: 'GUESS_MOVED', guess });
  const handleConfirmGuess = () => dispatch({ type: 'GUESS_CONFIRMED' });
  const handleNextRound = () => dispatch({ type: 'NEXT_ROUND', target: randomTarget() });
  const handlePlayAgain = () => dispatch({ type: 'RESTART', target: randomTarget() });

  const revealedResult = phase.name === 'ROUND_REVEAL' ? lastResult(game) : undefined;

  return (
    appStage === 'HOME' ? (
      <HomeScreen onStartGame={handleStartGame} />
    ) : (
      <div className="flex h-screen bg-black text-white w-full">
        {/* Left Panel */}
        <div className="w-1/4 h-full border-r border-gray-700 bg-black">
          <AudioController
            onPlay={handlePlay}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            volume={volume}
            onVolumeChange={setVolume}
            disabled={phase.name !== 'INIT' || !loaded}
            loadError={loadError}
          />
        </div>

        {isCalibrationOpen && (
          <CalibrationModal
            onClose={() => setIsCalibrationOpen(false)}
            playAudio={playAudio}
            volume={volume}
            onVolumeChange={setVolume}
            soundFiles={soundFiles}
            loaded={loaded}
          />
        )}

        {phase.name === 'MATCH_OVER' && (
          <EndScreen history={game.history} onPlayAgain={handlePlayAgain} />
        )}

        {/* Center Panel */}
        <div className="w-1/2 h-full p-4 flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center">
            <RadarCanvas
              gameState={phase.name}
              guess={displayedGuess(game)}
              onGuessChange={handleGuessChange}
              targetCoordinates={game.target}
              subscribeLevel={subscribeLevel}
            />
            {revealedResult && (
              <ScorePopup score={revealedResult.score} />
            )}
            {phase.name === 'GUESSING' && (
              <div className="btn-primary-border absolute -bottom-24">
                <button
                  onClick={handleConfirmGuess}
                  onMouseEnter={playHoverSound}
                  disabled={!phase.guess}
                  className="btn-circle bg-black text-white disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            )}
            {phase.name === 'ROUND_REVEAL' && (
              <div className="btn-primary-border absolute -bottom-24">
                <button
                  onClick={() => { playUiSound(); handleNextRound(); }}
                  onMouseEnter={playHoverSound}
                  className="btn-circle bg-black text-white"
                >
                  {game.round < TOTAL_ROUNDS ? 'Next' : 'Finish'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/4 h-full border-l border-gray-700 bg-black">
          <MatchHistory
            history={game.history}
            currentRound={game.round}
          />
        </div>
      </div>
    )
  );
};

export default App;
