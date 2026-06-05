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
import {
  createInitialState, startHand, applyAction, advanceStreet, runShowdown,
  inHandCount, decideBotAction, DEFAULT_POKER_CONFIG,
  type BotDifficulty, type Card as PokerCard, type PokerAction, type PokerPublicState,
} from '@/lib/poker';
import type { Card as BlackjackCard } from '@/lib/blackjack/types';

const HERO = 1;
const cfg = DEFAULT_POKER_CONFIG;
const toFaceUp = (c: PokerCard): BlackjackCard => ({ ...c, faceUp: true });
const cardBack: BlackjackCard = { rank: 'A', suit: 'spades', faceUp: false };

interface Game { state: PokerPublicState; deck: PokerCard[]; hole: Record<number, PokerCard[]> }

function resolveLocal(state: PokerPublicState, deck: PokerCard[], hole: Record<number, PokerCard[]>) {
  let working = state;
  let d = deck;
  let guard = 0;
  while (working.currentTurnSeat === null && working.phase !== 'payout' && guard++ < 12) {
    if (inHandCount(working) <= 1) { working = runShowdown(working, {}); break; }
    if (working.phase === 'showdown') { working = runShowdown(working, hole); break; }
    const adv = advanceStreet(working, d); working = adv.state; d = adv.deck;
    if (working.phase === 'showdown') { working = runShowdown(working, hole); break; }
    if (working.currentTurnSeat !== null) break;
  }
  return { state: working, deck: d };
}

export default function PokerSolo() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [botCount, setBotCount] = useState(3);
  const [game, setGame] = useState<Game | null>(null);
  const gameRef = useRef<Game | null>(null);
  const settledFor = useRef<number>(-1);
  gameRef.current = game;

  const start = useCallback(() => {
    const players = [{ seat: HERO, userId: 'hero', stack: 1000 }];
    for (let i = 0; i < botCount; i++) players.push({ seat: i + 2, userId: `bot${i + 2}`, stack: 1000 });
    const started = startHand(createInitialState(players, cfg), cfg);
    setGame({ state: started.state, deck: started.deck, hole: started.hole });
  }, [botCount]);

  const doAction = useCallback((seat: number, action: PokerAction, amount?: number) => {
    setGame((prev) => {
      if (!prev) return prev;
      try {
        const next = applyAction(prev.state, seat, action, amount, cfg);
        const { state, deck } = resolveLocal(next, prev.deck, prev.hole);
        return { ...prev, state, deck };
      } catch {
        return prev; // illegal — ignore
      }
    });
  }, []);

  const newHand = useCallback(() => {
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

  // Drive bots: when it's a bot's turn during a betting street, act after a delay.
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

  // ---- Setup screen ----
  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a3622] via-[#062114] to-[#030e09] text-white font-outfit p-4">
        <div className="max-w-md mx-auto">
          <Button onClick={() => navigate('/mode-selection')} variant="outline" size="sm" className="bg-black/40 border-white/15 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
          </Button>
          <div className="text-center mb-8">
            <div className="text-3xl font-black text-[#d4af37]">{t.poker.vsBots}</div>
            <div className="text-sm text-white/50">{t.poker.vsBotsDesc}</div>
          </div>

          <div className="rounded-2xl bg-black/40 border border-white/10 p-5 space-y-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">{t.poker.chooseDifficulty}</div>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      difficulty === d ? 'bg-[#d4af37] text-black' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}>
                    {t.poker[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">
                {t.poker.numberOfBots}: <span className="text-[#d4af37]">{botCount}</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button key={n} onClick={() => setBotCount(n)}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${
                      botCount === n ? 'bg-[#d4af37] text-black' : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={start}
              className="w-full py-3 rounded-xl font-extrabold uppercase tracking-wider text-black bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow">
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a3622] via-[#062114] to-[#030e09] text-white font-outfit">
      <div className="flex items-center justify-between p-3">
        <Button onClick={() => setGame(null)} variant="outline" size="sm" className="bg-black/40 border-white/15">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
        </Button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-[#d4af37]/80 font-bold">{t.poker.vsBots}</div>
          <div className="text-[11px] text-white/50">{t.poker[difficulty]}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t.poker.pot}</div>
          <div className="text-xl font-black text-[#d4af37] tabular-nums">${pot}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-3">
        <div className="flex gap-2 min-h-[96px] items-center">
          {state.communityCards.map((c, i) => <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-[64px]" />)}
          {state.communityCards.length === 0 && <div className="text-white/30 uppercase tracking-widest text-sm">{t.poker.subtitle}</div>}
        </div>

        {state.phase === 'payout' && state.results && (
          <div className="text-center space-y-1">
            {state.results.filter((r) => r.amountWon > 0).map((r) => (
              <div key={r.seat} className="text-lg font-bold text-[#4ade80]">
                {r.seat === HERO ? t.poker.youWin(r.amountWon) : `${t.poker.winnerNamed(seatName(r.seat))} ($${r.amountWon})`}
                {r.handLabel ? ` — ${r.handLabel}` : ''}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-3xl">
          {state.seats.filter((s) => s.userId).map((s) => {
            const isTurn = state.currentTurnSeat === s.seat;
            return (
              <div key={s.seat}
                className={`rounded-xl p-2.5 border text-center transition-all ${
                  isTurn ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_16px_rgba(212,175,55,0.3)]' : 'border-white/10 bg-black/30'
                } ${s.status === 'folded' ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm font-bold truncate">{seatName(s.seat)}</span>
                  {s.seat === state.buttonSeat && <span className="text-[9px] font-black bg-white text-black rounded-full w-4 h-4 flex items-center justify-center">D</span>}
                </div>
                <div className="text-[#d4af37] font-black tabular-nums">${s.stack}</div>
                {s.committedThisStreet > 0 && <div className="text-[11px] text-white/60">{t.poker.bet}: ${s.committedThisStreet}</div>}
                {s.status === 'folded' && <div className="text-[10px] uppercase text-white/40">{t.poker.folded}</div>}
                {s.status === 'allin' && <div className="text-[10px] uppercase text-warning font-bold">{t.poker.allInTag}</div>}
                <div className="flex justify-center gap-1 mt-1.5">
                  {s.seat === HERO
                    ? (hole[HERO] ?? []).map((c, i) => <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-9" />)
                    : (s.holeCards
                        ? s.holeCards.map((c, i) => <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-9" />)
                        : (s.status !== 'folded' ? [0, 1].map((i) => <PlayingCard key={i} card={cardBack} index={i} className="w-9" />) : null))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        {isHeroTurn ? (
          <PokerActionBar state={state} mySeat={HERO} onAction={doAction} />
        ) : gameOver ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-bold text-[#d4af37]">{t.poker.gameOver}</div>
            <button onClick={() => setGame(null)} className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wider text-black bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow">
              {t.poker.playAgain}
            </button>
          </div>
        ) : state.phase === 'payout' ? (
          <div className="flex justify-center">
            <button onClick={newHand} className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wider text-black bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow">
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
