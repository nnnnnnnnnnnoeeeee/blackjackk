// ============================================================================
// Edge Function: create_table
// Crée une nouvelle table de jeu
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    const { name, max_players = 5, config } = await req.json();

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Table name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create table
    const { data: table, error: tableError } = await supabaseClient
      .from('tables')
      .insert({
        name: name.trim(),
        max_players: Math.max(2, Math.min(8, max_players)),
        created_by: user.id,
        status: 'waiting',
        config: config || null,
      })
      .select()
      .single();

    if (tableError) {
      throw tableError;
    }

    // Add creator as first player (seat 1)
    const { error: playerError } = await supabaseClient
      .from('table_players')
      .insert({
        table_id: table.id,
        user_id: user.id,
        seat: 1,
        bankroll: 1000,
      });

    if (playerError) {
      // Rollback table creation
      await supabaseClient.from('tables').delete().eq('id', table.id);
      throw playerError;
    }

    // Initialize table state
    const initialState = {
      phase: 'waiting',
      shoe: [],
      dealerHand: {
        cards: [],
        bet: 0,
        isDoubled: false,
        isSplit: false,
        isStood: false,
        isBusted: false,
        isBlackjack: false,
      },
      playerHands: {},
      activeSeat: null,
      currentRound: 0,
      sideBets: {},
      sideBetResults: null,
    };

    const { error: stateError } = await supabaseClient
      .from('table_state')
      .insert({
        table_id: table.id,
        state_json: initialState,
      });

    if (stateError) {
      // Rollback
      await supabaseClient.from('tables').delete().eq('id', table.id);
      throw stateError;
    }

    return new Response(
      JSON.stringify({ table }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
