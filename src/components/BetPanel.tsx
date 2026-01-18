// ============================================================================
// Bet Panel Component - Handles bet placement
// ============================================================================

import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectBankroll, selectConfig } from '@/store/useGameStore';
import { cn } from '@/lib/utils';

interface ChipButtonProps {
  value: number;
  color: 'red' | 'blue' | 'green' | 'black' | 'gold';
  onClick: () => void;
  disabled?: boolean;
}

const ChipButton = memo(function ChipButton({ 
  value, 
  color, 
  onClick, 
  disabled 
}: ChipButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'poker-chip cursor-pointer text-xs font-bold',
        color,
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      aria-label={`Add ${value} to bet`}
    >
      {value}
    </motion.button>
  );
});

const CHIP_VALUES: Array<{ value: number; color: 'red' | 'blue' | 'green' | 'black' | 'gold' }> = [
  { value: 10, color: 'red' },
  { value: 25, color: 'green' },
  { value: 50, color: 'blue' },
  { value: 100, color: 'black' },
  { value: 500, color: 'gold' },
];

export const BetPanel = memo(function BetPanel() {
  const bankroll = useGameStore(selectBankroll);
  const config = useGameStore(selectConfig);
  const placeBet = useGameStore(s => s.placeBet);
  
  const [betAmount, setBetAmount] = useState(config.minBet);
  
  const handleChipClick = useCallback((value: number) => {
    setBetAmount(prev => Math.min(prev + value, bankroll, config.maxBet));
  }, [bankroll, config.maxBet]);
  
  const handleClear = useCallback(() => {
    setBetAmount(config.minBet);
  }, [config.minBet]);
  
  const handleAllIn = useCallback(() => {
    setBetAmount(Math.min(bankroll, config.maxBet));
  }, [bankroll, config.maxBet]);
  
  const handleDeal = useCallback(() => {
    if (betAmount >= config.minBet && betAmount <= bankroll) {
      placeBet(betAmount);
    }
  }, [betAmount, config.minBet, bankroll, placeBet]);
  
  const canDeal = betAmount >= config.minBet && betAmount <= bankroll;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 p-4 sm:p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
    >
      {/* Bet amount display */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Your Bet
        </div>
        <div className="text-3xl sm:text-4xl font-bold text-primary">
          ${betAmount}
        </div>
      </div>
      
      {/* Chip buttons */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {CHIP_VALUES.map(({ value, color }) => (
          <ChipButton
            key={value}
            value={value}
            color={color}
            onClick={() => handleChipClick(value)}
            disabled={betAmount + value > bankroll || betAmount >= config.maxBet}
          />
        ))}
      </div>
      
      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="btn-casino-secondary text-xs px-3 py-2"
        >
          Clear
        </button>
        <button
          onClick={handleAllIn}
          disabled={bankroll === 0}
          className="btn-casino-secondary text-xs px-3 py-2"
        >
          All In
        </button>
      </div>
      
      {/* Bet slider */}
      <div className="w-full max-w-xs">
        <input
          type="range"
          min={config.minBet}
          max={Math.min(bankroll, config.maxBet)}
          step={5}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          aria-label="Bet amount slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>${config.minBet}</span>
          <span>${Math.min(bankroll, config.maxBet)}</span>
        </div>
      </div>
      
      {/* Deal button */}
      <motion.button
        whileHover={{ scale: canDeal ? 1.02 : 1 }}
        whileTap={{ scale: canDeal ? 0.98 : 1 }}
        onClick={handleDeal}
        disabled={!canDeal}
        className="btn-casino text-lg px-8 py-4 glow-gold"
        aria-label="Deal cards"
      >
        Deal
      </motion.button>
    </motion.div>
  );
});

export default BetPanel;
