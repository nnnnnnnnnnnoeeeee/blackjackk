// ============================================================================
// Playing Card Component - Premium animations
// ============================================================================

import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '@/lib/blackjack/types';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: CardType;
  index?: number;
  className?: string;
}

// Subtle random tilt per card (stable across renders via index seed)
const getTilt = (index: number) => ((index * 17 + 7) % 5) - 2; // -2 to +2 deg

export const PlayingCard = memo(function PlayingCard({
  card,
  index = 0,
  className,
}: PlayingCardProps) {
  const { suit, rank, faceUp } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const color = SUIT_COLORS[suit];

  // --- Flip logic ---
  // Phase: 'idle' | 'half' | 'done'
  const [flipPhase, setFlipPhase] = useState<'idle' | 'half' | 'done'>('idle');
  const prevFaceUp = useRef(faceUp);

  useEffect(() => {
    if (prevFaceUp.current === faceUp) return;
    prevFaceUp.current = faceUp;

    // Phase 1: squeeze to flat (scaleX 1 → 0)
    setFlipPhase('half');
    const t = setTimeout(() => {
      // Phase 2: expand back (scaleX 0 → 1) — content has already switched
      setFlipPhase('done');
      setTimeout(() => setFlipPhase('idle'), 200);
    }, 180);
    return () => clearTimeout(t);
  }, [faceUp]);

  const isFlipping = flipPhase !== 'idle';
  const showFront = faceUp || flipPhase === 'done';

  const dealTransition = {
    type: 'spring' as const,
    stiffness: 320,
    damping: 26,
    mass: 0.6,
    delay: index * 0.1,
  };

  const flipScaleX = flipPhase === 'half' ? 0.05 : 1;

  if (!showFront) {
    return (
      <motion.div
        initial={{ y: -180, x: 0, opacity: 0, scale: 0.4, rotate: -8 }}
        animate={{
          y: 0,
          x: 0,
          opacity: 1,
          scale: 1,
          rotate: getTilt(index),
          scaleX: flipScaleX,
        }}
        transition={isFlipping
          ? { duration: 0.18, ease: 'easeIn' }
          : dealTransition
        }
        whileHover={{ scale: 1.06, rotate: 0, transition: { duration: 0.15 } }}
        style={{ transformOrigin: 'center center' }}
        className={cn('playing-card face-down', className)}
        aria-label="Face down card"
      />
    );
  }

  return (
    <motion.div
      initial={{ y: -180, x: 0, opacity: 0, scale: 0.4, rotate: -8 }}
      animate={{
        y: 0,
        x: 0,
        opacity: 1,
        scale: 1,
        rotate: getTilt(index),
        scaleX: flipScaleX,
      }}
      transition={isFlipping
        ? { duration: 0.18, ease: 'easeOut' }
        : dealTransition
      }
      whileHover={{ scale: 1.06, rotate: 0, transition: { duration: 0.15 } }}
      style={{ transformOrigin: 'center center' }}
      className={cn('playing-card', color, className)}
      aria-label={`${rank} of ${suit}`}
    >
      {/* Top left */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className="text-sm font-bold">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>

      {/* Center suit */}
      <span className="text-2xl sm:text-3xl">{symbol}</span>

      {/* Bottom right (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className="text-sm font-bold">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </motion.div>
  );
});

export default PlayingCard;
