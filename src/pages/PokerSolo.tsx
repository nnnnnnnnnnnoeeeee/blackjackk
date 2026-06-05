// ============================================================================
// Poker Solo vs Bots (fully client-side, no Supabase needed)
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayingCard } from '@/components/PlayingCard';
import { PokerActionBar } from '@/ui/poker/components/PokerActionBar';
import { useTranslation } from '@/ui/blackjack/i18n';
import { ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { vibrate } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createInitialState, startHand, applyAction, advanceStreet, runShowdown,
  inHandCount, decideBotAction, DEFAULT_POKER_CONFIG, legalActions,
  type BotDifficulty, type Card as PokerCard, type PokerAction, type PokerPublicState,
} from '@/lib/poker';
import type { Card as BlackjackCard } from '@/lib/blackjack/types';

const HERO = 1;
const cfg = DEFAULT_POKER_CONFIG;
const toFaceUp = (c: PokerCard): BlackjackCard => ({ ...c, faceUp: true });
const cardBack: BlackjackCard = { rank: 'A', suit: 'spades', faceUp: false };

interface Game {
  state: PokerPublicState;
  deck: PokerCard[];
  hole: Record<number, PokerCard[]>;
}

interface BotProfile {
  name: string;
  avatar: string;
  bgClass: string;
}

const BOT_PROFILES: BotProfile[] = [
  { name: 'Slick Rick', avatar: '🎩', bgClass: 'from-blue-600/30 to-blue-900/30 border-blue-500/40 text-blue-200 shadow-[0_0_12px_rgba(59,130,246,0.2)]' },
  { name: 'Lucky Lucy', avatar: '🍀', bgClass: 'from-emerald-600/30 to-emerald-900/30 border-emerald-500/40 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
  { name: 'Tight Tina', avatar: '🦉', bgClass: 'from-purple-600/30 to-purple-900/30 border-purple-500/40 text-purple-200 shadow-[0_0_12px_rgba(139,92,246,0.2)]' },
  { name: 'Maniac Mike', avatar: '🔥', bgClass: 'from-red-600/30 to-red-900/30 border-red-500/40 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
  { name: 'Dealer Dan', avatar: '🤵', bgClass: 'from-amber-600/30 to-amber-900/30 border-amber-500/40 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
  { name: 'Bluffing Bob', avatar: '🎭', bgClass: 'from-pink-600/30 to-pink-900/30 border-pink-500/40 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.2)]' },
  { name: 'Chancer Charlie', avatar: '🎲', bgClass: 'from-cyan-600/30 to-cyan-900/30 border-cyan-500/40 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]' },
];

const getSeatCoordinates = (seatNumber: number, totalPlayers: number) => {
  if (totalPlayers === 2) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    return { left: '50%', top: '18%' };
  }
  if (totalPlayers === 3) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    if (seatNumber === 2) return { left: '20%', top: '25%' };
    return { left: '80%', top: '25%' };
  }
  if (totalPlayers === 4) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    if (seatNumber === 2) return { left: '12%', top: '48%' };
    if (seatNumber === 3) return { left: '50%', top: '18%' };
    return { left: '88%', top: '48%' };
  }
  if (totalPlayers === 5) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    if (seatNumber === 2) return { left: '15%', top: '60%' };
    if (seatNumber === 3) return { left: '25%', top: '20%' };
    if (seatNumber === 4) return { left: '75%', top: '20%' };
    return { left: '85%', top: '60%' };
  }
  if (totalPlayers === 6) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    if (seatNumber === 2) return { left: '15%', top: '65%' };
    if (seatNumber === 3) return { left: '12%', top: '30%' };
    if (seatNumber === 4) return { left: '50%', top: '18%' };
    if (seatNumber === 5) return { left: '88%', top: '30%' };
    return { left: '85%', top: '65%' };
  }
  if (totalPlayers === 7) {
    if (seatNumber === 1) return { left: '50%', top: '82%' };
    if (seatNumber === 2) return { left: '18%', top: '70%' };
    if (seatNumber === 3) return { left: '10%', top: '42%' };
    if (seatNumber === 4) return { left: '32%', top: '18%' };
    if (seatNumber === 5) return { left: '68%', top: '18%' };
    if (seatNumber === 6) return { left: '90%', top: '42%' };
    return { left: '82%', top: '70%' };
  }
  // 8 players
  if (seatNumber === 1) return { left: '50%', top: '82%' };
  if (seatNumber === 2) return { left: '22%', top: '70%' };
  if (seatNumber === 3) return { left: '12%', top: '48%' };
  if (seatNumber === 4) return { left: '22%', top: '22%' };
  if (seatNumber === 5) return { left: '50%', top: '18%' };
  if (seatNumber === 6) return { left: '78%', top: '22%' };
  if (seatNumber === 7) return { left: '88%', top: '48%' };
  return { left: '78%', top: '70%' };
};

