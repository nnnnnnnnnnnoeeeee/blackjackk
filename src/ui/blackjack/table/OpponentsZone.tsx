// ============================================================================
// Table Zone - Opponents Zone (Multijoueur)
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { HandView } from '@/components/HandView';
import { ChipStack } from '@/components/ChipStack';
import { TurnIndicator } from '../components/TurnIndicator';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';
import type { Hand } from '@/lib/blackjack/types';

interface Opponent {
  id: string;
  seat: number;
  username: string;
  bankroll: number;
  hands: Hand[];
}

interface OpponentsZoneProps {
  opponents: Opponent[];
  activeSeat?: number | null;
  phase?: string;
  className?: string;
}

export const OpponentsZone = memo(function OpponentsZone({
  opponents,
  activeSeat,
  phase = 'playing',
  className,
}: OpponentsZoneProps) {
  const prefersReducedMotion = useReducedMotion();

  if (opponents.length === 0) return null;

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
    },
    prefersReducedMotion
  );

  return (
    <div
      className={cn(
        'flex-shrink-0 px-4 py-3 bg-black/40 backdrop-blur-sm border-y border-primary/20',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        <h3 className="text-sm font-bold text-primary/80 mb-3 uppercase tracking-wider">
          Opponents
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2" role="list" aria-label="Opponents">
          {opponents
            .sort((a, b) => a.seat - b.seat)
            .map((opponent, index) => {
              const isActive = activeSeat === opponent.seat && phase === 'playing';

              return (
                <motion.div
                  key={opponent.id}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex-shrink-0 bg-black/60 rounded-lg border-2 p-2 min-w-[180px]',
                    isActive
                      ? 'border-primary bg-primary/20 shadow-lg shadow-primary/50'
                      : 'border-primary/30',
                    'transition-all duration-300'
                  )}
                  role="listitem"
                  aria-label={`Opponent ${opponent.seat}: ${opponent.username}`}
                >
                  {/* Player Header */}
                  <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-primary/20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {opponent.seat}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary leading-tight">
                          {opponent.username}
                        </div>
                        <div className="text-xs text-primary/70 leading-tight">
                          ${opponent.bankroll.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {isActive && <TurnIndicator isActive={true} />}
                  </div>

                  {/* Cards Display */}
                  <div className="space-y-1.5">
                    {opponent.hands.length > 0 ? (
                      opponent.hands.map((hand, idx) => (
                        <div
                          key={idx}
                          className="bg-black/40 rounded p-1.5 border border-primary/20"
                        >
                          <HandView
                            hand={hand}
                            isActive={isActive && idx === 0}
                            showValue={true}
                          />
                          {hand.bet > 0 && (
                            <div className="mt-1 flex justify-center">
                              <ChipStack amount={hand.bet} size="sm" />
                            </div>
                          )}
                          {/* Status badges */}
                          {hand.isBlackjack && (
                            <div className="mt-1 text-center">
                              <span className="text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                BJ
                              </span>
                            </div>
                          )}
                          {hand.isBusted && (
                            <div className="mt-1 text-center">
                              <span className="text-xs font-bold bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                                BUST
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-xs text-primary/50 py-1">...</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );
});

export default OpponentsZone;
