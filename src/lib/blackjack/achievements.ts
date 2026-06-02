// ============================================================================
// Achievements System - Definitions & Evaluation
// ============================================================================

import type { GameStats, XPSystem } from './types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: 'gameplay' | 'streak' | 'bankroll' | 'mastery';
  condition: (stats: GameStats, xp: XPSystem, bankroll: number) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number; // timestamp
}

// ============================================================================
// Achievement Definitions
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // -- Gameplay --
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Win your first hand',
    icon: '🎯',
    xpReward: 100,
    tier: 'bronze',
    category: 'gameplay',
    condition: (stats) => stats.handsWon >= 1,
  },
  {
    id: 'natural',
    title: 'Natural',
    description: 'Get a Blackjack',
    icon: '🃏',
    xpReward: 100,
    tier: 'bronze',
    category: 'gameplay',
    condition: (stats) => stats.blackjacks >= 1,
  },
  {
    id: 'blackjack_hunter',
    title: 'Blackjack Hunter',
    description: 'Get 10 Blackjacks',
    icon: '♠️',
    xpReward: 300,
    tier: 'silver',
    category: 'gameplay',
    condition: (stats) => stats.blackjacks >= 10,
  },
  {
    id: 'blackjack_legend',
    title: 'Blackjack Legend',
    description: 'Get 50 Blackjacks',
    icon: '👑',
    xpReward: 800,
    tier: 'gold',
    category: 'gameplay',
    condition: (stats) => stats.blackjacks >= 50,
  },
  {
    id: 'veteran',
    title: 'Veteran',
    description: 'Play 100 hands',
    icon: '🎖️',
    xpReward: 200,
    tier: 'bronze',
    category: 'gameplay',
    condition: (stats) => stats.handsPlayed >= 100,
  },
  {
    id: 'grinder',
    title: 'Grinder',
    description: 'Play 500 hands',
    icon: '⚡',
    xpReward: 500,
    tier: 'silver',
    category: 'gameplay',
    condition: (stats) => stats.handsPlayed >= 500,
  },
  {
    id: 'marathon',
    title: 'Marathon Runner',
    description: 'Play 1000 hands',
    icon: '🏃',
    xpReward: 1000,
    tier: 'gold',
    category: 'gameplay',
    condition: (stats) => stats.handsPlayed >= 1000,
  },
  {
    id: 'double_master',
    title: 'Double Master',
    description: 'Win 10 double downs',
    icon: '✌️',
    xpReward: 300,
    tier: 'silver',
    category: 'gameplay',
    condition: (stats) => stats.doubleDownWins >= 10,
  },

  // -- Streaks --
  {
    id: 'hot_streak',
    title: 'Hot Streak',
    description: '5 wins in a row',
    icon: '🔥',
    xpReward: 200,
    tier: 'bronze',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 5,
  },
  {
    id: 'on_fire',
    title: 'On Fire',
    description: '10 wins in a row',
    icon: '🌋',
    xpReward: 500,
    tier: 'silver',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 10,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: '15 wins in a row',
    icon: '💎',
    xpReward: 1000,
    tier: 'gold',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 15,
  },
  {
    id: 'legendary_run',
    title: 'Legendary Run',
    description: '20 wins in a row',
    icon: '🌟',
    xpReward: 2000,
    tier: 'diamond',
    category: 'streak',
    condition: (stats) => stats.bestStreak >= 20,
  },

  // -- Bankroll --
  {
    id: 'high_roller',
    title: 'High Roller',
    description: 'Reach $5,000 bankroll',
    icon: '💰',
    xpReward: 300,
    tier: 'silver',
    category: 'bankroll',
    condition: (_stats, _xp, bankroll) => bankroll >= 5000,
  },
  {
    id: 'whale',
    title: 'Whale',
    description: 'Reach $10,000 bankroll',
    icon: '🐋',
    xpReward: 500,
    tier: 'gold',
    category: 'bankroll',
    condition: (_stats, _xp, bankroll) => bankroll >= 10000,
  },
  {
    id: 'mogul',
    title: 'Casino Mogul',
    description: 'Reach $50,000 bankroll',
    icon: '🏆',
    xpReward: 1500,
    tier: 'diamond',
    category: 'bankroll',
    condition: (_stats, _xp, bankroll) => bankroll >= 50000,
  },
  {
    id: 'big_winner',
    title: 'Big Winner',
    description: 'Win $500+ in a single hand',
    icon: '💵',
    xpReward: 400,
    tier: 'silver',
    category: 'bankroll',
    condition: (stats) => stats.biggestWin >= 500,
  },
  {
    id: 'jackpot',
    title: 'Jackpot',
    description: 'Win $2,000+ in a single hand',
    icon: '🎰',
    xpReward: 800,
    tier: 'gold',
    category: 'bankroll',
    condition: (stats) => stats.biggestWin >= 2000,
  },

  // -- Mastery --
  {
    id: 'level_5',
    title: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐',
    xpReward: 200,
    tier: 'bronze',
    category: 'mastery',
    condition: (_stats, xp) => xp.level >= 5,
  },
  {
    id: 'level_8',
    title: 'Master Player',
    description: 'Reach Level 8',
    icon: '🎓',
    xpReward: 500,
    tier: 'gold',
    category: 'mastery',
    condition: (_stats, xp) => xp.level >= 8,
  },
  {
    id: 'win_rate_60',
    title: 'Strategist',
    description: 'Maintain 60%+ win rate (min 50 hands)',
    icon: '🧠',
    xpReward: 500,
    tier: 'gold',
    category: 'mastery',
    condition: (stats) =>
      stats.handsPlayed >= 50 &&
      (stats.handsWon / stats.handsPlayed) >= 0.6,
  },
  {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Win 25 hands after having 0 bankroll',
    icon: '🔄',
    xpReward: 300,
    tier: 'silver',
    category: 'mastery',
    condition: (stats) => stats.handsWon >= 25,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function checkNewAchievements(
  stats: GameStats,
  xp: XPSystem,
  bankroll: number,
  alreadyUnlocked: UnlockedAchievement[]
): Achievement[] {
  const unlockedIds = new Set(alreadyUnlocked.map((a) => a.id));

  return ACHIEVEMENTS.filter(
    (achievement) =>
      !unlockedIds.has(achievement.id) &&
      achievement.condition(stats, xp, bankroll)
  );
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementProgress(
  stats: GameStats,
  xp: XPSystem,
  bankroll: number,
  unlocked: UnlockedAchievement[]
): { total: number; unlocked: number; percentage: number } {
  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlocked.length;
  return {
    total,
    unlocked: unlockedCount,
    percentage: total > 0 ? Math.round((unlockedCount / total) * 100) : 0,
  };
}

export const TIER_COLORS: Record<Achievement['tier'], string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#d4af37',
  diamond: '#b9f2ff',
};

export const TIER_GRADIENTS: Record<Achievement['tier'], string> = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-amber-600',
  diamond: 'from-cyan-300 to-blue-400',
};
