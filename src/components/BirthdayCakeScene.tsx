import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../utils/audio";
import { Heart, Volume2, VolumeX, ArrowLeft, Award, Sparkles, Star, Edit3, Check, RefreshCw, PenTool, Download, ArrowDown, Lock } from "lucide-react";
import { toPng } from "html-to-image";

interface BirthdayCakeSceneProps {
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetToLock?: () => void;
}

interface RealBalloon {
  id: number;
  x: number; // side percentage (0-100)
  size: number; // width in pixels
  color: string;
  speed: number; // rise duration in seconds
  delay: number; // delay in seconds
  swayAmplitude: number; // side-to-side sway width
  score: number;
}

export default function BirthdayCakeScene({ onBack, isMuted, onToggleMute, onResetToLock }: BirthdayCakeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const giftCardRef = useRef<HTMLDivElement>(null);
  const greetingCardBuilderRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeTimeoutRef = useRef<any>(null);

  const [balloons, setBalloons] = useState<RealBalloon[]>([]);
  const [poppedCount, setPoppedCount] = useState<number>(0);
  const [showDirectVoiceNotice, setShowDirectVoiceNotice] = useState<boolean>(true);

  // Personalized Digital Greeting Card States
  const [signerName] = useState<string>("Your Best Friend & Brother");
  const [selectedWish] = useState<string>("Wishing the most amazing sister & favorite singer a wonderful birthday! May your magical voice keep bringing warm peace and joy to everyone. Honestly, ur my Spotify! 🎵💖");
  const [cardTheme, setCardTheme] = useState<'pink' | 'teal' | 'gold' | 'neon'>('pink');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownloadCard = async () => {
    if (!cardElementRef.current) return;
    setIsDownloading(true);
    try {
      audio.playPopSound();
      // Wait a bit to ensure smooth action feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const dataUrl = await toPng(cardElementRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Premium quality crisp render for typography and signatures
        backgroundColor: cardTheme === 'pink' ? '#1c0914' :
                        cardTheme === 'teal' ? '#061a18' :
                        cardTheme === 'gold' ? '#211603' : '#140821', // Dark gradients background match
        style: {
          transform: 'scale(1)',
          borderRadius: '24px',
        }
      });
      
      const link = document.createElement('a');
      const safeName = signerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') || 'friend';
      link.download = `dhanushka_birthday_card_${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Could not download image", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // High-fidelity balloon color gradients with metallic gloss
  const BALLOON_COLORS = [
    { bg: "radial-gradient(circle at 35% 35%, #ff7675, #d63031)", border: "#c23616", string: "#ff7675" },
    { bg: "radial-gradient(circle at 35% 35%, #74b9ff, #0984e3)", border: "#192a56", string: "#74b9ff" },
    { bg: "radial-gradient(circle at 35% 35%, #55efc4, #00b894)", border: "#006266", string: "#55efc4" },
    { bg: "radial-gradient(circle at 35% 35%, #ffeaa7, #fdcb6e)", border: "#b8860b", string: "#ffeaa7" },
    { bg: "radial-gradient(circle at 35% 35%, #a29bfe, #6c5ce7)", border: "#3c1a5b", string: "#a29bfe" },
    { bg: "radial-gradient(circle at 35% 35%, #ff9ff3, #f368e0)", border: "#b33939", string: "#ff9ff3" },
    { bg: "radial-gradient(circle at 35% 35%, #48dbfb, #0abde3)", border: "#222f3e", string: "#48dbfb" },
    { bg: "radial-gradient(circle at 35% 35%, #ff9f43, #ee5253)", border: "#5f27cd", string: "#ff9f43" }
  ];

  // Helper to generate a realistic balloon configuration
  const makeRandomBalloon = (id: number, startAtBottom = false): RealBalloon => {
    return {
      id,
      x: Math.random() * 85 + 7, // Leave nice side margin
      size: Math.random() * 25 + 40, // 40px to 65px width for fantastic variance
      color: JSON.stringify(BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]),
      speed: Math.random() * 6 + 7, // float up duration from bottom to top (7s to 13s)
      delay: startAtBottom ? Math.random() * 2 : Math.random() * 8, // staggered onset delays
      swayAmplitude: Math.random() * 40 + 30, // side-to-side drift offset in px
      score: Math.floor(Math.random() * 10) + 1,
    };
  };

  // Populate floating balloons on mount
  useEffect(() => {
    const initialBalloons = Array.from({ length: 16 }, (_, i) => makeRandomBalloon(i, false));
    setBalloons(initialBalloons);

    // Play sweet magical shimmer background music on entrance beautifully
    if (!isMuted) {
      audio.playMagicalShimmerMusic();
    }

    return () => {
      audio.stopAllBackgroundMusic();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
    };
  }, []);

  // Sync background sound reactively to mute/unmute state changes
  useEffect(() => {
    if (isMuted) {
      audio.stopAllBackgroundMusic();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
    } else {
      audio.playMagicalShimmerMusic();
    }
  }, [isMuted]);

  // Handle tap-and-pop with realistic popping sound and feedback
  const popBalloon = (id: number) => {
    audio.playPopSound();
    setPoppedCount((prev) => prev + 1);

    // Replace the popped balloon with a brand new one climbing from the bottom
    setBalloons((prev) =>
      prev.map((b) => (b.id === id ? makeRandomBalloon(id, true) : b))
    );
  };

  // Play Crayon Shinchan Authentic Audio voice wish
  const playVoiceWish = () => {
    if (isMuted) {
      audio.toggleMute(); // Auto-unmute for immediate enjoyment
    }

    // Absolutely clear any running audio overlapping
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
    }

    audio.stopAllBackgroundMusic();
    audio.playPopSound();

    const customVoiceUrl = `/api/proxy-audio?id=1Qw1Z2Ps8C5eQDWxrBR7ZU9WCbhDKc6Xs&_cb=${Date.now()}`;
    const speech = new Audio(customVoiceUrl);
    activeAudioRef.current = speech;
    speech.volume = 0.95;

    speech
      .play()
      .then(() => {
        // Safe timeout cleanup
        activeTimeoutRef.current = setTimeout(() => {
          activeAudioRef.current = null;
        }, 7600);
      })
      .catch((err) => {
        console.log("Playing primary Google Drive speech failed, trying cached fallback:", err);
        const fallbackSpeech = new Audio("https://www.myinstants.com/media/sounds/sinchan_1.mp3");
        activeAudioRef.current = fallbackSpeech;
        fallbackSpeech.volume = 0.90;
        fallbackSpeech.play().then(() => {
          activeTimeoutRef.current = setTimeout(() => {
            activeAudioRef.current = null;
          }, 4200);
        }).catch(() => {
          activeAudioRef.current = null;
        });
      });
  };

  // Three.js 3D Birthday Cake Rendering Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 1. Create WebGL THREE.js Scene
    const scene = new THREE.Scene();

    // 2. Camera perspective matching user's exact specification but dynamically positioned for responsiveness
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    camera.position.y = 2.5;

    // 3. WebGL Renderer with custom anti-aliasing & transparent background to mix perfectly with beautiful CSS gradient
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 4. Lights - Warm ambient and cinematic spotlight focused on the cake layers
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.45); // lower general light for higher dramatic focus
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 12, 6);
    scene.add(directionalLight);

    // Warm golden Spotlight pointing from top-front to make the frosting and colors shine
    const spotLight = new THREE.SpotLight(0xff9f43, 8, 25, Math.PI / 3, 0.5, 1);
    spotLight.position.set(0, 10, 4);
    scene.add(spotLight);

    // 5. Cake Group Assembly of the 3 Multi-Tier Layers exactly using User's dimensions
    const cakeGroup = new THREE.Group();

    // Bottom Layer: Cylinder (radiusTop=3, radiusBottom=3, height=1.5, segments=32)
    // Metallic Minty Matcha Green
    const bottomCake = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 1.5, 32),
      new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        roughness: 0.3,
        metalness: 0.15,
      })
    );
    cakeGroup.add(bottomCake);

    // Middle Layer: Cylinder (radiusTop=2.2, radiusBottom=2.2, height=1.3, segments=32)
    // position.y = 1.4, Forest Cream Green
    const middleCake = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 1.3, 32),
      new THREE.MeshStandardMaterial({
        color: 0x27ae60,
        roughness: 0.35,
        metalness: 0.1,
      })
    );
    middleCake.position.y = 1.4;
    cakeGroup.add(middleCake);

    // Top Layer: Cylinder (radiusTop=1.5, radiusBottom=1.5, height=1, segments=32)
    // position.y = 2.6, Emerald Lime Green
    const topCake = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 1, 32),
      new THREE.MeshStandardMaterial({
        color: 0x58d68d,
        roughness: 0.25,
        metalness: 0.08,
      })
    );
    topCake.position.y = 2.6;
    cakeGroup.add(topCake);

    // Add Sparkles / Sprinkles to enhance top of the Three.js Cake
    const sprinkleColors = [0xffffff, 0xff007f, 0xffea00, 0x00e5ff, 0xa29bfe];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 1.2 * Math.sqrt(Math.random()); // distribute within upper layer
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const sprinkle = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshStandardMaterial({
          color: sprinkleColors[i % sprinkleColors.length],
          roughness: 0.1,
        })
      );
      sprinkle.position.set(x, 3.12, z);
      cakeGroup.add(sprinkle);
    }

    // 6. Candles & Flickering Flames (exactly 5 as requested by user's template)
    const flamesArray: THREE.Mesh[] = [];
    const candleLightsArray: THREE.PointLight[] = [];
    const glowAurasArray: THREE.Mesh[] = [];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      // Candle mesh: Cylinder (0.08, 0.08, 0.8, 16) with standard white beeswax texture
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
        })
      );
      candle.position.set(x, 3.4, z);
      cakeGroup.add(candle);

      // Flame mesh: Cone (0.08, 0.2, 12, components) with custom emissive golden glows
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.2, 12),
        new THREE.MeshPhongMaterial({
          color: 0xffdd55,
          emissive: 0xff7700,
          emissiveIntensity: 1.5,
        })
      );
      flame.position.set(x, 3.9, z);
      cakeGroup.add(flame);
      flamesArray.push(flame);

      // Warm local PointLight right at the flame center to cast glowing yellow-orange rays on the cake!
      const pointLight = new THREE.PointLight(0xff9900, 2.5, 4.5, 1.2);
      pointLight.position.set(x, 3.95, z);
      cakeGroup.add(pointLight);
      candleLightsArray.push(pointLight);

      // Add Semi-transparent additive-blended Glow Halo around the candle flame for a physical light bloom effect
      const glowGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(x, 3.9, z);
      cakeGroup.add(glowMesh);
      glowAurasArray.push(glowMesh);
    }

    scene.add(cakeGroup);

    // Back to nice position camera view
    camera.position.z = 8.5;
    camera.position.y = 2.0;

    // Gentle camera tilt / orbit controls with subtle user mouse interaction
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 7. Render/Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Constantly rotate the beautiful cake group exactly as requested! (cake.rotation.y += 0.01)
      cakeGroup.rotation.y += 0.01;

      // Add neat interactive responsive mouse tilting
      camera.position.x += (targetX * 3.5 - camera.position.x) * 0.05;
      camera.position.y += (2.0 - targetY * 2.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 1.8, 0);

      const elapsedTime = clock.getElapsedTime();

      // Flicker lit candle flames to represent real blowing fire wind!
      flamesArray.forEach((flame, index) => {
        const flicker = 1.0 + Math.sin(elapsedTime * 24 + index * 9) * 0.15;
        flame.scale.set(flicker, flicker + Math.cos(elapsedTime * 18 + index * 7) * 0.1, flicker);

        // Flicker corresponding PointLight intensity dynamically as well!
        const light = candleLightsArray[index];
        if (light) {
          light.intensity = 2.0 + Math.sin(elapsedTime * 28 + index * 5) * 0.6;
        }

        // Dynamically rotate and pulsate glow halo size/opacity for a realistic fire emission bloom effect
        const glow = glowAurasArray[index];
        if (glow) {
          const pulsate = 1.0 + Math.sin(elapsedTime * 16 + index * 8) * 0.14;
          glow.scale.set(pulsate, pulsate, pulsate);
          if (glow.material && !Array.isArray(glow.material)) {
            (glow.material as THREE.MeshBasicMaterial).opacity = 0.32 + Math.sin(elapsedTime * 24 + index * 6) * 0.1;
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // 8. Responsive Container Size Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full min-h-screen relative overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#090514] via-[#0d0a21] to-[#120f2b] flex flex-col items-center pb-12">
      
      {/* 🎈 REAL FLOATING BALLOONS CLIMBING FROM THE BOTTOM 🎈 */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {balloons.map((balloon) => {
          const config = JSON.parse(balloon.color);
          return (
            <motion.div
              key={balloon.id}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: `${balloon.x}%`,
                bottom: -120, // start completely below viewport
                width: balloon.size,
                height: balloon.size * 1.25,
              }}
              initial={{ y: 0, x: 0, rotate: 0 }}
              animate={{
                // Ascend from below the viewport up to above the top, with dynamic horizontal sways
                y: [0, -window.innerHeight - 300],
                x: [
                  0,
                  Math.sin(balloon.id) * balloon.swayAmplitude,
                  Math.cos(balloon.id * 1.5) * (balloon.swayAmplitude + 15),
                  Math.sin(balloon.id * 2) * balloon.swayAmplitude,
                  0
                ],
                rotate: [0, 4, -4, 5, -5, 0]
              }}
              transition={{
                duration: balloon.speed,
                delay: balloon.delay,
                repeat: Infinity,
                ease: "linear"
              }}
              onClick={() => popBalloon(balloon.id)}
            >
              {/* Detailed High-Quality SVG Balloon Layer */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 130"
                className="overflow-visible drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
              >
                <defs>
                  {/* Glossy Radial highlights with border edges */}
                  <radialGradient id={`glow-${balloon.id}`} cx="35%" cy="30%" r="55%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="35%" stopColor={config.string} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={config.border} />
                  </radialGradient>
                </defs>

                {/* Main oval balloon body */}
                <ellipse
                  cx="50"
                  cy="50"
                  rx="40"
                  ry="48"
                  fill={`url(#glow-${balloon.id})`}
                  stroke={config.border}
                  strokeWidth="1.5"
                />

                {/* Subtle light reflections shine on side of the balloon */}
                <path
                  d="M 32 18 A 20 20 0 0 1 20 40 A 5 5 0 0 1 20 30"
                  fill="white"
                  opacity="0.3"
                />

                {/* Little triangle tie at the bottom of the balloon */}
                <polygon
                  points="50,97 44,105 56,105"
                  fill={config.border}
                />

                {/* Realistically waving golden balloon trailing string line representation */}
                <path
                  d="M 50 104 Q 45 112, 50 120 T 47 132"
                  fill="none"
                  stroke={config.string}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              </svg>
            </motion.div>
          );
        })}
      </div>

      {/* ⭐ FLOATING RETRO DECORATIVE STARS/COSMIC STARDUST ⭐ */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[12%] left-[8%] animate-pulse text-yellow-300 opacity-40"><Star fill="currentColor" size={24} /></div>
        <div className="absolute top-[28%] right-[12%] animate-pulse delay-500 text-pink-400 opacity-30"><Star fill="currentColor" size={16} /></div>
        <div className="absolute bottom-[24%] left-[16%] animate-pulse delay-1000 text-teal-300 opacity-25"><Star fill="currentColor" size={20} /></div>
        <div className="absolute top-[55%] left-[64%] animate-ping text-purple-400 opacity-20"><Star size={12} /></div>
      </div>

      {/* 🏆 NAVIGATION & MUTE RETRO HEADER 🏆 */}
      <div className="w-full max-w-5xl px-4 py-4 flex items-center justify-between z-30 pointer-events-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-white text-stone-900 border-2 border-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-[#ffcc33] hover:translate-y-[-1px] active:translate-y-[2px] transition-all"
        >
          <ArrowLeft size={14} className="stroke-[3px]" />
          <span>Go Back</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Popping Score Board */}
          <div className="bg-black/40 border border-[#ffcc33] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
            <Award className="text-[#ffcc33] animate-bounce" size={14} />
            <span className="font-mono text-[10.5px] font-bold text-white tracking-widest uppercase">
              Balloons Popped: <span className="text-[#ffcc33] font-black">{poppedCount}</span>
            </span>
          </div>

          {/* Sound Controller Button */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-white rounded-full border-2 border-black text-[#e63946] shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-[#ffcc33] active:translate-y-[1px] transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={15} className="stroke-[2.5px]" /> : <Volume2 size={15} className="stroke-[2.5px]" />}
          </button>
        </div>
      </div>

      {/* 🚀 GLORIOUS THREE.JS 3D CANVAS STAGE 🚀 */}
      <div className="w-full max-w-4xl relative flex flex-col items-center justify-center z-13 px-4">
        {/* Three.JS Container Wrapper */}
        <div 
          ref={containerRef} 
          className="w-full h-[280px] xs:h-[340px] sm:h-[400px] md:h-[460px] relative cursor-grab active:cursor-grabbing rounded-2xl"
          id="canvas-3d-glorious-cake"
        />

        {/* Floating Design overlay to describe rotation */}
        <div className="absolute bottom-4 inset-x-0 w-full flex justify-center pointer-events-none z-20">
          <div className="bg-[#ffcc33] text-stone-950 px-4 py-2 border-2 border-black rounded-2xl shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wide animate-pulse pointer-events-auto">
            <Sparkles size={12} className="animate-spin text-stone-900" />
            <span>🌌 drag horizontally to rotate cake! 🌌</span>
          </div>
        </div>
      </div>

      {/* ⏬ INTUITIVE GLOWING SCROLL BUTTON FOR CONVENIENT USER NAVIGATION ⏬ */}
      <div className="mt-4 mb-6 z-30 flex justify-center">
        <button
          onClick={() => {
            greetingCardBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-full border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-emerald-400 active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 group"
        >
          <span>See card builder & message ↓</span>
          <span className="inline-block animate-bounce group-hover:translate-y-0.5">👇</span>
        </button>
      </div>

      {/* 📻 SHINCHAN CASSETTE player overlay at the bottom 📻 */}
      <div className="w-full max-w-lg px-4 pb-8 z-30 pointer-events-auto mt-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#ffeaa7] border-4 border-black p-4 rounded-3xl shadow-[5px_5px_0px_rgba(0,0,0,1)] flex flex-col gap-3 relative overflow-hidden"
        >
          {/* Tape shiny texture circles */}
          <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-[#fdcb6e] opacity-30 pointer-events-none" />

          {/* Notice Banner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📢</span>
              <span className="font-sans text-[11px] font-black uppercase text-stone-900 tracking-wider">
                Shinchan's Star Record
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
              Click to Play
            </span>
          </div>

          <div className="flex items-center gap-4 bg-white/70 p-3 rounded-2xl border-2 border-black/10">
            <div className="w-11 h-11 rounded-xl bg-orange-400 border-2 border-black flex items-center justify-center text-xl shadow-inner animate-pulse">
              🎤
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-stone-950 font-black text-xs">"Play Real Shinchan Voice Wish"</span>
              <p className="text-[10px] text-stone-800 font-bold italic mt-0.5 leading-tight">
                Tap the recorder to play his voice wish directly on this 3D stage!
              </p>
            </div>
            <button
              onClick={playVoiceWish}
              className="px-3.5 py-2 bg-[#ff7675] hover:bg-[#ff4757] text-white border-2 border-black rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] transition-all shrink-0"
            >
              Play Tape
            </button>
          </div>
        </motion.div>
      </div>

      {/* 🎨 INTERACTIVE PERSONALIZED DIGITAL GREETING CARD SECTION 🎨 */}
      <div ref={greetingCardBuilderRef} className="w-full max-w-lg px-4 pb-8 z-30 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1635]/95 border-3 border-[#55efc4] p-5 rounded-3xl shadow-[5px_5px_0px_rgba(0,0,0,1)] text-left flex flex-col gap-4 relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <span className="text-2xl animate-bounce">🎨</span>
            <div>
              <h3 className="font-sans text-[11.5px] font-black uppercase text-[#55efc4] tracking-widest">
                Your Birthday Gift Card Design
              </h3>
              <p className="text-[10px] text-stone-300 font-medium">
                Choose a beautiful color design theme for your card, then download it below!
              </p>
            </div>
          </div>

          {/* Theme selection */}
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-4 gap-2">
              {(['pink', 'teal', 'gold', 'neon'] as const).map((t) => {
                const themeNames = { pink: 'Rose Spark', teal: 'Mint Wave', gold: 'Amber Sun', neon: 'Cosmic Sky' };
                const themeColors = {
                  pink: 'bg-rose-500 border-rose-300',
                  teal: 'bg-teal-500 border-teal-300',
                  gold: 'bg-amber-500 border-amber-300',
                  neon: 'bg-purple-600 border-purple-400',
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      audio.playPopSound();
                      setCardTheme(t);
                    }}
                    className={`py-2 px-1 text-[10px] font-black uppercase tracking-tight rounded-xl border-2 text-white flex flex-col items-center gap-1 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:scale-105 ${themeColors[t]} ${cardTheme === t ? 'ring-2 ring-white scale-105 border-white shadow-none translate-y-[2px]' : 'opacity-75'}`}
                  >
                    <span className="text-sm">
                      {t === 'pink' && '🌸'}
                      {t === 'teal' && '🌊'}
                      {t === 'gold' && '☀️'}
                      {t === 'neon' && '🌌'}
                    </span>
                    <span className="text-[8px] leading-tight text-center">{themeNames[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Captured card container - elements inside this ref will be downloaded */}
          <div
            ref={cardElementRef}
            className={`p-6 rounded-3xl border-3 text-center flex flex-col gap-5 relative overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.8)] ${
              cardTheme === 'pink' ? 'bg-gradient-to-br from-pink-950 via-rose-950 to-purple-950 border-rose-400' :
              cardTheme === 'teal' ? 'bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950 border-teal-400' :
              cardTheme === 'gold' ? 'bg-gradient-to-br from-amber-950 via-yellow-950 to-orange-950 border-amber-400' :
              'bg-gradient-to-br from-purple-950 via-fuchsia-950 to-indigo-950 border-fuchsia-400'
            }`}
          >
            {/* Decorative sparkles & details */}
            <div className="absolute top-3 left-3 text-white/20 animate-ping text-xs">★</div>
            <div className="absolute top-4 right-4 text-white/30 animate-pulse">✨</div>
            <div className="absolute bottom-4 left-4 text-white/20 animate-pulse">✨</div>
            <div className="absolute bottom-3 right-3 text-white/20 animate-ping text-xs">★</div>
            
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-3xl animate-pulse">🎉</span>
              <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${
                cardTheme === 'pink' ? 'text-rose-300' :
                cardTheme === 'teal' ? 'text-teal-300' :
                cardTheme === 'gold' ? 'text-amber-300' :
                'text-fuchsia-300'
              }`}>
                ★ Personalized Card ★
              </span>
              <h4 className="font-playfair font-bold text-lg text-white mt-1">
                Happy Birthday, Dhanushka!
              </h4>
            </div>

            {/* Card Divider Ribbon */}
            <div className="w-full flex items-center justify-center gap-2 my-1">
              <div className="h-[1px] flex-1 bg-white/20" />
              <Heart size={14} className={`fill-current ${
                cardTheme === 'pink' ? 'text-rose-400' :
                cardTheme === 'teal' ? 'text-teal-400' :
                cardTheme === 'gold' ? 'text-amber-400' :
                'text-fuchsia-400'
              }`} />
              <div className="h-[1px] flex-1 bg-white/20" />
            </div>

            {/* Wish content text */}
            <p className="font-sans text-xs text-stone-200 font-bold leading-relaxed px-2 italic">
              "{selectedWish}"
            </p>

            {/* Elegant script signature signoff */}
            <div className="flex flex-col items-center mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 font-bold">
                Signed with lots of love,
              </span>
              <div 
                className={`font-cursive text-3xl sm:text-4xl mt-1.5 tracking-wide px-4 py-1 select-none transform -rotate-1 drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] ${
                  cardTheme === 'pink' ? 'text-rose-300' :
                  cardTheme === 'teal' ? 'text-teal-300' :
                  cardTheme === 'gold' ? 'text-amber-300' :
                  'text-fuchsia-300'
                }`}
                style={{ fontFamily: "'Dancing Script', cursive" }}
              >
                {signerName}
              </div>
            </div>
          </div>

          {/* Action Button Controls (outside cardElementRef, won't be visible in the saved card image!) */}
          <div className="w-full mt-1 flex flex-col gap-2">
            {/* Download button */}
            <button
              type="button"
              onClick={handleDownloadCard}
              disabled={isDownloading}
              className={`w-full py-3 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                isDownloading 
                  ? 'bg-gray-700/50 border-gray-600 text-gray-400 cursor-wait' 
                  : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.35)] active:translate-y-[1px]'
              }`}
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={14} className="animate-pulse" />
              )}
              <span>{isDownloading ? 'Saving Card...' : 'Save & Download Card PNG 📥'}</span>
            </button>

            {/* Scroll to Lock Option Button */}
            <button
              type="button"
              onClick={() => {
                audio.playPopSound();
                giftCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-white/20 active:translate-y-[1px]"
            >
              <ArrowDown size={11} className="animate-bounce" />
              <span>Scroll to Lock Option ↓</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* 💝 WARM FRIEND & BROTHER GIFT DEDICATION & LOCK TRIGGER 💝 */}
      <div ref={giftCardRef} className="w-full max-w-lg px-4 pb-12 z-30 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-gradient-to-r from-teal-500/20 via-emerald-500/20 to-teal-500/20 border-3 border-[#ffcc33] p-5 rounded-3xl shadow-[6px_6px_0px_rgba(0,0,0,1)] bg-neutral-900/90 text-center flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Decorative small stars inside */}
          <div className="absolute top-2 left-2 text-[#ffcc33]/40 animate-pulse text-xs">★</div>
          <div className="absolute bottom-2 right-2 text-[#ffcc33]/40 animate-pulse text-xs">★</div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl animate-bounce">🎁</span>
            <span className="text-[11px] font-black uppercase text-[#ffcc33] tracking-widest font-mono">
              ★ A Sibling's Gift ★
            </span>
          </div>

          <p className="font-sans text-xs text-stone-200 font-bold leading-relaxed px-1">
            "I hope this simple, magical gift from your friend & brother brings a beautiful, glowing smile to your face today and always! Stay blessed, Sister Dhanushka!"
          </p>

          <p className="text-[10px] text-[#ff7675] font-mono font-black uppercase tracking-wider animate-pulse">
            💖 Pure Joy • Infinite Smiles • Magical Memories 💖
          </p>

          {onResetToLock && (
            <button
              onClick={() => {
                audio.playSuccessSound();
                onResetToLock();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl border-3 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
            >
              <span>🔒 Lock & Start Again</span>
            </button>
          )}
        </motion.div>
      </div>

    </div>
  );
}
