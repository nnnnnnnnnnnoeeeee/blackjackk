// ============================================================================
// Component - Chip Selector
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion, conditionalVariants } from '../a11y';

interface ChipButtonProps {
  value: number;
  color: 'red' | 'blue' | 'green' | 'black' | 'gold';
  onClick: () => void;
  disabled?: boolean;
}

const CHIP_VALUES: Array<{ value: number; color: 'red' | 'blue' | 'green' | 'black' | 'gold' }> = [
  { value: 10, color: 'red' },
  { value: 25, color: 'green' },
  { value: 50, color: 'blue' },
  { value: 100, color: 'black' },
  { value: 500, color: 'gold' },
];

const ChipButton = memo(function ChipButton({
  value,
  color,
  onClick,
  disabled,
}: ChipButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  const hoverVariants = conditionalVariants(
    {
      scale: 1.15,
      y: -4,
    },
    prefersReducedMotion
  );

  const tapVariants = conditionalVariants(
    {
      scale: 0.9,
      y: 0,
    },
    prefersReducedMotion
  );

  return (
    <motion.button
      whileHover={disabled || prefersReducedMotion ? {} : hoverVariants}
      whileTap={disabled || prefersReducedMotion ? {} : tapVariants}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'poker-chip cursor-pointer text-xs font-bold',
        color,
        disabled && 'opacity-50 cursor-not-allowed filter grayscale-[50%]',
      )}
      style={{
        boxShadow: disabled ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.2)',
      }}
      aria-label={`Add $${value} to bet`}
      title={`Add $${value}`}
    >
      {value}
    </motion.button>
  );
});

interface ChipSelectorProps {
  onChipClick: (value: number) => void;
  maxValue?: number;
  disabled?: boolean;
  chipValues?: Array<{ value: number; color: 'red' | 'blue' | 'green' | 'black' | 'gold' }>;
}

export const ChipSelector = memo(function ChipSelector({
  onChipClick,
  maxValue,
  disabled = false,
  chipValues = CHIP_VALUES,
}: ChipSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 w-full px-1">
      {chipValues.map(({ value, color }) => (
        <ChipButton
          key={value}
          value={value}
          color={color}
          onClick={() => onChipClick(value)}
          disabled={disabled || (maxValue !== undefined && value > maxValue)}
        />
      ))}
    </div>
  );
});

export default ChipSelector;
