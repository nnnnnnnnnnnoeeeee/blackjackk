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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create client with ANON_KEY (exactly like join_table)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { name, max_players = 5 } = await req.json();

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Table name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create table using the client (RLS will handle permissions)
    const { data: table, error: tableError } = await supabaseClient
      .from('tables')
      .insert({
        name: name.trim(),
        max_players: Math.max(2, Math.min(8, max_players)),
        created_by: user.id,
        status: 'waiting',
      })
      .select()
      .single();

    if (tableError) {
      console.error('Table creation error:', tableError);
      return new Response(
        JSON.stringify({ error: 'Failed to create table', details: tableError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add creator as first player (seat 1)
    const { data: player, error: playerError } = await supabaseClient
      .from('table_players')
      .insert({
        table_id: table.id,
        user_id: user.id,
        seat: 1,
        bankroll: 1000,
      })
      .select()
      .single();

    if (playerError) {
      console.error('Player insertion error:', playerError);
      // Rollback table creation
      await supabaseClient.from('tables').delete().eq('id', table.id);
      return new Response(
        JSON.stringify({ error: 'Failed to add player to table', details: playerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('State initialization error:', stateError);
      // Rollback
      await supabaseClient.from('tables').delete().eq('id', table.id);
      await supabaseClient.from('table_players').delete().eq('table_id', table.id);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize table state', details: stateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ table }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        details: error?.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
