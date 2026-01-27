// ============================================================================
// Component - Bet Composer (Main Bet + Side Bets)
// ============================================================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectBankroll, selectConfig, selectPhase } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';
import { DEFAULT_CONFIG } from '@/lib/blackjack/types';
import { useBetValidation } from '../hooks';
import { useReducedMotion, conditionalVariants } from '../a11y';
import { ChipSelector } from './ChipSelector';
import { SideBetToggle } from './SideBetToggle';

export const BetComposer = memo(function BetComposer() {
  const bankroll = useGameStore(selectBankroll);
  const config = useGameStore(selectConfig);
  const phase = useGameStore(selectPhase);
  const placeBet = useGameStore((s) => s.placeBet);
  const placeSideBets = useGameStore((s) => s.placeSideBets);
  const updateConfig = useGameStore((s) => s.updateConfig);
  const { playSound } = useSound({
    enabled: config.soundEnabled ?? false,
    volume: config.soundVolume ?? 0.5,
  });
  const prefersReducedMotion = useReducedMotion();

  const { validateBet, validateSideBet, minBet, maxBet } = useBetValidation();

  const [betAmount, setBetAmount] = useState(0);
  const [lastBetAmount, setLastBetAmount] = useState(0);
  const [perfectPairsBet, setPerfectPairsBet] = useState(0);
  const [twentyOnePlus3Bet, setTwentyOnePlus3Bet] = useState(0);

  // Reset bet amount when phase changes to BETTING
  useEffect(() => {
    if (phase === 'BETTING') {
      setBetAmount(0);
      setPerfectPairsBet(0);
      setTwentyOnePlus3Bet(0);
    }
  }, [phase]);

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
    setPerfectPairsBet(0);
    setTwentyOnePlus3Bet(0);
  }, [betAmount]);

  const handleRebet = useCallback(() => {
    if (lastBetAmount > 0 && lastBetAmount <= bankroll && lastBetAmount <= maxBet) {
      setBetAmount(lastBetAmount);
    } else {
      toast.error('Rebet unavailable', {
        description: 'Previous bet amount is invalid',
      });
    }
  }, [lastBetAmount, bankroll, maxBet]);

  const handleAllIn = useCallback(() => {
    setBetAmount(Math.min(bankroll, maxBet));
  }, [bankroll, maxBet]);

  const handleDeal = useCallback(() => {
    try {
      validateBet(betAmount);
      if (config.perfectPairs?.enabled) validateSideBet('perfectPairs', perfectPairsBet);
      if (config.twentyOnePlus3?.enabled) validateSideBet('twentyOnePlus3', twentyOnePlus3Bet);

      // Place side bets FIRST (while phase is still BETTING)
      // Always call placeSideBets to ensure side bets are set (even if 0)
      placeSideBets(perfectPairsBet, twentyOnePlus3Bet);
      
      // Then place main bet (this will change phase from BETTING to DEALING/PLAYER_TURN)
      placeBet(betAmount);
      playSound('chipStack');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error placing bet';
      toast.error('Error', {
        description: message,
      });
      console.error('BetComposer error:', error);
    }
  }, [betAmount, perfectPairsBet, twentyOnePlus3Bet, validateBet, validateSideBet, placeBet, placeSideBets, playSound, config]);

  useEffect(() => {
    if (betAmount > maxBet) {
      setBetAmount(Math.min(bankroll, maxBet));
    }
    if (betAmount > bankroll) {
      setBetAmount(bankroll);
    }
  }, [maxBet, bankroll, betAmount]);

  // Memoized calculations
  const canDeal = useMemo(
    () =>
      phase === 'BETTING' &&
      betAmount >= minBet &&
      betAmount <= bankroll &&
      betAmount <= maxBet,
    [phase, betAmount, minBet, bankroll, maxBet]
  );

  const totalBets = useMemo(
    () => betAmount + perfectPairsBet + twentyOnePlus3Bet,
    [betAmount, perfectPairsBet, twentyOnePlus3Bet]
  );

  const canAffordSideBets = useMemo(
    () => totalBets <= bankroll,
    [totalBets, bankroll]
  );

  const availableBankroll = useMemo(
    () => bankroll - betAmount,
    [bankroll, betAmount]
  );

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
      {/* Bet amount display - Always visible */}
      <div className="text-center w-full flex-shrink-0">
        <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">
          Your Bet
        </div>
        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary break-all">
          ${betAmount}
        </div>
      </div>

      {/* Chip buttons - Always visible */}
      <div className="flex-shrink-0 w-full">
        <ChipSelector
          onChipClick={handleChipClick}
          maxValue={Math.min(bankroll, maxBet)}
          disabled={betAmount >= maxBet || betAmount >= bankroll}
        />
      </div>

      {/* Quick actions - Always visible */}
      <div className="flex gap-2 sm:gap-2.5 md:gap-3 w-full max-w-xs sm:max-w-sm md:max-w-md px-1 flex-shrink-0">
        <button
          onClick={handleClear}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label="Clear bet"
        >
          Clear
        </button>
        <button
          onClick={handleRebet}
          disabled={lastBetAmount === 0 || lastBetAmount > bankroll || lastBetAmount > maxBet}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Rebet last bet"
        >
          Rebet
        </button>
        <button
          onClick={handleAllIn}
          disabled={bankroll === 0}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label="Bet all"
        >
          All In
        </button>
      </div>

      {/* Bet slider - Always visible */}
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
          aria-label="Bet amount slider"
        />
        <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
          <span>$0</span>
          <span className="truncate">${Math.min(bankroll, maxBet)}</span>
        </div>
      </div>

      {/* Side Bets Section - Scrollable ONLY if needed */}
      <div className="w-full border-t-2 border-primary/20 pt-2 sm:pt-3 mt-2 sm:mt-3 space-y-2 sm:space-y-3 max-h-[120px] sm:max-h-[140px] overflow-y-auto flex-shrink">
        <div className="relative text-center mb-1 sm:mb-2">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30">
            <span className="text-sm sm:text-base md:text-lg">🎰</span>
            <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-bold text-primary">
              Side Bets
            </span>
          </div>
        </div>

        {/* Perfect Pairs */}
        {config.perfectPairs && (
          <SideBetToggle
            name="perfectPairs"
            label="Perfect Pairs"
            description="Win if your first 2 cards form a pair"
            config={config.perfectPairs}
            enabled={config.perfectPairs.enabled}
            bet={perfectPairsBet}
            onToggle={(checked) => {
              updateConfig({
                perfectPairs: {
                  ...(config.perfectPairs || DEFAULT_CONFIG.perfectPairs),
                  enabled: checked,
                },
              });
              if (!checked) setPerfectPairsBet(0);
            }}
            onBetChange={setPerfectPairsBet}
            maxBet={config.perfectPairs.maxBet}
            availableBankroll={availableBankroll - twentyOnePlus3Bet}
            payouts={{
              Mixed: config.perfectPairs.payouts.mixed,
              Colored: config.perfectPairs.payouts.colored,
              Perfect: config.perfectPairs.payouts.perfect,
            }}
          />
        )}

        {/* 21+3 */}
        {config.twentyOnePlus3 && (
          <SideBetToggle
            name="twentyOnePlus3"
            label="21+3"
            description="Your 2 cards + dealer's card = poker hand"
            config={config.twentyOnePlus3}
            enabled={config.twentyOnePlus3.enabled}
            bet={twentyOnePlus3Bet}
            onToggle={(checked) => {
              updateConfig({
                twentyOnePlus3: {
                  ...(config.twentyOnePlus3 || DEFAULT_CONFIG.twentyOnePlus3),
                  enabled: checked,
                },
              });
              if (!checked) setTwentyOnePlus3Bet(0);
            }}
            onBetChange={setTwentyOnePlus3Bet}
            maxBet={config.twentyOnePlus3.maxBet}
            availableBankroll={availableBankroll - perfectPairsBet}
            payouts={{
              Flush: config.twentyOnePlus3.payouts.flush,
              Straight: config.twentyOnePlus3.payouts.straight,
              '3 of a Kind': config.twentyOnePlus3.payouts.threeOfAKind,
              'Straight Flush': config.twentyOnePlus3.payouts.straightFlush,
            }}
          />
        )}

        {/* Total side bets display */}
        {(perfectPairsBet > 0 || twentyOnePlus3Bet > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-2 mt-2 border-t-2 border-primary/20"
          >
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-1">
              Total Side Bets
            </div>
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold',
                canAffordSideBets
                  ? 'text-primary drop-shadow-lg'
                  : 'text-destructive drop-shadow-lg'
              )}
            >
              ${perfectPairsBet + twentyOnePlus3Bet}
            </div>
            {!canAffordSideBets && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs sm:text-sm text-destructive mt-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 inline-block"
              >
                ⚠️ Total exceeds bankroll
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Deal button - ALWAYS VISIBLE, NO SCROLL NEEDED */}
      <div className="w-full mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-primary/30 flex-shrink-0">
        <motion.button
          whileHover={canDeal && !prefersReducedMotion ? { scale: 1.05, y: -2 } : {}}
          whileTap={canDeal && !prefersReducedMotion ? { scale: 0.95, y: 0 } : {}}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!canDeal) {
              return;
            }
            handleDeal();
          }}
          disabled={!canDeal}
          className={cn(
            'btn-casino text-sm sm:text-base md:text-lg lg:text-xl',
            'px-4 sm:px-6 md:px-8 lg:px-10',
            'py-2.5 sm:py-3 md:py-4 lg:py-5',
            'glow-gold w-full',
            'min-h-[48px] sm:min-h-[52px] md:min-h-[56px]',
            'font-bold uppercase tracking-wider',
            'shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
            !canDeal && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
            canDeal && !prefersReducedMotion && 'animate-[pulse-glow_2s_ease-in-out_infinite]'
          )}
          style={{
            pointerEvents: canDeal ? 'auto' : 'none',
          }}
          aria-label={canDeal ? 'Deal cards' : 'Cannot deal: minimum bet not met'}
          aria-disabled={!canDeal}
          aria-describedby={!canDeal && betAmount < minBet ? 'deal-error' : undefined}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">🎲</span>
            <span>Deal</span>
            {canDeal && <span className="text-sm sm:text-base">✓</span>}
          </span>
        </motion.button>
        {!canDeal && betAmount < minBet && (
          <p
            id="deal-error"
            className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1"
            role="alert"
            aria-live="polite"
          >
            Minimum bet: ${minBet}
          </p>
        )}
      </div>
    </motion.div>
  );
});

export default BetComposer;
