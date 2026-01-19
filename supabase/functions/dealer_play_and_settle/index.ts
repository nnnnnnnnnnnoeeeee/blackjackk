// ============================================================================
// Edge Function: dealer_play_and_settle
// Fait jouer le dealer et règle toutes les mains
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  Card,
  Hand,
  GameState,
  drawCard,
  addCardToHand,
  getBestHandValue,
  isBusted,
  isBlackjack,
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

    // Get table
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

    let gameState: GameState = stateData.state_json;

    if (gameState.phase !== 'settling') {
      return new Response(
        JSON.stringify({ error: 'Game is not in settling phase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reveal dealer hole card
    let dealerHand = { ...gameState.dealerHand };
    if (dealerHand.cards.length >= 2 && !dealerHand.cards[1].faceUp) {
      dealerHand.cards[1] = { ...dealerHand.cards[1], faceUp: true };
    }

    // Check if all players busted
    const allBusted = Object.values(gameState.playerHands).every(hands =>
      hands.every(h => h.isBusted)
    );

    let shoe = gameState.shoe;

    // Dealer plays if not all players busted
    if (!allBusted) {
      const dealerHitsSoft17 = table.config.dealerHitsSoft17 || false;
      
      while (shouldDealerHit(dealerHand.cards, dealerHitsSoft17)) {
        const [card, newShoe] = drawCard(shoe, true);
        shoe = newShoe;
        dealerHand = addCardToHand(dealerHand, card);
      }
    }

    dealerHand.isBusted = isBusted(dealerHand.cards);
    dealerHand.isBlackjack = isBlackjack(dealerHand.cards);

    // Calculate settlements
    const dealerValue = getBestHandValue(dealerHand.cards);
    const settlements: Record<number, number> = {}; // seat -> net change

    for (const [seatStr, hands] of Object.entries(gameState.playerHands)) {
      const seat = Number(seatStr);
      let netChange = 0;

      for (const hand of hands) {
        if (hand.isBusted) {
          netChange -= hand.bet;
        } else if (hand.isBlackjack && !dealerHand.isBlackjack) {
          netChange += hand.bet * 2.5; // 3:2 payout
        } else if (dealerHand.isBusted) {
          netChange += hand.bet * 2;
        } else {
          const playerValue = getBestHandValue(hand.cards);
          if (playerValue > dealerValue) {
            netChange += hand.bet * 2;
          } else if (playerValue === dealerValue) {
            netChange += hand.bet; // Push
          } else {
            netChange -= hand.bet;
          }
        }
      }

      settlements[seat] = netChange;
    }

    // Update bankrolls
    for (const player of table.table_players) {
      const netChange = settlements[player.seat] || 0;
      const newBankroll = Math.max(0, player.bankroll + netChange);

      await supabaseClient
        .from('table_players')
        .update({ bankroll: newBankroll })
        .eq('id', player.id);
    }

    // Update state for next round
    const newState: GameState = {
      ...gameState,
      phase: 'betting',
      shoe: shoe,
      dealerHand: createEmptyHand(),
      playerHands: {},
      activeSeat: null,
      sideBets: {},
      sideBetResults: null,
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
      .update({ status: 'betting' })
      .eq('id', table_id);

    // Log action
    await supabaseClient.from('table_actions').insert({
      table_id: table_id,
      action_type: 'settle',
      payload: { settlements, round: gameState.currentRound },
    });

    return new Response(
      JSON.stringify({ success: true, settlements, state: newState }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function shouldDealerHit(cards: Card[], hitsSoft17: boolean): boolean {
  const value = getBestHandValue(cards);
  if (value > 17) return false;
  if (value < 17) return true;
  
  // Value is 17
  if (!hitsSoft17) return false;
  
  // Check if soft 17
  let hasAce = false;
  let nonAceValue = 0;
  
  for (const card of cards) {
    if (card.rank === 'A') {
      hasAce = true;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      nonAceValue += 10;
    } else {
      nonAceValue += parseInt(card.rank);
    }
  }
  
  return hasAce && nonAceValue === 6; // Soft 17 (A + 6)
}
