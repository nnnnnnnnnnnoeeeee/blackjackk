// ============================================================================
// Component - Bet Composer Multiplayer (Adapted for Multiplayer)
// ============================================================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { useBetValidation } from '../hooks';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ChipSelector } from './ChipSelector';
import { TimerBadge } from './TimerBadge';
import { getLabel } from '../i18n';

interface BetComposerMultiplayerProps {
  bankroll: number;
  minBet: number;
  maxBet: number;
  onBet: (amount: number) => void;
  onDeal?: () => void;
  isTableCreator?: boolean;
  bettingTimeLeft?: number;
  canDeal?: boolean;
  soundEnabled?: boolean;
  soundVolume?: number;
}

export const BetComposerMultiplayer = memo(function BetComposerMultiplayer({
  bankroll,
  minBet,
  maxBet,
  onBet,
  onDeal,
  isTableCreator = false,
  bettingTimeLeft,
  canDeal = false,
  soundEnabled = false,
  soundVolume = 0.5,
}: BetComposerMultiplayerProps) {
  const { playSound } = useSound({
    enabled: soundEnabled,
    volume: soundVolume,
  });
  const prefersReducedMotion = useReducedMotion();

  const [betAmount, setBetAmount] = useState(0);
  const [lastBetAmount, setLastBetAmount] = useState(0);

  const handleChipClick = useCallback(
    (value: number) => {
      const newAmount = Math.min(betAmount + value, bankroll, maxBet);
      setBetAmount(newAmount);
    },
    [betAmount, bankroll, maxBet]
  );

  const handleClear = useCallback(() => {
    setLastBetAmount(betAmount);
    setBetAmount(0);
  }, [betAmount]);

  const handleRebet = useCallback(() => {
    if (lastBetAmount > 0 && lastBetAmount <= bankroll && lastBetAmount <= maxBet) {
      setBetAmount(lastBetAmount);
    } else {
      toast.error(getLabel('rebet_unavailable_title'), {
        description: getLabel('rebet_unavailable_description'),
      });
    }
  }, [lastBetAmount, bankroll, maxBet]);

  const handleAllIn = useCallback(() => {
    setBetAmount(Math.min(bankroll, maxBet));
  }, [bankroll, maxBet]);

  const handlePlaceBet = useCallback(() => {
    if (betAmount < minBet) {
      toast.error(getLabel('error_title'), {
        description: `${getLabel('minimum_bet')}: $${minBet}`,
      });
      return;
    }
    if (betAmount > bankroll) {
      toast.error(getLabel('error_title'), {
        description: getLabel('insufficient_bankroll'),
      });
      return;
    }
    if (betAmount > maxBet) {
      toast.error(getLabel('error_title'), {
        description: `Maximum bet: $${maxBet}`,
      });
      return;
    }
    playSound('chipStack');
    onBet(betAmount);
    setBetAmount(0);
  }, [betAmount, minBet, bankroll, maxBet, onBet, playSound]);

  useEffect(() => {
    if (betAmount > maxBet) {
      setBetAmount(Math.min(bankroll, maxBet));
    }
    if (betAmount > bankroll) {
      setBetAmount(bankroll);
    }
  }, [maxBet, bankroll, betAmount]);

  const variants = conditionalVariants(
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
    prefersReducedMotion
  );

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-card/50 backdrop-blur-sm border border-border w-full max-w-full relative"
    >
      {/* Header with timer */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="text-center flex-1">
          <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">
            {getLabel('your_bet')}
          </div>
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary break-all">
            ${betAmount}
          </div>
        </div>
        {isTableCreator && bettingTimeLeft !== undefined && bettingTimeLeft > 0 && (
          <TimerBadge
            timeLeft={bettingTimeLeft}
            totalTime={10}
            size={40}
            color="gold"
            showText={true}
          />
        )}
      </div>

      {/* Chip buttons */}
      <div className="flex-shrink-0 w-full">
        <ChipSelector
          onChipClick={handleChipClick}
          maxValue={Math.min(bankroll, maxBet)}
          disabled={betAmount >= maxBet || betAmount >= bankroll}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 sm:gap-2.5 md:gap-3 w-full max-w-xs sm:max-w-sm md:max-w-md px-1 flex-shrink-0">
        <button
          onClick={handleClear}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label={getLabel('clear_bet_aria')}
        >
          {getLabel('clear_button')}
        </button>
        <button
          onClick={handleRebet}
          disabled={lastBetAmount === 0 || lastBetAmount > bankroll || lastBetAmount > maxBet}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={getLabel('rebet_last_bet_aria')}
        >
          {getLabel('rebet_button')}
        </button>
        <button
          onClick={handleAllIn}
          disabled={bankroll === 0}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label={getLabel('bet_all_aria')}
        >
          {getLabel('all_in_button')}
        </button>
      </div>

      {/* Bet slider */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md px-2 sm:px-3 flex-shrink-0">
        <input
          type="range"
          min={0}
          max={Math.min(bankroll, maxBet)}
          step={5}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-full h-1.5 sm:h-2 md:h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary touch-none"
          style={{
            WebkitAppearance: 'none',
            touchAction: 'none',
          }}
          aria-label={getLabel('bet_amount_slider_aria')}
        />
        <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
          <span>$0</span>
          <span className="truncate">${Math.min(bankroll, maxBet)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 w-full mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-primary/30 flex-shrink-0">
        <motion.button
          whileHover={betAmount >= minBet && !prefersReducedMotion ? { scale: 1.05, y: -2 } : {}}
          whileTap={betAmount >= minBet && !prefersReducedMotion ? { scale: 0.95, y: 0 } : {}}
          onClick={handlePlaceBet}
          disabled={betAmount < minBet || betAmount > bankroll || betAmount > maxBet}
          className={cn(
            'btn-casino text-sm sm:text-base md:text-lg',
            'px-4 sm:px-6 md:px-8',
            'py-2.5 sm:py-3 md:py-4',
            'glow-gold flex-1',
            'min-h-[48px] sm:min-h-[52px]',
            'font-bold uppercase tracking-wider',
            'shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
            (betAmount < minBet || betAmount > bankroll || betAmount > maxBet) && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
            betAmount >= minBet && !prefersReducedMotion && 'animate-[pulse-glow_2s_ease-in-out_infinite]'
          )}
          aria-label={betAmount >= minBet ? getLabel('place_bet_aria') : getLabel('cannot_deal_min_bet_aria')}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">💰</span>
            <span>{getLabel('place_bet_button')}</span>
          </span>
        </motion.button>
        {canDeal && onDeal && (
          <motion.button
            whileHover={!prefersReducedMotion ? { scale: 1.05, y: -2 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.95, y: 0 } : {}}
            onClick={onDeal}
            className={cn(
              'btn-casino text-sm sm:text-base md:text-lg',
              'px-4 sm:px-6 md:px-8',
              'py-2.5 sm:py-3 md:py-4',
              'glow-gold flex-1',
              'min-h-[48px] sm:min-h-[52px]',
              'font-bold uppercase tracking-wider',
              'bg-success hover:bg-success/90',
              'shadow-[0_4px_20px_rgba(34,197,94,0.4)]',
              !prefersReducedMotion && 'animate-[pulse-glow_2s_ease-in-out_infinite]'
            )}
            aria-label={getLabel('deal_cards_aria')}
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl sm:text-2xl">🎲</span>
              <span>{getLabel('deal_button')}</span>
            </span>
          </motion.button>
        )}
      </div>
      {betAmount < minBet && betAmount > 0 && (
        <p
          className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1"
          role="alert"
          aria-live="polite"
        >
          {getLabel('minimum_bet')}: ${minBet}
        </p>
      )}
    </motion.div>
  );
});
