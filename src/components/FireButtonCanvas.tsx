import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface FireButtonCanvasHandle {
  setHovered: (hovered: boolean) => void;
}

interface FireButtonCanvasProps {}

export const FireButtonCanvas = forwardRef<FireButtonCanvasHandle, FireButtonCanvasProps>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const isAnimatingRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    setHovered: (hovered: boolean) => {
      isAnimatingRef.current = hovered;
      if (!hovered) {
        particlesRef.current = []; // Clear particles on stop
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      if (isAnimatingRef.current) {
        // Create new particles
        for (let i = 0; i < 5; i++) { 
          const angle = Math.random() * Math.PI * 2;
          // Spawn near the center for a more organic feel
          const radius = (Math.random() * canvas.width) / 4;
          
          particlesRef.current.push({
            x: canvas.width / 2 + Math.cos(angle) * radius,
            y: canvas.height / 2 + Math.sin(angle) * radius,
            // Add wavy drift
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1, 
            life: 1.0,
            size: Math.random() * 5 + 2,
            // Variable color
            hue: 180 + Math.random() * 40
          });
        }

        // Update and Draw
        particlesRef.current.forEach((p, i) => {
          // Add some simple turbulence
          p.x += p.vx + Math.sin(p.life * 10) * 0.5;
          p.y += p.vy;
          // Apply a randomized death factor to prevent uniform cutoff
          p.life -= (0.015 + Math.random() * 0.02); 

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          } else {
            ctx.beginPath();
            // Vary size decay so particles don't just vanish
            ctx.arc(p.x, p.y, (p.size * p.life) * (0.5 + Math.random() * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.life})`;
            ctx.fill();
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full pointer-events-none z-10" />;
});
