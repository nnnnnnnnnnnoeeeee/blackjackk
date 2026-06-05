// ============================================================================
// Edge Function: poker_create_table
// Creates a No-Limit Texas Hold'em table (game_type = 'poker').
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createInitialState, DEFAULT_POKER_CONFIG, type PokerConfig } from '../_shared/poker-engine.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function roomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const name: string = body.name;
    const isPublic: boolean = body.isPublic ?? true;
    const maxPlayers: number = Math.max(2, Math.min(8, body.max_players ?? 8));
    const config: PokerConfig = { ...DEFAULT_POKER_CONFIG, ...(body.config ?? {}), maxPlayers };

    if (!name || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Table name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: table, error: tableError } = await supabaseClient
      .from('tables')
      .insert({
        name: name.trim(),
        max_players: maxPlayers,
        created_by: user.id,
        status: 'waiting',
        game_type: 'poker',
        is_public: isPublic,
        room_code: roomCode(),
        config,
      })
      .select()
      .single();

    if (tableError) {
      return new Response(JSON.stringify({ error: 'Failed to create table', details: tableError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: playerError } = await supabaseClient
      .from('table_players')
      .insert({ table_id: table.id, user_id: user.id, seat: 1, bankroll: 1000 });

    if (playerError) {
      await supabaseClient.from('tables').delete().eq('id', table.id);
      return new Response(JSON.stringify({ error: 'Failed to seat creator', details: playerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Initialize the PUBLIC poker state (waiting, single seated player).
    const initialState = createInitialState([{ seat: 1, userId: user.id, stack: 1000 }], config);

    const { error: stateError } = await supabaseClient
      .from('table_state')
      .insert({ table_id: table.id, state_json: initialState });

    if (stateError) {
      await supabaseClient.from('tables').delete().eq('id', table.id);
      await supabaseClient.from('table_players').delete().eq('table_id', table.id);
      return new Response(JSON.stringify({ error: 'Failed to init state', details: stateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ table }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const err = error as { message?: string } | null;
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
