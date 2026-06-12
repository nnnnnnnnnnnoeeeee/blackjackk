// ============================================================================
// New Blackjack Table - Using new UI components
// ============================================================================

import { memo, useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableShell, HeaderBar, BottomActionDock } from '@/ui/blackjack/layout';
import { DealerZone, PlayerZone, CenterPotZone } from '@/ui/blackjack/table';
import { ActionBar, BetComposer, SettlementSheet, CoachFeedback, type CoachFeedbackData } from '@/ui/blackjack/components';
import { useGameStore } from '@/store/useGameStore';
import { getBasicStrategyRecommendation, type StrategyAction } from '@/lib/blackjack/basicStrategy';
import { getBestHandValue } from '@/lib/blackjack/hand';
import type { PlayerAction } from '@/lib/blackjack/types';

// ---- Coach mode types & helpers ----
interface CoachMistake {
  handSummary: string;
  playerAction: PlayerAction;
  optimalAction: PlayerAction;
  explanation: string;
}

export interface CoachSession {
  totalDecisions: number;
  correctDecisions: number;
  mistakes: CoachMistake[];
}

function strategyToPlayerAction(action: StrategyAction): PlayerAction {
  switch (action) {
    case 'S': return 'stand';
    case 'D':
    case 'DH':
    case 'DS': return 'double';
    case 'P': return 'split';
    case 'RS':
    case 'RH': return 'surrender';
    default:   return 'hit';
  }
}
import { HandView } from './HandView';
import { StatsPanel } from './StatsPanel';
import { StatsDashboard } from './StatsDashboard';
import { CardCountingPanel } from './CardCountingPanel';
import { SettingsPanel } from './SettingsPanel';
import { Tutorial } from './Tutorial';
import { BasicStrategyChart } from './BasicStrategyChart';
import { ParticleSystem } from './ParticleSystem';
import { LevelUpNotification } from './LevelUpNotification';
import { XPBar } from './XPBar';
import { AchievementNotification } from './AchievementNotification';
import { AchievementsPanel } from './AchievementsPanel';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMobileLayout } from '@/ui/blackjack/hooks';
import { useTranslation } from '@/ui/blackjack/i18n';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Settings, BarChart, TrendingUp, ArrowLeft } from 'lucide-react';

// ============================================================================
// Side Dock Button — Premium floating action button
// ============================================================================

