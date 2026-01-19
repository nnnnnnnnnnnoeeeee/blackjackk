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
    // Use service_role key to bypass RLS, but verify user via auth header
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Service role key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
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

    // Create table using admin client to bypass RLS
    const { data: table, error: tableError } = await supabaseAdmin
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
      console.error('Table creation error:', tableError);
      return new Response(
        JSON.stringify({ error: 'Failed to create table', details: tableError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add creator as first player (seat 1) using admin client
    const { error: playerError } = await supabaseAdmin
      .from('table_players')
      .insert({
        table_id: table.id,
        user_id: user.id,
        seat: 1,
        bankroll: 1000,
      });

    if (playerError) {
      console.error('Player insertion error:', playerError);
      // Rollback table creation
      await supabaseAdmin.from('tables').delete().eq('id', table.id);
      return new Response(
        JSON.stringify({ error: 'Failed to add player to table', details: playerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize table state using admin client
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

    const { error: stateError } = await supabaseAdmin
      .from('table_state')
      .insert({
        table_id: table.id,
        state_json: initialState,
      });

    if (stateError) {
      console.error('State initialization error:', stateError);
      // Rollback
      await supabaseAdmin.from('tables').delete().eq('id', table.id);
      await supabaseAdmin.from('table_players').delete().eq('table_id', table.id);
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
