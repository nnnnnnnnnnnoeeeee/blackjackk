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
  const [lastBetAmount, setLastBetAmount] = useState(0); // Stocker la dernière mise
  const [perfectPairsBet, setPerfectPairsBet] = useState(0);
  const [twentyOnePlus3Bet, setTwentyOnePlus3Bet] = useState(0);
  
  // Sauvegarder la mise quand on revient à la phase BETTING (après une partie)
  useEffect(() => {
    if (phase === 'BETTING') {
      // La mise précédente est déjà sauvegardée dans handleDeal
      // On réinitialise juste betAmount pour la nouvelle partie
      setBetAmount(0);
    }
  }, [phase]);
  
  const handleChipClick = useCallback((value: number) => {
    setBetAmount(prev => Math.min(prev + value, bankroll, config.maxBet));
  }, [bankroll, config.maxBet]);
  
  const handleClear = useCallback(() => {
    setBetAmount(0);
  }, []);
  
  const handleRebet = useCallback(() => {
    if (lastBetAmount > 0 && lastBetAmount <= bankroll && lastBetAmount <= config.maxBet) {
      setBetAmount(lastBetAmount);
      playSound('chip');
    }
  }, [lastBetAmount, bankroll, config.maxBet, playSound]);
  
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
      
      // Sauvegarder la mise pour le rebet avant de la placer
      setLastBetAmount(betAmount);
      
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
      className="flex flex-col items-center gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-card/50 backdrop-blur-sm border border-border max-w-2xl w-full relative"
    >
      {/* Bet amount display - Fully Responsive */}
      <div className="text-center w-full">
        <div className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">
          Your Bet
        </div>
        <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary break-all">
          ${betAmount}
        </div>
      </div>
      
      {/* Chip buttons - Fully Responsive & Touch-friendly */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full px-1">
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
      
      {/* Quick actions - Fully Responsive & Touch-friendly */}
      <div className="flex gap-1.5 sm:gap-2 md:gap-2.5 w-full max-w-xs sm:max-w-sm md:max-w-md">
        <button
          onClick={handleClear}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label="Réinitialiser la mise"
        >
          Clear
        </button>
        <button
          onClick={handleRebet}
          disabled={lastBetAmount === 0 || lastBetAmount > bankroll || lastBetAmount > config.maxBet}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Remiser la mise précédente"
        >
          Remiser
        </button>
        <button
          onClick={handleAllIn}
          disabled={bankroll === 0}
          className="btn-casino-secondary text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 flex-1 min-h-[44px] sm:min-h-[48px]"
          aria-label="Miser tout"
        >
          All In
        </button>
      </div>
      
      {/* Bet slider - Fully Responsive */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md px-1 sm:px-2">
        <input
          type="range"
          min={0}
          max={Math.min(bankroll, config.maxBet)}
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
          <span className="truncate">${Math.min(bankroll, config.maxBet)}</span>
        </div>
      </div>
      
      {/* Side Bets Section - Premium Casino Style - Fully Responsive */}
      <div className="w-full border-t-2 border-primary/20 pt-2 sm:pt-3 mt-2 sm:mt-3 space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-64 overflow-y-auto pb-2">
        <div className="relative text-center mb-2 sm:mb-3">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30">
            <span className="text-sm sm:text-base md:text-lg">🎰</span>
            <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-bold text-primary">
              Side Bets
            </span>
          </div>
        </div>
        
        {/* Perfect Pairs - Premium Card Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-card/40 via-card/30 to-card/40 rounded-xl p-3 sm:p-4 border-2 border-primary/20 shadow-lg backdrop-blur-sm"
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-xl" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
                Perfect Pairs
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center cursor-help"
                title="Gagnez si vos 2 premières cartes forment une paire"
              >
                <span className="text-[10px] sm:text-xs font-bold text-primary">ℹ</span>
              </motion.button>
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-3"
            >
              {/* Explanation - Premium Style */}
              <div className="relative bg-gradient-to-br from-primary/10 via-background/60 to-primary/10 rounded-lg p-3 border border-primary/20">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">💡</span>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                      Comment ça marche ?
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                      Si vos 2 premières cartes forment une paire, vous gagnez !
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                      <span className="px-2 py-1 rounded bg-destructive/20 border border-destructive/30 text-destructive font-semibold">
                        🔴 Mixed: {config.perfectPairs?.payouts?.mixed ?? 5}:1
                      </span>
                      <span className="px-2 py-1 rounded bg-success/20 border border-success/30 text-success font-semibold">
                        🟢 Colored: {config.perfectPairs?.payouts?.colored ?? 10}:1
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/20 border border-primary/30 text-primary font-semibold">
                        ⭐ Perfect: {config.perfectPairs?.payouts?.perfect ?? 25}:1
                      </span>
                    </div>
                  </div>
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
            </motion.div>
          )}
        </motion.div>
        
        {/* 21+3 - Premium Card Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-card/40 via-card/30 to-card/40 rounded-xl p-3 sm:p-4 border-2 border-primary/20 shadow-lg backdrop-blur-sm"
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/30 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-xl" />
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide">
                21+3
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center cursor-help"
                title="Gagnez si vos 2 cartes + la carte du dealer forment une main de poker"
              >
                <span className="text-[10px] sm:text-xs font-bold text-primary">ℹ</span>
              </motion.button>
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-3"
            >
              {/* Explanation - Premium Style */}
              <div className="relative bg-gradient-to-br from-primary/10 via-background/60 to-primary/10 rounded-lg p-3 border border-primary/20">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">💡</span>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                      Comment ça marche ?
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                      Vos 2 cartes + la carte du dealer = main de poker
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                      <span className="px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold">
                        🟣 Flush: {config.twentyOnePlus3?.payouts?.flush ?? 5}:1
                      </span>
                      <span className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 font-semibold">
                        📈 Straight: {config.twentyOnePlus3?.payouts?.straight ?? 10}:1
                      </span>
                      <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-semibold">
                        🎯 3 of a Kind: {config.twentyOnePlus3?.payouts?.threeOfAKind ?? 30}:1
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/20 border border-primary/30 text-primary font-semibold">
                        ⭐ Straight Flush: {config.twentyOnePlus3?.payouts?.straightFlush ?? 40}:1
                      </span>
                    </div>
                  </div>
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
            </motion.div>
          )}
        </motion.div>
        
        {/* Total side bets display - Premium Style */}
        {(perfectPairsBet > 0 || twentyOnePlus3Bet > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center pt-3 mt-3 border-t-2 border-primary/20"
          >
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-foreground mb-1">
              Total Side Bets
            </div>
            <div className={cn(
              "text-xl sm:text-2xl font-bold",
              canAffordSideBets 
                ? "text-primary drop-shadow-lg" 
                : "text-destructive drop-shadow-lg"
            )}>
              ${perfectPairsBet + twentyOnePlus3Bet}
            </div>
            {!canAffordSideBets && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs sm:text-sm text-destructive mt-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 inline-block"
              >
                ⚠️ Total dépasse votre bankroll
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Deal button - Always Visible & Accessible - Fixed on Mobile */}
      <div className="fixed sm:sticky bottom-0 left-0 right-0 w-full sm:w-auto sm:relative mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-primary/30 bg-gradient-to-t from-card/95 via-card/90 to-card/80 backdrop-blur-md px-2 sm:px-3 md:px-4 pb-2 sm:pb-0 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] sm:shadow-none">
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
            'btn-casino text-base sm:text-lg md:text-xl lg:text-2xl',
            'px-6 sm:px-8 md:px-10 lg:px-12',
            'py-3 sm:py-4 md:py-5 lg:py-6',
            'glow-gold w-full',
            'min-h-[56px] sm:min-h-[60px] md:min-h-[64px]',
            'font-bold uppercase tracking-wider',
            'shadow-[0_4px_20px_rgba(212,175,55,0.4)]',
            'relative z-50',
            !canDeal && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
            canDeal && 'animate-[pulse-glow_2s_ease-in-out_infinite]'
          )}
          style={{ 
            pointerEvents: canDeal ? 'auto' : 'none',
          }}
          aria-label="Distribuer les cartes"
          aria-disabled={!canDeal}
          type="button"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">🎲</span>
            <span>Deal</span>
            {canDeal && <span className="text-sm sm:text-base">✓</span>}
          </span>
        </motion.button>
        {!canDeal && betAmount < config.minBet && (
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">
            Mise minimum: ${config.minBet}
          </p>
        )}
      </div>
    </motion.div>
  );
});

export default BetPanel;
