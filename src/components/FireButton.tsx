import React, { useEffect, useRef } from 'react';
import { useCanvasLoop, cssVar, hexToRgbTriplet, type DrawFn } from '../hooks/useCanvasLoop';
import { playHoverSound, playUiSound } from '../utils/audioHelper';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  size: number;
  phase: number;
}

interface FireButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// How far the flame canvas extends past the button, in px (flames rise well above it)
const PAD_X = 48;
const PAD_TOP = 120;
const PAD_BOTTOM = 16;
const SPAWN_PER_FRAME = 4;

// Start button: accent-colored flames rise off it while hovered, with a looping crackle
export const FireButton: React.FC<FireButtonProps> = ({ onClick, children }) => {
  const particlesRef = useRef<Particle[]>([]);
  const hoveredRef = useRef(false);
  const opacityRef = useRef(0);
  const colorRef = useRef('255, 255, 255');
  const crackleRef = useRef<HTMLAudioElement | null>(null);

  const draw: DrawFn = (ctx, { width, height }, dt) => {
    const particles = particlesRef.current;
    opacityRef.current = hoveredRef.current
      ? Math.min(1, opacityRef.current + 0.05 * dt)
      : Math.max(0, opacityRef.current - 0.02 * dt);

    if (hoveredRef.current) {
      const spawnW = width - PAD_X * 2;
      const spawnTop = PAD_TOP + 8;
      const spawnH = height - PAD_TOP - PAD_BOTTOM - 16;
      for (let i = 0; i < SPAWN_PER_FRAME; i++) {
        particles.push({
          x: PAD_X + Math.random() * spawnW,
          y: spawnTop + Math.random() * spawnH,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.9 - 0.5,
          life: 1,
          size: Math.random() * 10 + 6,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    ctx.globalCompositeOperation = 'screen';
    // Iterate backwards so removing a particle doesn't skip the next one
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += (p.vx + Math.sin(p.life * 5 + p.phase) * 0.5) * dt;
      p.y += p.vy * dt;
      p.life -= (0.006 + ((height - p.y) / height) * 0.008) * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      const r = p.size * p.life;
      const alpha = p.life * opacityRef.current;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      gradient.addColorStop(0, `rgba(${colorRef.current}, ${alpha})`);
      gradient.addColorStop(1, `rgba(${colorRef.current}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return hoveredRef.current || particles.length > 0;
  };

  const { canvasRef, wake } = useCanvasLoop(draw);

  useEffect(() => {
    colorRef.current = hexToRgbTriplet(cssVar('--color-accent'));
    return () => crackleRef.current?.pause();
  }, []);

  const startCrackle = () => {
    if (!crackleRef.current) {
      crackleRef.current = new Audio('/ui_audio/fire_crackle.ogg');
      crackleRef.current.loop = true;
      crackleRef.current.volume = 0.3;
    }
    crackleRef.current.play().catch((e) => console.error('Fire audio playback failed:', e));
  };

  const stopCrackle = () => {
    if (!crackleRef.current) return;
    crackleRef.current.pause();
    crackleRef.current.currentTime = 0;
  };

  const setHovered = (hovered: boolean) => {
    hoveredRef.current = hovered;
    if (hovered) {
      wake();
      startCrackle();
      playHoverSound();
    } else {
      stopCrackle();
    }
  };

  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{ left: -PAD_X, right: -PAD_X, top: -PAD_TOP, bottom: -PAD_BOTTOM, width: `calc(100% + ${PAD_X * 2}px)`, height: `calc(100% + ${PAD_TOP + PAD_BOTTOM}px)` }}
      />
      <button
        onClick={() => { setHovered(false); playUiSound(); onClick(); }}
        className="btn relative h-14 px-10 text-base bg-bg"
      >
        {children}
      </button>
    </div>
  );
};
