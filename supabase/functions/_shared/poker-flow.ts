// ============================================================================
// Shared poker flow — apply an action then auto-resolve streets/showdown.
// Used by both poker_player_action and poker_timeout to keep behaviour identical.
// ============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  applyAction, advanceStreet, runShowdown, inHandCount,
  type Card, type PokerAction, type PokerConfig, type PokerPublicState,
} from './poker-engine.ts';

async function loadHole(client: SupabaseClient, tableId: string, handNo: number): Promise<Record<number, Card[]>> {
  const { data } = await client
    .from('poker_hole_cards').select('seat, cards').eq('table_id', tableId).eq('hand_no', handNo);
  const hole: Record<number, Card[]> = {};
  for (const row of (data ?? []) as Array<{ seat: number; cards: Card[] }>) hole[row.seat] = row.cards;
  return hole;
}

/**
 * Apply `action` for `seat`, then keep advancing the hand while betting rounds
 * are closed (deal community cards from `deck`, run showdown with side pots).
 * Returns the resulting public state and remaining deck. Throws if the action
 * is illegal.
 */
export async function applyAndResolve(
  client: SupabaseClient,
  tableId: string,
  state: PokerPublicState,
  deck: Card[],
  seat: number,
  action: PokerAction,
  amount: number | undefined,
  cfg: PokerConfig,
): Promise<{ state: PokerPublicState; deck: Card[] }> {
  let working = applyAction(state, seat, action, amount, cfg);
  let workingDeck = [...deck];

  let guard = 0;
  while (working.currentTurnSeat === null && working.phase !== 'payout' && guard++ < 12) {
    if (inHandCount(working) <= 1) {
      working = runShowdown(working, {}); // uncontested
      break;
    }
    if (working.phase === 'showdown') {
      working = runShowdown(working, await loadHole(client, tableId, working.handNo));
      break;
    }
    const adv = advanceStreet(working, workingDeck);
    working = adv.state;
    workingDeck = adv.deck;
    if (working.phase === 'showdown') {
      working = runShowdown(working, await loadHole(client, tableId, working.handNo));
      break;
    }
    if (working.currentTurnSeat !== null) break; // players can act on the new street
  }

  return { state: working, deck: workingDeck };
}

/** Stamp (or clear) the auto-action deadline based on whose turn it is. */
export function withTurnDeadline(state: PokerPublicState, cfg: PokerConfig): PokerPublicState {
  return {
    ...state,
    turnDeadline: state.currentTurnSeat !== null ? Date.now() + cfg.actionTimerSec * 1000 : undefined,
  };
}
