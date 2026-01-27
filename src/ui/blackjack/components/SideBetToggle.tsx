// ============================================================================
// Component - Side Bet Toggle
// ============================================================================

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ChipSelector } from './ChipSelector';
import type { PerfectPairsConfig, TwentyOnePlus3Config } from '@/lib/blackjack/types';

interface SideBetToggleProps {
  name: 'perfectPairs' | 'twentyOnePlus3';
  label: string;
  description: string;
  config: PerfectPairsConfig | TwentyOnePlus3Config;
  enabled: boolean;
  bet: number;
  onToggle: (enabled: boolean) => void;
  onBetChange: (amount: number) => void;
  maxBet: number;
  availableBankroll: number;
  payouts?: Record<string, number>;
}

export const SideBetToggle = memo(function SideBetToggle({
  name,
  label,
  description,
  config,
  enabled,
  bet,
  onToggle,
  onBetChange,
  maxBet,
  availableBankroll,
  payouts = {},
}: SideBetToggleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [localBet, setLocalBet] = useState(bet);

  const handleChipClick = (value: number) => {
    const newBet = Math.min(localBet + value, maxBet, availableBankroll);
    if (newBet >= config.minBet) {
      setLocalBet(newBet);
      onBetChange(newBet);
    }
  };

  const handleClear = () => {
    setLocalBet(0);
    onBetChange(0);
  };

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
    prefersReducedMotion
  );

  const expandVariants = conditionalVariants(
    {
      initial: { opacity: 0, height: 0 },
      animate: { opacity: 1, height: 'auto' },
      exit: { opacity: 0, height: 0 },
    },
    prefersReducedMotion
  );

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="relative bg-gradient-to-br from-card/40 via-card/30 to-card/40 rounded-xl p-3 sm:p-4 border-2 border-primary/20 shadow-lg backdrop-blur-sm"
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-xl" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
            {label}
          </span>
          <motion.button
            whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.9 }}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center cursor-help"
            title={description}
            aria-label={`Information about ${label} side bet`}
            aria-describedby={`${name}-description`}
          >
            <span className="text-[10px] sm:text-xs font-bold text-primary">ℹ</span>
          </motion.button>
        </div>
        <Switch
          id={`${name}-toggle`}
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`Enable ${label}`}
        />
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            variants={expandVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3 mt-3"
          >
            {/* Explanation */}
            <div className="relative bg-gradient-to-br from-primary/10 via-background/60 to-primary/10 rounded-lg p-3 border border-primary/20">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-base">💡</span>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                    How it works
                  </div>
                  <div
                    id={`${name}-description`}
                    className="text-[10px] sm:text-xs text-muted-foreground mb-2"
                  >
                    {description}
                  </div>
                  {Object.keys(payouts).length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                      {Object.entries(payouts).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded bg-primary/20 border border-primary/30 text-primary font-semibold"
                        >
                          {key}: {value}:1
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bet amount display */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">{label} Bet</div>
              <div className="text-xl font-bold text-primary">${localBet}</div>
            </div>

            {/* Chip buttons for side bet */}
            <ChipSelector
              onChipClick={handleChipClick}
              maxValue={Math.min(maxBet, availableBankroll)}
              disabled={localBet >= maxBet || localBet >= availableBankroll}
              chipValues={[
                { value: 5, color: 'red' },
                { value: 10, color: 'red' },
                { value: 25, color: 'green' },
                { value: 50, color: 'blue' },
              ]}
            />

            {/* Clear button */}
            {localBet > 0 && (
              <button
                onClick={handleClear}
                className="w-full text-xs btn-casino-secondary py-1"
                aria-label={`Clear ${label} bet`}
              >
                Clear
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default SideBetToggle;
