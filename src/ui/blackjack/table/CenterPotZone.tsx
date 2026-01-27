// ============================================================================
// Table Zone - Center Pot Zone (Bet Display & Settlement)
// ============================================================================

import { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CenterPotZoneProps {
  currentBet?: number;
  isPlaying?: boolean;
  showNewRound?: boolean;
  isBankrupt?: boolean;
  settlementContent?: ReactNode;
  newRoundButton?: ReactNode;
  bankruptContent?: ReactNode;
  className?: string;
}

export const CenterPotZone = memo(function CenterPotZone({
  currentBet,
  isPlaying,
  showNewRound,
  isBankrupt,
  settlementContent,
  newRoundButton,
  bankruptContent,
  className,
}: CenterPotZoneProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <AnimatePresence mode="wait">
        {/* Bet Display during play */}
        {isPlaying && currentBet && currentBet > 0 && (
          <motion.div
            key="bet-display"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex flex-col items-center"
          >
            <div className="poker-chip gold text-sm" aria-label={`Current bet: $${currentBet}`}>
              ${currentBet}
            </div>
          </motion.div>
        )}

        {/* Settlement Results */}
        {showNewRound && !isBankrupt && (
          <motion.div
            key="settlement"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center gap-4"
            style={{ position: 'relative', zIndex: 20 }}
            role="status"
            aria-live="polite"
          >
            {settlementContent}
            {newRoundButton}
          </motion.div>
        )}

        {/* Bankrupt State */}
        {isBankrupt && (
          <motion.div
            key="bankrupt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
            role="alert"
            aria-live="assertive"
          >
            {bankruptContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default CenterPotZone;
