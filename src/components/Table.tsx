// ============================================================================
// Main Blackjack Table - The game board
// ============================================================================

import { memo, useCallback } from 'react';
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
} from '@/store/useGameStore';
import { HandView } from './HandView';
import { BetPanel } from './BetPanel';
import { Controls } from './Controls';
import { StatsPanel } from './StatsPanel';

export const Table = memo(function Table() {
  const phase = useGameStore(selectPhase);
  const dealerHand = useGameStore(selectDealerHand);
  const playerHands = useGameStore(selectPlayerHands);
  const activeHandIndex = useGameStore(selectActiveHandIndex);
  const results = useGameStore(selectResults);
  const currentBet = useGameStore(selectCurrentBet);
  const bankroll = useGameStore(selectBankroll);
  const newRound = useGameStore(s => s.newRound);
  const resetGame = useGameStore(s => s.resetGame);
  
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
  const showNewRound = phase === 'SETTLEMENT';
  const isBankrupt = bankroll === 0 && phase === 'SETTLEMENT';
  
  return (
    <div className="table-felt min-h-screen flex flex-col">
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
          <StatsPanel />
        </div>
      </header>
      
      {/* Game Area */}
      <main className="flex-1 flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between gap-4">
          
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
                >
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
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={newRound}
                    className="btn-casino glow-gold"
                  >
                    New Hand
                  </motion.button>
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
                  <HandView
                    key={`hand-${index}`}
                    hand={hand}
                    isActive={index === activeHandIndex && phase === 'PLAYER_TURN'}
                    result={getHandResult(index)}
                  />
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
