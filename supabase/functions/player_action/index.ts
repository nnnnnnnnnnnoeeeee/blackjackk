// ============================================================================
// Edge Function: player_action
// Traite une action de joueur (bet, hit, stand, double, split, insurance)
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
  getBestHandValue,
  isBusted,
  isBlackjack,
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin access
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

    const { table_id, action_type, payload } = await req.json();

    if (!table_id || !action_type) {
      return new Response(
        JSON.stringify({ error: 'table_id and action_type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get table and player info
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

    const player = table.table_players.find((p: any) => p.user_id === user.id);
    if (!player) {
      return new Response(
        JSON.stringify({ error: 'Not a player in this table' }),
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

    let gameState: GameState = stateData.state_json;

    // Process action based on type
    let newState: GameState;
    let errorMessage: string | null = null;

    try {
      switch (action_type) {
        case 'bet':
          newState = handleBet(gameState, player.seat, payload?.amount || 0, player.bankroll);
          break;
        case 'hit':
          newState = handleHit(gameState, player.seat, table.config);
          break;
        case 'stand':
          newState = handleStand(gameState, player.seat);
          break;
        case 'double':
          newState = handleDouble(gameState, player.seat, player.bankroll, table.config);
          break;
        case 'split':
          newState = handleSplit(gameState, player.seat, player.bankroll, table.config);
          break;
        case 'insurance':
          newState = handleInsurance(gameState, player.seat, payload?.amount || 0, player.bankroll);
          break;
        default:
          throw new Error(`Unknown action type: ${action_type}`);
      }
    } catch (err) {
      errorMessage = err.message;
      newState = gameState; // Keep old state on error
    }

    if (errorMessage) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update state in database
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

    // Log action
    await supabaseClient.from('table_actions').insert({
      table_id: table_id,
      user_id: user.id,
      action_type: action_type,
      payload: payload || {},
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

// Action handlers
function handleBet(state: GameState, seat: number, amount: number, bankroll: number): GameState {
  if (state.phase !== 'betting') {
    throw new Error('Not in betting phase');
  }
  if (amount <= 0 || amount > bankroll) {
    throw new Error('Invalid bet amount');
  }

  const hands = state.playerHands[seat] || [];
  if (hands.length > 0) {
    throw new Error('Already placed bet');
  }

  const newHand = {
    ...createEmptyHand(),
    bet: amount,
  };

  return {
    ...state,
    playerHands: {
      ...state.playerHands,
      [seat]: [newHand],
    },
  };
}

function handleHit(state: GameState, seat: number, config: any): GameState {
  if (state.phase !== 'playing' || state.activeSeat !== seat) {
    throw new Error('Not your turn');
  }

  const hands = state.playerHands[seat] || [];
  if (hands.length === 0) {
    throw new Error('No hand to hit');
  }

  const activeHandIndex = hands.findIndex(h => !h.isStood && !h.isBusted && !h.isBlackjack);
  if (activeHandIndex === -1) {
    throw new Error('No active hand');
  }

  const [card, newShoe] = drawCard(state.shoe, true);
  const hand = hands[activeHandIndex];
  const newHand = addCardToHand(hand, card);

  const newHands = [...hands];
  newHands[activeHandIndex] = newHand;

  // If busted or blackjack, move to next hand/player
  let newActiveSeat = state.activeSeat;
  if (newHand.isBusted || newHand.isBlackjack) {
    newActiveSeat = getNextActiveSeat(state, seat);
  }

  return {
    ...state,
    shoe: newShoe,
    playerHands: {
      ...state.playerHands,
      [seat]: newHands,
    },
    activeSeat: newActiveSeat,
    phase: newActiveSeat === null ? 'settling' : state.phase,
  };
}

function handleStand(state: GameState, seat: number): GameState {
  if (state.phase !== 'playing' || state.activeSeat !== seat) {
    throw new Error('Not your turn');
  }

  const hands = state.playerHands[seat] || [];
  const activeHandIndex = hands.findIndex(h => !h.isStood && !h.isBusted && !h.isBlackjack);
  if (activeHandIndex === -1) {
    throw new Error('No active hand');
  }

  const newHands = [...hands];
  newHands[activeHandIndex] = { ...newHands[activeHandIndex], isStood: true };

  const newActiveSeat = getNextActiveSeat(state, seat);

  return {
    ...state,
    playerHands: {
      ...state.playerHands,
      [seat]: newHands,
    },
    activeSeat: newActiveSeat,
    phase: newActiveSeat === null ? 'settling' : state.phase,
  };
}

function handleDouble(state: GameState, seat: number, bankroll: number, config: any): GameState {
  if (state.phase !== 'playing' || state.activeSeat !== seat) {
    throw new Error('Not your turn');
  }

  const hands = state.playerHands[seat] || [];
  if (hands.length === 0 || hands[0].cards.length !== 2) {
    throw new Error('Cannot double');
  }

  const hand = hands[0];
  if (hand.bet * 2 > bankroll) {
    throw new Error('Insufficient bankroll');
  }

  const [card, newShoe] = drawCard(state.shoe, true);
  const newHand = addCardToHand({ ...hand, bet: hand.bet * 2, isDoubled: true }, card);

  const newActiveSeat = getNextActiveSeat(state, seat);

  return {
    ...state,
    shoe: newShoe,
    playerHands: {
      ...state.playerHands,
      [seat]: [newHand],
    },
    activeSeat: newActiveSeat,
    phase: newActiveSeat === null ? 'settling' : state.phase,
  };
}

function handleSplit(state: GameState, seat: number, bankroll: number, config: any): GameState {
  if (state.phase !== 'playing' || state.activeSeat !== seat) {
    throw new Error('Not your turn');
  }

  const hands = state.playerHands[seat] || [];
  if (hands.length !== 1 || hands[0].cards.length !== 2) {
    throw new Error('Cannot split');
  }

  const hand = hands[0];
  if (hand.cards[0].rank !== hand.cards[1].rank) {
    throw new Error('Cards must be same rank to split');
  }

  if (hand.bet * 2 > bankroll) {
    throw new Error('Insufficient bankroll');
  }

  const [card1, shoe1] = drawCard(state.shoe, true);
  const [card2, shoe2] = drawCard(shoe1, true);

  const hand1 = addCardToHand({ ...createEmptyHand(), bet: hand.bet, isSplit: true }, hand.cards[0]);
  const hand2 = addCardToHand({ ...createEmptyHand(), bet: hand.bet, isSplit: true }, hand.cards[1]);

  const newHand1 = addCardToHand(hand1, card1);
  const newHand2 = addCardToHand(hand2, card2);

  return {
    ...state,
    shoe: shoe2,
    playerHands: {
      ...state.playerHands,
      [seat]: [newHand1, newHand2],
    },
  };
}

function handleInsurance(state: GameState, seat: number, amount: number, bankroll: number): GameState {
  // Insurance logic - simplified for now
  if (amount > bankroll) {
    throw new Error('Insufficient bankroll');
  }
  return state; // TODO: Implement insurance
}

function getNextActiveSeat(state: GameState, currentSeat: number): number | null {
  const seats = Object.keys(state.playerHands).map(Number).sort((a, b) => a - b);
  const currentIndex = seats.indexOf(currentSeat);
  
  for (let i = currentIndex + 1; i < seats.length; i++) {
    const seat = seats[i];
    const hands = state.playerHands[seat] || [];
    const hasActiveHand = hands.some(h => !h.isStood && !h.isBusted && !h.isBlackjack);
    if (hasActiveHand) {
      return seat;
    }
  }
  
  return null; // All players done
}
