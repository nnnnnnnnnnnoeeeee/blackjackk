// ============================================================================
// Mode Selection Page - Premium Landing with Stats & Animations
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isPlaceholder } from '@/lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Users, User, Loader2, LogOut, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useGameStore, selectStats, selectXPSystem } from '@/store/useGameStore';
import { LEVEL_NAMES, getXPProgress } from '@/lib/blackjack/types';
import { getAchievementProgress } from '@/lib/blackjack/achievements';
import { useTranslation } from '@/ui/blackjack/i18n';
import { useReducedMotion } from '@/ui/blackjack/a11y';
import { useMobileLayout } from '@/ui/blackjack/hooks';

// ---- Floating Card Particle with Depth of Field ----
function FloatingCard({ delay, x, depth }: { delay: number; x: number, depth: number }) {
  const suits = ['♠', '♥', '♦', '♣'];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const isRed = suit === '♥' || suit === '♦';
  
  // Depth determines size, blur, and speed
  const size = 10 + depth * 30; // 10px to 40px
  const blur = depth > 0.7 ? 4 : depth < 0.3 ? 2 : 0;
  const opacity = depth > 0.8 ? 0.1 : 0.3;
  const duration = 12 - depth * 6;

  return (
    <motion.div
      initial={{ y: -100, x, opacity: 0, rotate: Math.random() * 40 - 20 }}
      animate={{
        y: [null, window.innerHeight + 100],
        opacity: [0, opacity, opacity, 0],
        rotate: [null, Math.random() * 180 - 90],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="fixed pointer-events-none select-none"
      style={{
        fontSize: `${size}px`,
        color: isRed ? 'rgba(220,38,38,1)' : 'rgba(255,255,255,1)',
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        zIndex: 0,
      }}
    >
      {suit}
    </motion.div>
  );
}

// ---- Gold Sparkle ----
function GoldSparkle({ delay }: { delay: number }) {
  const x = Math.random() * 100;
  const y = Math.random() * 100;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute pointer-events-none mix-blend-screen"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,1) 0%, rgba(218,165,32,0.4) 40%, transparent 80%)',
        boxShadow: '0 0 10px rgba(255,215,0,0.6)',
      }}
    />
  );
}

