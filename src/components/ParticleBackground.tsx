import { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  mode: 'twinkle' | 'hearts' | 'both';
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
  angle?: number;
  spin?: number;
  wiggleRange?: number;
  type: 'star' | 'heart' | 'bulb';
}

export default function ParticleBackground({ mode }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = mode === 'hearts' ? 18 : mode === 'both' ? 28 : 32;

    // Fluid container size observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvas) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
          // Spawn initial batch
          initParticles(canvas.width, canvas.height);
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const initParticles = (w: number, h: number) => {
      particles = [];
      const count = maxParticles;
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(w, h, true));
      }
    };

    const colors = {
      sparkle: ['rgba(244, 63, 94, ', 'rgba(217, 70, 239, ', 'rgba(168, 85, 247, ', 'rgba(253, 224, 71, ', 'rgba(255, 255, 255, '],
      hearts: ['rgba(244, 3, 94, ', 'rgba(225, 29, 72, ', 'rgba(244, 63, 94, ', 'rgba(251, 113, 133, ', 'rgba(253, 164, 175, '],
    };

    const createParticle = (w: number, h: number, isInitial = false): Particle => {
      const typeRand = Math.random();
      let type: 'star' | 'heart' | 'bulb' = 'star';
      
      if (mode === 'hearts') {
        type = 'heart';
      } else if (mode === 'both') {
        type = typeRand > 0.4 ? 'star' : 'heart';
      } else {
        type = typeRand > 0.8 ? 'bulb' : 'star';
      }

      const pColors = type === 'heart' ? colors.hearts : colors.sparkle;
      const baseColor = pColors[Math.floor(Math.random() * pColors.length)];

      return {
        x: Math.random() * w,
        y: isInitial ? Math.random() * h : h + 20,
        size: type === 'heart' ? Math.random() * 12 + 6 : type === 'bulb' ? Math.random() * 4 + 2 : Math.random() * 2 + 1,
        speedY: type === 'heart' ? -(Math.random() * 0.7 + 0.3) : -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.7 + 0.2,
        fadeSpeed: Math.random() * 0.005 + 0.002,
        color: baseColor,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        wiggleRange: Math.random() * 1.5 + 0.5,
        type,
      };
    };

    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, colorStr: string) => {
      c.save();
      c.translate(x, y);
      c.beginPath();
      
      // Draw a perfect vector love heart
      const d = size;
      c.moveTo(0, d / 4);
      c.bezierCurveTo(0, -d/2, -d, -d/2, -d, d/4);
      c.bezierCurveTo(-d, d, 0, d * 1.3, 0, d * 1.6);
      c.bezierCurveTo(0, d * 1.3, d, d, d, d/4);
      c.bezierCurveTo(d, -d/2, 0, -d/2, 0, d/4);
      
      c.closePath();
      c.fillStyle = colorStr + opacity + ')';
      
      // Add glowing shadow to hearts
      c.shadowBlur = d * 1.5;
      c.shadowColor = 'rgba(244, 63, 94, ' + (opacity * 0.8) + ')';
      
      c.fill();
      c.restore();
    };

    const drawTwinkle = (c: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, colorStr: string) => {
      c.save();
      c.beginPath();
      c.arc(x, y, size, 0, Math.PI * 2);
      c.fillStyle = colorStr + opacity + ')';
      c.shadowBlur = size * 3;
      c.shadowColor = colorStr + opacity + ')';
      c.fill();
      c.restore();
    };

    const drawSparklyStar = (c: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, colorStr: string) => {
      c.save();
      c.translate(x, y);
      c.beginPath();
      // Draw cross star flare
      for (let i = 0; i < 4; i++) {
        c.rotate(Math.PI / 2);
        c.lineTo(0, size * 2.5);
        c.lineTo(size * 0.4, 0);
      }
      c.closePath();
      c.fillStyle = colorStr + opacity + ')';
      c.shadowBlur = size * 4;
      c.shadowColor = colorStr + opacity + ')';
      c.fill();
      c.restore();
    };

    const tick = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Update position
        p.y += p.speedY;
        
        if (p.type === 'heart') {
          // Heart wiggle effect using sinus waves
          if (p.angle !== undefined) {
            p.angle += p.spin || 0.01;
            p.x += Math.sin(p.angle) * (p.wiggleRange || 1) * 0.15;
          }
        } else {
          p.x += p.speedX;
        }

        // Slight fade oscillate
        p.opacity -= p.fadeSpeed * 0.2;
        if (p.opacity <= 0) {
          particles[i] = createParticle(canvas.width, canvas.height, false);
          continue;
        }

        // Wrap around sides safely
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        // If floats completely above screen, recycle it
        if (p.y < -30) {
          particles[i] = createParticle(canvas.width, canvas.height, false);
          continue;
        }

        // Draw particle
        if (p.type === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size, p.opacity, p.color);
        } else if (p.type === 'star') {
          if (Math.random() > 0.985) {
            drawSparklyStar(ctx, p.x, p.y, p.size, p.opacity * 1.3, p.color);
          } else {
            drawTwinkle(ctx, p.x, p.y, p.size, p.opacity, p.color);
          }
        } else {
          drawTwinkle(ctx, p.x, p.y, p.size * 1.8, p.opacity * 0.7, p.color);
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [mode]);

  return (
    <canvas
      id="particle-canvas"
      ref={canvasRef}
      className="absolute inset-0 block w-full h-full pointer-events-none z-0"
    />
  );
}