const getChipsCoordinates = (seatNumber: number, totalPlayers: number) => {
  const seatCoords = getSeatCoordinates(seatNumber, totalPlayers);
  const seatX = parseFloat(seatCoords.left);
  const seatY = parseFloat(seatCoords.top);
  // Move 22% towards the center (50, 50)
  const factor = 0.22;
  const chipX = seatX + (50 - seatX) * factor;
  const chipY = seatY + (50 - seatY) * factor;
  return { left: `${chipX}%`, top: `${chipY}%` };
};

export default function PokerSolo() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [botCount, setBotCount] = useState(3);
  const [game, setGame] = useState<Game | null>(null);
  const [lastActions, setLastActions] = useState<Record<number, { action: string; amount?: number }>>({});
  const [timeLeft, setTimeLeft] = useState<number>(15);
  
  const gameRef = useRef<Game | null>(null);
  const settledFor = useRef<number>(-1);
  gameRef.current = game;

  // 15-second countdown timer for Hero
  useEffect(() => {
    const g = game;
    if (!g || g.state.currentTurnSeat !== HERO || g.state.phase === 'payout') {
      setTimeLeft(15);
      return;
    }

    setTimeLeft(15);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto action on timeout: Check if check is legal, else fold
          const actions = legalActions(g.state, HERO);
          const autoAction = actions.includes('check') ? 'check' : 'fold';
          doAction(HERO, autoAction);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [game, doAction]);

  const start = useCallback(() => {
    setLastActions({});
    const players = [{ seat: HERO, userId: 'hero', stack: 1000 }];
    for (let i = 0; i < botCount; i++) {
      players.push({ seat: i + 2, userId: `bot${i + 2}`, stack: 1000 });
    }
    const started = startHand(createInitialState(players, cfg), cfg);
    setGame({ state: started.state, deck: started.deck, hole: started.hole });
  }, [botCount]);

  const doAction = useCallback((seat: number, action: PokerAction, amount?: number) => {
    setGame((prev) => {
      if (!prev) return prev;
      try {
        const next = applyAction(prev.state, seat, action, amount, cfg);
        
        // Record this action for the visual bubble
        setLastActions((prevActions) => ({
          ...prevActions,
          [seat]: { action, amount }
        }));

        return { ...prev, state: next };
      } catch (e) {
        console.warn('Illegal action:', e);
        return prev;
      }
    });
  }, []);

  const newHand = useCallback(() => {
    setLastActions({});
    setGame((prev) => {
      if (!prev) return prev;
      try {
        const started = startHand(prev.state, cfg);
        return { state: started.state, deck: started.deck, hole: started.hole };
      } catch {
        return prev;
      }
    });
  }, []);

  // Drive bots: when it's a bot's turn, act after a delay.
  useEffect(() => {
    const g = game;
    if (!g) return;
    const seat = g.state.currentTurnSeat;
    if (seat === null || seat === HERO) return;
    if (!['preflop', 'flop', 'turn', 'river'].includes(g.state.phase)) return;
    const timer = setTimeout(() => {
      const cur = gameRef.current;
      if (!cur || cur.state.currentTurnSeat !== seat) return;
      const decision = decideBotAction(cur.state, seat, cur.hole[seat] ?? [], difficulty);
      doAction(seat, decision.action, decision.amount);
    }, 750);
    return () => clearTimeout(timer);
  }, [game, difficulty, doAction]);

  // Advance street or run showdown after a delay when betting is closed.
  useEffect(() => {
    const g = game;
    if (!g) return;
    const s = g.state;
    if (s.currentTurnSeat !== null || s.phase === 'payout') return;

    const timer = setTimeout(() => {
      setLastActions({}); // Clear player action bubbles when street changes

      setGame((prev) => {
        if (!prev) return null;
        const current = prev.state;
        if (current.currentTurnSeat !== null || current.phase === 'payout') return prev;

        if (inHandCount(current) <= 1) {
          const nextState = runShowdown(current, {});
          return { ...prev, state: nextState };
        }
        if (current.phase === 'showdown') {
          const nextState = runShowdown(current, prev.hole);
          return { ...prev, state: nextState };
        }

        // Advance street
        const adv = advanceStreet(current, prev.deck);
        return { state: adv.state, deck: adv.deck, hole: prev.hole };
      });
    }, 1500); // 1.5s delay to let player observe final bets

    return () => clearTimeout(timer);
  }, [game]);

  // Celebrate when the hero wins a pot.
  useEffect(() => {
    if (!game || game.state.phase !== 'payout' || !game.state.results) return;
    if (settledFor.current === game.state.handNo) return;
    settledFor.current = game.state.handNo;
    if (game.state.results.find((r) => r.seat === HERO && r.amountWon > 0)) {
      vibrate('win');
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [game]);

  // Trigger haptic when it becomes Hero's turn
  useEffect(() => {
    if (game && game.state.currentTurnSeat === HERO) {
      vibrate('tap');
    }
  }, [game?.state.currentTurnSeat]);

  const getActionLabel = (action: string, amount?: number) => {
    const act = action.toLowerCase();
    if (act === 'fold') return t.poker.fold;
    if (act === 'check') return t.poker.check;
    if (act === 'call') return `${t.poker.call} ${amount ? `$${amount}` : ''}`;
    if (act === 'bet') return `${t.poker.bet} ${amount ? `$${amount}` : ''}`;
    if (act === 'raise') return `${t.poker.raiseTo || 'Raise to'} ${amount ? `$${amount}` : ''}`;
    if (act === 'allin') return t.poker.allIn;
    return action;
  };

  // ---- Setup screen ----
  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt text-white font-outfit p-4 select-none">
        <div className="max-w-md w-full bg-black/45 backdrop-blur-xl border border-[#d4af37]/25 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6">
          <Button onClick={() => navigate('/mode-selection')} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white/80">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
          </Button>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFDF73] to-[#D4AF37]">
              {t.poker.vsBots}
            </h1>
            <p className="text-sm text-white/60">{t.poker.vsBotsDesc}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/50 font-bold">
                {t.poker.chooseDifficulty}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    type="button"
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      difficulty === d
                        ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {t.poker[d]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-white/50 font-bold">
                {t.poker.numberOfBots}: <span className="text-[#d4af37]">{botCount}</span>
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBotCount(n)}
                    type="button"
                    className={`py-2 rounded-lg text-sm font-bold transition-all border ${
                      botCount === n
                        ? 'bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={start}
              type="button"
              className="w-full btn-casino glow-gold py-3.5 text-base font-extrabold"
            >
              {t.poker.startGame}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Game ----
  const { state, hole } = game;
  const pot = state.seats.reduce((a, s) => a + s.committedTotal, 0);
  const isHeroTurn = state.currentTurnSeat === HERO;
  const playersWithChips = state.seats.filter((s) => s.userId && s.stack > 0).length;
  const gameOver = state.phase === 'payout' && playersWithChips < 2;
  const seatName = (seat: number) => (seat === HERO ? 'You' : t.poker.botName(seat - 1));

  const activePlayersCount = state.seats.filter((s) => s.userId).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#061e12] to-[#010805] text-white font-outfit select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 sm:px-6 bg-black/40 backdrop-blur-md border-b border-white/15">
        <Button onClick={() => setGame(null)} variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white/80">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
        </Button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-black">{t.poker.title}</div>
          <div className="text-[10px] text-white/55 font-bold uppercase tracking-wider">{t.poker[difficulty]} Opponents</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-widest text-white/45 font-bold">{t.poker.pot}</div>
          <div className="text-lg font-black text-[#d4af37] tabular-nums">${pot}</div>
        </div>
      </div>

      {/* Felt Board Area */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-0 relative">
        <div className="w-full max-w-4xl aspect-[1.12/1] sm:aspect-[2.1/1] bg-table-felt border-4 border-amber-900/90 rounded-[45px] sm:rounded-[100px] relative shadow-[inset_0_0_100px_rgba(0,0,0,0.85),0_15px_40px_rgba(0,0,0,0.6)] table-border">
          
          {/* Table Center (Board + Pot) */}
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 z-20 pointer-events-none">
            {/* Main Pot badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/65 border border-[#d4af37]/35 rounded-full text-[10px] sm:text-xs font-black tracking-wider text-[#FFDF73] uppercase shadow-md backdrop-blur-sm">
              🪙 {t.poker.pot}: <span className="tabular-nums">${pot}</span>
            </div>

            {/* Community cards slots */}
            <div className="flex gap-1 sm:gap-2 items-center justify-center">
              {Array.from({ length: 5 }).map((_, idx) => {
                const card = state.communityCards[idx];
                if (card) {
                  return (
                    <PlayingCard
                      key={idx}
                      card={toFaceUp(card)}
                      index={idx}
                      className="!min-w-0 !max-w-none w-[44px] sm:w-[58px] md:w-[66px] aspect-[2.5/3.5] shadow-lg"
                    />
                  );
                }
                return (
                  <div
                    key={idx}
                    className="w-[44px] sm:w-[58px] md:w-[66px] aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-white/10 bg-black/55 flex items-center justify-center text-white/5 text-xl sm:text-2xl font-bold"
                  >
                    🂠
                  </div>
                );
              })}
            </div>

            {/* Payout/Showdown banner */}
            <AnimatePresence>
              {state.phase === 'payout' && state.results && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center gap-1.5 bg-black/85 border border-[#d4af37]/30 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center shadow-[0_12px_28px_rgba(0,0,0,0.6)] z-40 max-w-[190px] sm:max-w-xs"
                >
                  <div className="text-[9px] sm:text-xs uppercase tracking-widest text-emerald-400 font-bold">
                    {t.poker.showdown}
                  </div>
                  {state.results.filter((r) => r.amountWon > 0).map((r) => (
                    <div key={r.seat} className="text-xs sm:text-sm font-extrabold text-white">
                      {r.seat === HERO ? (
                        <span className="text-emerald-400 font-black">🎉 {t.poker.youWin(r.amountWon)}</span>
                      ) : (
                        <span>{t.poker.winnerNamed(seatName(r.seat))} (${r.amountWon})</span>
                      )}
                      {r.handLabel && (
                        <div className="text-[10px] sm:text-xs font-semibold text-white/60 mt-0.5 leading-tight">
                          {r.handLabel}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player Seats around Table */}
          {state.seats.filter((s) => s.userId).map((s) => {
            const isTurn = state.currentTurnSeat === s.seat;
            const coords = getSeatCoordinates(s.seat, activePlayersCount);
            const chipCoords = getChipsCoordinates(s.seat, activePlayersCount);

            const isMe = s.seat === HERO;
            const profile = isMe ? null : BOT_PROFILES[(s.seat - 2) % BOT_PROFILES.length];
            const displayName = isMe ? 'You' : (profile?.name || seatName(s.seat));
            const avatarEmoji = isMe ? '👤' : (profile?.avatar || '🤖');
            const avatarBg = isMe
              ? 'from-[#FFDF73]/20 to-[#D4AF37]/20 border-[#D4AF37]/45 text-[#FFDF73]'
              : (profile?.bgClass || 'from-zinc-700/20 to-zinc-950/20 border-zinc-600/30');

            return (
              <div key={s.seat}>
                {/* Seat Box */}
                <div
                  className={`absolute rounded-2xl p-2 border text-center transition-all w-24 sm:w-28 flex flex-col items-center justify-between z-30 bg-black/75 border-white/10 backdrop-blur-md ${
                    isTurn
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/35 shadow-[0_0_18px_rgba(212,175,55,0.5)]'
                      : ''
                  } ${s.status === 'folded' ? 'opacity-35 grayscale scale-95 border-white/5 bg-black/50' : ''}`}
                  style={{
                    left: coords.left,
                    top: coords.top,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Dealer badge */}
                  {s.seat === state.buttonSeat && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black bg-[#d4af37] text-black rounded-full w-5 h-5 border border-black/40 flex items-center justify-center shadow-md z-40">
                      D
                    </span>
                  )}

                  {/* Active turn indicators (Player timer / Bot Thinking) */}
                  {isTurn && (
                    <>
                      {isMe ? (
                        <span className="absolute -top-3.5 -left-3 text-[10px] font-black bg-red-600 text-white rounded-full w-6 h-6 border border-white/20 flex items-center justify-center shadow-lg animate-bounce z-40">
                          {timeLeft}s
                        </span>
                      ) : (
                        <span className="absolute -top-3.5 -left-4 text-[8px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full border border-black/45 flex items-center gap-1 shadow-md animate-pulse z-40 whitespace-nowrap">
                          <span className="w-1 h-1 bg-black rounded-full animate-ping" />
                          Mise...
                        </span>
                      )}
                    </>
                  )}

                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-b ${avatarBg} border flex items-center justify-center text-sm shadow-inner mb-1`}>
                    {avatarEmoji}
                  </div>

                  {/* Display Name */}
                  <span className="text-[11px] sm:text-xs font-bold truncate max-w-[80px] text-white/95 leading-tight">
                    {displayName}
                  </span>

                  {/* Chips Stack (Gold Pill) */}
                  <div className="text-[11px] sm:text-xs font-black text-[#FFDF73] bg-[#d4af37]/15 border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full mt-1 shadow-sm tabular-nums">
                    ${s.stack}
                  </div>

                  {/* Status Badges */}
                  {s.status === 'folded' && (
                    <div className="text-[8px] font-extrabold uppercase tracking-wider text-white/40 mt-1 bg-white/5 border border-white/5 px-1 py-0.5 rounded">
                      {t.poker.folded}
                    </div>
                  )}
                  {s.status === 'allin' && (
                    <div className="text-[8px] font-black uppercase tracking-wider text-amber-400 mt-1 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded animate-pulse">
                      {t.poker.allInTag}
                    </div>
                  )}

                  {/* Hole Cards */}
                  <div className="flex justify-center gap-0.5 mt-1.5 min-h-[42px] sm:min-h-[52px]">
                    {s.seat === HERO
                      ? (hole[HERO] ?? []).map((c, i) => (
                          <PlayingCard
                            key={i}
                            card={toFaceUp(c)}
                            index={i}
                            className="!min-w-0 !max-w-none w-[28px] sm:w-[35px] aspect-[2.5/3.5] shadow-md"
                          />
                        ))
                      : s.holeCards
                      ? s.holeCards.map((c, i) => (
                          <PlayingCard
                            key={i}
                            card={toFaceUp(c)}
                            index={i}
                            className="!min-w-0 !max-w-none w-[28px] sm:w-[35px] aspect-[2.5/3.5] shadow-md"
                          />
                        ))
                      : s.status !== 'folded'
                      ? [0, 1].map((i) => (
                          <PlayingCard
                            key={i}
                            card={cardBack}
                            index={i}
                            className="!min-w-0 !max-w-none w-[28px] sm:w-[35px] aspect-[2.5/3.5] shadow-md"
                          />
                        ))
                      : null}
                  </div>

                  {/* Visual timer countdown bar at seat bottom */}
                  {isMe && isTurn && (
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1 max-w-[80px]">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-400"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / 15) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </div>
                  )}

                  {/* Temporary Action Bubble overlay */}
                  <AnimatePresence>
                    {lastActions[s.seat] && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 5 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -5 }}
                        className="absolute -top-11 left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] text-black font-extrabold px-2.5 py-0.5 rounded-full text-[9px] sm:text-xs shadow-[0_5px_12px_rgba(0,0,0,0.5)] border border-white/20 whitespace-nowrap z-50 uppercase tracking-wider"
                      >
                        {getActionLabel(lastActions[s.seat].action, lastActions[s.seat].amount)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Player Committed Chips Badge */}
                {s.committedThisStreet > 0 && (
                  <div
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-black/85 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-[#d4af37]/35 text-[10px] sm:text-xs font-black tabular-nums text-[#FFDF73] shadow-md"
                    style={{
                      left: chipCoords.left,
                      top: chipCoords.top,
                    }}
                  >
                    🪙 ${s.committedThisStreet}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-black/35 backdrop-blur-md z-40">
        {isHeroTurn ? (
          <PokerActionBar state={state} mySeat={HERO} onAction={doAction} />
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-lg sm:text-xl font-bold text-[#d4af37]">{t.poker.gameOver}</div>
            <button
              onClick={() => setGame(null)}
              type="button"
              className="px-10 py-3.5 btn-casino glow-gold font-extrabold text-sm uppercase tracking-wider text-black shadow-lg"
            >
              {t.poker.playAgain}
            </button>
          </div>
        ) : state.phase === 'payout' ? (
          <div className="flex justify-center">
            <button
              onClick={newHand}
              type="button"
              className="px-10 py-3.5 btn-casino glow-gold font-extrabold text-sm uppercase tracking-wider text-black shadow-lg"
            >
              {t.poker.deal}
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-white/50 py-3">{t.poker.waitingForTurn}</div>
        )}
      </div>
    </div>
  );
}
