import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LockScreen from './components/LockScreen';
import HeartfeltMessage from './components/HeartfeltMessage';
import ShinchanScene from './components/ShinchanScene';
import MemoriesCarousel from './components/MemoriesCarousel';
import BirthdayCakeScene from './components/BirthdayCakeScene';
import { audio } from './utils/audio';

type PageState = 'lock' | 'message' | 'shinchan' | 'memories' | 'birthdayCake';

export default function App() {
  const [page, setPage] = useState<PageState>('lock');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync mute state on mount & block right click to inspect the code
  useEffect(() => {
    // Enable audio manager subscription to keep states synchronized
    audio.subscribeMuteChange((mutedState) => {
      setIsMuted(mutedState);
    });

    // Check pre-existing state
    setIsMuted(audio.isMuted);

    // Warm up standard fonts for nice typography
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Block right-click menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      audio.stopAllBackgroundMusic();
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const handleToggleMute = () => {
    // Play a sweet tiny button pluck when clicking mute
    audio.toggleMute();
  };

  const handleUnlockSuccess = () => {
    setPage('message');
  };

  const handleNextTrigger = () => {
    setPage('shinchan');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#07040a] selection:bg-rose-500/30 selection:text-white font-sans antialiased text-neutral-100 relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          {page === 'lock' && (
            <LockScreen
              onUnlockSuccess={handleUnlockSuccess}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {page === 'message' && (
            <HeartfeltMessage
              onNextTrigger={handleNextTrigger}
              onBack={() => setPage('lock')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {page === 'shinchan' && (
            <ShinchanScene
              onBack={() => setPage('message')}
              onNextTrigger={() => setPage('memories')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {page === 'memories' && (
            <MemoriesCarousel
              onBack={() => setPage('shinchan')}
              onNextTrigger={() => setPage('birthdayCake')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {page === 'birthdayCake' && (
            <BirthdayCakeScene
              onBack={() => setPage('memories')}
              onResetToLock={() => setPage('lock')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
