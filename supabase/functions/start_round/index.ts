// ============================================================================
// Edge Function: start_round
// Démarre un nouveau round (distribue les cartes initiales)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  Card,
  Hand,
  GameState,
  createShuffledShoe,
  drawCard,
  addCardToHand,
  createEmptyHand,
} from '../_shared/blackjack-engine.ts';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    // Get table and players
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

    // Check if user is creator or player
    const isCreator = table.created_by === user.id;
    const isPlayer = table.table_players.some((p: any) => p.user_id === user.id);
    
    if (!isCreator && !isPlayer) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to start round' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current state
    const { data: stateData, error: stateError } = await supabaseClient
      .from('table_state')
      .select('state_json')
      .eq('table_id', table_id)
      .single();

    if (stateError || !stateData) {
      return new Response(
        JSON.stringify({ error: 'Table state not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentState: GameState = stateData.state_json;

    // If in waiting phase, transition to betting phase first
    // Players will place bets, then we can deal cards
    if (currentState.phase === 'waiting') {
      const bettingState: GameState = {
        ...currentState,
        phase: 'betting',
      };

      // Update state to betting phase
      const { error: updateError } = await supabaseClient
        .from('table_state')
        .update({
          state_json: bettingState,
          updated_at: new Date().toISOString(),
        })
        .eq('table_id', table_id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, state: bettingState, message: 'Game moved to betting phase' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If in betting phase, check minimum requirements before dealing
    if (currentState.phase === 'betting') {
      const playersWithBets = Object.keys(currentState.playerHands).length;
      const totalPlayers = table.table_players.length;

      // Minimum 1 player required to start
      if (totalPlayers < 1) {
        return new Response(
          JSON.stringify({ error: 'At least 1 player is required to start' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // At least one player must have placed a bet
      if (playersWithBets === 0) {
        return new Response(
          JSON.stringify({ error: 'At least one player must place a bet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Continue to deal cards - only players who bet will get cards
      // This allows starting with 2+ players even if not all have bet
    } else if (currentState.phase !== 'betting') {
      // Should not happen, but safety check
      return new Response(
        JSON.stringify({ error: `Cannot start round in phase: ${currentState.phase}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize shoe if needed
    let shoe = currentState.shoe;
    if (shoe.length < 20) {
      shoe = createShuffledShoe(table.config.deckCount || 6);
    }

    // Deal initial cards
    const dealerHand = createEmptyHand();
    const playerHands: Record<number, Hand[]> = {};

    // Deal to each player
    for (const player of table.table_players) {
      const seat = player.seat;
      const hands = currentState.playerHands[seat] || [];
      if (hands.length === 0) continue;

      const firstHand = hands[0];
      const [card1, shoe1] = drawCard(shoe, true);
      const [card2, shoe2] = drawCard(shoe1, true);
      shoe = shoe2;

      const newHand = addCardToHand(
        { ...firstHand, cards: [] },
        card1
      );
      const finalHand = addCardToHand(newHand, card2);
      
      playerHands[seat] = [finalHand];
    }

    // Deal to dealer
    const [dealerCard1, shoe1] = drawCard(shoe, true);
    const [dealerCard2, shoe2] = drawCard(shoe1, false); // Hole card face down
    shoe = shoe2;

    const dealerHandWithCards = addCardToHand(dealerHand, dealerCard1);
    const finalDealerHand = addCardToHand(dealerHandWithCards, dealerCard2);

    // Determine first active seat
    const seats = Object.keys(playerHands).map(Number).sort((a, b) => a - b);
    const firstActiveSeat = seats.length > 0 ? seats[0] : null;

    // Update state
    const newState: GameState = {
      ...currentState,
      phase: 'playing',
      shoe: shoe,
      dealerHand: finalDealerHand,
      playerHands: playerHands,
      activeSeat: firstActiveSeat,
      currentRound: currentState.currentRound + 1,
    };

    // Update database
    const { error: updateError } = await supabaseClient
      .from('table_state')
      .update({
        state_json: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('table_id', table_id);

    if (updateError) {
      throw updateError;
    }

    // Update table status
    await supabaseClient
      .from('tables')
      .update({ status: 'playing' })
      .eq('id', table_id);

    // Log action
    await supabaseClient.from('table_actions').insert({
      table_id: table_id,
      user_id: user.id,
      action_type: 'deal',
      payload: { round: newState.currentRound },
    });

    return new Response(
      JSON.stringify({ success: true, state: newState }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
