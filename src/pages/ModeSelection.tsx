// ============================================================================
// Mode Selection Page - Premium Landing with Stats & Animations
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isPlaceholder } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Users, User, Loader2, LogOut, Trophy, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useGameStore, selectStats, selectXPSystem } from '@/store/useGameStore';
import { LEVEL_NAMES, getXPProgress } from '@/lib/blackjack/types';
import { getAchievementProgress } from '@/lib/blackjack/achievements';

// ---- Floating Card Particle ----
function FloatingCard({ delay, x }: { delay: number; x: number }) {
  const suits = ['♠', '♥', '♦', '♣'];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  const isRed = suit === '♥' || suit === '♦';
  return (
    <motion.div
      initial={{ y: -50, x, opacity: 0, rotate: Math.random() * 40 - 20 }}
      animate={{
        y: [null, window.innerHeight + 60],
        opacity: [0, 0.25, 0.25, 0],
        rotate: [null, Math.random() * 90 - 45],
      }}
      transition={{
        duration: 8 + Math.random() * 6,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="fixed pointer-events-none select-none"
      style={{
        fontSize: `${20 + Math.random() * 24}px`,
        color: isRed ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.15)',
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
        opacity: [0, 1, 0],
        scale: [0, 1.2, 0],
      }}
      transition={{
        duration: 2 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.8) 0%, transparent 70%)',
        boxShadow: '0 0 6px rgba(212,175,55,0.5)',
      }}
    />
  );
}

export default function ModeSelection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
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
        // If there's an error (e.g. placeholder URL) or no user, 
        // just let them stay on the page as a guest instead of forcing login.
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
        toast.error('Le mode multijoueur nécessite une base de données Supabase configurée.');
        return;
      }
      navigate('/lobby', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate floating cards
  const floatingCards = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
  }));

  return (
    <div className="min-h-screen bg-table-felt flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Particles */}
      {floatingCards.map((card, i) => (
        <FloatingCard key={i} delay={card.delay} x={card.x} />
      ))}

      {/* Gold sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <GoldSparkle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Logo Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl font-bold mb-2"
            style={{
              color: '#d4af37',
              textShadow: '0 0 40px rgba(212,175,55,0.4), 0 2px 8px rgba(0,0,0,0.5)',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            ♠ Blackjack
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground tracking-[0.3em] uppercase"
          >
            Brilliance
          </motion.p>
        </motion.div>

        {/* Player Stats Card */}
        {stats.handsPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 rounded-xl bg-card/60 backdrop-blur-md border border-primary/20 shadow-lg"
          >
            {/* Level & XP */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Level {xpSystem.level}</div>
                  <div className="text-sm font-bold text-foreground">{levelName}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Bankroll</div>
                <div className="text-lg font-bold text-primary">${bankroll.toLocaleString()}</div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>XP: {xpProgress.current} / {xpProgress.needed || '∞'}</span>
                <span>{Math.round(xpProgress.pct * 100)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress.pct * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full"
                />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground">Played</div>
                <div className="text-sm font-bold text-foreground">{stats.handsPlayed}</div>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground">Win Rate</div>
                <div className={`text-sm font-bold ${winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                  {winRate}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground">Best Streak</div>
                <div className="text-sm font-bold text-warning">{stats.bestStreak} 🔥</div>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30">
                <div className="text-xs text-muted-foreground">Trophies</div>
                <div className="text-sm font-bold text-primary">
                  {achievementProgress.unlocked}/{achievementProgress.total}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mode Selection Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-6"
        >
          {/* Multiplayer - Primary */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => handleModeSelection('multiplayer')}
              className="w-full h-auto py-6 flex items-center gap-4 px-6 rounded-xl bg-gradient-to-r from-primary/90 to-primary/70 border-2 border-primary/60 shadow-lg hover:shadow-xl transition-all group"
              style={{
                boxShadow: '0 0 30px rgba(212,175,55,0.15), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-primary-foreground">Multiplayer</div>
                <div className="text-sm text-primary-foreground/70">
                  Play with real opponents in real-time
                </div>
              </div>
              <div className="ml-auto flex-shrink-0">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="text-primary-foreground/60 text-xl"
                >
                  →
                </motion.div>
              </div>
            </button>
          </motion.div>

          {/* Solo - Secondary */}
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => handleModeSelection('solo')}
              className="w-full h-auto py-6 flex items-center gap-4 px-6 rounded-xl bg-card/60 backdrop-blur-md border-2 border-primary/30 shadow-lg hover:border-primary/50 hover:shadow-xl transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg text-foreground">Solo Mode</div>
                <div className="text-sm text-muted-foreground">
                  Practice offline with AI dealer
                </div>
              </div>
              <div className="ml-auto flex-shrink-0 text-muted-foreground/40 text-xl group-hover:text-primary/60 transition-colors">
                →
              </div>
            </button>
          </motion.div>
        </motion.div>

        {/* User Info & Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-between pt-4 border-t border-border/30"
        >
          {user && (
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {user.email}
            </p>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground ml-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
