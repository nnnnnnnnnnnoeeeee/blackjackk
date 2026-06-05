// ============================================================================
// Edge Function: poker_timeout
// Auto-acts for the current player when their action timer has expired.
// Any seated player may call it; the server re-validates the deadline, so it is
// safe and idempotent (a stale call simply finds nothing expired).
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { applyAndResolve, withTurnDeadline } from '../_shared/poker-flow.ts';
import { legalActions, type Card, type PokerConfig, type PokerPublicState } from '../_shared/poker-engine.ts';

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

    const { table_id } = await req.json();

    const { data: table } = await supabaseClient
      .from('tables').select('*, table_players(*)').eq('id', table_id).single();
    if (!table) {
      return new Response(JSON.stringify({ error: 'Table not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const isMember = table.table_players.some((p: { user_id: string }) => p.user_id === user.id);
    if (!isMember) {
      return new Response(JSON.stringify({ error: 'Not a player at this table' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: stateRow } = await supabaseClient
      .from('table_state').select('state_json').eq('table_id', table_id).single();
    const state = stateRow?.state_json as PokerPublicState;

    // Re-validate the deadline server-side. No-op if nothing is actually expired.
    if (!state || state.currentTurnSeat === null || !state.turnDeadline || Date.now() < state.turnDeadline) {
      return new Response(JSON.stringify({ ok: false, reason: 'not_expired' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cfg = table.config as PokerConfig;
    const seat = state.currentTurnSeat;
    const legal = legalActions(state, seat);
    const autoAction = legal.includes('check') ? 'check' : 'fold';

    const { data: priv } = await supabaseClient
      .from('poker_private').select('deck').eq('table_id', table_id).single();
    const deck: Card[] = (priv?.deck as Card[]) ?? [];

    const result = await applyAndResolve(supabaseClient, table_id, state, deck, seat, autoAction, undefined, cfg);
    const working = withTurnDeadline(result.state, cfg);

    await supabaseClient.from('table_state')
      .update({ state_json: working, updated_at: new Date().toISOString() })
      .eq('table_id', table_id);
    await supabaseClient.from('poker_private')
      .update({ deck: result.deck, updated_at: new Date().toISOString() })
      .eq('table_id', table_id);

    if (working.phase === 'payout') {
      for (const s of working.seats) {
        if (s.userId) {
          await supabaseClient.from('table_players')
            .update({ bankroll: s.stack }).eq('table_id', table_id).eq('user_id', s.userId);
        }
      }
      await supabaseClient.from('tables').update({ status: 'waiting' }).eq('id', table_id);
    }

    const seatPlayer = table.table_players.find((p: { seat: number; user_id: string }) => p.seat === seat);
    await supabaseClient.from('table_actions').insert({
      table_id, user_id: seatPlayer?.user_id ?? null, action_type: autoAction, payload: { auto: true },
    });

    return new Response(JSON.stringify({ ok: true, action: autoAction }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const err = error as { message?: string } | null;
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
