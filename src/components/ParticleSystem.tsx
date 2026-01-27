// ============================================================================
// Particle System for Special Events
// ============================================================================

import React, { memo, useEffect, useState, useRef } from 'react';
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
  rotationSpeed?: number; // Pour l'animation de rotation du blackjack
  rotation?: number; // Angle de rotation actuel
  isStar?: boolean; // Pour les étoiles dans l'animation blackjack
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef(trigger);
  
  // Update trigger ref when trigger changes
  useEffect(() => {
    triggerRef.current = trigger;
  }, [trigger]);
  
  // Clean particles immediately when trigger becomes false
  useEffect(() => {
    if (!trigger) {
      // Clear all intervals and timeouts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Clear all particles immediately
      setParticles([]);
      return;
    }
    
    // Only proceed if trigger is true
    
    const config = {
      win: { count: 30, colors: ['#22c55e', '#10b981', '#34d399'], speed: 2 },
      lose: { count: 20, colors: ['#ef4444', '#dc2626', '#f87171'], speed: 1.5 },
      blackjack: { count: 80, colors: ['#d4af37', '#fbbf24', '#f59e0b', '#ffd700', '#ffed4e'], speed: 4 },
      chip: { count: 15, colors: ['#3b82f6', '#60a5fa', '#93c5fd'], speed: 1 },
    };
    
    const cfg = config[type];
    const newParticles: Particle[] = [];
    
    if (type === 'blackjack') {
      // Animation spéciale pour blackjack : confettis dorés qui tombent du haut
      for (let i = 0; i < cfg.count; i++) {
        const x = Math.random() * 100; // Position horizontale aléatoire
        const y = -10 - Math.random() * 20; // Commence au-dessus de l'écran
        const angle = Math.random() * Math.PI * 2;
        const speed = cfg.speed * (0.8 + Math.random() * 0.4);
        const rotationSpeed = (Math.random() - 0.5) * 10; // Rotation aléatoire
        const isStar = Math.random() > 0.7; // 30% des particules sont des étoiles
        
        newParticles.push({
          id: `bj-${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed * 0.3, // Mouvement horizontal léger
          vy: speed * (0.5 + Math.random() * 0.5), // Tombe vers le bas
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          size: 6 + Math.random() * 8, // Plus grandes particules
          life: 1,
          rotationSpeed,
          rotation: 0,
          isStar,
        });
      }
    } else {
      // Animation normale pour win/lose/chip
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
    }
    
    setParticles(newParticles);
    
    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Animate particles with faster decay
    intervalRef.current = setInterval(() => {
      setParticles(prev => {
        // If trigger is false, clear immediately and stop interval
        if (!triggerRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return [];
        }
        
        const updated = prev
          .map(p => {
            const isBlackjack = p.id.startsWith('bj-');
            const rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
            
            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: isBlackjack ? p.vy + 0.15 : p.vy + 0.1, // Gravity plus forte pour blackjack
              life: p.life - (isBlackjack ? 0.02 : 0.05), // Décroissance plus lente pour blackjack
              rotation,
            };
          })
          .filter(p => p.life > 0);
        
        // If no particles left, clear the array and stop interval
        if (updated.length === 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return [];
        }
        
        return updated;
      });
    }, 16);
    
    // Auto-cleanup after max duration (1.5 seconds - shorter)
    timeoutRef.current = setTimeout(() => {
      setParticles([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timeoutRef.current = null;
    }, 1500);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [trigger, type, position.x, position.y]);
  
  // Don't render if no particles or trigger is false
  if (!trigger || particles.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence mode="popLayout">
        {particles.map(particle => {
          const isBlackjack = particle.id.startsWith('bj-');
          const isStar = particle.isStar || false;
          
          return (
            <motion.div
              key={particle.id}
              className={isStar ? 'absolute' : 'absolute rounded-full'}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2.5}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}40`,
                transform: `rotate(${particle.rotation || 0}deg)`,
                clipPath: isStar ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
              }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                opacity: particle.life,
                scale: isBlackjack ? particle.life * (1 + Math.sin(Date.now() / 100) * 0.2) : particle.life, // Pulsation pour blackjack
              }}
              exit={{ 
                opacity: 0, 
                scale: 0,
                transition: { duration: 0.15 }
              }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
});
