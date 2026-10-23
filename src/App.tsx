import React, { useState, useReducer } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { RadarCanvas } from './components/RadarCanvas';
import { CalibrationModal } from './components/CalibrationModal';
import HomeScreen from './components/HomeScreen';
import EndScreen from './components/EndScreen';
import { RevealReadout } from './components/RevealReadout';
import { RoundPips } from './components/RoundPips';
import { ScoreTicker } from './components/ScoreTicker';
import { VolumeControl } from './components/VolumeControl';
import { KeyHint } from './components/KeyHint';
import { useSpatialAudio } from './hooks/useSpatialAudio';
import { useKeyboardShortcuts, type ShortcutBindings } from './hooks/useKeyboardShortcuts';
import { playUiSound, playHoverSound } from './utils/audioHelper';
import { TOTAL_ROUNDS } from './gameConfig';
import { gameReducer, createGame, displayedGuess, lastResult } from './game/gameReducer';
import { randomTarget } from './game/scoring';
import type { AppStage, Vec2 } from './types';

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

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

  const canPlay = phase.name === 'INIT' && loaded;

  const handlePlay = async () => {
    if (!canPlay) return;
    const { x, z } = game.target;
    const soundToPlay = soundFiles[Math.floor(Math.random() * soundFiles.length)].file;

    dispatch({ type: 'PLAY_STARTED' });
    console.log(`Playing ${soundToPlay} at (${x}, ${z})`);
    await playAudio(x, z, soundToPlay);
    dispatch({ type: 'PLAY_ENDED' });
  };

  const handleGuessChange = (guess: Vec2) => dispatch({ type: 'GUESS_MOVED', guess });
  const handleConfirmGuess = () => {
    if (phase.name !== 'GUESSING' || !phase.guess) return;
    playUiSound();
    dispatch({ type: 'GUESS_CONFIRMED' });
  };
  const handleNextRound = () => {
    playUiSound();
    dispatch({ type: 'NEXT_ROUND', target: randomTarget() });
  };
  const handlePlayAgain = () => dispatch({ type: 'RESTART', target: randomTarget() });

  const shortcutsByPhase: Partial<Record<typeof phase.name, ShortcutBindings>> = {
    INIT: { ' ': handlePlay },
    GUESSING: { Enter: handleConfirmGuess },
    ROUND_REVEAL: { n: handleNextRound, Enter: handleNextRound },
  };
  useKeyboardShortcuts(shortcutsByPhase[phase.name] ?? {}, appStage === 'GAME' && !isCalibrationOpen);

  const revealedResult = phase.name === 'ROUND_REVEAL' ? lastResult(game) : undefined;
  const totalScore = game.history.reduce((sum, item) => sum + item.score, 0);
  const isLastRound = game.round >= TOTAL_ROUNDS;

  const renderPrompt = () => {
    switch (phase.name) {
      case 'INIT':
        return loaded
          ? <KeyHint keys={['Space']} label="or click the center to listen" />
          : <span className="text-xs text-muted">{loadError ?? 'Loading sounds…'}</span>;
      case 'AUDIO_PLAYING':
        return <span className="label animate-pulse">Listening</span>;
      case 'GUESSING':
        return (
          <div className="flex items-center gap-5">
            <span className="text-xs text-muted">Click or drag to place</span>
            <button
              onClick={handleConfirmGuess}
              onMouseEnter={playHoverSound}
              disabled={!phase.guess}
              className="btn"
            >
              Lock in <kbd className="kbd">⏎</kbd>
            </button>
          </div>
        );
      case 'ROUND_REVEAL':
        return (
          <button onClick={handleNextRound} onMouseEnter={playHoverSound} className="btn">
            {isLastRound ? 'See results' : 'Next round'} <kbd className="kbd">N</kbd>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grain" />
      <AnimatePresence>
        {appStage === 'HOME' && (
          <motion.div key="home" className="fixed inset-0" {...fade}>
            <HomeScreen onStartGame={handleStartGame} />
          </motion.div>
        )}

        {appStage === 'GAME' && phase.name !== 'MATCH_OVER' && (
          <motion.main key="game" className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" {...fade}>
            {/* HUD: top corners */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6 sm:p-8">
              <RoundPips history={game.history} round={game.round} />
              <ScoreTicker total={totalScore} />
            </div>

            <RadarCanvas
              gameState={phase.name}
              guess={displayedGuess(game)}
              onGuessChange={handleGuessChange}
              targetCoordinates={game.target}
              subscribeLevel={subscribeLevel}
              onPlay={handlePlay}
              canPlay={canPlay}
            />

            {/* Context area under the radar: reveal readout, then the phase's action */}
            <div className="mt-6 flex min-h-32 flex-col items-center justify-start gap-4">
              {revealedResult && <RevealReadout key={revealedResult.round} result={revealedResult} />}
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: phase.name === 'ROUND_REVEAL' ? 1.2 : 0 } }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderPrompt()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* HUD: bottom corners */}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 sm:p-8">
              <VolumeControl volume={volume} onVolumeChange={setVolume} compact />
              <button
                onClick={() => { playUiSound(); setIsCalibrationOpen(true); }}
                onMouseEnter={playHoverSound}
                className="label transition-colors hover:text-accent"
              >
                Calibrate
              </button>
            </div>
          </motion.main>
        )}

        {appStage === 'GAME' && phase.name === 'MATCH_OVER' && (
          <motion.div key="end" className="fixed inset-0" {...fade}>
            <EndScreen history={game.history} onPlayAgain={handlePlayAgain} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>
    </MotionConfig>
  );
};

export default App;
