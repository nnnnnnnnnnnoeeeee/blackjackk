// ============================================================================
// Main Blackjack Table - The game board
// ============================================================================

import { memo, useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGameStore, 
  selectPhase, 
  selectDealerHand, 
  selectPlayerHands, 
  selectActiveHandIndex,
  selectResults,
  selectCurrentBet,
  selectBankroll,
  selectConfig,
} from '@/store/useGameStore';
import { HandView } from './HandView';
import { BetPanel } from './BetPanel';
import { Controls } from './Controls';
import { StatsPanel } from './StatsPanel';
import { StatsDashboard } from './StatsDashboard';
import { CardCountingPanel } from './CardCountingPanel';
import { SettingsPanel } from './SettingsPanel';
import { Tutorial } from './Tutorial';
import { BasicStrategyChart } from './BasicStrategyChart';
import { ParticleSystem } from './ParticleSystem';
import { GameStatusBar } from './GameStatusBar';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

export const Table = memo(function Table() {
  const phase = useGameStore(selectPhase);
  const dealerHand = useGameStore(selectDealerHand);
  const playerHands = useGameStore(selectPlayerHands);
  const activeHandIndex = useGameStore(selectActiveHandIndex);
  const results = useGameStore(selectResults);
  const currentBet = useGameStore(selectCurrentBet);
  const bankroll = useGameStore(selectBankroll);
  const insuranceBet = useGameStore(s => s.gameState.insuranceBet);
  const sideBetResults = useGameStore(s => s.gameState.sideBetResults);
  const isAnimating = useGameStore(s => s.isAnimating);
  const newRound = useGameStore(s => s.newRound);
  const resetGame = useGameStore(s => s.resetGame);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [showStrategyChart, setShowStrategyChart] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particleType, setParticleType] = useState<'win' | 'lose' | 'blackjack' | 'chip'>('win');
  
  // Sound effects (disabled by default)
  const config = useGameStore(selectConfig);
  const { playSound } = useSound({ 
    enabled: config.soundEnabled ?? false, 
    volume: config.soundVolume ?? 0.5 
  });
  
  // Play sounds and particles on settlement - Clean particles when phase changes
  useEffect(() => {
    // Always clean particles when leaving SETTLEMENT phase
    if (phase !== 'SETTLEMENT') {
      setParticleTrigger(false);
      return;
    }
    
    if (phase === 'SETTLEMENT' && results.length > 0) {
      const hasWin = results.some(r => r.result === 'win' || r.result === 'blackjack');
      const hasBlackjack = results.some(r => r.result === 'blackjack');
      const hasLoss = results.some(r => r.result === 'lose');
      
      if (hasBlackjack) {
        playSound('blackjack');
        setParticleType('blackjack');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 1200); // Longer duration for animation
      } else if (hasWin) {
        playSound('win');
        setParticleType('win');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 1200);
      } else if (hasLoss) {
        playSound('lose');
        setParticleType('lose');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 1200);
      }
    } else {
      // No results, ensure particles are cleared
      setParticleTrigger(false);
    }
  }, [phase, results, playSound]);
  
  // Safety: Reset isAnimating if stuck (shouldn't be animating in BETTING or SETTLEMENT)
  useEffect(() => {
    if (isAnimating && (phase === 'BETTING' || phase === 'SETTLEMENT')) {
      console.log('[Table] Force resetting isAnimating for phase:', phase);
      useGameStore.setState({ isAnimating: false });
    }
  }, [phase, isAnimating]);
  
  // Safety: If we're stuck in DEALER_TURN without animation, force finishRound
  // Use a ref to prevent multiple calls
  const finishRoundAttemptedRef = useRef(false);
  
  useEffect(() => {
    // Reset ref when phase changes to BETTING or DEALING (new round starting)
    if (phase === 'BETTING' || phase === 'DEALING') {
      finishRoundAttemptedRef.current = false;
      // Also ensure isAnimating is false when starting a new round
      if (isAnimating) {
        useGameStore.setState({ isAnimating: false });
      }
      return;
    }
    
    if (phase === 'DEALER_TURN' && !isAnimating && !finishRoundAttemptedRef.current) {
      finishRoundAttemptedRef.current = true;
      const timeout = setTimeout(() => {
        const currentState = useGameStore.getState();
        if (currentState.gameState.phase === 'DEALER_TURN' && !currentState.isAnimating) {
          console.log('[Table] Stuck in DEALER_TURN, forcing finishRound');
          currentState.finishRound().catch(err => {
            console.error('[Table] Error forcing finishRound:', err);
            // Force to SETTLEMENT on error
            useGameStore.setState({
              gameState: {
                ...currentState.gameState,
                phase: 'SETTLEMENT',
              },
              isAnimating: false,
            });
          });
        }
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    } else if (phase !== 'DEALER_TURN') {
      // Reset ref when phase changes away from DEALER_TURN
      finishRoundAttemptedRef.current = false;
    }
  }, [phase, isAnimating]);
  
  const getHandResult = useCallback((index: number) => {
    if (phase !== 'SETTLEMENT') return null;
    const result = results.find(r => r.handIndex === index);
    return result?.result || null;
  }, [phase, results]);
  
  const getDealerResult = useCallback(() => {
    if (phase !== 'SETTLEMENT') return null;
    // If all player hands lost, dealer wins; otherwise check actual results
    const playerWon = results.some(r => r.result === 'win' || r.result === 'blackjack');
    const allPush = results.every(r => r.result === 'push');
    if (allPush) return 'push';
    if (playerWon) return 'lose';
    return 'win';
  }, [phase, results]);
  
  const isPlaying = phase !== 'BETTING' && phase !== 'SETTLEMENT';
  const showNewRound = phase === 'SETTLEMENT' && !isAnimating;
  const isBankrupt = bankroll === 0 && phase === 'SETTLEMENT';
  
  console.log('[Table] Render check', { phase, showNewRound, isBankrupt, bankroll });
  
  
  return (
    <div className="table-felt table-border h-screen flex flex-col overflow-hidden">
      {/* Header / Stats - Fully Responsive */}
      <header className="flex-shrink-0 p-1.5 sm:p-2 md:p-3">
        <div className="max-w-2xl mx-auto w-full px-1 sm:px-2">
          <div className="flex justify-between items-center mb-1 sm:mb-1.5 md:mb-2 gap-2">
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-primary text-shadow-md flex-shrink-0">
              ♠ Blackjack
            </h1>
            <div className="text-right flex-shrink-0 min-w-0">
              <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider block">
                Bankroll
              </span>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground truncate">
                ${bankroll.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Phase indicator - Responsive */}
          <GameStatusBar
            phase={phase}
            activeHandIndex={activeHandIndex}
            totalHands={playerHands.length}
          />
          
          {/* Stats Panels - Fully Responsive */}
          <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
            {!showSettings && !showStatsDashboard && !showStrategyChart && (
              <>
                <StatsPanel />
                <CardCountingPanel />
              </>
            )}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-2.5 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg',
                  'bg-gradient-to-b from-card/80 to-card/60',
                  'border-2 border-primary/30 shadow-lg',
                  'backdrop-blur-sm transition-all duration-200',
                  'min-w-[48px] sm:min-w-[56px] min-h-[44px] sm:min-h-[48px]',
                  'flex items-center justify-center',
                  showSettings && 'border-primary/60 shadow-gold ring-2 ring-primary/20',
                  'hover:border-primary/50 hover:shadow-xl',
                )}
                aria-label="Settings"
              >
                <span className="text-lg sm:text-xl">
                  {showSettings ? '✕' : '⚙️'}
                </span>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-lg bg-primary/10 pointer-events-none"
                  />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStatsDashboard(!showStatsDashboard)}
                className={cn(
                  'relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg',
                  'bg-gradient-to-b from-card/80 to-card/60',
                  'border-2 border-primary/30 shadow-lg',
                  'backdrop-blur-sm transition-all duration-200',
                  'min-w-[48px] sm:min-w-[56px] min-h-[44px] sm:min-h-[48px]',
                  'flex items-center justify-center',
                  showStatsDashboard && 'border-primary/60 shadow-gold ring-2 ring-primary/20',
                  'hover:border-primary/50 hover:shadow-xl',
                )}
                aria-label="Stats Dashboard"
              >
                <span className="text-lg sm:text-xl">
                  {showStatsDashboard ? '✕' : '📊'}
                </span>
                {showStatsDashboard && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 rounded-lg bg-primary/10 pointer-events-none"
                  />
                )}
              </motion.button>
              {phase === 'PLAYER_TURN' && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStrategyChart(!showStrategyChart)}
                  className={cn(
                    'relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg',
                    'bg-gradient-to-b from-card/80 to-card/60',
                    'border-2 border-primary/30 shadow-lg',
                    'backdrop-blur-sm transition-all duration-200',
                    'min-w-[48px] sm:min-w-[56px] min-h-[44px] sm:min-h-[48px]',
                    'flex items-center justify-center',
                    showStrategyChart && 'border-primary/60 shadow-gold ring-2 ring-primary/20',
                    'hover:border-primary/50 hover:shadow-xl',
                  )}
                  aria-label="Strategy Chart"
                >
                  <span className="text-lg sm:text-xl">
                    {showStrategyChart ? '✕' : '📈'}
                  </span>
                  {showStrategyChart && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-lg bg-primary/10 pointer-events-none"
                    />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Tutorial */}
      <Tutorial />
      
      {/* Particle System - Only show during SETTLEMENT */}
      {phase === 'SETTLEMENT' && (
        <ParticleSystem 
          key={`particles-${phase}-${particleTrigger}`}
          trigger={particleTrigger} 
          type={particleType}
          position={{ x: 50, y: 50 }}
        />
      )}
      
      {/* Settings Panel - Scrollable if needed */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-shrink-0 w-full p-2 max-h-48 overflow-y-auto"
        >
          <SettingsPanel />
        </motion.div>
      )}
      
      {/* Stats Dashboard - Scrollable if needed */}
      {showStatsDashboard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-shrink-0 w-full p-2 max-h-48 overflow-y-auto"
        >
          <StatsDashboard />
        </motion.div>
      )}
      
      {/* Strategy Chart - Scrollable if needed */}
      {showStrategyChart && phase === 'PLAYER_TURN' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-shrink-0 w-full p-2 max-h-48 overflow-y-auto"
        >
          <BasicStrategyChart />
        </motion.div>
      )}
      
      {/* Game Area - Responsive Layout */}
      <main className="flex-1 flex flex-col justify-between p-1.5 sm:p-2 md:p-3 min-h-0 overflow-hidden">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 md:gap-3 table-felt table-border rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 min-h-0">
          
          {/* Dealer Area - Responsive */}
          <div className="flex-shrink-0 flex justify-center py-1 sm:py-2">
            <AnimatePresence mode="wait">
              {dealerHand.cards.length > 0 && (
                <HandView
                  hand={dealerHand}
                  isDealer
                  showValue={phase === 'SETTLEMENT' || phase === 'DEALER_TURN'}
                  result={getDealerResult()}
                />
              )}
            </AnimatePresence>
          </div>
          
          {/* Center Area - Bet Display or Message - Responsive */}
          <div className="flex-shrink-0 flex justify-center items-center py-1 sm:py-2 md:py-3">
            <AnimatePresence mode="wait">
              {isPlaying && currentBet > 0 && (
                <motion.div
                  key="bet-display"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="poker-chip gold text-sm">
                    ${currentBet}
                  </div>
                </motion.div>
              )}
              
              {showNewRound && !isBankrupt && (
                <motion.div
                  key="result-message"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center gap-4"
                  style={{ position: 'relative', zIndex: 20 }}
                >
                  {/* Insurance result */}
                  {insuranceBet > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Insurance
                      </div>
                      <div className={`text-base font-semibold ${
                        dealerHand.isBlackjack ? 'text-success' : 'text-destructive'
                      }`}>
                        {dealerHand.isBlackjack 
                          ? `+$${(insuranceBet * 2).toFixed(0)}` 
                          : `-$${insuranceBet.toFixed(0)}`}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Side Bets Results */}
                  {sideBetResults && (
                    <div className="space-y-2">
                      {sideBetResults.perfectPairs && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                            Perfect Pairs ({sideBetResults.perfectPairs.tier})
                          </div>
                          <div className={`text-sm font-semibold ${
                            sideBetResults.perfectPairs.payout > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {sideBetResults.perfectPairs.payout > 0 
                              ? `+$${sideBetResults.perfectPairs.payout.toFixed(0)}` 
                              : `-$${sideBetResults.perfectPairs.bet.toFixed(0)}`}
                          </div>
                        </motion.div>
                      )}
                      {sideBetResults.twentyOnePlus3 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                            21+3 ({sideBetResults.twentyOnePlus3.handType})
                          </div>
                          <div className={`text-sm font-semibold ${
                            sideBetResults.twentyOnePlus3.payout > 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {sideBetResults.twentyOnePlus3.payout > 0 
                              ? `+$${sideBetResults.twentyOnePlus3.payout.toFixed(0)}` 
                              : `-$${sideBetResults.twentyOnePlus3.bet.toFixed(0)}`}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* Payout info */}
                  <div className="text-center">
                    {results.map((result, i) => {
                      const hand = playerHands[result.handIndex];
                      const bet = hand?.bet || currentBet;
                      const netResult = result.payout - bet;
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`text-lg font-bold ${
                            netResult > 0 ? 'text-success' : 
                            netResult < 0 ? 'text-destructive' : 
                            'text-warning'
                          }`}
                        >
                          {netResult > 0 ? '+' : ''}{netResult !== 0 ? `$${netResult}` : 'Push'}
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Table] New Hand button clicked', { phase, isAnimating, bankroll });
                        // Force isAnimating to false before calling newRound
                        useGameStore.setState({ isAnimating: false });
                        try {
                          newRound();
                          console.log('[Table] newRound called successfully');
                        } catch (error) {
                          console.error('[Table] Error calling newRound:', error);
                          // Ensure isAnimating is false even on error
                          useGameStore.setState({ isAnimating: false });
                        }
                      }}
                      className="btn-casino glow-gold"
                      type="button"
                      style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 30 }}
                    >
                      New Hand
                    </button>
                  </motion.div>
                </motion.div>
              )}
              
              {isBankrupt && (
                <motion.div
                  key="bankrupt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="text-xl font-bold text-destructive text-shadow-md">
                    Out of chips!
                  </div>
                  <button onClick={resetGame} className="btn-casino">
                    Start Over ($1,000)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Player Area - Responsive */}
          <div className="flex-shrink-0 flex justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap px-1">
            <AnimatePresence mode="wait">
              {playerHands.length > 0 ? (
                playerHands.map((hand, index) => (
                  <div key={`hand-${index}`} className="relative">
                    <HandView
                      hand={hand}
                      isActive={index === activeHandIndex && phase === 'PLAYER_TURN'}
                      result={getHandResult(index)}
                    />
                    {/* Hand number badge for split hands */}
                    {playerHands.length > 1 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                          index === activeHandIndex && phase === 'PLAYER_TURN'
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                      >
                        {index + 1}
                      </motion.div>
                    )}
                  </div>
                ))
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Controls Area - Fixed Bottom - Always Accessible */}
      <footer className="flex-shrink-0 p-1 sm:p-2 md:p-3 lg:p-4 border-t-2 border-primary/30 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-sm relative z-40 pb-20 sm:pb-0">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {phase === 'BETTING' && bankroll > 0 && (
              <motion.div
                key="bet-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full"
              >
                <BetPanel />
              </motion.div>
            )}
            
            {phase === 'PLAYER_TURN' && (
              <motion.div
                key="controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex justify-center"
              >
                <Controls />
              </motion.div>
            )}
            
            {(phase === 'DEALER_TURN' || phase === 'DEALING') && isAnimating && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-muted-foreground text-sm"
              >
                <span className="animate-pulse">Dealer playing...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
});

export default Table;
