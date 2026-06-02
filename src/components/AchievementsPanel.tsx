// ============================================================================
// Achievements Panel - Full list of achievements with progress
// ============================================================================

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  getAchievementProgress,
  type Achievement,
  type UnlockedAchievement,
} from '@/lib/blackjack/achievements';
import { useGameStore, selectStats, selectXPSystem } from '@/store/useGameStore';

interface AchievementsPanelProps {
  className?: string;
}

export const AchievementsPanel = memo(function AchievementsPanel({
  className,
}: AchievementsPanelProps) {
  const stats = useGameStore(selectStats);
  const xp = useGameStore(selectXPSystem);
  const bankroll = useGameStore((s) => s.gameState.bankroll);
  const unlocked = useGameStore((s) => s.unlockedAchievements ?? []);

  const progress = useMemo(
    () => getAchievementProgress(stats, xp, bankroll, unlocked),
    [stats, xp, bankroll, unlocked]
  );

  const unlockedIds = useMemo(
    () => new Set(unlocked.map((a: UnlockedAchievement) => a.id)),
    [unlocked]
  );

  const categories = [
    { key: 'gameplay', label: '🎮 Gameplay', color: '#22c55e' },
    { key: 'streak', label: '🔥 Streaks', color: '#f59e0b' },
    { key: 'bankroll', label: '💰 Bankroll', color: '#d4af37' },
    { key: 'mastery', label: '🧠 Mastery', color: '#8b5cf6' },
  ] as const;

  return (
    <div className={className}>
      {/* Header with progress */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-primary mb-2">🏆 Achievements</h2>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">
            {progress.unlocked} / {progress.total}
          </span>
          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-primary">{progress.percentage}%</span>
        </div>
      </div>

      {/* Category sections */}
      {categories.map(({ key, label, color }) => {
        const categoryAchievements = ACHIEVEMENTS.filter((a) => a.category === key);
        return (
          <div key={key} className="mb-4">
            <h3
              className="text-xs font-bold uppercase tracking-widest mb-2 px-1"
              style={{ color }}
            >
              {label}
            </h3>
            <div className="space-y-1.5">
              {categoryAchievements.map((achievement) => (
                <AchievementRow
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={unlockedIds.has(achievement.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ============================================================================
// Achievement Row
// ============================================================================

const AchievementRow = memo(function AchievementRow({
  achievement,
  isUnlocked,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={isUnlocked ? { opacity: 1 } : { opacity: 0.5 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
        isUnlocked
          ? 'bg-card/80 border-primary/30'
          : 'bg-card/20 border-border/30 grayscale'
      }`}
    >
      {/* Icon */}
      <div
        className="text-xl flex-shrink-0 w-8 text-center"
        style={
          isUnlocked
            ? { filter: `drop-shadow(0 0 4px ${TIER_COLORS[achievement.tier]})` }
            : undefined
        }
      >
        {achievement.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
            {achievement.title}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
            style={{
              backgroundColor: isUnlocked ? `${TIER_COLORS[achievement.tier]}20` : 'transparent',
              color: isUnlocked ? TIER_COLORS[achievement.tier] : 'inherit',
              border: `1px solid ${isUnlocked ? `${TIER_COLORS[achievement.tier]}40` : 'transparent'}`,
            }}
          >
            {achievement.tier}
          </span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{achievement.description}</div>
      </div>

      {/* XP Reward */}
      <div
        className={`text-xs font-bold flex-shrink-0 ${
          isUnlocked ? 'text-primary' : 'text-muted-foreground/50'
        }`}
      >
        {isUnlocked ? '✓' : `+${achievement.xpReward}`}
      </div>
    </motion.div>
  );
});

export default AchievementsPanel;
