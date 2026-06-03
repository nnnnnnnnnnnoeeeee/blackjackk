// ============================================================================
// Achievements Panel - Premium Redesign with glassmorphism & animations
// ============================================================================

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ACHIEVEMENTS,
  TIER_COLORS,
  getAchievementProgress,
  type Achievement,
  type UnlockedAchievement,
} from '@/lib/blackjack/achievements';
import { useGameStore, selectStats, selectXPSystem } from '@/store/useGameStore';
import { cn } from '@/lib/utils';

interface AchievementsPanelProps {
  className?: string;
}

// ---- Tier styling config ----
const TIER_META: Record<Achievement['tier'], { label: string; bg: string; border: string; glow: string; icon: string }> = {
  bronze:  { label: 'Bronze',  bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.25)',  glow: 'rgba(205,127,50,0.15)',  icon: '🥉' },
  silver:  { label: 'Silver',  bg: 'rgba(192,192,192,0.08)', border: 'rgba(192,192,192,0.25)', glow: 'rgba(192,192,192,0.15)', icon: '🥈' },
  gold:    { label: 'Gold',    bg: 'rgba(212,175,55,0.08)',  border: 'rgba(212,175,55,0.25)',  glow: 'rgba(212,175,55,0.15)',  icon: '🥇' },
  diamond: { label: 'Diamond', bg: 'rgba(185,242,255,0.08)', border: 'rgba(185,242,255,0.25)', glow: 'rgba(185,242,255,0.15)', icon: '💎' },
};

const CATEGORY_META = {
  gameplay: { label: 'Gameplay',  icon: '🎮', color: '#4ade80' },
  streak:   { label: 'Streaks',   icon: '🔥', color: '#fb923c' },
  bankroll: { label: 'Bankroll',  icon: '💰', color: '#d4af37' },
  mastery:  { label: 'Mastery',   icon: '🧠', color: '#a78bfa' },
} as const;

// ---- Animated Progress Ring ----
function ProgressRing({ percentage, size = 80, stroke = 6 }: { percentage: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#997A15" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#FFDF73" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          className="text-xl font-black text-white leading-none"
        >
          {percentage}%
        </motion.span>
      </div>
    </div>
  );
}

// ---- Category filter pill ----
function CategoryPill({
  icon,
  label,
  color,
  isActive,
  count,
  onClick,
}: {
  icon: string;
  label: string;
  color: string;
  isActive: boolean;
  count: { unlocked: number; total: number };
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border',
        isActive
          ? 'text-white shadow-lg'
          : 'text-white/50 bg-white/5 border-white/10 hover:text-white/80 hover:bg-white/8'
      )}
      style={
        isActive
          ? {
              backgroundColor: `${color}20`,
              borderColor: `${color}50`,
              boxShadow: `0 0 20px ${color}20`,
            }
          : undefined
      }
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
        style={{
          backgroundColor: isActive ? `${color}30` : 'rgba(255,255,255,0.08)',
          color: isActive ? color : 'rgba(255,255,255,0.4)',
        }}
      >
        {count.unlocked}/{count.total}
      </span>
    </motion.button>
  );
}

// ============================================================================
// Main Panel
// ============================================================================

