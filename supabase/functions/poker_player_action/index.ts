// ============================================================================
// Edge Function: poker_player_action
// Validates and applies a poker action, auto-advances streets and resolves
// showdown / payout. All deck access is server-side (private store).
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  applyAction, advanceStreet, runShowdown, inHandCount,
  type Card, type PokerAction, type PokerConfig, type PokerPublicState,
} from '../_shared/poker-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { table_id, action, amount } = await req.json() as
      { table_id: string; action: PokerAction; amount?: number };

    const { data: table } = await supabaseClient
      .from('tables').select('*, table_players(*)').eq('id', table_id).single();
    if (!table) {
      return new Response(JSON.stringify({ error: 'Table not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const player = table.table_players.find((p: { user_id: string; seat: number }) => p.user_id === user.id);
    if (!player) {
      return new Response(JSON.stringify({ error: 'Not a player at this table' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: stateRow } = await supabaseClient
      .from('table_state').select('state_json').eq('table_id', table_id).single();
    const state = stateRow?.state_json as PokerPublicState;
    if (!state) {
      return new Response(JSON.stringify({ error: 'No table state' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cfg = table.config as PokerConfig;

    // Read the private deck for this hand.
    const { data: priv } = await supabaseClient
      .from('poker_private').select('deck').eq('table_id', table_id).single();
    let deck: Card[] = (priv?.deck as Card[]) ?? [];

    // Apply the action (throws if out of turn / illegal).
    let working: PokerPublicState;
    try {
      working = applyAction(state, player.seat, action, amount, cfg);
    } catch (err) {
      const e = err as { message?: string } | null;
      return new Response(JSON.stringify({ error: e?.message || 'Illegal action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve closed betting rounds: advance streets and/or run showdown.
    let guard = 0;
    while (working.currentTurnSeat === null && working.phase !== 'payout' && guard++ < 12) {
      if (inHandCount(working) <= 1) {
        working = runShowdown(working, {}); // uncontested — winner mucks
        break;
      }
      if (working.phase === 'showdown') {
        const hole = await loadHole(supabaseClient, table_id, working.handNo);
        working = runShowdown(working, hole);
        break;
      }
      const adv = advanceStreet(working, deck);
      working = adv.state;
      deck = adv.deck;
      if (working.phase === 'showdown') {
        const hole = await loadHole(supabaseClient, table_id, working.handNo);
        working = runShowdown(working, hole);
        break;
      }
      // If players can still act on the new street, stop and let them.
      if (working.currentTurnSeat !== null) break;
    }

    // Persist new public state + remaining deck.
    await supabaseClient.from('table_state')
      .update({ state_json: working, updated_at: new Date().toISOString() })
      .eq('table_id', table_id);
    await supabaseClient.from('poker_private')
      .update({ deck, updated_at: new Date().toISOString() })
      .eq('table_id', table_id);

    // On payout, write stacks back to persistent bankrolls.
    if (working.phase === 'payout') {
      for (const s of working.seats) {
        if (s.userId) {
          await supabaseClient.from('table_players')
            .update({ bankroll: s.stack }).eq('table_id', table_id).eq('user_id', s.userId);
        }
      }
      await supabaseClient.from('tables').update({ status: 'waiting' }).eq('id', table_id);
    }

    await supabaseClient.from('table_actions').insert({
      table_id, user_id: user.id, action_type: action, payload: { amount: amount ?? null },
    });

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const err = error as { message?: string } | null;
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function loadHole(
  client: ReturnType<typeof createClient>,
  tableId: string,
  handNo: number,
): Promise<Record<number, Card[]>> {
  const { data } = await client
    .from('poker_hole_cards').select('seat, cards').eq('table_id', tableId).eq('hand_no', handNo);
  const hole: Record<number, Card[]> = {};
  for (const row of (data ?? []) as Array<{ seat: number; cards: Card[] }>) {
    hole[row.seat] = row.cards;
  }
  return hole;
}
