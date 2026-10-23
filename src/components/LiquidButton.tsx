import React, { useEffect, useRef } from 'react';
import { useCanvasLoop, cssVar, hexToRgbTriplet, type CanvasSize, type DrawFn } from '../hooks/useCanvasLoop';
import { playHoverSound, playUiSound } from '../utils/audioHelper';

interface Spring {
  height: number; // y of the liquid surface at this column (0 = full, canvas height = empty)
  target: number;
  velocity: number;
}

interface LiquidButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const SPRING_COUNT = 40;
const K = 0.002; // spring stiffness (low = slow fill)
const DAMPING = 0.2;
const SPREAD = 0.01; // how much each column pulls its neighbours
const REST_EPSILON = 0.05;

// Play Again button: fills with accent liquid on hover; moving the cursor over it makes waves
export const LiquidButton: React.FC<LiquidButtonProps> = ({ onClick, children }) => {
  const springsRef = useRef<Spring[]>(
    Array.from({ length: SPRING_COUNT }, () => ({ height: 0, target: 0, velocity: 0 }))
  );
  const hoveredRef = useRef(false);
  const heightRef = useRef(0);
  const colorRef = useRef('255, 255, 255');

  const handleResize = ({ height }: CanvasSize) => {
    heightRef.current = height;
    const level = hoveredRef.current ? 0 : height;
    springsRef.current.forEach((s) => { s.height = level; s.target = level; s.velocity = 0; });
  };

  const draw: DrawFn = (ctx, { width, height }, dt) => {
    const springs = springsRef.current;
    let moving = false;

    for (const s of springs) {
      const force = K * (s.target - s.height) - DAMPING * s.velocity;
      s.velocity = Math.max(-50, Math.min(50, (s.velocity + force * dt) * 0.9));
      s.height = Math.max(-20, Math.min(height + 20, s.height + s.velocity * dt));
      if (Math.abs(s.velocity) > REST_EPSILON || Math.abs(s.target - s.height) > REST_EPSILON) moving = true;
    }
    for (let j = 0; j < springs.length; j++) {
      if (j > 0) springs[j - 1].velocity += SPREAD * (springs[j].height - springs[j - 1].height);
      if (j < springs.length - 1) springs[j + 1].velocity += SPREAD * (springs[j].height - springs[j + 1].height);
    }

    ctx.beginPath();
    ctx.moveTo(0, height);
    springs.forEach((s, i) => ctx.lineTo((i / (springs.length - 1)) * width, s.height));
    ctx.lineTo(width, height);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `rgba(${colorRef.current}, 0.95)`);
    gradient.addColorStop(1, `rgba(${colorRef.current}, 0.75)`);
    ctx.fillStyle = gradient;
    ctx.fill();

    return moving;
  };

  const { canvasRef, wake } = useCanvasLoop(draw, handleResize);

  useEffect(() => {
    colorRef.current = hexToRgbTriplet(cssVar('--color-accent'));
  }, []);

  const setHovered = (hovered: boolean) => {
    hoveredRef.current = hovered;
    const target = hovered ? 0 : heightRef.current;
    springsRef.current.forEach((s) => { s.target = target; });
    wake();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const index = Math.floor(((e.clientX - rect.left) / rect.width) * SPRING_COUNT);
    const spring = springsRef.current[index];
    if (!spring) return;
    spring.velocity += Math.max(-10, Math.min(10, e.movementY)) * 0.5;
    wake();
  };

  return (
    <button
      onClick={() => { playUiSound(); onClick(); }}
      onMouseEnter={() => { playHoverSound(); setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className="btn group relative overflow-hidden h-14 px-12 text-base hover:text-bg hover:border-accent"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full pointer-events-none" />
      <span className="relative">{children}</span>
    </button>
  );
};
