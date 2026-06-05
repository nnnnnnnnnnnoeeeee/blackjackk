// ============================================================================
// Poker - Action Bar (Fold / Check / Call / Bet-Raise with sizing)
// ============================================================================

import { memo, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/ui/blackjack/i18n';
import {
  legalActions, callAmount, minRaiseTo,
  type PokerAction, type PokerPublicState,
} from '@/lib/poker';

interface PokerActionBarProps {
  state: PokerPublicState;
  mySeat: number;
  disabled?: boolean;
  onAction: (action: PokerAction, amount?: number) => void;
}

export const PokerActionBar = memo(function PokerActionBar({
  state,
  mySeat,
  disabled = false,
  onAction,
}: PokerActionBarProps) {
  const { t } = useTranslation();
  const me = state.seats.find((s) => s.seat === mySeat);
  const actions = useMemo(() => legalActions(state, mySeat), [state, mySeat]);

  const pot = useMemo(() => state.seats.reduce((a, s) => a + s.committedTotal, 0), [state.seats]);
  const toCall = callAmount(state, mySeat);
  const minTo = minRaiseTo(state);
  const maxTo = me ? me.committedThisStreet + me.stack : 0;
  const canAggress = actions.includes('bet') || actions.includes('raise');

  const [raiseTo, setRaiseTo] = useState(Math.min(minTo, maxTo));
  useEffect(() => {
    setRaiseTo(Math.min(Math.max(minTo, 0), maxTo));
  }, [minTo, maxTo, state.handNo, state.phase, state.currentTurnSeat]);

  if (!me || actions.length === 0) {
    return (
      <div className="text-center text-sm text-white/50 py-3">{t.poker.waitingForTurn}</div>
    );
  }

  const aggressAction: PokerAction = actions.includes('bet') ? 'bet' : 'raise';
  const clampTo = (v: number) => Math.max(minTo, Math.min(maxTo, v));
  const sizeButtons: Array<{ label: string; to: number }> = [
    { label: t.poker.half, to: clampTo(state.betToCall + Math.round(pot * 0.5)) },
    { label: t.poker.threeQuarter, to: clampTo(state.betToCall + Math.round(pot * 0.75)) },
    { label: t.poker.potSize, to: clampTo(state.betToCall + pot) },
  ];

  return (
    <div className="flex flex-col gap-3 w-full max-w-lg mx-auto">
      {/* Raise sizing */}
      {canAggress && maxTo > minTo && (
        <div className="flex items-center gap-3 px-1">
          <input
            type="range"
            min={minTo}
            max={maxTo}
            step={state.blinds.bb}
            value={raiseTo}
            onChange={(e) => setRaiseTo(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-white/15"
            aria-label={t.poker.raiseTo}
          />
          <div className="w-20 text-right font-bold tabular-nums text-primary">${raiseTo}</div>
        </div>
      )}
      {canAggress && (
        <div className="flex gap-2">
          {sizeButtons.map((b) => (
            <button
              key={b.label}
              onClick={() => setRaiseTo(b.to)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
              type="button"
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Primary actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onAction('fold')}
          disabled={disabled || !actions.includes('fold')}
          className="py-3 rounded-xl font-extrabold uppercase tracking-wide bg-gradient-to-b from-[#64748b] to-[#475569] text-white shadow disabled:opacity-40"
          type="button"
        >
          {t.poker.fold}
        </button>

        {actions.includes('check') ? (
          <button
            onClick={() => onAction('check')}
            disabled={disabled}
            className="py-3 rounded-xl font-extrabold uppercase tracking-wide bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white shadow disabled:opacity-40"
            type="button"
          >
            {t.poker.check}
          </button>
        ) : (
          <button
            onClick={() => onAction('call')}
            disabled={disabled || !actions.includes('call')}
            className="py-3 rounded-xl font-extrabold uppercase tracking-wide bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] text-white shadow disabled:opacity-40"
            type="button"
          >
            {t.poker.call} {toCall > 0 ? `$${toCall}` : ''}
          </button>
        )}

        {canAggress ? (
          <button
            onClick={() => onAction(aggressAction, raiseTo)}
            disabled={disabled}
            className={cn(
              'py-3 rounded-xl font-extrabold uppercase tracking-wide text-black',
              'bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow disabled:opacity-40',
            )}
            type="button"
          >
            {aggressAction === 'bet' ? t.poker.bet : t.poker.raiseTo} ${raiseTo}
          </button>
        ) : (
          <button
            onClick={() => onAction('allin')}
            disabled={disabled || !actions.includes('allin')}
            className="py-3 rounded-xl font-extrabold uppercase tracking-wide text-black bg-gradient-to-b from-[#FFDF73] to-[#D4AF37] shadow disabled:opacity-40"
            type="button"
          >
            {t.poker.allIn}
          </button>
        )}
      </div>
    </div>
  );
});

export default PokerActionBar;
