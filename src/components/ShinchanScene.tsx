import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, AlertCircle, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { audio } from '../utils/audio';
import ThreeCake from './ThreeCake';

interface ShinchanSceneProps {
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNextTrigger?: () => void;
}

interface BalloonColor {
  bg: string;
  accentColor: string;
  shadow: string;
}

interface Balloon {
  id: number;
  x: number; // Percent 0-100
  size: number;
  speed: number;
  color: BalloonColor;
  popped: boolean;
  delay: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'rect' | 'triangle';
}

interface FireworkRocket {
  id: number;
  startX: number;
  x: number;
  y: number;
  targetY: number;
  speedY: number;
  color: string;
  size: number;
  trail: { x: number; y: number }[];
}

interface FireworkSpark {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  gravity: number;
}

const BALLOON_GRADIENTS: BalloonColor[] = [
  {
    bg: 'radial-gradient(circle at 35% 30%, #ff6b8b 0%, #e63956 50%, #900a22 100%)',
    accentColor: '#be123c',
    shadow: '0 8px 20px rgba(230,57,86,0.35)',
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #54a0ff 0%, #0097e6 50%, #004b7a 100%)',
    accentColor: '#0284c7',
    shadow: '0 8px 20px rgba(0,151,230,0.35)',
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #ffeaa7 0%, #fdcb6e 50%, #c47c00 100%)',
    accentColor: '#d97706',
    shadow: '0 8px 20px rgba(253,203,110,0.35)',
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #55efc4 0%, #00b894 50%, #00604b 100%)',
    accentColor: '#059669',
    shadow: '0 8px 20px rgba(0,184,148,0.35)',
  },
  {
     bg: 'radial-gradient(circle at 35% 30%, #e056fd 0%, #be2edd 50%, #6d0a87 100%)',
     accentColor: '#a21caf',
     shadow: '0 8px 20px rgba(190,46,221,0.35)',
  },
  {
    bg: 'radial-gradient(circle at 35% 30%, #ff9ff3 0%, #f368e0 50%, #a2128e 100%)',
    accentColor: '#db2777',
    shadow: '0 8px 20px rgba(243,104,224,0.35)',
  },
];

