import { useCallback, useEffect, useRef } from 'react';

export interface CanvasSize {
  width: number; // CSS pixels
  height: number;
}

// Draws one frame. `dt` is in 60fps frames (1 = 16.7ms), so per-frame constants stay frame-rate independent.
// Return true to keep animating, false to let the loop sleep until wake() is called.
export type DrawFn = (ctx: CanvasRenderingContext2D, size: CanvasSize, dt: number) => boolean;

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shared requestAnimationFrame loop for decorative canvases: DPR-aware sizing, and no frames while idle.
export const useCanvasLoop = (draw: DrawFn, onResize?: (size: CanvasSize) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 });
  const drawRef = useRef(draw);
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    drawRef.current = draw;
    onResizeRef.current = onResize;
  });

  const wake = useCallback(() => {
    if (frameRef.current || prefersReducedMotion()) return;

    function tick(time: number) {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) {
        frameRef.current = 0;
        return;
      }
      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / (1000 / 60), 3) : 1;
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, sizeRef.current.width, sizeRef.current.height);
      const keepGoing = drawRef.current(ctx, sizeRef.current, dt);
      frameRef.current = keepGoing ? requestAnimationFrame(tick) : 0;
      if (!keepGoing) lastTimeRef.current = 0;
    }
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height };
      onResizeRef.current?.(sizeRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, []);

  return { canvasRef, wake };
};

// Reads a CSS custom property (e.g. '--color-accent') from :root
export const cssVar = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// '#d4ff3a' -> '212, 255, 58', for building rgba() strings in canvas code
export const hexToRgbTriplet = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};
