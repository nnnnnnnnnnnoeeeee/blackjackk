// ============================================================================
// Chip Stack Component - Jetons empilés avec animation
// ============================================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Couleurs de chips selon montant
function getChipColor(amount: number): { bg: string; border: string; text: string } {
  if (amount >= 500) return { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', border: 'border-yellow-700', text: 'text-black' };
  if (amount >= 250) return { bg: 'bg-gradient-to-br from-purple-400 to-purple-600', border: 'border-purple-700', text: 'text-white' };
  if (amount >= 100) return { bg: 'bg-gradient-to-br from-gray-800 to-black', border: 'border-gray-900', text: 'text-white' };
  if (amount >= 50) return { bg: 'bg-gradient-to-br from-green-500 to-green-700', border: 'border-green-800', text: 'text-white' };
  if (amount >= 25) return { bg: 'bg-gradient-to-br from-blue-500 to-blue-700', border: 'border-blue-800', text: 'text-white' };
  return { bg: 'bg-gradient-to-br from-red-500 to-red-700', border: 'border-red-800', text: 'text-white' };
}

function getChipLabel(amount: number): string {
  if (amount >= 500) return '$500';
  if (amount >= 250) return '$250';
  if (amount >= 100) return '$100';
  if (amount >= 50) return '$50';
  if (amount >= 25) return '$25';
  return '$10';
}

export function ChipStack({ amount, size = 'md', className }: ChipStackProps) {
  const colors = getChipColor(amount);
  const label = getChipLabel(amount);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  // Calculer nombre de chips à empiler (visuel)
  const chipCount = Math.min(Math.max(1, Math.floor(amount / 10)), 5);

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {/* Stack de chips */}
      <div className="relative">
        {Array.from({ length: chipCount }).map((_, index) => {
          const offset = index * 2;
          const zIndex = chipCount - index;
          
          return (
            <motion.div
              key={index}
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: offset, opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1,
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className={cn(
                'absolute left-1/2 -translate-x-1/2 rounded-full border-2 flex items-center justify-center font-bold shadow-lg',
                sizeClasses[size],
                colors.bg,
                colors.border,
                colors.text
              )}
              style={{
                zIndex,
                transform: `translateX(-50%) translateY(${offset}px)`,
              }}
            >
              {index === chipCount - 1 && (
                <span className="font-bold">{label}</span>
              )}
            </motion.div>
          );
        })}
      </div>
      {/* Montant total */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 text-xs font-bold text-gold"
      >
        ${amount}
      </motion.div>
    </div>
  );
}
