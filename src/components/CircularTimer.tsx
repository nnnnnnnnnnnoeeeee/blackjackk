// ============================================================================
// Circular Timer Component - Progressif circulaire pour timers
// ============================================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularTimerProps {
  timeLeft: number;
  totalTime: number;
  size?: number;
  strokeWidth?: number;
  color?: 'gold' | 'red' | 'green';
  showText?: boolean;
  className?: string;
}

export function CircularTimer({
  timeLeft,
  totalTime,
  size = 60,
  strokeWidth = 6,
  color = 'gold',
  showText = true,
  className,
}: CircularTimerProps) {
  const progress = (timeLeft / totalTime) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    gold: 'text-gold stroke-gold',
    red: 'text-red-500 stroke-red-500',
    green: 'text-green-500 stroke-green-500',
  };

  const bgColorClasses = {
    gold: 'bg-gold/20',
    red: 'bg-red-500/20',
    green: 'bg-green-500/20',
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'font-bold text-lg',
              colorClasses[color],
              timeLeft <= 2 && 'animate-pulse'
            )}
          >
            {timeLeft}
          </span>
        </div>
      )}
      {/* Pulse effect when time is low */}
      {timeLeft <= 2 && (
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            bgColorClasses[color]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}
