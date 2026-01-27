// ============================================================================
// New Blackjack Table - Using new UI components
// ============================================================================

import { memo, useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableShell, HeaderBar, BottomActionDock } from '@/ui/blackjack/layout';
import { DealerZone, PlayerZone, CenterPotZone } from '@/ui/blackjack/table';
import { ActionBar, BetComposer, SettlementSheet } from '@/ui/blackjack/components';
import { useGameStore } from '@/store/useGameStore';
import { HandView } from './HandView';
import { StatsPanel } from './StatsPanel';
import { StatsDashboard } from './StatsDashboard';
import { CardCountingPanel } from './CardCountingPanel';
import { SettingsPanel } from './SettingsPanel';
import { Tutorial } from './Tutorial';
import { BasicStrategyChart } from './BasicStrategyChart';
import { ParticleSystem } from './ParticleSystem';
import { useSound } from '@/hooks/useSound';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMobileLayout } from '@/ui/blackjack/hooks';
import { useTranslation } from '@/ui/blackjack/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, TrendingUp, ArrowLeft } from 'lucide-react';

export const NewTable = memo(function NewTable() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const phase = useGameStore((s) => s.gameState.phase);
  const dealerHand = useGameStore((s) => s.gameState.dealerHand);
  const playerHands = useGameStore((s) => s.gameState.playerHands);
  const activeHandIndex = useGameStore((s) => s.gameState.activeHandIndex);
  const results = useGameStore((s) => s.gameState.results);
  const currentBet = useGameStore((s) => s.gameState.currentBet);
  const bankroll = useGameStore((s) => s.gameState.bankroll);
  const insuranceBet = useGameStore((s) => s.gameState.insuranceBet);
  const sideBetResults = useGameStore((s) => s.gameState.sideBetResults);
  const isAnimating = useGameStore((s) => s.isAnimating);
  const newRound = useGameStore((s) => s.newRound);
  const resetGame = useGameStore((s) => s.resetGame);
  const config = useGameStore((s) => s.gameState.config);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [showStrategyChart, setShowStrategyChart] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particleType, setParticleType] = useState<'win' | 'lose' | 'blackjack' | 'chip'>('win');
  
  const { isMobile } = useMobileLayout();
  
  // Sound effects
  const { playSound } = useSound({ 
    enabled: config.soundEnabled ?? false, 
    volume: config.soundVolume ?? 0.5 
  });
  
  // Play sounds and particles on settlement
  // Track if we've already triggered particles for this settlement round
  const settlementRoundRef = useRef<string>('');
  
  useEffect(() => {
    if (phase !== 'SETTLEMENT') {
      setParticleTrigger(false);
      settlementRoundRef.current = '';
      return;
    }
    
    if (results.length === 0) {
      setParticleTrigger(false);
      return;
    }
    
    // Create a unique key for this settlement round
    const settlementKey = `${results.length}-${results.map(r => r.result).join(',')}`;
    
    // Only trigger once per settlement round
    if (settlementRoundRef.current === settlementKey) {
      return;
    }
    
    settlementRoundRef.current = settlementKey;
    
    const hasWin = results.some(r => r.result === 'win' || r.result === 'blackjack');
    const hasBlackjack = results.some(r => r.result === 'blackjack');
    const hasLoss = results.some(r => r.result === 'lose');
    
    let timeoutId: NodeJS.Timeout | undefined;
    
    if (hasBlackjack) {
      playSound('blackjack');
      setParticleType('blackjack');
      setParticleTrigger(true);
      timeoutId = setTimeout(() => setParticleTrigger(false), 1200);
    } else if (hasWin) {
      playSound('win');
      setParticleType('win');
      setParticleTrigger(true);
      timeoutId = setTimeout(() => setParticleTrigger(false), 1200);
    } else if (hasLoss) {
      playSound('lose');
      setParticleType('lose');
      setParticleTrigger(true);
      timeoutId = setTimeout(() => setParticleTrigger(false), 1200);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [phase, results.length, playSound]);
  
  // Show settlement sheet when phase is SETTLEMENT
  useEffect(() => {
    if (phase === 'SETTLEMENT' && results.length > 0) {
      setShowSettlement(true);
    } else {
      setShowSettlement(false);
    }
  }, [phase, results]);
  
  // Safety: Reset isAnimating if stuck
  useEffect(() => {
    if (isAnimating && (phase === 'BETTING' || phase === 'SETTLEMENT')) {
      useGameStore.setState({ isAnimating: false });
    }
  }, [phase, isAnimating]);
  
  const getHandResult = useCallback((index: number) => {
    if (phase !== 'SETTLEMENT') return null;
    const result = results.find((r) => r.handIndex === index);
    return result?.result || null;
  }, [phase, results]);
  
  const handleNewHand = useCallback(() => {
    useGameStore.setState({ isAnimating: false });
    try {
      newRound();
    } catch (error) {
      console.error('[NewTable] Error calling newRound:', error);
      useGameStore.setState({ isAnimating: false });
    }
  }, [newRound]);
  
  const isPlaying = phase !== 'BETTING' && phase !== 'SETTLEMENT';
  const isBankrupt = bankroll === 0 && phase === 'SETTLEMENT';
  
  return (
    <>
      {/* Particle System */}
      <ParticleSystem trigger={particleTrigger} type={particleType} />
      
      {/* Tutorial */}
      <Tutorial />
      
      {/* Back Button - Top Left */}
      <Button
        onClick={() => navigate('/mode-selection')}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-[100] bg-card/95 backdrop-blur-md border-2 border-primary/30 shadow-lg"
        aria-label={t.common.back}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t.common.back}
      </Button>

      {/* Floating Menu Button - Top Right (moved down a bit) */}
      <div className="fixed top-16 right-2 sm:top-20 sm:right-4 z-[100] flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !showSettings;
            setShowSettings(newValue);
            setShowStatsDashboard(false);
            setShowStrategyChart(false);
          }}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-card/95 backdrop-blur-md border-2 border-primary/30 min-h-[44px] transition-all hover:border-primary/50 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          style={{ pointerEvents: 'auto' }}
          aria-label={t.a11y.settings}
          type="button"
        >
          {showSettings ? '✕' : '⚙️'}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !showStatsDashboard;
            setShowStatsDashboard(newValue);
            setShowSettings(false);
            setShowStrategyChart(false);
          }}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-card/95 backdrop-blur-md border-2 border-primary/30 min-h-[44px] transition-all hover:border-primary/50 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          style={{ pointerEvents: 'auto' }}
          aria-label={t.a11y.stats}
          type="button"
        >
          {showStatsDashboard ? '✕' : '📊'}
        </button>
        {phase === 'PLAYER_TURN' && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newValue = !showStrategyChart;
              setShowStrategyChart(newValue);
              setShowSettings(false);
              setShowStatsDashboard(false);
            }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-card/95 backdrop-blur-md border-2 border-primary/30 min-h-[44px] transition-all hover:border-primary/50 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            style={{ pointerEvents: 'auto' }}
            aria-label={t.a11y.strategy}
            type="button"
          >
            {showStrategyChart ? '✕' : '📈'}
          </button>
        )}
      </div>

      {/* Floating Panels - Use Sheet on mobile, motion.div on desktop */}
      {isMobile ? (
        <>
          <Sheet open={showSettings} onOpenChange={setShowSettings}>
            <SheetContent side="right" className="w-full sm:w-[400px] md:w-[500px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.settings.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <SettingsPanel />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={showStatsDashboard} onOpenChange={setShowStatsDashboard}>
            <SheetContent side="right" className="w-full sm:w-[400px] md:w-[500px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.a11y.stats}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <StatsDashboard />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={showStrategyChart && phase === 'PLAYER_TURN'} onOpenChange={setShowStrategyChart}>
            <SheetContent side="right" className="w-full sm:w-[400px] md:w-[500px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t.a11y.strategy}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <BasicStrategyChart />
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
          {showSettings && (
            <motion.div
              key="settings-panel"
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="fixed top-28 right-2 sm:top-32 sm:right-4 z-[90] w-[calc(100vw-1rem)] sm:w-[400px] md:w-[500px] max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-visible bg-card/95 backdrop-blur-md rounded-lg border-2 border-primary/30 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <SettingsPanel />
            </motion.div>
          )}

          {showStatsDashboard && (
            <motion.div
              key="stats-panel"
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="fixed top-28 right-2 sm:top-32 sm:right-4 z-[90] w-[calc(100vw-1rem)] sm:w-[400px] md:w-[500px] max-h-[calc(100vh-8rem)] overflow-y-auto bg-card/95 backdrop-blur-md rounded-lg border-2 border-primary/30 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <StatsDashboard />
            </motion.div>
          )}

          {showStrategyChart && phase === 'PLAYER_TURN' && (
            <motion.div
              key="strategy-chart-panel"
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="fixed top-28 right-2 sm:top-32 sm:right-4 z-[90] w-[calc(100vw-1rem)] sm:w-[400px] md:w-[500px] max-h-[calc(100vh-8rem)] overflow-y-auto bg-card/95 backdrop-blur-md rounded-lg border-2 border-primary/30 shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <BasicStrategyChart />
            </motion.div>
          )}
        </>
      )}

      <TableShell
        header={
          <div className="space-y-1 sm:space-y-1.5 w-full relative" style={{ zIndex: 50 }}>
            <HeaderBar
              bankroll={bankroll}
              phase={phase}
              activeHandIndex={activeHandIndex}
              totalHands={playerHands.length}
            />
            
            {/* Stats Panel and Card Counting - Only show during BETTING phase */}
            {!showSettings && !showStatsDashboard && !showStrategyChart && phase === 'BETTING' && (
              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                <StatsPanel />
                <CardCountingPanel />
              </div>
            )}
          </div>
        }
        dealerZone={
          <DealerZone
            hand={dealerHand}
            isRevealed={phase === 'SETTLEMENT' || phase === 'DEALER_TURN'}
            result={null}
          />
        }
        centerZone={
          <CenterPotZone
            currentBet={currentBet}
            isPlaying={isPlaying}
            showNewRound={phase === 'SETTLEMENT'}
            isBankrupt={isBankrupt}
            settlementContent={
              phase === 'SETTLEMENT' && results.length > 0 ? (
                <div className="text-center space-y-2">
                  {results.map((result, idx) => {
                    const hand = playerHands[result.handIndex];
                    const netResult = result.payout - (hand?.bet || 0);
                    return (
                      <div
                        key={idx}
                        className={`text-lg font-bold ${
                          netResult > 0
                            ? 'text-success'
                            : netResult < 0
                            ? 'text-destructive'
                            : 'text-warning'
                        }`}
                      >
                        {netResult > 0 ? '+' : ''}${netResult !== 0 ? netResult : 'Push'}
                      </div>
                    );
                  })}
                </div>
              ) : undefined
            }
            newRoundButton={
              phase === 'SETTLEMENT' ? (
                <button
                  onClick={handleNewHand}
                  className="btn-casino glow-gold"
                  type="button"
                >
                  {t.common.newRound}
                </button>
              ) : undefined
            }
            bankruptContent={
              isBankrupt ? (
                <>
                  <div className="text-xl font-bold text-destructive mb-4">{t.common.outOfChips}</div>
                  <button onClick={resetGame} className="btn-casino">
                    {t.common.startOver}
                  </button>
                </>
              ) : undefined
            }
          />
        }
        playerZone={
          <PlayerZone
            hands={playerHands}
            activeHandIndex={activeHandIndex}
            getHandResult={getHandResult}
          />
        }
        bottomDock={
          <BottomActionDock
            bettingContent={phase === 'BETTING' && bankroll > 0 ? <BetComposer /> : undefined}
            playingContent={phase === 'PLAYER_TURN' ? <ActionBar /> : undefined}
            waitingContent={
              (phase === 'DEALER_TURN' || phase === 'DEALING') && isAnimating ? (
                <span className="animate-pulse text-muted-foreground">{t.status.dealerPlaying}</span>
              ) : undefined
            }
          />
        }
      />
      
      {/* Settlement Sheet */}
      <SettlementSheet
        open={showSettlement}
        onOpenChange={setShowSettlement}
        results={results}
        playerHands={playerHands}
        insuranceBet={insuranceBet}
        insuranceResult={
          insuranceBet > 0
            ? {
                won: dealerHand.isBlackjack || false,
                amount: insuranceBet * 2,
              }
            : undefined
        }
        sideBetResults={sideBetResults}
        onNewHand={handleNewHand}
      />
      
    </>
  );
});

export default NewTable;