export default function ShinchanScene({ onBack, isMuted, onToggleMute, onNextTrigger }: ShinchanSceneProps) {
  // Candle states: True if lit, False if blown out
  const [candles, setCandles] = useState<boolean[]>([true, true, true, true, true]);
  const [allBlownOut, setAllBlownOut] = useState<boolean>(false);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState<number>(0);
  const [interactionNudge, setInteractionNudge] = useState<boolean>(true);
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  // High-intensity Confetti Canvas details
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiParticles = useRef<ConfettiParticle[]>([]);
  const fireworkRockets = useRef<FireworkRocket[]>([]);
  const fireworkSparks = useRef<FireworkSpark[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const shinchanQuotes = [
    "Uh-oh! Mom says I must be extra polite today... So Happy Birthday, DHANUSHKA! Let's watch Rohit hit a 100! 🏏✨",
    "Buri Buri! Action Mask says you are the greatest cricket and Hitman fan girl ever, Dhanushka! 🦸‍♂️🏆❤️",
    "Let's eat this yummy cake before Mitsy finds out! 🤫🍰",
    "Ooh, our bond and cricket love is stronger than Action Mask's laser beam! ♾️🚀",
    "Happy Birthday! May your day be filled with yummy Chocobi and lots of Rohit Sharma maximums! 🍫🏏🎉"
  ];

  // High-intensity confetti trigger (Dual-Cannon and center fountain burst)
  const triggerConfettiExplosion = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#ff6b81', '#70a1ff', '#eccc68', '#f368e0', '#be2edd'];
    const shapes: ('circle' | 'rect' | 'triangle')[] = ['circle', 'rect', 'triangle'];
    const count = 160;

    // Left Bottom Cannon
    for (let i = 0; i < count / 2; i++) {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.45;
      const speed = Math.random() * 16 + 12;
      confettiParticles.current.push({
        x: -10,
        y: canvas.height * 0.88,
        size: Math.random() * 7 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed * 1.3 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    // Right Bottom Cannon
    for (let i = 0; i < count / 2; i++) {
      const angle = -3 * Math.PI / 4 + (Math.random() - 0.5) * 0.45;
      const speed = Math.random() * 16 + 12;
      confettiParticles.current.push({
        x: canvas.width + 10,
        y: canvas.height * 0.88,
        size: Math.random() * 7 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed * 1.3 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    // Mid-air fountain burst
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      confettiParticles.current.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        size: Math.random() * 5 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
  };

  const launchFirework = (x: number, targetY: number) => {
    const colors = ['#ff4500', '#ff00ff', '#00ff00', '#00ffff', '#ffff00', '#ff1493', '#7cfc00', '#9400d3', '#ff4757', '#2ed573', '#1e90ff'];
    fireworkRockets.current.push({
      id: Math.random(),
      startX: x,
      x: x,
      y: window.innerHeight,
      targetY: targetY,
      speedY: -9 - Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: rsize(),
      trail: [],
    });
  };

  // Helper helper to randomize firework bullet head size
  function rsize() {
    return Math.random() * 1.2 + 1.8;
  }

  const explodeFirework = (x: number, y: number, baseColor: string) => {
    audio.playExplosionSound();
    
    // Create a circular burst with real sparks
    const numSparks = 60 + Math.floor(Math.random() * 30);
    const accentColors = [baseColor, '#ffffff', '#ffd700', '#ff69b4', '#00ffff', '#ff8c00', '#32cd32'];
    for (let i = 0; i < numSparks; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.2 + 1.2;
      fireworkSparks.current.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color: accentColors[Math.floor(Math.random() * accentColors.length)],
        size: Math.random() * 1.8 + 1,
        alpha: 1,
        decay: Math.random() * 0.012 + 0.010,
        gravity: 0.08,
      });
    }
  };

  // Initialize colorful balloons
  useEffect(() => {
    const initialBalloons = Array.from({ length: 12 }).map((_, idx) => ({
      id: idx,
      x: 5 + idx * 8,
      size: Math.random() * 15 + 40, // 3D Size
      speed: Math.random() * 1.2 + 0.60,
      color: BALLOON_GRADIENTS[idx % BALLOON_GRADIENTS.length],
      popped: false,
      delay: Math.random() * 3.5,
    }));

    setBalloons(initialBalloons);

    return () => {
      audio.stopAllBackgroundMusic();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
    };
  }, []);

  // Sync voice play/pause and mute/unmute states reactively
  useEffect(() => {
    if (isMuted) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
        activeAudioRef.current = null;
      }
    }
  }, [isMuted]);

  const getShinchanAudioElement = (): HTMLAudioElement | null => {
    const htmlAudio = document.getElementById('shinchan-audio') as HTMLAudioElement | null;
    if (!htmlAudio) {
      console.error('Shinchan audio element not found.');
      return null;
    }

    htmlAudio.src = '/music.mp3';
    htmlAudio.load();
    htmlAudio.currentTime = 0;
    htmlAudio.volume = 1;
    return htmlAudio;
  };

  // Set up high-performance confetti and particle fireworks simulation loop
  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial High-Intensity Confetti and Fireworks Blowout right on load
    const initialTimeout = setTimeout(() => {
      triggerConfettiExplosion();
      audio.playExplosionSound();

      // Launch 5 spectacular rockets staggered at start
      const w = window.innerWidth;
      const h = window.innerHeight;
      launchFirework(w * 0.18, h * (0.15 + Math.random() * 0.15));
      launchFirework(w * 0.38, h * (0.10 + Math.random() * 0.12));
      launchFirework(w * 0.58, h * (0.13 + Math.random() * 0.15));
      launchFirework(w * 0.78, h * (0.17 + Math.random() * 0.12));
    }, 450);

    // Continuously spawn random beautiful sky rockets!
    const fireworkInterval = setInterval(() => {
      const x = Math.random() * (window.innerWidth - 160) + 80;
      const targetY = Math.random() * (window.innerHeight * 0.40) + window.innerHeight * 0.08;
      launchFirework(x, targetY);

      if (Math.random() < 0.40) {
        setTimeout(() => {
          const x2 = Math.random() * (window.innerWidth - 160) + 80;
          const targetY2 = Math.random() * (window.innerHeight * 0.40) + window.innerHeight * 0.08;
          launchFirework(x2, targetY2);
        }, 600);
      }
    }, 2500);

    let frameId: number;
    const renderConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw Confetti particles
      const particles = confettiParticles.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.speedY += 0.26;
        p.speedX *= 0.985;
        p.speedY *= 0.985;

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'triangle') {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Update and draw Firework Rockets
      const rockets = fireworkRockets.current;
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) {
          r.trail.shift();
        }

        r.y += r.speedY;
        r.x += Math.sin(r.y * 0.06) * 0.8;

        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        if (r.trail.length > 0) {
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          for (let k = 1; k < r.trail.length; k++) {
            ctx.lineTo(r.trail[k].x, r.trail[k].y);
          }
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (r.y <= r.targetY || r.speedY >= 0) {
          explodeFirework(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update and draw Sparks
      const sparks = fireworkSparks.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];

        s.x += s.speedX;
        s.y += s.speedY;
        s.speedY += s.gravity;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        if (s.alpha > 0.4) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = s.color;
        }
        ctx.fill();
        ctx.restore();
      }

      frameId = requestAnimationFrame(renderConfetti);
    };

    renderConfetti();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialTimeout);
      clearInterval(fireworkInterval);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const handleBlowCandle = (idx: number) => {
    if (!candles[idx]) return;

    // Extinguish candle
    const updated = [...candles];
    updated[idx] = false;
    setCandles(updated);

    // Play pluck and launch sparkler
    audio.playKeypadSound(idx + 3);

    // Check if progress is complete
    if (updated.every(c => !c)) {
      setAllBlownOut(true);
      setInteractionNudge(false);
      audio.playExplosionSound();
      triggerConfettiExplosion(); // Extra beautiful burst!
      
      // Auto-replenish balloons to fill up the festive vibe!
      setBalloons(prev => prev.map(b => ({ ...b, popped: false })));
    }
  };

  const handlePopBalloon = (id: number, e: React.MouseEvent) => {
    setBalloons(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    audio.playPopSound();

    // Respawn balloon after 2.5 seconds at a new random horizontal position, so they float infinitely!
    setTimeout(() => {
      setBalloons(prev => prev.map(b => b.id === id ? {
        ...b,
        popped: false,
        x: Math.random() * 88 + 6,
        color: BALLOON_GRADIENTS[Math.floor(Math.random() * BALLOON_GRADIENTS.length)],
        delay: 0
      } : b));
    }, 2500);
  };

  const playRealVoice = () => {
    if (isMuted) {
      showNotification("Please unmute the audio first using the speaker button on top right! 🔊", "info");
      return;
    }

    const htmlAudio = getShinchanAudioElement();
    if (!htmlAudio) {
      return;
    }

    // Stop any previously playing voice audio to ensure absolutely no overlap
    if (!htmlAudio.paused) {
      htmlAudio.pause();
      htmlAudio.currentTime = 0;
    }
    if (activeAudioRef.current && activeAudioRef.current !== htmlAudio) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
    }

    // Stop background music temporarily so she can hear the voice clearly!
    audio.stopAllBackgroundMusic();
    audio.playPopSound();

    activeAudioRef.current = htmlAudio;
    const playPromise = htmlAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Failed to play Shinchan audio:", error);
      });
    }
  };

  const resetCandles = () => {
    setCandles([true, true, true, true, true]);
    setAllBlownOut(false);
    audio.playSuccessSound();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-[#fffef0] text-[#1c1917] overflow-y-auto p-4 md:p-6 select-none pb-12 leading-relaxed">
      
      {/* High-intensity Canvas-based Confetti celebration layer */}
      <canvas 
        ref={confettiCanvasRef} 
        className="fixed inset-0 pointer-events-none z-40 w-full h-full" 
      />

      {/* Custom Gorgeous Toast Banner instead of window.alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            className="fixed top-6 left-1/2 z-50 max-w-md w-[90%] bg-gradient-to-r from-[#ffeaa7] to-[#ffd32a] text-stone-950 border-4 border-[#1c1917] rounded-3xl p-4 flex items-center gap-3 shadow-[6px_6px_0px_rgba(28,25,23,1)] select-none pointer-events-auto"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#1c1917] flex items-center justify-center text-lg shadow-md animate-pulse">
              📢
            </div>
            <div className="flex-1 font-black text-xs leading-tight text-[#1c1917]">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-stone-900 font-extrabold text-base hover:scale-125 active:scale-90 transition-transform p-1 ml-auto"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Animated Floating Balloons in the background */}
      <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden pointer-events-none z-30">
        {balloons.map((b) => (
          !b.popped && (
            <motion.div
              key={b.id}
              className="absolute cursor-pointer pointer-events-auto flex flex-col items-center flex-nowrap"
              style={{
                width: b.size,
                height: b.size * 1.28,
                left: `${b.x}%`,
                background: b.color.bg,
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', // Real balloon teardrop shape
                boxShadow: b.color.shadow,
              }}
              initial={{ y: '105vh' }}
              animate={{
                y: '-25vh',
                rotate: [-6, 6, -6],
                x: [0, Math.sin(b.id) * 30, 0],
              }}
              whileHover={{ 
                scale: 1.15,
                rotate: 12,
                transition: { type: 'spring', stiffness: 300 }
              }}
              transition={{
                y: {
                  duration: 12 / b.speed,
                  repeat: Infinity,
                  delay: b.delay,
                  ease: 'linear',
                },
                rotate: {
                  duration: 4 + (b.id % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
                x: {
                  duration: 6 + (b.id % 2),
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              onClick={(e) => handlePopBalloon(b.id, e)}
            >
              {/* Glossy sunlight reflection bubble on top-left */}
              <div 
                className="absolute top-[8%] left-[12%] w-[25%] h-[15%] bg-white/50 rounded-full rotate-[-30deg] pointer-events-none filter blur-[0.4px]" 
              />
              <div 
                className="absolute top-[12%] left-[16%] w-[10%] h-[6%] bg-white/30 rounded-full rotate-[-30deg] pointer-events-none" 
              />

              {/* Balloon knot matching base color */}
              <div 
                className="w-3 h-2 mt-auto relative" 
                style={{
                  background: b.color.accentColor,
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  transform: 'translateY(1.5px)',
                }}
              />

              {/* Realistic curly hanging wavy string */}
              <svg 
                className="w-6 h-16 overflow-visible pointer-events-none opacity-50" 
                style={{ transform: 'translateY(1px)' }}
              >
                <path 
                  d="M12,0 C5,10 19,20 12,30 C5,40 19,50 12,60" 
                  fill="none" 
                  stroke="#a3a3a3" 
                  strokeWidth="1.2" 
                />
              </svg>
            </motion.div>
          )
        ))}
      </div>

      {/* Floating Sparkly Star & Hearts in light DOM */}
      <div className="absolute top-[15%] left-[8%] w-12 h-12 text-rose-400 animate-pulse pointer-events-none">❤️</div>
      <div className="absolute top-[35%] right-[6%] w-10 h-10 text-amber-400 animate-bounce pointer-events-none">⭐</div>
      <div className="absolute bottom-[30%] left-[5%] w-14 h-14 text-purple-400/60 animate-pulse pointer-events-none">🌸</div>

      {/* Dancing Intro Overlay Modal with animated dance and speech bubble */}
      <AnimatePresence>
        {showIntroModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1c1917]/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -30 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="w-full max-w-sm bg-[#fffef0] border-[6px] border-[#1c1917] rounded-[2.5rem] p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Confetti sprinkle top border */}
              <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-[#e63946] via-[#ffcc33] to-[#3b82f6]"></div>

              {/* Party Hat Label */}
              <div className="mt-4 bg-[#ffcc33] text-[#1c1917] font-black px-4 py-1.5 rounded-full border-2 border-[#1c1917] text-xs uppercase tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-4">
                BURI BURI ROOM! 🥳🎈
              </div>

              {/* Animated hip-wiggling Dancing Shinchan container */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1],
                  rotate: [-4, 4, -4] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.7,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 my-2 cursor-pointer relative"
              >
                <img 
                  src="https://i.pinimg.com/originals/2c/04/9d/2c049de1fe6eba9e8f761c8c59acff4d.jpg" 
                  alt="Shinchan dancing clip"
                  className="w-full h-full object-cover rounded-full border-4 border-[#1c1917] bg-white shadow-md"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Speech bubble */}
              <div className="bg-[#ff99bb]/10 border-2 border-[#1c1917] p-3.5 rounded-2xl relative mt-4 max-w-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] mb-6">
                <span className="text-xs md:text-sm font-bold text-stone-900 leading-relaxed block italic">
                  "Hey there, DHANUSHKA! Crayon Shinchan and Action Mask welcome you! Let's pop some floating balloons, blow out the candles, and hear my real birthday voice message! 🎂✨ Buri Buri!"
                </span>
                {/* Arrow */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#fffef0] border-r-2 border-b-2 border-[#1c1917] rotate-45"></div>
              </div>

              <button
                id="btn-intro-modal-close"
                onClick={() => {
                  setShowIntroModal(false);
                  audio.playSuccessSound();
                  playRealVoice();
                }}
                className="w-full py-4.5 bg-[#ffcc33] hover:bg-[#ffdd55] text-stone-950 font-black border-4 border-stone-950 rounded-2xl tracking-wide text-xs md:text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(28,25,23,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer select-none"
              >
                <span>LET'S SURPRISE ROOM! 🎉</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header controls with themed high-contrast colors */}
      <div className="w-full max-w-lg mt-2 flex items-center justify-between z-20 px-1 mb-4">
        <div className="flex items-center gap-2">
          {/* Comic retro back button to return to old pages */}
          <button
            id="btn-scene-back"
            onClick={onBack}
            className="text-xs px-3.5 py-1.5 rounded-full bg-white border-2 border-[#1c1917] text-[#1c1917] font-black hover:bg-[#ffcc33] active:scale-95 transition-all shadow-[2px_2px_0px_rgba(28,25,23,1)] flex items-center gap-1"
          >
            <span>← Back</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5 font-bold text-[#e63946] drop-shadow-sm ml-2">
            <Heart className="fill-[#e63946] text-[#e63946] animate-pulse" size={14} />
            <span className="font-sans text-[10px] tracking-wider uppercase">CUTE CELEBRATION</span>
          </div>
        </div>

        <div className="flex gap-2">
          {allBlownOut && (
            <button
              id="btn-candles-reset"
              onClick={resetCandles}
              className="text-xs px-3 py-1.5 rounded-full bg-[#ffcc33] border-2 border-[#1c1917] text-[#1c1917] font-black hover:bg-white hover:scale-105 active:scale-95 shadow-sm transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>Lit Again</span>
            </button>
          )}

          <button
            id="btn-scene-mute"
            onClick={onToggleMute}
            className="p-2 bg-white rounded-full border-2 border-[#1c1917] hover:bg-[#ffcc33]/25 transition-all text-[#e63946] shadow-sm active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Interactive Birthday Cake and Shinchan Layout */}
      <div className="w-full max-w-lg flex flex-col items-center gap-6 z-10 px-1">
        
        {/* Interactive Candle Blow Nudge Card in high-contrast comic strip format */}
        {interactionNudge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center p-3.5 rounded-2xl bg-[#ff99bb]/10 border-2 border-[#e63946] shadow-md leading-relaxed text-xs text-[#e63946] font-extrabold tracking-wide flex items-center justify-center gap-2 animate-pulse"
          >
            <AlertCircle size={15} />
            <span>👉 Tap on all candles to blow them out & unlock the blessing! 👈</span>
          </motion.div>
        )}

        {/* 🎂 DYNAMIC 3D MULTI-TIER CAKE STAGE 🎂 */}
        <div className="relative w-full h-[320px] flex flex-col items-center justify-center p-2 rounded-3xl bg-radial-gradient border-4 border-[#1c1917] bg-white shadow-xl overflow-hidden mb-4">
          <ThreeCake candles={candles} onBlowCandle={handleBlowCandle} />
        </div>

        {/* 👦 CHIBI SHINCHAN VECTOR & QUOTES STAGE 👦 */}
        <div className="w-full p-5 rounded-3xl bg-white border-4 border-[#ffcc33] shadow-lg flex items-center gap-4 relative overflow-visible">
          
          {/* Chibi Shinchan drawn with pure CSS/SVG (High Fidelity) */}
          <button
            id="btn-shinchan-avatar"
            onClick={() => setActiveQuoteIdx((prev) => (prev + 1) % shinchanQuotes.length)}
            className="relative w-28 h-28 shrink-0 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer pointer-events-auto"
            title="Tap Shinchan!"
          >
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-md select-none"
            >
              {/* Cute party hat */}
              <polygon points="50,1 32,25 68,25" fill="#e63946" />
              <circle cx="50" cy="1" r="3" fill="#ffcc33" />
              <polygon points="40,25 50,1 60,25" fill="#3b82f6" opacity="0.3" />
              <circle cx="42" cy="15" r="2.5" fill="#3b82f6" />
              <circle cx="58" cy="15" r="2.5" fill="#10b981" />

              {/* Chubby Head shape */}
              <path d="M25,50 C25,25 75,25 75,50 C75,58 76,64 70,68 C64,72 50,71 50,71 C50,71 36,72 30,68 C24,64 25,58 25,50 Z" fill="#FFE0B2" />
              
              {/* Chubby iconic right cheek bulb */}
              <ellipse cx="26" cy="56" rx="8" ry="7" fill="#FFE0B2" />
              <ellipse cx="74" cy="56" rx="6" ry="6" fill="#FFE0B2" />

              {/* Bold black eyebrows */}
              <path d="M33,38 C35,28 44,28 46,36" fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M54,36 C56,28 65,28 67,38" fill="none" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />

              {/* Round sparkling anime eyes */}
              <circle cx="39" cy="48" r="6" fill="#000" />
              <circle cx="37" cy="46" r="2" fill="#FFF" />
              
              <circle cx="61" cy="48" r="6" fill="#000" />
              <circle cx="59" cy="46" r="2" fill="#FFF" />

              {/* Cute rosy pink cheeks */}
              <ellipse cx="29" cy="58" rx="4.5" ry="3" fill="#FF4081" opacity="0.4" />
              <ellipse cx="71" cy="58" rx="4.5" ry="3" fill="#FF4081" opacity="0.4" />

              {/* Happy wide mouth */}
              <path d="M44,57 Q50,65 56,57 Z" fill="#D32F2F" />
              <path d="M47,59 Q50,63 53,59 Z" fill="#FF8A80" />

              {/* Tiny ears */}
              <ellipse cx="20" cy="50" rx="3.5" ry="5.5" fill="#FFE0B2" />
              <ellipse cx="80" cy="50" rx="3.5" ry="5.5" fill="#FFE0B2" />
            </svg>
            
            {/* Small glowing interactive prompt */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-[#e63946] text-white font-bold rounded px-1.5 py-0.5 tracking-wider animate-bounce uppercase whitespace-nowrap">
              HI! TAP ME
            </div>
          </button>

          {/* Interactive Speech Bubble */}
          <div className="flex-1 bg-[#fffdf0] border-2 border-[#ffcc33] p-4 rounded-2xl relative min-h-[75px] flex items-center justify-center">
            {/* Speech bubble arrow indicator */}
            <div className="absolute top-[45%] -left-3.5 border-t-[8px] border-t-transparent border-r-[15px] border-r-[#ffcc33] border-b-[8px] border-b-transparent after:content-[''] after:absolute after:top-[-7px] after:left-[2px] after:border-t-[7px] after:border-t-transparent after:border-r-[13px] after:border-r-[#fffdf0] after:border-b-[7px] after:border-b-transparent" />
            
            <AnimatePresence mode="wait">
              <motion.p
                key={activeQuoteIdx}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="text-[12.5px] md:text-sm font-bold text-stone-800 italic text-center w-full"
              >
                {shinchanQuotes[activeQuoteIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* 📜 GRAND BIRTHDAY WRAP-UP MESSAGES 📜 */}
        {/* Styled precisely according to Design HTML Step 3 with comic-yellow branding */}
        <motion.div
          animate={allBlownOut ? { scale: 1.02 } : {}}
          className="w-full p-6 md:p-8 bg-[#fffef0] rounded-3xl flex flex-col items-center border-[6px] border-[#ffcc33] text-stone-900 shadow-2xl overflow-hidden relative"
        >
          {/* Top-left design accent dot from Step 03 specification */}
          <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-[#ffcc33] opacity-60"></div>
          
          <div className="text-[10px] tracking-widest text-[#e63946] uppercase font-black mb-2 select-none">
            Final Page — Celebration 🎉
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#e63946] py-1 font-serif italic mb-4">
            Happy Birthday DHANUSHKA! ❤️
          </h2>

          <div className="space-y-4 text-xs md:text-sm text-stone-800 leading-relaxed font-sans mt-2 text-center">
            <p className="leading-relaxed font-black text-rose-700 italic">
              "Thank you for being my best friend, my partner-in-crime, my biggest supporter, and one of the most precious people in my life. 🫂💖"
            </p>
            
            <p className="text-stone-700 font-medium leading-relaxed">
              "May your life always be overfilled with happiness, success, love, laughter, and amazing cricket memories! 🎂✨🌸"
            </p>
          </div>

          {/* GRID OF SPECIAL IMAGES REQUESTED BY USER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6 bg-white/40 p-4 border-2 border-[#ffcc33] rounded-2xl">
            {/* Sticker 1: Crayon Shinchan Cute Stars Sticker (Custom Pin Image) */}
            <div className="bg-white p-3 border-4 border-[#1c1917] rounded-2xl shadow-md rotate-[-2deg] hover:rotate-0 transition-transform duration-300 flex flex-col items-center w-full">
              <div className="w-full aspect-square bg-[#fffef0] border-2 border-[#1c1917] rounded-xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://i.pinimg.com/originals/2c/04/9d/2c049de1fe6eba9e8f761c8c59acff4d.jpg"
                  alt="Shinchan Cute stars"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-2 text-center select-none">
                <span className="font-serif italic text-xs text-[#e63946] font-extrabold">Cute Shinchan & Stars ★</span>
              </div>
            </div>

            {/* Sticker 2: Rohit Sharma (The Hitman) Card */}
            <div className="bg-white p-3 border-4 border-[#1c1917] rounded-2xl shadow-md rotate-[2deg] hover:rotate-0 transition-transform duration-300 flex flex-col items-center w-full">
              <div className="w-full aspect-square bg-sky-50 border-2 border-[#1c1917] rounded-xl overflow-hidden flex items-center justify-center relative">
                <img
                  src="https://c.ndtvimg.com/2025-03/gbf3jmm8_rohit-sharma-afp_625x300_09_March_25.jpg"
                  alt="Rohit Sharma Hitman"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-1.5 left-1.5 bg-[#e63946] text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest border border-black shadow">
                  Hitman
                </div>
              </div>
              <div className="mt-2 text-center select-none">
                <span className="font-sans font-black text-[10px] uppercase tracking-wider text-stone-900">Captain Rohit Sharma ★</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE RETRO CASSETTE PLAYER WIDGET TO HEAR SHINCHAN VOICE */}
          <div 
            onClick={playRealVoice}
            className="mt-6 w-full bg-[#ff99bb]/10 border-4 border-[#1c1917] rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#ff99bb]/20 hover:scale-[1.02] active:scale-95 transition-all shadow-[4px_4px_0px_rgba(28,25,23,1)] select-none pointer-events-auto"
          >
            <div className="shrink-0 w-12 h-12 bg-[#ffcc33] border-2 border-[#1c1917] rounded-xl flex items-center justify-center text-xl shadow-inner animate-pulse">
              📻
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[10px] font-black tracking-widest text-[#e63946] font-mono">SHINCHAN RECODER TAPE</div>
              <div className="text-xs font-black text-stone-900 truncate">Play Real Shinchan Voice Wish 🎙️❤️</div>
              <p className="text-[9px] text-[#e63946] italic font-bold">Tap here & unmute to play real Crayon Shinchan audio message!</p>
            </div>
            <div className="shrink-0 bg-[#e63946] text-[#1c1917] font-black text-[10px] uppercase border-2 border-[#1c1917] px-3.5 py-1.5 rounded-full shadow-md animate-bounce">
              PLAY VOICE
            </div>
          </div>

          {/* DEDICATED HITMAN CHAMPION BIRTHDAY WISH BANNER */}
          <div className="mt-6 w-full bg-[#ffcc33]/20 border-4 border-[#ffcc33] rounded-2xl p-5 relative overflow-hidden flex flex-col items-center text-center">
            {/* Cricket design accent stamps */}
            <div className="absolute -top-1 -right-1 text-base opacity-40">🏏</div>
            <div className="absolute -bottom-1 -left-1 text-base opacity-40">🏆</div>
            
            <div className="text-[9px] font-black tracking-widest text-[#e63946] uppercase mb-1.5 font-mono select-none">
              ★ GOLDEN CHAMPION WISH ★
            </div>

            <p className="font-serif italic text-base md:text-lg font-extrabold text-stone-950 leading-snug">
              "Once again happy birthday <span className="text-[#e63946] not-italic font-black border-b-2 border-dashed border-[#e63946] pb-0.5">DHANUSHKA</span>!"
            </p>
            
            <div className="w-8 h-[2px] bg-[#e63946]/40 my-2.5"></div>

            <p className="text-[10px] font-black text-white bg-[#e63946] border-2 border-[#1c1917] px-3.5 py-1.5 rounded-full shadow-md tracking-wider uppercase">
              From hitman fan boy to hitman fan girl 🏏💙
            </p>
          </div>

          {/* Interactive forever bond display */}
          <div className="mt-6 w-full bg-white rounded-2xl p-4 border-2 border-[#ffcc33] text-center">
            <div className="text-xs font-bold text-[#e63946] mb-1 italic">"Our bond is forever"</div>
            <div className="text-2xl flex items-center justify-center gap-1">
              <span>♾️❤️</span>
            </div>
          </div>

          {/* NEXT SCREEN TRIGGER BUTTON */}
          {onNextTrigger && (
            <button
              onClick={onNextTrigger}
              className="mt-6 w-full py-4 bg-[#e63946] hover:bg-[#ff4d6d] text-white font-black text-sm uppercase tracking-wider rounded-2xl border-4 border-[#1c1917] shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:scale-[1.01] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="animate-spin text-[#ffcc33]" size={16} />
              <span>Step into the Magical 3D World! 🎂🌈</span>
              <Sparkles className="text-[#ffcc33]" size={16} />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
