// ============================================================================
// Table Zone - Player Zone
// ============================================================================

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandView } from '@/components/HandView';
import { cn } from '@/lib/utils';
import type { Hand } from '@/lib/blackjack/types';

interface PlayerZoneProps {
  hands: Hand[];
  activeHandIndex?: number;
  getHandResult?: (index: number) => 'win' | 'lose' | 'push' | 'blackjack' | null;
  className?: string;
}

export const PlayerZone = memo(function PlayerZone({
  hands,
  activeHandIndex,
  getHandResult,
  className,
}: PlayerZoneProps) {
  return (
    <div className={cn('w-full max-w-full overflow-hidden', className)}>
      <AnimatePresence mode="wait">
        {hands.length > 0 ? (
          <div className="flex gap-1.5 sm:gap-2 md:gap-3 flex-wrap justify-center overflow-x-auto pb-1 max-w-full">
            {hands.map((hand, index) => {
              const isActive = index === activeHandIndex;
              const result = getHandResult?.(index) || null;

              return (
                <motion.div
                  key={`hand-${index}`}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <HandView
                    hand={hand}
                    isActive={isActive}
                    result={result || undefined}
                  />
                  {/* Hand number badge for split hands */}
                  {hands.length > 1 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                        isActive
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                      aria-label={`Hand ${index + 1} of ${hands.length}`}
                    >
                      {index + 1}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export default PlayerZone;
