import React, { useRef } from 'react';
import { playUiSound, playHoverSound } from '../utils/audioHelper';
import { FireButtonCanvas, type FireButtonCanvasHandle } from './FireButtonCanvas';

interface HomeScreenProps {
  onStartGame: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const fireRef = useRef<FireButtonCanvasHandle>(null);
  const fireAudioRef = useRef<HTMLAudioElement | null>(null);

  const startFireSound = () => {
    if (!fireAudioRef.current) {
      fireAudioRef.current = new Audio('/ui_audio/fire_crackle.ogg');
      fireAudioRef.current.loop = true;
      fireAudioRef.current.volume = 0.3;
    }
    fireAudioRef.current.play().catch(e => console.error("Fire Audio playback failed:", e));
  };

  const stopFireSound = () => {
    if (fireAudioRef.current) {
      fireAudioRef.current.pause();
      fireAudioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="max-w-md p-8 bg-black border border-gray-800 rounded-2xl shadow-xl text-center">
        <h1 className="main-header mb-4 text-white">sound locator</h1>
        <p className="text-gray-400 mb-8">
          Train your spatial audio location skills, by correctly guessing the location where an audio is played.
          Listen to the sound and pinpoint its location on the radar.
        </p>
        <div 
          className="btn-primary-border mx-auto size-[82px] relative flex items-center justify-center rounded-full"
          onMouseEnter={() => { fireRef.current?.setHovered(true); startFireSound(); playHoverSound(); }}
          onMouseLeave={() => { fireRef.current?.setHovered(false); stopFireSound(); }}
        >
          {/* Canvas container extended to allow flames to rise above the button */}
          <div className="absolute -top-16 -left-16 size-[200px] z-10 flex items-center justify-center pointer-events-none">
            <FireButtonCanvas ref={fireRef} />
          </div>
          <button
            onClick={() => { stopFireSound(); playUiSound(); onStartGame(); }}
            className="btn-circle bg-black hover:bg-gray-900 text-white relative z-20"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
