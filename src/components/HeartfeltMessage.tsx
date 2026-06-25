import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Stars, ChevronDown, Volume2, VolumeX, Sparkles } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import { audio } from '../utils/audio';

interface HeartfeltMessageProps {
  onNextTrigger: () => void;
  onBack: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function HeartfeltMessage({ onNextTrigger, onBack, isMuted, onToggleMute }: HeartfeltMessageProps) {
  const paragraphs = [
    "🎂❤️ Happy Birthday to the most special person in my life! 🥳✨",
    "You are not just my best friend, you are my lifetime sister and one of the greatest blessings in my life. 🫂💖",
    "I am truly lucky to have a person like you. 🥹❤️ Thank you for always supporting me, motivating me, and standing by my side whenever I need you. 🤗🌸",
    "Whenever I talk to you, I forget all my sadness and worries. 💕✨ No matter how bad my day is, a simple conversation with you is enough to make smile again. 😊❤️ Thank you for being my comfort, my support, and one of the happiest parts of my life. 🫂💖",
    "I know that sometimes I irritated you and annoyed you, and for that, I am truly sorry. 🥺🙏",
    "As a small birthday gift, I want to give you these words from my heart. 🎁❤️",
    "Just like Karthik in 8th Vasanthalu, I promise that I will always respect you, support you in your hard times, and stand by your side whenever you need me. 🫂✨ I will never leave you in this life as your best friend and brother. ♾️💖",
    "And one more thing... I truly believe that our bond will never break. 🤞♾️❤️ No matter how busy life gets or where life takes us, our friendship and this beautiful brother-sister bond will always remain strong. 🥹💞",
    "Also, I must politely say that your voice is absolutely magical! You are truly the best singer (honestly, ur my spotify 🥲) and hearing you sing brings so much warmth, peace, and joy to everyone around you. 🎶✨",
    "Thank you for every smile, every piece of motivation, every bit of support, and for being the amazing person that you are. 🌷❤️",
    "May this year bring you endless happiness, success, peace, and beautiful memories. 🎉🎂✨",
    "Happy Birthday, my lifetime best friend and lifetime sister! ❤️🥳♾️"
  ];

  const [isLetterOpened, setIsLetterOpened] = useState<boolean>(false);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>('');
  const [completedParagraphs, setCompletedParagraphs] = useState<string[]>([]);
  const [isDoneTyping, setIsDoneTyping] = useState<boolean>(false);
  
  const textEndRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Typewriter parameters
  const typingSpeed = 30; // ms per character

  useEffect(() => {
    if (!isLetterOpened) return; // Wait until envelope is clicked

    if (currentParagraphIdx >= paragraphs.length) {
      setIsDoneTyping(true);
      return;
    }

    const fullText = paragraphs[currentParagraphIdx];
    const chars = Array.from(fullText);
    let charIdx = 0;
    setTypedText('');

    const interval = setInterval(() => {
      if (charIdx >= chars.length) {
        clearInterval(interval);
        setTimeout(() => {
          setCompletedParagraphs((prev) => [...prev, fullText]);
          setCurrentParagraphIdx((prev) => prev + 1);
        }, 1100); // delay before next paragraph
        return;
      }

      charIdx++;
      const currentSlice = chars.slice(0, charIdx).join('');
      setTypedText(currentSlice);
      
      // Smart scroll: only scroll down if the user is already near the bottom!
      // This stops unwanted force-snapping if she scrolls up to read.
      if (containerRef.current && textEndRef.current) {
        const container = containerRef.current;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 160;
        if (isNearBottom) {
          textEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [currentParagraphIdx, isLetterOpened]);

  const handleOpenLetter = () => {
    // Play sweet chime sound
    audio.playSuccessSound();
    // Start emotional background music chord loop
    audio.playEmotionalMusic();
    setIsLetterOpened(true);
  };

  const handleSkipTyping = () => {
    setCompletedParagraphs(paragraphs);
    setIsDoneTyping(true);
    // Play quick magical bell when skipped
    audio.playSuccessSound();
  };

  /**
   * Helper function to colorize and highlight high-emotional keywords elegantly
   */
  const renderHighlightedText = (text: string) => {
    // Regular expression for capturing emotional elements
    const parts = text.split(/(lifetime sister|lifetime best friend|lifetime best friend and lifetime sister|best friend and brother|8th Vasanthalu|Karthik|brother-sister bond|greatest blessings|Happy Birthday|best singer|ur my spotify)/gi);
    
    return (
      <>
        {parts.map((part, idx) => {
          const lower = part.toLowerCase();
          if (lower === 'lifetime sister' || lower === 'lifetime best friend' || lower === 'lifetime best friend and lifetime sister') {
            return (
              <span key={idx} className="font-semibold text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                {part}
              </span>
            );
          }
          if (lower === 'best friend and brother' || lower === 'brother-sister bond') {
            return (
              <span key={idx} className="font-semibold text-amber-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                {part}
              </span>
            );
          }
          if (lower === 'best singer') {
            return (
              <span key={idx} className="font-semibold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] italic underline decoration-wavy decoration-pink-400">
                {part}
              </span>
            );
          }
          if (lower === 'ur my spotify') {
            return (
              <span key={idx} className="font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.55)] italic">
                {part}
              </span>
            );
          }
          if (lower === '8th vasanthalu' || lower === 'karthik') {
            return (
              <span key={idx} className="font-bold border-b border-dashed border-sky-300 text-sky-200 tracking-wide px-0.5">
                {part}
              </span>
            );
          }
          if (lower === 'greatest blessings') {
            return (
              <span key={idx} className="italic text-purple-200 font-medium">
                {part}
              </span>
            );
          }
          if (lower === 'happy birthday') {
            return (
              <span key={idx} className="font-bold bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200 bg-clip-text text-transparent text-lg tracking-wide">
                {part}
              </span>
            );
          }
          return part;
        })}
      </>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-[#0a0510] text-neutral-100 overflow-y-auto p-4 md:p-6 select-none leading-relaxed">
      {/* Background radial gradient and star dots from Artistic Flair theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#2e1065_0%,_#0a0510_70%)] opacity-60 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%20/%3E%3C/svg%3E')] opacity-30 pointer-events-none z-0"></div>

      {/* Rose-Violet Romantic Particle Sky */}
      <ParticleBackground mode="hearts" />

      {/* Magical color blobs */}
      <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full bg-pink-500/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[50%] right-[10%] w-80 h-80 rounded-full bg-fuchsia-500/10 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[5%] w-60 h-60 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Header controls with Back navigation */}
      <div className="w-full max-w-lg mt-2 flex items-center justify-between z-20 px-1 mb-4">
        <div className="flex items-center gap-2">
          <button
            id="btn-message-back"
            onClick={onBack}
            className="text-xs px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
          >
            <span>← Back</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <Heart className="text-pink-500 animate-pulse fill-pink-500" size={14} />
            <span className="text-[10px] font-mono text-pink-300 tracking-widest uppercase">LIFETIME BOND</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isLetterOpened && !isDoneTyping && (
            <button
              id="btn-skip-typing"
              onClick={handleSkipTyping}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Sparkles size={12} className="text-amber-300 animate-spin" />
              <span>Skip</span>
            </button>
          )}

          <button
            id="btn-message-mute"
            onClick={onToggleMute}
            className="p-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all text-neutral-300"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isLetterOpened ? (
          /* Animated Virtual Envelope */
          <motion.div
            key="envelope-view"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full max-w-lg flex flex-col items-center justify-center z-10 px-2"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center font-serif italic text-rose-200/90 text-sm md:text-base mb-8 max-w-sm drop-shadow"
            >
              "I have written my hearts words in this envelope... Tap to open and unfold, sister!" ✉️✍️
            </motion.p>

            {/* Interactive Envelope layout */}
            <motion.div
              id="envelope-box"
              onClick={handleOpenLetter}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full max-w-[380px] aspect-[4/3] bg-gradient-to-br from-[#1a0e28] to-[#250d2c] border border-pink-500/30 rounded-[2rem] p-6 shadow-[0_25px_60px_-15px_rgba(244,63,94,0.3)] flex flex-col items-center justify-center cursor-pointer group select-none ring-1 ring-white/10"
            >
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-pink-500/40 rounded-tl-lg group-hover:border-pink-400"></div>
              <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-pink-500/40 rounded-tr-lg group-hover:border-pink-400"></div>
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-pink-500/40 rounded-bl-lg group-hover:border-pink-400"></div>
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-pink-500/40 rounded-br-lg group-hover:border-pink-400"></div>

              {/* Fold visual separators */}
              <div className="absolute top-0 left-0 w-1/2 h-1/2 border-b border-r border-pink-500/10 bg-white/[0.01] rounded-tl-[2rem]"></div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 border-b border-l border-pink-500/10 bg-white/[0.01] rounded-tr-[2rem]"></div>

              {/* Pulsing wax seal with Heart */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="w-20 h-20 bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 rounded-full shadow-[0_8px_30px_rgba(236,72,153,0.6)] border-2 border-white/40 flex items-center justify-center z-13 relative group-hover:brightness-110 active:scale-95 transition-all"
              >
                <Heart className="text-white fill-white animate-pulse" size={32} />
              </motion.div>

              <div className="mt-8 text-center z-10 pointer-events-none">
                <span className="text-xs font-mono font-bold tracking-widest text-pink-300 uppercase block">Tap Seal to Open</span>
                <span className="text-[10px] text-neutral-400/80 mt-1 italic block">Unfolds typewriter letter</span>
              </div>

              {/* Floating micro stars decoration */}
              <Sparkles className="absolute top-6 right-8 text-amber-300 opacity-60 animate-bounce" size={16} />
              <Heart className="absolute bottom-6 left-8 text-rose-400/30" size={14} />
            </motion.div>
          </motion.div>
        ) : (
          /* Elegant Glassmorphic Message Container */
          <motion.div 
            key="letter-view"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            ref={containerRef}
            className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 flex flex-col shadow-2xl relative ring-1 ring-white/30 z-10 w-full max-w-lg flex-1 mb-6 overflow-y-auto"
            style={{ contentVisibility: 'auto' }}
          >
            {/* Glowing top line from design guide */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>

            {/* Step label */}
            <div className="text-[10px] tracking-widest text-pink-400 uppercase font-bold mb-6 flex justify-between items-center w-full">
              <span>Step 02 — Heartfelt Message</span>
              <span className="text-pink-500 animate-pulse">❤️</span>
            </div>

            <div className="space-y-6 text-sm md:text-base text-neutral-200 font-sans tracking-wide">
              {completedParagraphs.map((text, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={`leading-relaxed ${i === 0 ? 'font-serif italic text-3xl leading-tight text-pink-100' : ''}`}
                >
                  {renderHighlightedText(text)}
                </motion.p>
              ))}

              {/* Currently Typing Paragraph */}
              {!isDoneTyping && typedText && (
                <p className={`leading-relaxed border-r-2 border-pink-500 animate-caret pr-1 inline ${completedParagraphs.length === 0 ? 'font-serif italic text-3xl leading-tight text-pink-100' : ''}`}>
                  {renderHighlightedText(typedText)}
                </p>
              )}

              {/* Scrolling anchor */}
              <div ref={textEndRef} />
            </div>

            {/* Scroll Guide if writing is still ongoing */}
            {!isDoneTyping && (
              <div className="flex flex-col items-center justify-center pt-8 text-neutral-400/60 text-xs gap-1.5 animate-bounce">
                <span>Writing heartfelt letter...</span>
                <ChevronDown size={14} />
              </div>
            )}

            {/* Trigger next page button (only shows when typing done) */}
            <AnimatePresence>
              {isDoneTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="mt-8 flex flex-col items-center btn-trigger-box"
                >
                  <div className="w-full h-[1px] bg-white/15 mb-6" />
                  
                  <p className="text-center font-serif italic text-xs text-pink-300/80 mb-4 tracking-wider flex items-center gap-1.5">
                    <Stars size={12} className="text-yellow-300 animate-pulse" />
                    "There is one more magical surprise waiting for DHANUSHKA..."
                  </p>

                  <motion.button
                    id="btn-message-next"
                    onClick={onNextTrigger}
                    whileHover={{ 
                      scale: 1.03, 
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl font-semibold tracking-wide flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(236,72,153,0.3)] border border-white/20 select-none cursor-pointer text-white pointer-events-auto"
                  >
                    <span>Explore the Celebration</span>
                    <span className="inline-block">🎁</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
