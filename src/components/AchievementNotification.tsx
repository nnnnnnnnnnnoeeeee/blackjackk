// ============================================================================
// Achievement Notification Toast - Animated unlock toast
// ============================================================================

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIER_COLORS, type Achievement } from '@/lib/blackjack/achievements';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementNotification = memo(function AchievementNotification({
  achievement,
  onDismiss,
}: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 400);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {visible && achievement && (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: -80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed z-[200] pointer-events-auto bottom-[120px] sm:bottom-8 left-4 sm:left-8"
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-black/90 backdrop-blur-xl border-2 shadow-2xl cursor-pointer"
            style={{
              borderColor: TIER_COLORS[achievement.tier],
              boxShadow: `0 0 30px ${TIER_COLORS[achievement.tier]}40, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Icon with glow */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              className="text-3xl"
              style={{
                filter: `drop-shadow(0 0 8px ${TIER_COLORS[achievement.tier]})`,
              }}
            >
              {achievement.icon}
            </motion.div>

            {/* Text */}
            <div className="flex flex-col min-w-0">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[10px] uppercase tracking-[0.2em] font-bold"
                style={{ color: TIER_COLORS[achievement.tier] }}
              >
                Achievement Unlocked
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="text-sm font-bold text-white truncate"
              >
                {achievement.title}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="text-xs text-gray-400 truncate"
              >
                {achievement.description} · +{achievement.xpReward} XP
              </motion.div>
            </div>

            {/* Tier badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.4 }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase"
              style={{
                background: `linear-gradient(135deg, ${TIER_COLORS[achievement.tier]}, ${TIER_COLORS[achievement.tier]}80)`,
                color: achievement.tier === 'gold' || achievement.tier === 'bronze' ? '#1a1a1a' : '#fff',
              }}
            >
              {achievement.tier.charAt(0).toUpperCase()}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default AchievementNotification;
