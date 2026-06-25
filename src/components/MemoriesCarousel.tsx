import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, Heart, BookOpen, Volume2, VolumeX, ArrowRight, RotateCcw } from 'lucide-react';
import { audio } from '../utils/audio';

interface MemoriesCarouselProps {
  onBack: () => void;
  onNextTrigger: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface MemoryCard {
  id: number;
  title: string;
  caption: string;
  image: string;
  emoji: string;
  accent: string;
  stickerText?: string;
}

const MEMORIES: MemoryCard[] = [
  {
    id: 1,
    title: "1. The First Spark ⚡",
    caption: "",
    image: "/images/pic1.jpeg",
    emoji: "🌸",
    accent: "from-pink-400 to-rose-400",
    stickerText: "OUR BEGINNING"
  },
  {
    id: 2,
    title: "2. Late Night Whispers 🌙",
    caption: "",
    image: "/images/pic2.jpeg",
    emoji: "☕",
    accent: "from-indigo-400 to-purple-400",
    stickerText: "COZY TALKS"
  },
  {
    id: 3,
    title: "3. Little Adventures Together 🎒",
    caption: "",
    image: "/images/pic3.jpeg",
    emoji: "🌧️",
    accent: "from-teal-400 to-emerald-400",
    stickerText: "SWEET ROAD"
  },
  {
    id: 4,
    title: "4. Your Adorable Smile ✨",
    caption: "",
    image: "/images/pic4.jpeg",
    emoji: "💖",
    accent: "from-amber-300 to-rose-400",
    stickerText: "YOUR LAUGHTER"
  },
  {
    id: 5,
    title: "5. The Endless Promise 🤝",
    caption: "",
    image: "/images/pic5.jpeg",
    emoji: "🌟",
    accent: "from-rose-400 to-amber-300",
    stickerText: "FOREVER & ALWAYS"
  }
];

export default function MemoriesCarousel({ onBack, onNextTrigger, isMuted, onToggleMute }: MemoriesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [maxIndexReached, setMaxIndexReached] = useState<number>(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastSlideAudioPlayed = React.useRef(false);

  const handleNext = () => {
    if (currentIndex < MEMORIES.length - 1) {
      setDirection('next');
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (nextIdx > maxIndexReached) {
        setMaxIndexReached(nextIdx);
      }
      audio.playKeypadSound(nextIdx); // Play an elegant key pluck for slide change
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection('prev');
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      audio.playKeypadSound(prevIdx);
    }
  };

  // Click on image spawns interactive bubble heart
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newHeart = { id: Date.now(), x, y };

    setFloatingHearts(prev => [...prev, newHeart]);
    audio.playKeypadSound(currentIndex + 4); // Tiny melodic tune on tap

    // Auto cleanup heart
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== newHeart.id));
    }, 1500);
  };

  const isCompleted = maxIndexReached >= MEMORIES.length - 1;

  // When the user reaches the final memory card, play the Shinchan voice message (if not muted).
  React.useEffect(() => {
    if (!isCompleted) {
      lastSlideAudioPlayed.current = false;
      return;
    }

    if (lastSlideAudioPlayed.current) return;

    // Only play if the app is not muted
    if (isMuted) return;

    try {
      const htmlAudio = document.getElementById('shinchan-audio') as HTMLAudioElement | null;
      if (htmlAudio) {
        // Stop any background synth music for clarity
        audio.stopAllBackgroundMusic();
        htmlAudio.src = '/music.mp3';
        htmlAudio.currentTime = 0;
        const p = htmlAudio.play();
        if (p && p.catch) p.catch((err) => console.error('Failed to play shinchan audio on last slide', err));
        lastSlideAudioPlayed.current = true;
      }
    } catch (e) {
      console.error('Error attempting to play shinchan audio on last slide', e);
    }
  }, [isCompleted, isMuted]);

  // Variants for beautiful Polaroid stacking animation
  const slideVariants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? 320 : -320,
      opacity: 0,
      rotate: dir === 'next' ? 6 : -6,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: currentIndex % 2 === 0 ? -2 : 2,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.25 },
        rotate: { type: "spring", stiffness: 150 }
      }
    },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? -320 : 320,
      opacity: 0,
      rotate: dir === 'next' ? -6 : 6,
      scale: 0.95,
      transition: { duration: 0.25 }
    })
  };

  const currentMemory = MEMORIES[currentIndex];

  return (
    <div id="memories_scrapbook_container" className="relative w-full h-full flex flex-col items-center bg-[#0d0714] text-white p-4 md:p-6 overflow-hidden">
      {/* Background Star Ambient Dust */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#3b1c5c_0%,_#0d0714_80%)] opacity-70 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%221%22%20fill%3D%22%23fff%22%20fill-opacity%3D%220.08%22%20/%3E%3C/svg%3E')] pointer-events-none z-0" />

      {/* Decorative Pastel Constellations */}
      <div className="absolute top-20 left-10 md:left-24 w-12 h-12 bg-pink-500/10 rounded-full blur-xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-20 right-10 md:right-24 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none animate-pulse duration-4000" />

      {/* Header Bar */}
      <header className="w-full max-w-lg z-10 flex items-center justify-between mt-2 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-pink-300 transition-transform active:scale-90"
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
          </button>
        </div>
      </header>

      {/* Applet Title Card */}
      <div className="text-center z-10 max-w-md px-2 flex flex-col items-center select-none">
        <div className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-400/30 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest text-pink-300 mb-2 animate-pulse">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Milestone Memories</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 tracking-tight font-serif italic mb-1 drop-shadow-[0_2px_10px_rgba(244,63,94,0.15)]">
          Dhanushka's Scrapbook
        </h1>
        <p className="text-[11px] md:text-xs text-stone-300 max-w-xs leading-relaxed">
          Swipe or tap the arrows to review our special milestones! Tap on the photo to spawn sweet magical hearts ❤️
        </p>
      </div>

      {/* Main Memory Polaroid Stage */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center relative mt-2 mb-4 z-10">
        
        {/* Progress Dots Indicator at top of container */}
        <div className="flex gap-2.5 justify-center mb-4 select-none z-10">
          {MEMORIES.map((m, idx) => {
            const isSelected = idx === currentIndex;
            const isRead = idx <= maxIndexReached;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setDirection(idx > currentIndex ? 'next' : 'prev');
                  setCurrentIndex(idx);
                  if (idx > maxIndexReached) setMaxIndexReached(idx);
                  audio.playKeypadSound(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isSelected 
                    ? "w-6 bg-gradient-to-r from-pink-400 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
                    : isRead 
                      ? "w-2 bg-pink-400/60" 
                      : "w-2 bg-stone-700 hover:bg-stone-600"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Polaroid Card Area */}
        <div className="relative w-[310px] sm:w-[335px] h-[390px] sm:h-[405px] flex items-center justify-center">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentMemory.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute w-full h-full bg-[#faf6f0] text-stone-950 rounded-[20px] p-4 flex flex-col border-[6px] border-[#ede0ce] shadow-[0_15px_35px_rgba(13,7,20,0.5),_inset_0_0_12px_rgba(212,163,115,0.15)] overflow-hidden cursor-pointer"
            >
              {/* Polaroid Decorative Tape */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-yellow-200/50 backdrop-blur-sm border-b border-yellow-300/30 -translate-y-1 rotate-[-2deg] flex items-center justify-center text-[7px] font-mono tracking-widest text-amber-800 font-bold mix-blend-multiply pointer-events-none select-none">
                ★ SWEET MEMORY ★
              </div>

              {/* Photo Area with Loading State and Click Spawner */}
              <div 
                onClick={handleImageClick}
                className="relative flex-1 w-full rounded-lg bg-stone-100 border border-[#e5d5be] overflow-hidden select-none"
              >
                {/* Sticker overlay removed to keep image unobstructed */}

                <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs shadow animate-bounce">
                  {currentMemory.emoji}
                </div>

                {
                  // For the 2nd and 3rd photos, slightly adjust positioning/scale
                  // so faces and heads fit naturally in the frame without changing layout.
                  (currentMemory.id === 2 || currentMemory.id === 3) ? (
                    <div className="w-full h-full overflow-hidden">
                      <img
                        src={currentMemory.image}
                        alt={currentMemory.title}
                        className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                        style={{
                          // nudge the focal point and slightly zoom out so faces are visible
                          objectPosition: currentMemory.id === 2 ? '50% 28%' : '50% 22%'
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <img
                      src={currentMemory.image}
                      alt={currentMemory.title}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  )
                }

                {/* Light shading Vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent pointer-events-none" />

                {/* Interactive Heart Bursting overlay */}
                <span className="absolute bottom-2 left-2 text-[9px] text-white/70 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded">
                  ❤ Tap Photo to Spark Heart
                </span>

                {/* Spawned Hearts Visualizer */}
                {floatingHearts.map(heart => (
                  <motion.div
                    key={heart.id}
                    initial={{ scale: 0, opacity: 1, x: heart.x - 16, y: heart.y - 16 }}
                    animate={{ scale: [1, 1.4, 0.8], opacity: 0, y: heart.y - 80, rotate: [-10, 15, -15] }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute pointer-events-none z-20"
                  >
                    <Heart className="w-8 h-8 fill-rose-500 text-rose-500 filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.8)]" />
                  </motion.div>
                ))}
              </div>

              {/* Polaroid Footer / Story Text */}
              <div className="pt-3 pb-1 px-1 flex flex-col shrink-0 select-text">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-[13px] text-pink-700 tracking-tight flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    {currentMemory.title}
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400 font-bold">
                    {currentIndex + 1} / {MEMORIES.length}
                  </span>
                </div>
                <p className="text-[10.5px] text-stone-700 font-medium leading-[1.35] tracking-wide text-left font-sans italic">
                  "{currentMemory.caption}"
                </p>
              </div>

              {/* Polaroid bottom grip texture */}
              <div className="mt-1 border-t border-stone-200/60 pt-1 flex justify-center text-[7px] text-stone-400 tracking-[0.2em] uppercase font-bold font-mono">
                ✿ Cherishing You Every Single Day ✿
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Shell Controls */}
        <div className="absolute inset-x-[-15px] sm:inset-x-[-25px] flex items-center justify-between pointer-events-none z-20 select-none">
          {/* Left Arrow Button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 pointer-events-auto shadow-xl ${
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
            }`}
            aria-label="Previous Memory"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === MEMORIES.length - 1}
            className={`w-10 h-10 rounded-full bg-stone-900/60 hover:bg-stone-900/90 border border-white/20 text-white flex items-center justify-center transition-all active:scale-90 pointer-events-auto shadow-xl ${
              currentIndex === MEMORIES.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:scale-110"
            }`}
            aria-label="Next Memory"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Footer Navigation Bar / Unlock Ceremony Button */}
      <footer className="w-full max-w-xs flex flex-col items-center gap-2 mb-2 min-h-[75px] z-10 select-none">
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.button
              key="celebration-unlocked"
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              onClick={() => {
                audio.playSuccessSound();
                onNextTrigger();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-extrabold text-sm text-[#0d0714] bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow-[0_8px_25px_rgba(244,63,94,0.45)] border-2 border-white/20"
            >
              <span>Unlock Birthday Ceremony 🎂</span>
              <ArrowRight className="w-4 h-4 animate-bounce" />
            </motion.button>
          ) : (
            <motion.div
              key="celebration-locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <button
                disabled
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed flex items-center justify-center gap-1"
              >
                <span>Read all {MEMORIES.length} cards to unlock cake 🎂</span>
                <span className="text-[10px] bg-stone-700 text-stone-400 px-1.5 py-0.5 rounded-full">
                  {maxIndexReached + 1} / {MEMORIES.length}
                </span>
              </button>
              <p className="text-[10px] text-pink-300/60 mt-1.5 font-medium animate-pulse">
                Swipe through all memories or hit the "➔" buttons above to unlock the candle!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
}