function SideDockButton({
  icon,
  label,
  isActive,
  activeColor = '#d4af37',
  onClick,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  activeColor?: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-end">
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-white/10 shadow-xl whitespace-nowrap pointer-events-none"
          >
            <span className="text-[11px] font-bold text-white/90 tracking-wide">{label}</span>
            {/* Arrow */}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 bg-black/90 border-r border-t border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        type="button"
        aria-label={label}
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        style={{
          pointerEvents: 'auto',
          backgroundColor: isActive ? `${activeColor}18` : 'rgba(0,0,0,0.5)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isActive ? `${activeColor}50` : 'rgba(255,255,255,0.08)',
          boxShadow: isActive
            ? `0 0 20px ${activeColor}25, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
            : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            layoutId={`dock-indicator-${label}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 0 8px ${activeColor}80`,
            }}
          />
        )}

        {/* Close icon when active, otherwise normal icon */}
        <span
          className="transition-transform duration-200"
          style={{
            transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
            filter: isActive ? `drop-shadow(0 0 6px ${activeColor}80)` : 'none',
          }}
        >
          {isActive ? '✕' : icon}
        </span>
      </motion.button>
    </div>
  );
}

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
  
  const coachMode = useGameStore((s) => s.coachMode);
  const toggleCoachMode = useGameStore((s) => s.toggleCoachMode);

  const [showSettings, setShowSettings] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [showStrategyChart, setShowStrategyChart] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particleType, setParticleType] = useState<'win' | 'lose' | 'blackjack' | 'chip'>('win');
  const [flashType, setFlashType] = useState<'win' | 'lose' | 'blackjack' | null>(null);
  const [resultBanner, setResultBanner] = useState<string | null>(null);

  // Coach mode session
  const [coachSession, setCoachSession] = useState<CoachSession>({ totalDecisions: 0, correctDecisions: 0, mistakes: [] });
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedbackData | null>(null);
  const coachFeedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { isMobile } = useMobileLayout();

  // Sound effects
  const { playSound } = useSound({
    enabled: config.soundEnabled ?? false,
    volume: config.soundVolume ?? 0.5,
  });

  // Haptic feedback
  const haptic = useHaptic();

  // Swipe gesture — Hit = swipe up, Stand = swipe down
  // Use getState() inside callbacks to avoid snapshot-comparison loops
  const swipeHandlers = useSwipeGesture({
    onSwipeUp: () => {
      const store = useGameStore.getState();
      if (store.gameState.phase !== 'PLAYER_TURN') return;
      haptic.buttonPress();
      try { store.action('hit'); } catch { /* invalid action — ignore */ }
    },
    onSwipeDown: () => {
      const store = useGameStore.getState();
      if (store.gameState.phase !== 'PLAYER_TURN') return;
      haptic.buttonPress();
      try { store.action('stand'); } catch { /* invalid action — ignore */ }
    },
  });
  
  // Play sounds, particles, haptic and visual feedback on settlement
  const settlementRoundRef = useRef<string>('');

  useEffect(() => {
    if (phase !== 'SETTLEMENT') {
      setParticleTrigger(false);
      setFlashType(null);
      setResultBanner(null);
      settlementRoundRef.current = '';
      return;
    }

    if (results.length === 0) {
      setParticleTrigger(false);
      return;
    }

    const settlementKey = `${results.length}-${results.map(r => r.result).join(',')}`;
    if (settlementRoundRef.current === settlementKey) return;
    settlementRoundRef.current = settlementKey;

    const hasBlackjack = results.some(r => r.result === 'blackjack');
    const hasWin = results.some(r => r.result === 'win' || r.result === 'blackjack');
    const hasLoss = results.some(r => r.result === 'lose');
    const allBusted = results.every(r => r.result === 'lose') && playerHands.every(h => h.isBusted);

    const timers: NodeJS.Timeout[] = [];

    if (hasBlackjack) {
      playSound('blackjack');
      haptic.blackjack();
      setParticleType('blackjack');
      setParticleTrigger(true);
      setFlashType('blackjack');
      setResultBanner('✦ BLACKJACK ✦');
      timers.push(setTimeout(() => setParticleTrigger(false), 1800));
      timers.push(setTimeout(() => setFlashType(null), 600));
      timers.push(setTimeout(() => setResultBanner(null), 2000));
    } else if (hasWin) {
      playSound('win');
      haptic.win();
      setParticleType('win');
      setParticleTrigger(true);
      setFlashType('win');
      setResultBanner('VICTOIRE');
      timers.push(setTimeout(() => setParticleTrigger(false), 1200));
      timers.push(setTimeout(() => setFlashType(null), 400));
      timers.push(setTimeout(() => setResultBanner(null), 1600));
    } else if (hasLoss) {
      playSound('lose');
      if (allBusted) haptic.bust(); else haptic.lose();
      setParticleType('lose');
      setParticleTrigger(true);
      setFlashType('lose');
      setResultBanner(allBusted ? 'BUST' : 'PERDU');
      timers.push(setTimeout(() => setParticleTrigger(false), 900));
      timers.push(setTimeout(() => setFlashType(null), 400));
      timers.push(setTimeout(() => setResultBanner(null), 1400));
    }

    return () => timers.forEach(clearTimeout);
  }, [phase, results.length, playSound, haptic, playerHands]);
  
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
  
  // Coach mode: evaluate a player action against basic strategy
  const handleCoachCheck = useCallback(
    (playerAction: PlayerAction) => {
      if (!coachMode) return;

      const gs = useGameStore.getState().gameState;
      const activeHand = gs.playerHands[gs.activeHandIndex];
      const dealerUpcard = gs.dealerHand.cards.find((c) => c.faceUp);

      if (!activeHand || !dealerUpcard || gs.phase !== 'PLAYER_TURN') return;

      const canDouble =
        activeHand.cards.length === 2 &&
        gs.bankroll >= activeHand.bet &&
        !activeHand.isDoubled;
      const canSplit =
        activeHand.cards.length === 2 &&
        activeHand.cards[0].rank === activeHand.cards[1].rank &&
        gs.bankroll >= activeHand.bet;
      const canSurrender = !!gs.config.allowSurrender;

      const recommendation = getBasicStrategyRecommendation(
        activeHand.cards,
        dealerUpcard,
        canDouble,
        canSplit,
        canSurrender,
      );
      if (!recommendation) return;

      const optimalAction = strategyToPlayerAction(recommendation.action);
      const handValue = getBestHandValue(activeHand.cards);
      const dr = dealerUpcard.rank;
      const dealerLabel = ['J', 'Q', 'K'].includes(dr) ? '10' : dr;
      const handSummary = `${handValue} vs ${dealerLabel}`;
      const isCorrect = playerAction === optimalAction;

      setCoachSession((prev) => ({
        totalDecisions: prev.totalDecisions + 1,
        correctDecisions: isCorrect ? prev.correctDecisions + 1 : prev.correctDecisions,
        mistakes: isCorrect
          ? prev.mistakes
          : [
              ...prev.mistakes,
              { handSummary, playerAction, optimalAction, explanation: recommendation.explanation },
            ],
      }));

      clearTimeout(coachFeedbackTimerRef.current);
      setCoachFeedback({ handSummary, playerAction, optimalAction, explanation: recommendation.explanation, isCorrect });
      coachFeedbackTimerRef.current = setTimeout(
        () => setCoachFeedback(null),
        isCorrect ? 1200 : 3800,
      );
    },
    [coachMode],
  );

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
      {/* Swipe overlay (PLAYER_TURN only) */}
      {phase === 'PLAYER_TURN' && (
        <div
          {...swipeHandlers}
          className="fixed inset-0 z-[10] pointer-events-auto"
          aria-hidden="true"
        />
      )}
      {/* Particle System */}
      <ParticleSystem trigger={particleTrigger} type={particleType} />

      {/* Level Up Notification */}
      <LevelUpNotification />

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={useGameStore.getState().pendingAchievements[0] ?? null}
        onDismiss={() => useGameStore.getState().dismissAchievement()}
      />

      {/* Screen Flash Overlay */}
      <AnimatePresence>
        {flashType && (
          <motion.div
            key={flashType + settlementRoundRef.current}
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] pointer-events-none"
            style={{
              background:
                flashType === 'blackjack'
                  ? 'radial-gradient(ellipse at center, rgba(212,175,55,0.5) 0%, transparent 70%)'
                  : flashType === 'win'
                  ? 'radial-gradient(ellipse at center, rgba(34,197,94,0.4) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at center, rgba(239,68,68,0.4) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Result Banner */}
      <AnimatePresence>
        {resultBanner && (
          <motion.div
            key={resultBanner + settlementRoundRef.current}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none"
          >
            <div
              className="px-8 py-4 rounded-2xl text-3xl sm:text-4xl font-extrabold tracking-widest shadow-2xl border-2"
              style={{
                background:
                  resultBanner.includes('BLACKJACK')
                    ? 'rgba(0,0,0,0.85)'
                    : resultBanner === 'VICTOIRE'
                    ? 'rgba(0,0,0,0.8)'
                    : 'rgba(0,0,0,0.8)',
                borderColor:
                  resultBanner.includes('BLACKJACK')
                    ? '#d4af37'
                    : resultBanner === 'VICTOIRE'
                    ? '#22c55e'
                    : '#ef4444',
                color:
                  resultBanner.includes('BLACKJACK')
                    ? '#d4af37'
                    : resultBanner === 'VICTOIRE'
                    ? '#22c55e'
                    : '#ef4444',
                textShadow:
                  resultBanner.includes('BLACKJACK')
                    ? '0 0 30px rgba(212,175,55,0.8)'
                    : resultBanner === 'VICTOIRE'
                    ? '0 0 20px rgba(34,197,94,0.6)'
                    : '0 0 20px rgba(239,68,68,0.6)',
              }}
            >
              {resultBanner}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coach Feedback overlay */}
      <CoachFeedback feedback={coachFeedback} />

      {/* Tutorial */}
      <Tutorial />
      
      {/* Back Button - Top Left */}
      <Button
        onClick={() => navigate('/mode-selection')}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-[45] bg-card/95 backdrop-blur-md border-2 border-primary/30 shadow-lg"
        aria-label={t.common.back}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t.common.back}
      </Button>

      {/* Floating Menu — Premium Side Dock */}
      <div className="fixed top-16 right-2 sm:top-20 sm:right-3 z-[45] flex flex-col gap-2.5">
        {/* Settings */}
        <SideDockButton
          icon="⚙️"
          label={t.a11y.settings}
          isActive={showSettings}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !showSettings;
            setShowSettings(newValue);
            setShowStatsDashboard(false);
            setShowStrategyChart(false);
          }}
        />
        {/* Stats */}
        <SideDockButton
          icon="📊"
          label={t.a11y.stats}
          isActive={showStatsDashboard}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !showStatsDashboard;
            setShowStatsDashboard(newValue);
            setShowSettings(false);
            setShowStrategyChart(false);
          }}
        />
        {/* Strategy Chart (only during player turn) */}
        {phase === 'PLAYER_TURN' && (
          <SideDockButton
            icon="🃏"
            label={t.a11y.strategy}
            isActive={showStrategyChart}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const newValue = !showStrategyChart;
              setShowStrategyChart(newValue);
              setShowSettings(false);
              setShowStatsDashboard(false);
            }}
          />
        )}
        {/* Coach Mode */}
        <SideDockButton
          icon="🎓"
          label={coachMode ? 'Coach: ON' : 'Coach: OFF'}
          isActive={coachMode}
          activeColor="#f59e0b"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCoachMode();
          }}
        />
        {/* Achievements */}
        <SideDockButton
          icon="🏆"
          label="Trophées"
          isActive={showAchievements}
          activeColor="#d4af37"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const newValue = !showAchievements;
            setShowAchievements(newValue);
            setShowSettings(false);
            setShowStatsDashboard(false);
            setShowStrategyChart(false);
          }}
        />
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

          <Sheet open={showAchievements} onOpenChange={setShowAchievements}>
            <SheetContent side="right" className="w-full sm:w-[400px] md:w-[500px] overflow-y-auto bg-[#0a0a0a]/98 border-l-white/10">
              <SheetHeader>
                <SheetTitle className="sr-only">Achievements</SheetTitle>
              </SheetHeader>
              <div className="mt-2">
                <AchievementsPanel />
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

          {showAchievements && (
            <motion.div
              key="achievements-panel"
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="fixed top-28 right-2 sm:top-32 sm:right-4 z-[90] w-[calc(100vw-1rem)] sm:w-[400px] md:w-[500px] max-h-[calc(100vh-8rem)] overflow-y-auto bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <AchievementsPanel />
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
            
            {/* Card Counting - Only show during BETTING phase */}
            {!showSettings && !showStatsDashboard && !showStrategyChart && phase === 'BETTING' && (
              <div className="flex justify-center mt-2">
                <div className="w-full max-w-xs">
                  <CardCountingPanel />
                </div>
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
            playingContent={phase === 'PLAYER_TURN' ? <ActionBar onBeforeAction={handleCoachCheck} /> : undefined}
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
        coachSession={coachMode ? coachSession : undefined}
      />
    </>
  );
});

export default NewTable;
