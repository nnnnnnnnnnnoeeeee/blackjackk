// ============================================================================
// Main Blackjack Table - The game board
// ============================================================================

import { memo, useCallback, useEffect, useState } from 'react';
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
import { useSound } from '@/hooks/useSound';

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
  
  // Play sounds and particles on settlement
  useEffect(() => {
    if (phase === 'SETTLEMENT' && results.length > 0) {
      const hasWin = results.some(r => r.result === 'win' || r.result === 'blackjack');
      const hasBlackjack = results.some(r => r.result === 'blackjack');
      const hasLoss = results.some(r => r.result === 'lose');
      
      if (hasBlackjack) {
        playSound('blackjack');
        setParticleType('blackjack');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 100);
      } else if (hasWin) {
        playSound('win');
        setParticleType('win');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 100);
      } else if (hasLoss) {
        playSound('lose');
        setParticleType('lose');
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 100);
      }
    }
  }, [phase, results, playSound]);
  
  // Safety: Reset isAnimating if stuck (shouldn't be animating in BETTING or SETTLEMENT)
  useEffect(() => {
    if (isAnimating && (phase === 'BETTING' || phase === 'SETTLEMENT')) {
      useGameStore.setState({ isAnimating: false });
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
  
  // Phase display text
  const getPhaseText = () => {
    switch (phase) {
      case 'BETTING':
        return 'Placez votre mise';
      case 'DEALING':
        return 'Distribution...';
      case 'PLAYER_TURN':
        return playerHands.length > 1 
          ? `À vous - Main ${activeHandIndex + 1}/${playerHands.length}`
          : 'À vous';
      case 'DEALER_TURN':
        return 'Croupier joue...';
      case 'SETTLEMENT':
        return 'Résultat';
      default:
        return '';
    }
  };
  
  return (
    <div className="table-felt table-border min-h-screen flex flex-col">
      {/* Header / Stats */}
      <header className="p-3 sm:p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-primary text-shadow-md">
              ♠ Blackjack
            </h1>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Bankroll
              </span>
              <div className="text-lg sm:text-xl font-bold text-foreground">
                ${bankroll.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Phase indicator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            key={phase}
            className="text-center mb-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {getPhaseText()}
              </span>
            </div>
          </motion.div>
          
          <div className="flex flex-col gap-3">
            <StatsPanel />
            <CardCountingPanel />
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn-casino-secondary text-xs px-3 py-2"
                aria-label="Settings"
              >
                {showSettings ? 'Hide' : 'Show'} Settings
              </button>
              <button
                onClick={() => setShowStatsDashboard(!showStatsDashboard)}
                className="btn-casino-secondary text-xs px-3 py-2"
                aria-label="Stats Dashboard"
              >
                {showStatsDashboard ? 'Hide' : 'Show'} Stats
              </button>
              {phase === 'PLAYER_TURN' && (
                <button
                  onClick={() => setShowStrategyChart(!showStrategyChart)}
                  className="btn-casino-secondary text-xs px-3 py-2"
                  aria-label="Strategy Chart"
                >
                  {showStrategyChart ? 'Hide' : 'Show'} Strategy
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Tutorial */}
      <Tutorial />
      
      {/* Particle System */}
      <ParticleSystem 
        trigger={particleTrigger} 
        type={particleType}
        position={{ x: 50, y: 50 }}
      />
      
      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full p-4"
        >
          <SettingsPanel />
        </motion.div>
      )}
      
      {/* Stats Dashboard */}
      {showStatsDashboard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full p-4"
        >
          <StatsDashboard />
        </motion.div>
      )}
      
      {/* Strategy Chart */}
      {showStrategyChart && phase === 'PLAYER_TURN' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full p-4"
        >
          <BasicStrategyChart />
        </motion.div>
      )}
      
      {/* Game Area */}
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between gap-4 table-felt table-border rounded-2xl p-6 sm:p-8">
          
          {/* Dealer Area */}
          <div className="flex justify-center">
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
          
          {/* Center Area - Bet Display or Message */}
          <div className="flex justify-center items-center py-4">
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
          
          {/* Player Area */}
          <div className="flex justify-center gap-4 flex-wrap">
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
                          'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === activeHandIndex && phase === 'PLAYER_TURN'
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
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
      
      {/* Controls Area */}
      <footer className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {phase === 'BETTING' && bankroll > 0 && (
              <motion.div
                key="bet-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
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
            
            {(phase === 'DEALER_TURN' || phase === 'DEALING') && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-muted-foreground"
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
