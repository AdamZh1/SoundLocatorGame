import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface LiquidButtonCanvasProps {
  // No props needed for state control, controlled via ref
}

export interface LiquidButtonCanvasHandle {
  setHovered: (hovered: boolean) => void;
}

export const LiquidButtonCanvas = forwardRef<LiquidButtonCanvasHandle, LiquidButtonCanvasProps>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const springsRef = useRef(Array.from({ length: 40 }, () => ({ height: 0, target: 0, velocity: 0 })));
  const frameRef = useRef<number>(0);
  const isHoveredRef = useRef(false);
  const widthRef = useRef(0);
  const heightRef = useRef(0);

  const K = 0.01;
  const D = 0.15;
  const SPREAD = 0.02;

  useImperativeHandle(ref, () => ({
    setHovered: (hovered: boolean) => {
      isHoveredRef.current = hovered;
      const target = hovered ? 0 : heightRef.current;
      springsRef.current.forEach(s => s.target = target);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      widthRef.current = canvas.offsetWidth;
      heightRef.current = canvas.offsetHeight;
      canvas.width = widthRef.current;
      canvas.height = heightRef.current;
      
      // Initialize heights to bottom
      springsRef.current.forEach(s => {
        s.height = heightRef.current;
        s.target = heightRef.current;
        s.velocity = 0;
      });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, widthRef.current, heightRef.current);

      // Physics update
      springsRef.current.forEach(spring => {
        const force = K * (spring.target - spring.height) - D * spring.velocity;
        spring.velocity += force;
        spring.velocity *= 0.95; // Friction/Damping safeguard
        spring.height += spring.velocity;
        // CRITICAL CLAMP
        spring.height = Math.max(-50, Math.min(heightRef.current + 50, spring.height));
      });

      // Spread momentum
      for (let i = 0; i < 1; i++) {
        springsRef.current.forEach((spring, j, arr) => {
          if (j > 0) {
            const leftDelta = SPREAD * (spring.height - arr[j - 1].height);
            arr[j - 1].velocity += leftDelta;
          }
          if (j < arr.length - 1) {
            const rightDelta = SPREAD * (spring.height - arr[j + 1].height);
            arr[j + 1].velocity += rightDelta;
          }
        });
      }

      // Drawing
      ctx.beginPath();
      ctx.moveTo(0, heightRef.current);
      springsRef.current.forEach((spring, i) => {
        const x = (i / (springsRef.current.length - 1)) * widthRef.current;
        ctx.lineTo(x, spring.height);
      });
      ctx.lineTo(widthRef.current, heightRef.current);
      ctx.closePath();

      // Debug: Draw a stroke to see if anything renders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, 0, 0, heightRef.current);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fill();

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current!);
      observer.disconnect();
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const movementY = (e.nativeEvent as MouseEvent).movementY || 0;
    
    const index = Math.floor((x / rect.width) * springsRef.current.length);
    
    if (index >= 0 && index < springsRef.current.length) {
      // Safe Splash Injection
      const splashForce = Math.min(Math.max(movementY, -10), 10);
      springsRef.current[index].velocity += splashForce * 0.5;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 size-full z-0 pointer-events-auto rounded-full"
    />
  );
});