export default function ModeSelection() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { isMobile } = useMobileLayout();

  const stats = useGameStore(selectStats);
  const xpSystem = useGameStore(selectXPSystem);
  const bankroll = useGameStore((s) => s.gameState.bankroll);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements ?? []);
  const xpProgress = useMemo(() => getXPProgress(xpSystem.xp), [xpSystem.xp]);
  const achievementProgress = useMemo(
    () => getAchievementProgress(stats, xpSystem, bankroll, unlockedAchievements),
    [stats, xpSystem, bankroll, unlockedAchievements]
  );

  const levelName = LEVEL_NAMES[xpSystem.level] || 'Newbie';
  const winRate = stats.handsPlayed > 0
    ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
    : 0;

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    if (isPlaceholder) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setUser(null);
      } else {
        setUser(user);
      }
    } catch (err) {
      console.warn('Supabase auth failed. Proceeding as guest.', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelection = (mode: 'solo' | 'multiplayer') => {
    if (mode === 'solo') {
      navigate('/game', { replace: true });
    } else {
      if (isPlaceholder) {
        toast.error(t.landing.multiplayerNeedsDb);
        return;
      }
      navigate('/lobby', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t.landing.signedOut);
      navigate('/login', { replace: true });
    } catch {
      toast.error(t.landing.signOutError);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#062114]">
        <Loader2 className="h-10 w-10 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // Generate floating cards — fewer on mobile, none if the user prefers reduced motion
  const cardCount = prefersReducedMotion ? 0 : isMobile ? 5 : 15;
  const sparkleCount = prefersReducedMotion ? 0 : isMobile ? 8 : 25;
  const floatingCards = Array.from({ length: cardCount }, (_, i) => ({
    delay: i * 0.8,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
    depth: Math.random()
  }));

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden font-outfit selection:bg-[#d4af37]/30">
      {/* Rich Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a3622] via-[#062114] to-[#030e09] z-[-2]" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-[-1]" />

      {/* Background Particles */}
      {floatingCards.map((card, i) => (
        <FloatingCard key={i} delay={card.delay} x={card.x} depth={card.depth} />
      ))}

      {/* Gold sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: sparkleCount }, (_, i) => (
          <GoldSparkle key={i} delay={i * 0.4} />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl"
      >
        {/* Logo Section */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 20 }}
        >
          <div className="inline-block relative">
            <motion.div
              animate={{ rotateY: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute -left-10 top-1 text-3xl text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
            >
              ♠
            </motion.div>
            <h1
              className="text-5xl sm:text-7xl font-black mb-2 tracking-tight"
              style={{
                background: 'linear-gradient(to bottom, #FFDF73, #D4AF37, #997A15)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(212,175,55,0.3)',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Blackjack
            </h1>
            <motion.div
              animate={{ rotateY: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute -right-10 top-1 text-3xl text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
            >
              ♥
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0em" }}
            animate={{ opacity: 1, letterSpacing: "0.4em" }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-sm text-[#d4af37]/90 uppercase font-bold"
          >
            {t.landing.subtitle}
          </motion.p>
        </motion.div>

        {/* Player Stats Card */}
        {stats.handsPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8 relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {/* Subtle glow inside the card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-5 sm:p-6 relative z-10">
              {/* Level & Bankroll */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#997A15] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                    <Crown className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/65 uppercase tracking-widest font-bold">{t.landing.levelLabel} {xpSystem.level}</div>
                    <div className="text-lg font-black text-white tracking-wide">{levelName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/65 uppercase tracking-widest font-bold">{t.landing.bankroll}</div>
                  <div className="text-2xl font-black text-[#d4af37] drop-shadow-md">
                    ${bankroll.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] text-white/65 font-bold mb-1.5">
                  <span>XP: {xpProgress.current} / {xpProgress.needed || '∞'}</span>
                  <span>{Math.round(xpProgress.pct * 100)}%</span>
                </div>
                <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.pct * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                    className="h-full rounded-full relative"
                    style={{
                      background: 'linear-gradient(90deg, #997A15 0%, #d4af37 50%, #FFDF73 100%)',
                      boxShadow: '0 0 10px rgba(212,175,55,0.5)'
                    }}
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-[10px] text-white/65 uppercase font-bold mb-1">{t.landing.played}</div>
                  <div className="text-base sm:text-lg font-black text-white">{stats.handsPlayed}</div>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-[10px] text-white/65 uppercase font-bold mb-1">{t.landing.winRate}</div>
                  <div className={`text-base sm:text-lg font-black ${winRate >= 50 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                    {winRate}%
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-[10px] text-white/65 uppercase font-bold mb-1">{t.landing.bestRun}</div>
                  <div className="text-base sm:text-lg font-black text-[#d4af37]">{stats.bestStreak} <span className="text-xs">🔥</span></div>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-[10px] text-white/65 uppercase font-bold mb-1">{t.landing.trophies}</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {achievementProgress.unlocked}/{achievementProgress.total}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode Selection Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-4 mb-8"
        >
          {/* Multiplayer - Primary */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
          >
            {/* Animated border glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] via-[#FFDF73] to-[#d4af37] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            
            <button
              onClick={() => handleModeSelection('multiplayer')}
              className="relative w-full py-5 sm:py-6 flex items-center gap-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-[#d4af37]/30 shadow-2xl overflow-hidden"
            >
              {/* Glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] to-[#997A15] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <Users className="h-7 w-7 text-black" />
              </div>
              <div className="text-left flex-1">
                <div className="font-black text-xl sm:text-2xl text-white tracking-wide mb-0.5">{t.landing.multiplayer}</div>
                <div className="text-sm text-white/65 font-medium">
                  {t.landing.multiplayerDesc}
                </div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="text-[#d4af37] text-2xl font-light"
              >
                →
              </motion.div>
            </button>
          </motion.div>

          {/* Solo - Secondary */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => handleModeSelection('solo')}
              className="relative w-full py-5 sm:py-6 flex items-center gap-5 px-6 sm:px-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
                <User className="h-7 w-7 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-lg sm:text-xl text-white/90 tracking-wide mb-0.5">{t.landing.soloTitle}</div>
                <div className="text-sm text-white/60 font-medium">
                  {t.landing.soloDesc}
                </div>
              </div>
              <div className="text-white/20 text-2xl font-light group-hover:text-white/50 transition-colors">
                →
              </div>
            </button>
          </motion.div>
        </motion.div>

        {/* Language Selector, User Info & Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between gap-3 pt-5 border-t border-white/10"
        >
          {/* Language toggle */}
          <div
            className="flex items-center gap-0.5 rounded-full bg-black/40 border border-white/10 p-0.5"
            role="group"
            aria-label={t.landing.language}
          >
            {(['fr', 'en'] as const).map((lng) => (
              <button
                key={lng}
                onClick={() => setLanguage(lng)}
                aria-pressed={language === lng}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  language === lng
                    ? 'bg-[#d4af37] text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto min-w-0">
            {user && (
              <p className="text-xs text-white/55 font-medium truncate max-w-[160px]">
                {user.email}
              </p>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-white/55 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider flex-shrink-0"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              {t.landing.signOut}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
