import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Delete, Circle, Play, Volume2, VolumeX } from 'lucide-react';
import { audio } from '../utils/audio';
import ParticleBackground from './ParticleBackground';
import FireworksCanvas from './FireworksCanvas';

interface LockScreenProps {
  onUnlockSuccess: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function LockScreen({ onUnlockSuccess, isMuted, onToggleMute }: LockScreenProps) {
  const [passcode, setPasscode] = useState<string>('');
  const [isWrong, setIsWrong] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [typedCount, setTypedCount] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 6000);
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: false });

  // Elegant Birthday Countdown timer logic targeting June 27th (the user's special day) of current or upcoming year
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let targetDate = new Date(`${currentYear}-06-27T00:00:00`);
      
      // If target date already passed for the current calendar year, count down to next year
      if (now.getTime() > targetDate.getTime()) {
        targetDate = new Date(`${currentYear + 1}-06-27T00:00:00`);
      }

      const difference = targetDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isBirthday: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keypad configuration (Number, Letters)
  const keys = [
    { num: '1', letters: ' ' },
    { num: '2', letters: 'A B C' },
    { num: '3', letters: 'D E F' },
    { num: '4', letters: 'G H I' },
    { num: '5', letters: 'J K L' },
    { num: '6', letters: 'M N O' },
    { num: '7', letters: 'P Q R S' },
    { num: '8', letters: 'T U V' },
    { num: '9', letters: 'W X Y Z' },
    { num: ' ', letters: '' }, // empty placeholder
    { num: '0', letters: '+' },
    { num: 'back', letters: 'DELETE' }
  ];

  const handleKeyPress = (val: string) => {
    if (isUnlocked) return;

    if (val === ' ') return; // empty layout balance key

    if (val === 'back') {
      audio.playKeypadSound(9);
      setPasscode((prev) => prev.slice(0, -1));
      return;
    }

    const digit = parseInt(val, 10);
    audio.playKeypadSound(isNaN(digit) ? 5 : digit);

    if (passcode.length < 4) {
      const nextPasscode = passcode + val;
      setPasscode(nextPasscode);

      // Check passcode when 4 digits are completed
      if (nextPasscode.length === 4) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const birthdayDate = new Date(`${currentYear}-06-27T00:00:00`);
        const beforeBirthday = now.getTime() < birthdayDate.getTime();

        if (nextPasscode === '2006') {
          if (beforeBirthday) {
            setIsUnlocked(true);
            // Start background celebration music
            audio.playSuccessSound();
            setTimeout(() => {
              audio.playEmotionalMusic();
            }, 1000);
          } else {
            showNotification("Passcode 2006 is now expired! Since June 27th has arrived, please use the birthday passcode 4545! 🎂", "info");
            setTimeout(() => {
              setIsWrong(true);
              audio.playWrongSound();
              setTimeout(() => {
                setIsWrong(false);
                setPasscode('');
              }, 600);
            }, 150);
          }
        } else if (nextPasscode === '4545') {
          if (beforeBirthday) {
            showNotification("Hold on! 🔒 This special birthday journey is locked until June 27th at 00:00! ✨", "error");
            setTimeout(() => {
              setIsWrong(true);
              audio.playWrongSound();
              setTimeout(() => {
                setIsWrong(false);
                setPasscode('');
              }, 600);
            }, 150);
          } else {
            setIsUnlocked(true);
            // Start background celebration music
            audio.playSuccessSound();
            setTimeout(() => {
              audio.playEmotionalMusic();
            }, 1000);
          }
        } else {
          // Trigger shake & sound
          setTimeout(() => {
            setIsWrong(true);
            audio.playWrongSound();
            // Reset state with delay
            setTimeout(() => {
              setIsWrong(false);
              setPasscode('');
            }, 600);
          }, 150);
        }
      }
    }
  };

  // Keyboard support for ease of use
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUnlocked) return;
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyPress('back');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passcode, isUnlocked]);

  // Generates 40 custom colorfully stylized CSS falling confetti shapes
  const renderConfetti = () => {
    const pieces = Array.from({ length: 48 });
    const shapes = ['rect', 'circle', 'triangle'];
    const bgs = ['bg-rose-400', 'bg-fuchsia-400', 'bg-purple-400', 'bg-cyan-400', 'bg-yellow-400', 'bg-pink-400', 'bg-emerald-400'];

    return pieces.map((_, i) => {
      const shape = shapes[i % shapes.length];
      const bg = bgs[Math.floor(Math.random() * bgs.length)];
      const delay = Math.random() * 4;
      const duration = Math.random() * 3 + 2.5;
      const left = Math.random() * 100;
      const sizeIndex = Math.floor(Math.random() * 3);
      const sizes = ['w-2.5 h-2.5', 'w-3.5 h-3.5', 'w-1.5 h-4'];
      const sizeClass = sizes[sizeIndex];

      return (
        <motion.div
          key={i}
          className={`absolute ${bg} rounded-sm opacity-90 select-none pointer-events-none ${sizeClass} z-30`}
          style={{ top: '-40px', left: `${left}%` }}
          animate={{
            y: ['0vh', '105vh'],
            x: ['0px', `${(Math.random() - 0.5) * 120}px`],
            rotate: [0, Math.random() * 720 - 360],
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: 'linear',
          }}
        />
      );
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#0a0510] text-white overflow-hidden p-6 select-none">
      {/* Toast Notification Overlay HUD */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-gradient-to-r from-teal-400 via-pink-400 to-rose-400 text-stone-950 border-4 border-white/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_12px_30px_rgba(236,72,153,0.3)] pointer-events-auto font-sans"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-stone-900/40 backdrop-blur flex items-center justify-center text-sm shadow">
              🎁
            </div>
            <div className="flex-1 font-bold text-xs leading-snug text-[#0f172a] drop-shadow-[0_1px_1px_rgba(255,255,255,0.15)]">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast(null)}
              className="text-[#0f172a] font-[#0f172a] font-black text-sm hover:scale-125 transition-transform p-1 ml-auto"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background radial gradient and star dots from Artistic Flair theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#2e1065_0%,_#0a0510_70%)] opacity-60 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%20/%3E%3C/svg%3E')] opacity-30 pointer-events-none z-0"></div>

      {/* Dynamic Animated Atmospheric Particles */}
      <ParticleBackground mode={isUnlocked ? 'both' : 'twinkle'} />

      {/* Floating radial soft light drops */}
      <div className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full bg-pink-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-purple-600/10 blur-[130px] pointer-events-none z-0" />

      {/* Header Sound Controls */}
      <div className="absolute top-6 right-6 z-40">
        <button
          id="btn-lockscreen-mute"
          onClick={onToggleMute}
          className="p-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/15 hover:scale-105 active:scale-95 transition-all text-pink-300"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          /* ================= LOCK GRID VIEW ================= */
          <motion.div
            key="lock-grid"
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col items-center justify-between shadow-2xl relative w-full max-w-sm z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Ambient top-left pink blur light */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-pink-500/20 blur-xl rounded-full pointer-events-none"></div>

            {/* Step header from the design */}
            <div className="text-center mb-4">
              <div className="text-xs tracking-widest text-pink-300 uppercase mb-1 font-semibold">Step 01</div>
              <h3 className="text-lg font-serif italic text-pink-100">Secret Lock Screen</h3>
            </div>

            {/* Hint subtitle */}
            <p className="text-xs text-white/70 text-center px-4 mb-3 leading-relaxed">
              A special gift is waiting for DHANUSHKA ❤️
            </p>

            {/* Small Elegant Countdown Timer Component */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 flex flex-col items-center shadow-lg">
              <span className="text-[9px] uppercase tracking-[0.25em] text-pink-300 font-bold mb-2 animate-pulse">
                Days Until Golden Birthday 🕒
              </span>
              <div className="flex gap-2 justify-center items-center text-center">
                {!timeLeft.isBirthday ? (
                  <>
                    <div className="flex flex-col min-w-[36px]">
                      <span className="text-sm md:text-base font-extrabold text-white font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(244,63,94,0.4)]">
                        {String(timeLeft.days).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-white/40 tracking-wide font-semibold">days</span>
                    </div>
                    <span className="text-pink-300/30 text-xs font-light mb-2">:</span>
                    
                    <div className="flex flex-col min-w-[36px]">
                      <span className="text-sm md:text-base font-extrabold text-white font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(244,63,94,0.4)]">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-white/40 tracking-wide font-semibold">hours</span>
                    </div>
                    <span className="text-pink-300/30 text-xs font-light mb-2">:</span>
                    
                    <div className="flex flex-col min-w-[36px]">
                      <span className="text-sm md:text-base font-extrabold text-white font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(244,63,94,0.4)]">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-white/40 tracking-wide font-semibold">mins</span>
                    </div>
                    <span className="text-pink-300/30 text-xs font-light mb-2">:</span>
                    
                    <div className="flex flex-col min-w-[36px]">
                      <span className="text-sm md:text-base font-extrabold text-pink-400 font-mono tracking-tight drop-shadow-[0_2px_6px_rgba(236,72,153,0.6)]">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-pink-300/60 tracking-wide font-semibold">secs</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-yellow-200 animate-pulse font-serif italic">
                    ✨ Today is her Golden Day! 🎉
                  </span>
                )}
              </div>
            </div>

            {/* Passcode Indicator Dots */}
            <motion.div
              animate={isWrong ? { x: [-12, 12, -12, 12, -6, 6, 0], color: '#f43f5e' } : {}}
              transition={{ duration: 0.45 }}
              className="flex gap-4 mb-8 justify-center"
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = passcode.length > idx;
                return (
                  <div
                    key={idx}
                    className="relative w-3.5 h-3.5 rounded-full border border-white/30 flex items-center justify-center transition-all duration-300"
                    style={{
                      borderColor: isWrong ? '#f43f5e' : filled ? '#ec4899' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <AnimatePresence>
                      {filled && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={`w-2.5 h-2.5 rounded-full ${isWrong ? 'bg-red-500' : 'bg-pink-500 shadow-[0_0_10px_#ec4899]'}`}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>

            {/* Passcode Keypad Grid 3x4 */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 w-full max-w-[280px] justify-items-center">
              {keys.map((key, i) => {
                if (key.num === ' ') {
                  return <div key={i} className="w-12 h-12" />; // Spacer Balance
                }

                const isBack = key.num === 'back';

                return (
                  <motion.button
                    id={`btn-keypad-${key.num}`}
                    key={i}
                    onClick={() => handleKeyPress(key.num)}
                    whileTap={{ scale: 0.9, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                    whileHover={{ scale: 1.05 }}
                    className={`relative w-12 h-12 rounded-full flex flex-col items-center justify-center border transition-colors duration-250 pointer-events-auto
                      ${isBack 
                        ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' 
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {isBack ? (
                      <Delete size={16} />
                    ) : (
                      <>
                        <span className="text-lg font-semibold tracking-tight font-sans leading-none">{key.num}</span>
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            <p className="mt-8 text-[10px] text-white/30 uppercase tracking-tighter">
              Passcode Secured
            </p>
          </motion.div>
        ) : (
          /* ================= UNLOCKED CELEBRATION OVERLAY ================= */
          <motion.div
            key="lock-celebrated"
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-20 px-6 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Interactive Fireworks in the Background of the victory screen */}
            <FireworksCanvas />

            {/* Falling Confetti Layer */}
            {renderConfetti()}

            {/* Sparkles / Golden Shine FX */}
            <div className="absolute inset-0 bg-radial-gradient from-rose-500/10 via-transparent to-transparent pointer-events-none" />

            {/* Unlocked Magical Content Card */}
            <motion.div
              className="relative w-full max-w-md p-8 md:p-10 rounded-3xl bg-neutral-900/45 border border-white/10 backdrop-blur-xl shadow-[0_15px_45px_rgba(244,63,94,0.25)] flex flex-col items-center text-center z-30"
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Inner glowing element */}
              <div className="absolute -top-12 p-5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-[0_0_40px_rgba(244,63,94,0.4)] flex items-center justify-center animate-bounce">
                🎉
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-6 space-y-6"
              >
                <h2 className="text-2xl md:text-3xl font-bold font-sans tracking-tight leading-relaxed bg-gradient-to-r from-rose-300 via-pink-200 to-purple-300 bg-clip-text text-transparent">
                  🎉 Happy Birthday My Dear Lifetime Best Friend + Lifetime Sister ❤️
                </h2>
                
                <p className="text-sm text-rose-100/80 font-sans leading-relaxed px-2 font-light">
                  Passcode correct! This is the start of a sweet, emotional birthday journey dedicated entirely to you. You are highly valued & deeply appreciated!
                </p>
              </motion.div>

              {/* Radiant Continue Button */}
              <motion.button
                id="btn-unlocked-continue"
                onClick={onUnlockSuccess}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 0 25px rgba(244,63,94,0.7)',
                  borderColor: 'rgba(255,255,255,0.6)'
                }}
                whileTap={{ scale: 0.95 }}
                className="mt-10 px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-full text-white font-semibold text-base transition-all duration-300 shadow-[0_4px_20px_rgba(244,63,94,0.3)] border border-white/20 select-none flex items-center justify-center gap-2 group pointer-events-auto"
              >
                <span>Continue</span>
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">➜</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
