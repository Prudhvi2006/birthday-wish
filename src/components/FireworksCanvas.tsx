import { useEffect, useRef } from 'react';
import { audio } from '../utils/audio';

interface Rocket {
  x: number;
  y: number;
  tx: number;
  ty: number;
  xStep: number;
  yStep: number;
  color: string;
  size: number;
  alpha: number;
  trail: { x: number; y: number }[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  friction: number;
}

export default function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rockets: Rocket[] = [];
    let sparks: Spark[] = [];

    const colors = [
      '#ef4444', // Rose Red
      '#f43f5e', // Hot Pink
      '#ec4899', // Pink
      '#d946ef', // Magenta
      '#a855f7', // Purple
      '#8b5cf6', // Violet
      '#3b82f6', // Bright Blue
      '#06b6d4', // Cyan
      '#10b981', // Emerald Green
      '#eab308', // Gold Yellow
      '#f97316', // Orange
    ];

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (canvas) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const launchRocket = (startX: number, startY: number, targetX: number, targetY: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const distance = Math.hypot(targetX - startX, targetY - startY);
      const steps = Math.floor(distance / (Math.random() * 4 + 8)); // speed
      
      rockets.push({
        x: startX,
        y: startY,
        tx: targetX,
        ty: targetY,
        xStep: (targetX - startX) / steps,
        yStep: (targetY - startY) / steps,
        color,
        size: Math.random() * 2 + 1.5,
        alpha: 1,
        trail: [],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      audio.playExplosionSound();
      
      const particleCount = Math.floor(Math.random() * 24 + 24);
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.2;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008,
          size: Math.random() * 2 + 1,
          gravity: 0.12,
          friction: 0.96,
        });
      }

      // Small secondary mini crackler stars
      if (Math.random() > 0.75) {
        setTimeout(() => {
          for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 0.4;
            sparks.push({
              x: x + (Math.random() - 0.5) * 20,
              y: y + (Math.random() - 0.5) * 20,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color: '#ffffff', // White cracklers
              alpha: 0.9,
              decay: Math.random() * 0.02 + 0.015,
              size: Math.random() * 1.2 + 0.5,
              gravity: 0.08,
              friction: 0.92,
            });
          }
        }, 180);
      }
    };

    // Auto launcher timer
    let autoLaunchInterval = setInterval(() => {
      if (rockets.length < 3) {
        const startX = Math.random() * canvas.width;
        const startY = canvas.height;
        const targetX = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        const targetY = Math.random() * canvas.height * 0.4 + canvas.height * 0.15;
        launchRocket(startX, startY, targetX, targetY);
      }
    }, 1800);

    // Click handler to launch manual firework
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Launch rocket from bottom center to clicked spot
      launchRocket(canvas.width / 2, canvas.height, x, y);
    };

    const handleCanvasTouch = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        const rect = canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        launchRocket(canvas.width / 2, canvas.height, x, y);
      }
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: true });

    // Loop
    const render = () => {
      if (!ctx || !canvas) return;

      // Trail fade effect (semi-clear rect instead of clearRect)
      ctx.fillStyle = 'rgba(10, 10, 18, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Update and draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        
        // Push current trail
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 12) r.trail.shift();

        // Step closer
        r.x += r.xStep;
        r.y += r.yStep;

        // Draw trail
        ctx.beginPath();
        if (r.trail.length > 0) {
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          for (let k = 1; k < r.trail.length; k++) {
            ctx.lineTo(r.trail[k].x, r.trail[k].y);
          }
        }
        ctx.strokeStyle = r.color;
        ctx.lineWidth = r.size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Check if rocket reached destination
        const distToTarget = Math.hypot(r.tx - r.x, r.ty - r.y);
        // If rocket gets very close or is moving away, blow it up
        const isMissed = (r.yStep < 0 && r.y <= r.ty) || (r.yStep > 0 && r.y >= r.ty) || distToTarget < 15;

        if (isMissed) {
          explode(r.tx, r.ty, r.color);
          rockets.splice(i, 1);
        }
      }

      // 2. Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        
        // Apply physics
        s.vx *= s.friction;
        s.vy *= s.friction;
        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        // Draw individual spark
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.shadowBlur = s.size * 3;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    // Trigger initial burst of 3 immediately on load to make it super exciting
    setTimeout(() => {
      if (canvas) {
        launchRocket(canvas.width * 0.25, canvas.height, canvas.width * 0.3, canvas.height * 0.3);
        launchRocket(canvas.width * 0.5, canvas.height, canvas.width * 0.5, canvas.height * 0.2);
        launchRocket(canvas.width * 0.75, canvas.height, canvas.width * 0.7, canvas.height * 0.35);
      }
    }, 100);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(autoLaunchInterval);
      resizeObserver.disconnect();
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
        canvas.removeEventListener('touchstart', handleCanvasTouch);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-auto z-10 select-none overflow-hidden touch-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs text-rose-200 pointer-events-none font-medium tracking-wide animate-pulse">
        ✨ Tap anywhere to burst crackers! ✨
      </div>
    </div>
  );
}
