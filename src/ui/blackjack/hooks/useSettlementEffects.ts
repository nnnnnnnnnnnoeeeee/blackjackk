// ============================================================================
// Hook - Settlement Effects (Particles, Sounds, Animations)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useSound } from '@/hooks/useSound';
import type { GamePhase } from '@/lib/blackjack/types';

export type ParticleType = 'win' | 'lose' | 'blackjack' | 'chip';

export interface SettlementEffects {
  particleTrigger: boolean;
  particleType: ParticleType;
  triggerParticles: (type: ParticleType) => void;
  clearParticles: () => void;
}

/**
 * Hook to manage settlement effects (particles, sounds, animations)
 */
export function useSettlementEffects(): SettlementEffects {
  const phase = useGameStore((s) => s.gameState.phase);
  const results = useGameStore((s) => s.gameState.results);
  const config = useGameStore((s) => s.gameState.config);
  
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [particleType, setParticleType] = useState<ParticleType>('win');

  const { playSound } = useSound({
    enabled: config.soundEnabled ?? false,
    volume: config.soundVolume ?? 0.5,
  });

  const triggerParticles = useCallback((type: ParticleType) => {
    setParticleType(type);
    setParticleTrigger(true);
    setTimeout(() => setParticleTrigger(false), 1200);
  }, []);

  const clearParticles = useCallback(() => {
    setParticleTrigger(false);
  }, []);

  // Handle settlement effects when phase changes to SETTLEMENT
  useEffect(() => {
    // Always clean particles when leaving SETTLEMENT phase
    if (phase !== 'SETTLEMENT') {
      setParticleTrigger(false);
      return;
    }

    if (phase === 'SETTLEMENT' && results.length > 0) {
      const hasWin = results.some((r) => r.result === 'win' || r.result === 'blackjack');
      const hasBlackjack = results.some((r) => r.result === 'blackjack');
      const hasLoss = results.some((r) => r.result === 'lose');

      if (hasBlackjack) {
        playSound('blackjack');
        triggerParticles('blackjack');
      } else if (hasWin) {
        playSound('win');
        triggerParticles('win');
      } else if (hasLoss) {
        playSound('lose');
        triggerParticles('lose');
      }
    } else {
      // No results, ensure particles are cleared
      setParticleTrigger(false);
    }
  }, [phase, results, playSound, triggerParticles]);

  return {
    particleTrigger,
    particleType,
    triggerParticles,
    clearParticles,
  };
}
