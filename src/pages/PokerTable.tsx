// ============================================================================
// Poker Table Page (real-time multiplayer No-Limit Texas Hold'em)
// ============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { PlayingCard } from '@/components/PlayingCard';
import { PokerActionBar } from '@/ui/poker/components/PokerActionBar';
import { useTranslation } from '@/ui/blackjack/i18n';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Card as BlackjackCard } from '@/lib/blackjack/types';
import type { Card as PokerCard, PokerAction, PokerPublicState } from '@/lib/poker';

interface PlayerRow { id: string; user_id: string; seat: number; bankroll: number }
interface TableRow { id: string; name: string; created_by: string; room_code?: string; table_players: PlayerRow[] }

const toFaceUp = (c: PokerCard): BlackjackCard => ({ ...c, faceUp: true });
const cardBack: BlackjackCard = { rank: 'A', suit: 'spades', faceUp: false };

export default function PokerTable() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<TableRow | null>(null);
  const [state, setState] = useState<PokerPublicState | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [myHole, setMyHole] = useState<PokerCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fetchedHoleForHand = useRef<number>(-1);

  const mySeat = table?.table_players.find((p) => p.user_id === userId)?.seat ?? null;

  const loadTable = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('tables').select('*, table_players(*)').eq('id', id).single();
    if (data) {
      setTable(data as TableRow);
      const ids = (data.table_players as PlayerRow[]).map((p) => p.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, username').in('id', ids);
        const map: Record<string, string> = {};
        for (const p of (profs ?? []) as Array<{ id: string; username: string }>) map[p.id] = p.username;
        setNames(map);
      }
    }
  }, [id]);

  // Initial load + realtime subscription.
  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUserId(user?.id ?? null);
      await loadTable();
      const { data: stateRow } = await supabase.from('table_state').select('state_json').eq('table_id', id).single();
      if (active && stateRow) setState(stateRow.state_json as PokerPublicState);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`poker_${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'table_state', filter: `table_id=eq.${id}` },
        (payload) => setState((payload.new as { state_json: PokerPublicState }).state_json))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'table_players', filter: `table_id=eq.${id}` },
        () => loadTable())
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [id, loadTable]);

  // Fetch my own hole cards once per hand (RLS returns only my row).
  useEffect(() => {
    if (!id || !state || state.phase === 'waiting') return;
    if (state.handNo === fetchedHoleForHand.current) return;
    fetchedHoleForHand.current = state.handNo;
    (async () => {
      const { data } = await supabase
        .from('poker_hole_cards').select('cards').eq('table_id', id).eq('hand_no', state.handNo).maybeSingle();
      setMyHole((data?.cards as PokerCard[]) ?? null);
    })();
  }, [id, state]);

  const startHand = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke('poker_start_hand', { body: { table_id: id } });
    if (error) toast.error(error.message);
    setBusy(false);
  }, [id]);

  const act = useCallback(async (action: PokerAction, amount?: number) => {
    if (!id) return;
    setBusy(true);
    const { error } = await supabase.functions.invoke('poker_player_action', { body: { table_id: id, action, amount } });
    if (error) toast.error(error.message);
    setBusy(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#062114]">
        <Loader2 className="h-10 w-10 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  const seatName = (seat: number) => {
    const p = table?.table_players.find((x) => x.seat === seat);
    return p ? (names[p.user_id] ?? `Seat ${seat}`) : t.poker.seatOpen;
  };
  const pot = state ? state.seats.reduce((a, s) => a + s.committedTotal, 0) : 0;
  const isMyTurn = !!state && state.currentTurnSeat === mySeat;
  const canDeal = !!state && (state.phase === 'waiting' || state.phase === 'payout') &&
    (table?.table_players.length ?? 0) >= 2;
  const tag = (seat: number) => {
    if (!state) return '';
    if (seat === state.buttonSeat) return 'D';
    return '';
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-[#0a3622] via-[#062114] to-[#030e09] text-white font-outfit">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Button onClick={() => navigate('/poker/lobby')} variant="outline" size="sm"
          className="bg-black/40 border-white/15">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
        </Button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-[#d4af37]/80 font-bold">{t.poker.title}</div>
          {table?.room_code && <div className="text-[11px] text-white/50">Code : {table.room_code}</div>}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t.poker.pot}</div>
          <div className="text-xl font-black text-[#d4af37] tabular-nums">${pot}</div>
        </div>
      </div>

      {/* Community cards */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-3">
        <div className="flex gap-2 min-h-[96px] items-center">
          {(state?.communityCards ?? []).map((c, i) => (
            <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-[64px]" />
          ))}
          {(!state || state.communityCards.length === 0) && (
            <div className="text-white/30 uppercase tracking-widest text-sm">{t.poker.subtitle}</div>
          )}
        </div>

        {/* Results */}
        {state?.phase === 'payout' && state.results && (
          <div className="text-center space-y-1">
            {state.results.filter((r) => r.amountWon > 0).map((r) => (
              <div key={r.seat} className="text-lg font-bold text-[#4ade80]">
                {r.seat === mySeat ? t.poker.youWin(r.amountWon) : `${t.poker.winnerNamed(seatName(r.seat))} ($${r.amountWon})`}
                {r.handLabel ? ` — ${r.handLabel}` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Seats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-3xl">
          {(state?.seats ?? []).filter((s) => s.userId).map((s) => {
            const isTurn = state?.currentTurnSeat === s.seat;
            return (
              <div key={s.seat}
                className={`rounded-xl p-2.5 border text-center transition-all ${
                  isTurn ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_16px_rgba(212,175,55,0.3)]'
                    : 'border-white/10 bg-black/30'
                } ${s.status === 'folded' ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-sm font-bold truncate">{seatName(s.seat)}</span>
                  {tag(s.seat) && <span className="text-[9px] font-black bg-white text-black rounded-full w-4 h-4 flex items-center justify-center">{tag(s.seat)}</span>}
                </div>
                <div className="text-[#d4af37] font-black tabular-nums">${s.stack}</div>
                {s.committedThisStreet > 0 && <div className="text-[11px] text-white/60">{t.poker.bet}: ${s.committedThisStreet}</div>}
                {s.status === 'folded' && <div className="text-[10px] uppercase text-white/40">{t.poker.folded}</div>}
                {s.status === 'allin' && <div className="text-[10px] uppercase text-warning font-bold">{t.poker.allInTag}</div>}
                {/* Hero hole cards / opponent backs */}
                <div className="flex justify-center gap-1 mt-1.5">
                  {s.seat === mySeat && myHole
                    ? myHole.map((c, i) => <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-9" />)
                    : (s.holeCards
                        ? s.holeCards.map((c, i) => <PlayingCard key={i} card={toFaceUp(c)} index={i} className="w-9" />)
                        : (s.status !== 'folded' && state?.phase !== 'waiting' && state?.phase !== 'payout'
                            ? [0, 1].map((i) => <PlayingCard key={i} card={cardBack} index={i} className="w-9" />)
                            : null))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom dock */}
      <div className="p-3 border-t border-white/10 bg-black/30 backdrop-blur-sm">
        {isMyTurn && state ? (
          <PokerActionBar state={state} mySeat={mySeat!} disabled={busy} onAction={act} />
        ) : canDeal ? (
          <div className="flex justify-center">
            <button onClick={startHand} disabled={busy}
              className="px-8 py-3 rounded-xl font-extrabold uppercase tracking-wider text-black bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow disabled:opacity-50">
              {busy ? '…' : t.poker.deal}
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-white/50 py-3">
            {(table?.table_players.length ?? 0) < 2 ? t.poker.waitingForPlayers : t.poker.waitingForTurn}
          </div>
        )}
      </div>
    </div>
  );
}