export const AchievementsPanel = memo(function AchievementsPanel({
  className,
}: AchievementsPanelProps) {
  const stats = useGameStore(selectStats);
  const xp = useGameStore(selectXPSystem);
  const bankroll = useGameStore((s) => s.gameState.bankroll);
  const unlocked = useGameStore((s) => s.unlockedAchievements ?? []);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const progress = useMemo(
    () => getAchievementProgress(stats, xp, bankroll, unlocked),
    [stats, xp, bankroll, unlocked]
  );

  const unlockedIds = useMemo(
    () => new Set(unlocked.map((a: UnlockedAchievement) => a.id)),
    [unlocked]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, { unlocked: number; total: number }> = {};
    for (const cat of Object.keys(CATEGORY_META)) {
      const all = ACHIEVEMENTS.filter((a) => a.category === cat);
      const done = all.filter((a) => unlockedIds.has(a.id));
      counts[cat] = { unlocked: done.length, total: all.length };
    }
    return counts;
  }, [unlockedIds]);

  const filteredAchievements = useMemo(() => {
    const list = activeCategory
      ? ACHIEVEMENTS.filter((a) => a.category === activeCategory)
      : ACHIEVEMENTS;

    // Sort: unlocked first, then by tier (diamond > gold > silver > bronze)
    const tierOrder = { diamond: 0, gold: 1, silver: 2, bronze: 3 };
    return [...list].sort((a, b) => {
      const aUnlocked = unlockedIds.has(a.id) ? 0 : 1;
      const bUnlocked = unlockedIds.has(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }, [activeCategory, unlockedIds]);

  return (
    <div className={cn('font-outfit', className)}>
      {/* ---- Header ---- */}
      <div className="flex items-center gap-5 mb-6">
        <ProgressRing percentage={progress.percentage} />

        <div className="flex-1">
          <h2 className="text-2xl font-black text-white tracking-tight mb-1">
            Trophées
          </h2>
          <p className="text-sm text-white/40 font-medium">
            {progress.unlocked} sur {progress.total} débloqués
          </p>
          {/* XP earned from achievements */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#d4af37]/60 font-bold">
              XP total gagné
            </span>
            <span className="text-sm font-black text-[#d4af37]">
              +{unlocked.reduce((sum, u) => {
                const a = ACHIEVEMENTS.find(ac => ac.id === u.id);
                return sum + (a?.xpReward ?? 0);
              }, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ---- Category filters ---- */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <CategoryPill
          icon="✨"
          label="Tous"
          color="#ffffff"
          isActive={activeCategory === null}
          count={{ unlocked: progress.unlocked, total: progress.total }}
          onClick={() => setActiveCategory(null)}
        />
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <CategoryPill
            key={key}
            icon={meta.icon}
            label={meta.label}
            color={meta.color}
            isActive={activeCategory === key}
            count={categoryCounts[key]}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
          />
        ))}
      </div>

      {/* ---- Achievement grid ---- */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement, i) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              layout
            >
              <AchievementCard
                achievement={achievement}
                isUnlocked={unlockedIds.has(achievement.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ============================================================================
// Achievement Card — Premium glassmorphism style
// ============================================================================

const AchievementCard = memo(function AchievementCard({
  achievement,
  isUnlocked,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
}) {
  const tierMeta = TIER_META[achievement.tier];
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      className={cn(
        'relative flex items-center gap-4 px-4 py-3.5 rounded-2xl border backdrop-blur-md transition-all duration-300 group',
        isUnlocked
          ? 'hover:scale-[1.01]'
          : 'opacity-40 grayscale hover:opacity-60 hover:grayscale-[50%]'
      )}
      style={{
        backgroundColor: isUnlocked ? tierMeta.bg : 'rgba(255,255,255,0.02)',
        borderColor: isUnlocked ? tierMeta.border : 'rgba(255,255,255,0.06)',
        boxShadow: isUnlocked ? `0 4px 24px ${tierMeta.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
      }}
    >
      {/* Subtle glow for unlocked achievements */}
      {isUnlocked && (
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${tierColor}15 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Icon */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative z-10 border',
            isUnlocked ? 'shadow-lg' : ''
          )}
          style={{
            backgroundColor: isUnlocked ? `${tierColor}18` : 'rgba(255,255,255,0.04)',
            borderColor: isUnlocked ? `${tierColor}30` : 'rgba(255,255,255,0.06)',
            filter: isUnlocked ? `drop-shadow(0 0 8px ${tierColor}60)` : 'none',
          }}
        >
          {achievement.icon}
        </div>
        {/* Unlocked checkmark */}
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black z-20 shadow-lg border"
            style={{
              backgroundColor: tierColor,
              color: achievement.tier === 'silver' || achievement.tier === 'diamond' ? '#000' : '#fff',
              borderColor: `${tierColor}80`,
            }}
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              'text-sm font-bold tracking-wide',
              isUnlocked ? 'text-white' : 'text-white/40'
            )}
          >
            {achievement.title}
          </span>
          <span
            className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider"
            style={{
              backgroundColor: isUnlocked ? `${tierColor}20` : 'rgba(255,255,255,0.04)',
              color: isUnlocked ? tierColor : 'rgba(255,255,255,0.25)',
              border: `1px solid ${isUnlocked ? `${tierColor}35` : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {tierMeta.label}
          </span>
        </div>
        <p
          className={cn(
            'text-xs leading-snug',
            isUnlocked ? 'text-white/50' : 'text-white/20'
          )}
        >
          {achievement.description}
        </p>
      </div>

      {/* XP Reward / Unlocked Badge */}
      <div className="flex-shrink-0 text-right">
        {isUnlocked ? (
          <div className="flex flex-col items-end">
            <span
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: tierColor }}
            >
              Débloqué
            </span>
            <span className="text-[10px] text-white/30 font-bold">
              +{achievement.xpReward} XP
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-white/25">
              +{achievement.xpReward}
            </span>
            <span className="text-[10px] text-white/15 uppercase tracking-wider font-bold">
              XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default AchievementsPanel;
