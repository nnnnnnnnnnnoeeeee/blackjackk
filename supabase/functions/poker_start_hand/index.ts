// ============================================================================
// Edge Function: poker_start_hand
// Starts a new poker hand: rotate button, post blinds, shuffle, deal hole cards
// into the private store, write the public state.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createInitialState, startHand, type PokerConfig, type PokerPublicState } from '../_shared/poker-engine.ts';

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
    if (!table_id) {
      return new Response(JSON.stringify({ error: 'table_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: table, error: tableError } = await supabaseClient
      .from('tables').select('*, table_players(*)').eq('id', table_id).single();
    if (tableError || !table) {
      return new Response(JSON.stringify({ error: 'Table not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isMember = table.created_by === user.id ||
      table.table_players.some((p: { user_id: string }) => p.user_id === user.id);
    if (!isMember) {
      return new Response(JSON.stringify({ error: 'Not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const seated = table.table_players
      .filter((p: { bankroll: number }) => p.bankroll > 0)
      .map((p: { seat: number; user_id: string; bankroll: number }) => ({ seat: p.seat, userId: p.user_id, stack: p.bankroll }));

    if (seated.length < 2) {
      return new Response(JSON.stringify({ error: 'Need at least 2 players with chips' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cfg = table.config as PokerConfig;

    // Continuity: keep previous button/handNo so the button rotates correctly.
    const { data: stateRow } = await supabaseClient
      .from('table_state').select('state_json').eq('table_id', table_id).single();
    const prev = stateRow?.state_json as PokerPublicState | undefined;

    const base = createInitialState(seated, cfg);
    if (prev) { base.buttonSeat = prev.buttonSeat; base.handNo = prev.handNo; }

    const { state, deck, hole } = startHand(base, cfg);

    // Persist public state.
    await supabaseClient.from('table_state')
      .update({ state_json: state, updated_at: new Date().toISOString() })
      .eq('table_id', table_id);

    // Persist private deck (server-only).
    await supabaseClient.from('poker_private')
      .upsert({ table_id, hand_no: state.handNo, deck, updated_at: new Date().toISOString() });

    // Persist hole cards (owner-readable only). Clear prior hand's rows first.
    await supabaseClient.from('poker_hole_cards').delete().eq('table_id', table_id);
    const holeRows = Object.entries(hole).map(([seatStr, cards]) => {
      const seat = Number(seatStr);
      const player = table.table_players.find((p: { seat: number }) => p.seat === seat);
      return { table_id, hand_no: state.handNo, user_id: player.user_id, seat, cards };
    });
    await supabaseClient.from('poker_hole_cards').insert(holeRows);

    await supabaseClient.from('tables').update({ status: 'playing' }).eq('id', table_id);
    await supabaseClient.from('table_actions').insert({
      table_id, user_id: user.id, action_type: 'deal', payload: { handNo: state.handNo },
    });

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const err = error as { message?: string } | null;
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
