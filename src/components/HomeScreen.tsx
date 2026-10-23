import React from 'react';
import { motion } from 'motion/react';
import { FireButton } from './FireButton';
import { KeyHint } from './KeyHint';
import { BearingTicks, Radar, RadarSweep } from './Radar';
import { RADAR_LAYOUT_ID } from './RadarCanvas';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { playUiSound } from '../utils/audioHelper';

interface HomeScreenProps {
  onStartGame: () => void;
}

const TITLE = 'sound locator';
const easeOut = [0.16, 1, 0.3, 1] as const;

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  useKeyboardShortcuts({ ' ': () => { playUiSound(); onStartGame(); } }, true);

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-4">
      {/* Ambient radar behind the title; becomes the game radar on start */}
      <motion.div layoutId={RADAR_LAYOUT_ID} className="absolute opacity-40">
        <Radar className="size-[min(90vh,120vw)] border border-line">
          <BearingTicks className="text-fg/15" />
          <RadarSweep opacity={0.6} />
        </Radar>
      </motion.div>

      <h1 className="relative text-[clamp(3.5rem,13vw,10rem)] font-semibold leading-[0.85] tracking-[-0.06em] text-center">
        {TITLE.split('').map((char, i) => (
          <motion.span
            key={i}
            className="inline-block whitespace-pre"
            initial={{ opacity: 0, y: '0.4em', filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.1 + i * 0.035, duration: 0.7, ease: easeOut }}
          >
            {char}
          </motion.span>
        ))}
      </h1>

      <motion.div
        className="relative mt-6 flex flex-col items-center gap-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, ease: easeOut }}
      >
        <p className="max-w-sm text-center text-muted text-balance">
          Hear a sound once. Pin where it came from. Five rounds to train your ears for the next firefight.
        </p>
        <div className="flex flex-col items-center gap-4">
          <FireButton onClick={onStartGame}>Start</FireButton>
          <KeyHint keys={['Space']} label="to start" />
        </div>
        <p className="label">Headphones recommended</p>
      </motion.div>
    </div>
  );
};

export default HomeScreen;
