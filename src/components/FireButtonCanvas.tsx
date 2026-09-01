import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface FireButtonCanvasHandle {
  setHovered: (hovered: boolean) => void;
}

interface FireButtonCanvasProps {}

export const FireButtonCanvas = forwardRef<FireButtonCanvasHandle, FireButtonCanvasProps>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const isAnimatingRef = useRef(false);
  const opacityRef = useRef(0);
  const animationFrameRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    setHovered: (hovered: boolean) => {
      isAnimatingRef.current = hovered;
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
      ctx.globalCompositeOperation = 'screen';

      // Update global opacity based on hover state
      if (isAnimatingRef.current) {
        opacityRef.current = Math.min(1, opacityRef.current + 0.05);
      } else {
        opacityRef.current = Math.max(0, opacityRef.current - 0.02);
      }

      if (opacityRef.current > 0 || isAnimatingRef.current) {
        // Create new particles only when hovered
        if (isAnimatingRef.current) {
          for (let i = 0; i < 5; i++) { 
            const angle = Math.random() * Math.PI * 2;
            const radius = (Math.random() * (canvas.width / 4));
            
            particlesRef.current.push({
              x: canvas.width / 2 + Math.cos(angle) * radius,
              y: canvas.height / 2 + Math.sin(angle) * radius,
              vx: (Math.random() - 0.5) * 0.3,
              vy: -Math.random() * 0.8 - 0.4, 
              life: 1.0,
              size: Math.random() * 10 + 5,
              hue: 180 + Math.random() * 40,
              phase: Math.random() * Math.PI * 2
            });
          }
        }

        // Update and Draw particles
        particlesRef.current.forEach((p, i) => {
          p.x += p.vx + Math.sin(p.life * 5 + p.phase) * 0.5;
          p.y += p.vy;
          p.life -= (0.004 + (canvas.height - p.y) / canvas.height * 0.005); 

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
          } else {
            // Radial gradient
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * p.life);
            const alpha = p.life * opacityRef.current;
            gradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
            gradient.addColorStop(1, `hsla(${p.hue}, 100%, 70%, 0)`);
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
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
