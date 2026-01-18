// ============================================================================
// Playing Card Component
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '@/lib/blackjack/types';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: CardType;
  index?: number;
  className?: string;
}

export const PlayingCard = memo(function PlayingCard({ 
  card, 
  index = 0,
  className 
}: PlayingCardProps) {
  const { suit, rank, faceUp } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const color = SUIT_COLORS[suit];
  
  if (!faceUp) {
    return (
      <motion.div
        initial={{ 
          y: -200, 
          x: -50,
          opacity: 0, 
          rotateY: -90,
          rotateX: 10,
          scale: 0.5 
        }}
        animate={{ 
          y: 0, 
          x: 0,
          opacity: 1, 
          rotateY: 0,
          rotateX: 0,
          scale: 1 
        }}
        transition={{ 
          duration: 0.35,
          delay: index * 0.08,
          type: 'spring',
          stiffness: 250,
          damping: 30,
          mass: 0.7,
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className={cn('playing-card face-down', className)}
        aria-label="Face down card"
      />
    );
  }
  
  return (
    <motion.div
      initial={{ 
        y: -200, 
        x: -50,
        opacity: 0, 
        scale: 0.5, 
        rotate: -5,
        rotateY: -90,
        rotateX: 10,
      }}
      animate={{ 
        y: 0, 
        x: 0,
        opacity: 1, 
        scale: 1, 
        rotate: 0,
        rotateY: 0,
        rotateX: 0,
      }}
      transition={{ 
        duration: 0.35,
        delay: index * 0.08,
        type: 'spring',
        stiffness: 250,
        damping: 30,
        mass: 0.7,
      }}
      style={{ transformStyle: 'preserve-3d' }}
      className={cn('playing-card', color, className)}
      aria-label={`${rank} of ${suit}`}
    >
      {/* Top left corner */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className="text-sm font-bold">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
      
      {/* Center suit */}
      <span className="text-2xl sm:text-3xl">{symbol}</span>
      
      {/* Bottom right corner (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className="text-sm font-bold">{rank}</span>
        <span className="text-xs">{symbol}</span>
      </div>
    </motion.div>
  );
});

export default PlayingCard;
