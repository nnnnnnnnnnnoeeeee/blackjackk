// ============================================================================
// Particle System for Special Events
// ============================================================================

import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface ParticleSystemProps {
  trigger: boolean;
  type: 'win' | 'lose' | 'blackjack' | 'chip';
  position?: { x: number; y: number };
}

export const ParticleSystem = memo(function ParticleSystem({
  trigger,
  type,
  position = { x: 50, y: 50 },
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    if (!trigger) return;
    
    const config = {
      win: { count: 30, colors: ['#22c55e', '#10b981', '#34d399'], speed: 2 },
      lose: { count: 20, colors: ['#ef4444', '#dc2626', '#f87171'], speed: 1.5 },
      blackjack: { count: 50, colors: ['#d4af37', '#fbbf24', '#f59e0b'], speed: 3 },
      chip: { count: 15, colors: ['#3b82f6', '#60a5fa', '#93c5fd'], speed: 1 },
    };
    
    const cfg = config[type];
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < cfg.count; i++) {
      const angle = (Math.PI * 2 * i) / cfg.count + Math.random() * 0.5;
      const speed = cfg.speed * (0.5 + Math.random() * 0.5);
      
      newParticles.push({
        id: `${Date.now()}-${i}`,
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
        size: 4 + Math.random() * 4,
        life: 1,
      });
    }
    
    setParticles(newParticles);
    
    // Animate particles
    const interval = setInterval(() => {
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // Gravity
            life: p.life - 0.02,
          }))
          .filter(p => p.life > 0);
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [trigger, type, position]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: particle.life,
              scale: particle.life,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
