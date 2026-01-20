// ============================================================================
// Bet Panel Component - Handles bet placement
// ============================================================================

import { useState, useCallback, memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectBankroll, selectConfig, selectPhase } from '@/store/useGameStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useSound } from '@/hooks/useSound';
import { DEFAULT_CONFIG } from '@/lib/blackjack/types';

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
      whileHover={disabled ? {} : { 
        scale: 1.15, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={disabled ? {} : { 
        scale: 0.9, 
        y: 0,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'poker-chip cursor-pointer text-xs font-bold',
        color,
        disabled && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
      )}
      style={{
        boxShadow: disabled ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
      aria-label={`Ajouter ${value}$ à la mise`}
      title={`Ajouter ${value}$`}
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
  const phase = useGameStore(selectPhase);
  const placeBet = useGameStore(s => s.placeBet);
  const placeSideBets = useGameStore(s => s.placeSideBets);
  const updateConfig = useGameStore(s => s.updateConfig);
  const { playSound } = useSound({ 
    enabled: config.soundEnabled ?? false, 
    volume: config.soundVolume ?? 0.5 
  });
  
  const [betAmount, setBetAmount] = useState(0);
  const [perfectPairsBet, setPerfectPairsBet] = useState(0);
  const [twentyOnePlus3Bet, setTwentyOnePlus3Bet] = useState(0);
  
  const handleChipClick = useCallback((value: number) => {
    setBetAmount(prev => Math.min(prev + value, bankroll, config.maxBet));
  }, [bankroll, config.maxBet]);
  
  const handleClear = useCallback(() => {
    setBetAmount(0);
  }, []);
  
  const handleAllIn = useCallback(() => {
    setBetAmount(Math.min(bankroll, config.maxBet));
  }, [bankroll, config.maxBet]);
  
  const handleDeal = useCallback(() => {
    if (betAmount < config.minBet) {
      toast.error('Mise insuffisante', {
        description: `La mise minimum est de $${config.minBet}.`,
      });
      return;
    }
    
    if (betAmount > bankroll) {
      toast.error('Fonds insuffisants', {
        description: `Vous n'avez que $${bankroll.toLocaleString()} disponibles.`,
      });
      return;
    }
    
    if (betAmount > config.maxBet) {
      toast.error('Mise trop élevée', {
        description: `La mise maximum est de $${config.maxBet}.`,
      });
      return;
    }
    
    try {
      playSound('chip');
      
      // Place side bets first if any
      if (perfectPairsBet > 0 || twentyOnePlus3Bet > 0) {
        placeSideBets(
          perfectPairsBet > 0 ? perfectPairsBet : undefined,
          twentyOnePlus3Bet > 0 ? twentyOnePlus3Bet : undefined
        );
      }
      
      // Then place main bet and deal
      placeBet(betAmount);
      playSound('deal');
      
      // Reset bet amounts after successful bet
      setBetAmount(0);
      setPerfectPairsBet(0);
      setTwentyOnePlus3Bet(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du placement de la mise';
      toast.error('Erreur', {
        description: message,
      });
      console.error('BetPanel error:', error);
    }
  }, [betAmount, perfectPairsBet, twentyOnePlus3Bet, config.minBet, config.maxBet, bankroll, placeBet, placeSideBets]);
  
  // Update bet amount when config changes (only cap max, don't force min)
  useEffect(() => {
    if (betAmount > config.maxBet) {
      setBetAmount(Math.min(bankroll, config.maxBet));
    }
    if (betAmount > bankroll) {
      setBetAmount(bankroll);
    }
  }, [config.maxBet, bankroll, betAmount]);
  
  const canDeal = phase === 'BETTING' && betAmount >= config.minBet && betAmount <= bankroll && betAmount <= config.maxBet;
  const totalBets = betAmount + perfectPairsBet + twentyOnePlus3Bet;
  const canAffordSideBets = totalBets <= bankroll;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 p-2 rounded-xl bg-card/50 backdrop-blur-sm border border-border max-w-2xl w-full"
    >
      {/* Bet amount display - Compact */}
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
          Your Bet
        </div>
        <div className="text-2xl font-bold text-primary">
          ${betAmount}
        </div>
      </div>
      
      {/* Chip buttons - Compact */}
      <div className="flex flex-wrap justify-center gap-1.5">
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
      
      {/* Quick actions - Compact */}
      <div className="flex gap-1.5">
        <button
          onClick={handleClear}
          className="btn-casino-secondary text-xs px-2 py-1"
          aria-label="Réinitialiser la mise"
        >
          Clear
        </button>
        <button
          onClick={handleAllIn}
          disabled={bankroll === 0}
          className="btn-casino-secondary text-xs px-2 py-1"
          aria-label="Miser tout"
        >
          All In
        </button>
      </div>
      
      {/* Bet slider - Compact */}
      <div className="w-full max-w-xs">
        <input
          type="range"
          min={0}
          max={Math.min(bankroll, config.maxBet)}
          step={5}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          aria-label="Bet amount slider"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
          <span>$0</span>
          <span>${Math.min(bankroll, config.maxBet)}</span>
        </div>
      </div>
      
      {/* Side Bets Section - Compact and Collapsible */}
      <div className="w-full border-t border-border pt-2 mt-2 space-y-2 max-h-64 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-muted-foreground text-center mb-1.5">
          🎰 Side Bets
        </div>
        
        {/* Perfect Pairs */}
        <div className="bg-card/30 rounded-lg p-3 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Perfect Pairs</span>
              <span className="text-xs text-muted-foreground" title="Gagnez si vos 2 premières cartes forment une paire">
                ℹ️
              </span>
            </div>
            <Switch
              id="perfect-pairs-toggle"
              checked={config.perfectPairs?.enabled ?? false}
              onCheckedChange={(checked) => {
                updateConfig({
                  perfectPairs: { 
                    ...(config.perfectPairs || DEFAULT_CONFIG.perfectPairs), 
                    enabled: checked 
                  },
                });
                if (!checked) setPerfectPairsBet(0);
              }}
            />
          </div>
          
          {config.perfectPairs?.enabled && (
            <div className="space-y-3">
              {/* Explanation */}
              <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                <div className="font-medium mb-1">💡 Comment ça marche ?</div>
                <div>Si vos 2 premières cartes forment une paire, vous gagnez !</div>
                <div className="mt-1 flex gap-2 text-[10px]">
                  <span>🔴 Mixed: {config.perfectPairs?.payouts?.mixed ?? 5}:1</span>
                  <span>🟢 Colored: {config.perfectPairs?.payouts?.colored ?? 10}:1</span>
                  <span>⭐ Perfect: {config.perfectPairs?.payouts?.perfect ?? 25}:1</span>
                </div>
              </div>
              
              {/* Bet amount display */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Mise Perfect Pairs</div>
                <div className="text-xl font-bold text-primary">${perfectPairsBet}</div>
              </div>
              
              {/* Chip buttons for side bet */}
              <div className="flex flex-wrap justify-center gap-2">
                {[5, 10, 25, 50].map((value) => {
                  const maxBet = Math.min(bankroll - betAmount - twentyOnePlus3Bet, config.perfectPairs?.maxBet ?? 500);
                  const disabled = perfectPairsBet + value > maxBet || value < (config.perfectPairs?.minBet ?? 5);
                  return (
                    <motion.button
                      key={value}
                      whileHover={disabled ? {} : { scale: 1.1, y: -2 }}
                      whileTap={disabled ? {} : { scale: 0.9 }}
                      onClick={() => {
                        const newBet = Math.min(perfectPairsBet + value, maxBet);
                        if (newBet >= (config.perfectPairs?.minBet ?? 5)) {
                          setPerfectPairsBet(newBet);
                        }
                      }}
                      disabled={disabled}
                      className={cn(
                        'poker-chip text-xs font-bold cursor-pointer',
                        value === 5 && 'red',
                        value === 10 && 'red',
                        value === 25 && 'green',
                        value === 50 && 'blue',
                        disabled && 'opacity-30 cursor-not-allowed filter grayscale-[50%]',
                      )}
                      style={{
                        boxShadow: disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      +{value}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Clear button */}
              {perfectPairsBet > 0 && (
                <button
                  onClick={() => setPerfectPairsBet(0)}
                  className="w-full text-xs btn-casino-secondary py-1"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* 21+3 */}
        <div className="bg-card/30 rounded-lg p-3 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">21+3</span>
              <span className="text-xs text-muted-foreground" title="Gagnez si vos 2 cartes + la carte du dealer forment une main de poker">
                ℹ️
              </span>
            </div>
            <Switch
              id="21plus3-toggle"
              checked={config.twentyOnePlus3?.enabled ?? false}
              onCheckedChange={(checked) => {
                updateConfig({
                  twentyOnePlus3: { 
                    ...(config.twentyOnePlus3 || DEFAULT_CONFIG.twentyOnePlus3), 
                    enabled: checked 
                  },
                });
                if (!checked) setTwentyOnePlus3Bet(0);
              }}
            />
          </div>
          
          {config.twentyOnePlus3?.enabled && (
            <div className="space-y-3">
              {/* Explanation */}
              <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                <div className="font-medium mb-1">💡 Comment ça marche ?</div>
                <div>Vos 2 cartes + la carte du dealer = main de poker</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span>🟣 Flush: {config.twentyOnePlus3?.payouts?.flush ?? 5}:1</span>
                  <span>📈 Straight: {config.twentyOnePlus3?.payouts?.straight ?? 10}:1</span>
                  <span>🎯 3 of a Kind: {config.twentyOnePlus3?.payouts?.threeOfAKind ?? 30}:1</span>
                  <span>⭐ Straight Flush: {config.twentyOnePlus3?.payouts?.straightFlush ?? 40}:1</span>
                </div>
              </div>
              
              {/* Bet amount display */}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Mise 21+3</div>
                <div className="text-xl font-bold text-primary">${twentyOnePlus3Bet}</div>
              </div>
              
              {/* Chip buttons for side bet */}
              <div className="flex flex-wrap justify-center gap-2">
                {[5, 10, 25, 50].map((value) => {
                  const maxBet = Math.min(bankroll - betAmount - perfectPairsBet, config.twentyOnePlus3?.maxBet ?? 500);
                  const disabled = twentyOnePlus3Bet + value > maxBet || value < (config.twentyOnePlus3?.minBet ?? 5);
                  return (
                    <motion.button
                      key={value}
                      whileHover={disabled ? {} : { scale: 1.1, y: -2 }}
                      whileTap={disabled ? {} : { scale: 0.9 }}
                      onClick={() => {
                        const newBet = Math.min(twentyOnePlus3Bet + value, maxBet);
                        if (newBet >= (config.twentyOnePlus3?.minBet ?? 5)) {
                          setTwentyOnePlus3Bet(newBet);
                        }
                      }}
                      disabled={disabled}
                      className={cn(
                        'poker-chip text-xs font-bold cursor-pointer',
                        value === 5 && 'red',
                        value === 10 && 'red',
                        value === 25 && 'green',
                        value === 50 && 'blue',
                        disabled && 'opacity-30 cursor-not-allowed filter grayscale-[50%]',
                      )}
                      style={{
                        boxShadow: disabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      +{value}
                    </motion.button>
                  );
                })}
              </div>
              
              {/* Clear button */}
              {twentyOnePlus3Bet > 0 && (
                <button
                  onClick={() => setTwentyOnePlus3Bet(0)}
                  className="w-full text-xs btn-casino-secondary py-1"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Total side bets display */}
        {(perfectPairsBet > 0 || twentyOnePlus3Bet > 0) && (
          <div className="text-center pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">Total Side Bets</div>
            <div className={cn(
              "text-lg font-bold",
              canAffordSideBets ? "text-primary" : "text-destructive"
            )}>
              ${perfectPairsBet + twentyOnePlus3Bet}
            </div>
            {!canAffordSideBets && (
              <div className="text-xs text-destructive mt-1">
                ⚠️ Total dépasse votre bankroll
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Deal button with premium animation */}
      <motion.button
        whileHover={canDeal ? { 
          scale: 1.05, 
          y: -2,
          transition: { duration: 0.2 }
        } : {}}
        whileTap={canDeal ? { 
          scale: 0.95, 
          y: 0,
          transition: { duration: 0.1 }
        } : {}}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[BetPanel] Deal button clicked', { betAmount, canDeal, bankroll, config, phase });
          if (!canDeal) {
            console.warn('[BetPanel] Cannot deal:', { betAmount, minBet: config.minBet, maxBet: config.maxBet, bankroll, phase });
            return;
          }
          handleDeal();
        }}
        disabled={!canDeal}
        className={cn(
          'btn-casino text-lg px-8 py-4 glow-gold',
          !canDeal && 'opacity-50 cursor-not-allowed filter grayscale-[50%]'
        )}
        style={{ 
          pointerEvents: canDeal ? 'auto' : 'none',
        }}
        aria-label="Distribuer les cartes"
        aria-disabled={!canDeal}
        type="button"
      >
        Deal
      </motion.button>
    </motion.div>
  );
});

export default BetPanel;
