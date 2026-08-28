import React, { useEffect, useRef } from 'react';

interface ScorePopupProps {
  score: number;
}

export const ScorePopup: React.FC<ScorePopupProps> = ({ score }) => {
  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Play UI sound
    const audio = new Audio('/ui_audio/jingles_STEEL10.ogg');
    audio.volume = 0.3; // Adjust volume as needed
    audio.play().catch(e => console.error("Audio playback failed:", e));

    const duration = 1000; // 1 second
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      if (scoreRef.current) {
        scoreRef.current.textContent = `+${Math.floor(easeOut * score)} pts`;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="animate-score-rise">
        <div 
          ref={scoreRef}
          className="animate-pulse-size text-yellow-400 font-extrabold text-4xl drop-shadow-md whitespace-nowrap"
        >
          +0 pts
        </div>
      </div>
    </div>
  );
};
