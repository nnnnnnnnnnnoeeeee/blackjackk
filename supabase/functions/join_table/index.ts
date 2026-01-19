// ============================================================================
// Edge Function: join_table
// Rejoint une table existante
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { table_id } = await req.json();

    if (!table_id) {
      return new Response(
        JSON.stringify({ error: 'table_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if table exists and is joinable
    const { data: table, error: tableError } = await supabaseClient
      .from('tables')
      .select('*, table_players(*)')
      .eq('id', table_id)
      .single();

    if (tableError || !table) {
      return new Response(
        JSON.stringify({ error: 'Table not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (table.status !== 'waiting') {
      return new Response(
        JSON.stringify({ error: 'Table is not accepting new players' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is already in table
    const alreadyJoined = table.table_players.some((p: any) => p.user_id === user.id);
    if (alreadyJoined) {
      return new Response(
        JSON.stringify({ error: 'Already in this table' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if table is full
    if (table.table_players.length >= table.max_players) {
      return new Response(
        JSON.stringify({ error: 'Table is full' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find available seat
    const takenSeats = table.table_players.map((p: any) => p.seat);
    let availableSeat = 1;
    for (let i = 1; i <= table.max_players; i++) {
      if (!takenSeats.includes(i)) {
        availableSeat = i;
        break;
      }
    }

    // Add player to table
    const { data: player, error: playerError } = await supabaseClient
      .from('table_players')
      .insert({
        table_id: table_id,
        user_id: user.id,
        seat: availableSeat,
        bankroll: 1000,
      })
      .select()
      .single();

    if (playerError) {
      throw playerError;
    }

    // Log action
    await supabaseClient.from('table_actions').insert({
      table_id: table_id,
      user_id: user.id,
      action_type: 'bet', // Generic action for join
      payload: { seat: availableSeat },
    });

    return new Response(
      JSON.stringify({ player, seat: availableSeat }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
