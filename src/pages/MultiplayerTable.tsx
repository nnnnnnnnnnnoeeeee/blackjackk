// ============================================================================
// Multiplayer Table Page
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HandView } from '@/components/HandView';
import { TimerBadge, TurnIndicator, BetComposerMultiplayer, ActionBarMultiplayer } from '@/ui/blackjack/components';
import { OpponentsZone } from '@/ui/blackjack/table';
import { ChipStack } from '@/components/ChipStack';
import { ChatPanel } from '@/components/ChatPanel';
// Toast import removed - all notifications disabled
import { ArrowLeft, Copy, Hash, MessageSquare, Users } from 'lucide-react';
import type { Hand, Card as BlackjackCard, PlayerAction } from '@/lib/blackjack/types';
import { createShuffledShoe, drawCard } from '@/lib/blackjack/deck';
import { addCardToHand, createEmptyHand, isBusted, isBlackjack, getBestHandValue, isSoftHand, canSplit } from '@/lib/blackjack/hand';
import { getNextActiveHandIndex, areAllHandsFinished, shouldDealerHit, calculatePayout, canInsure } from '@/lib/blackjack/rules';
import type { GameConfig } from '@/lib/blackjack/types';

interface TableData {
  id: string;
  name: string;
  status: string;
  room_code?: string;
  table_players: Array<{
    id: string;
    user_id: string;
    seat: number;
    bankroll: number;
    profile?: { username: string };
  }>;
}

interface GameState {
  phase: string;
  shoe: any[];
  dealerHand: any;
  playerHands: Record<number, any[]>;
  activeSeat: number | null;
  currentRound: number;
  sideBets?: Record<string, any>;
  sideBetResults?: any;
}

// Function removed - opponents now displayed in horizontal layout

export default function MultiplayerTable() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TableData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTableCreator, setIsTableCreator] = useState(false);
  const [bettingTimer, setBettingTimer] = useState<number | null>(null);
  const [actionTimer, setActionTimer] = useState<number | null>(null);
  const [bettingTimeLeft, setBettingTimeLeft] = useState<number>(10);
  const [actionTimeLeft, setActionTimeLeft] = useState<number>(10);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTable();
    subscribeToTable();
  }, [id]);

  // Timer pour la phase de mise (5 secondes)
  useEffect(() => {
    if (gameState?.phase === 'betting' && isTableCreator) {
      // Reset timer et temps
      if (bettingTimer !== null) {
        clearInterval(bettingTimer);
      }
      setBettingTimeLeft(10);

      const timer = window.setInterval(() => {
        // Vérifier si au moins un joueur a misé (vérifier le state actuel)
        const playersWithBets = Object.keys(gameState?.playerHands || {}).length;
        
        setBettingTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (playersWithBets > 0 && newTime <= 0) {
            // Temps écoulé et au moins un joueur a misé, démarrer automatiquement
            clearInterval(timer);
            setBettingTimer(null);
            handleStartRound();
            return 0;
          }
          
          if (newTime <= 0) {
            // Temps écoulé mais aucun joueur n'a misé, réinitialiser le timer
            return 10;
          }
          
          return newTime;
        });
      }, 1000);

      setBettingTimer(timer);

      return () => {
        clearInterval(timer);
        setBettingTimer(null);
      };
    } else {
      // Reset timer si on n'est plus en phase betting
      if (bettingTimer !== null) {
        clearInterval(bettingTimer);
        setBettingTimer(null);
      }
      setBettingTimeLeft(10);
    }
  }, [gameState?.phase, gameState?.playerHands, isTableCreator]);

  // Timer pour les actions des joueurs (5 secondes par tour)
  useEffect(() => {
    if (gameState?.phase === 'playing' && gameState.activeSeat === mySeat && mySeat !== null) {
      // Reset timer et temps
      if (actionTimer !== null) {
        clearInterval(actionTimer);
      }
      setActionTimeLeft(10);

      const timer = window.setInterval(() => {
        setActionTimeLeft((prev) => {
          if (prev <= 1) {
            // Temps écoulé, faire un stand automatique
            clearInterval(timer);
            setActionTimer(null);
            console.log('[MultiplayerTable] Timer expired, auto-standing');
            handleAction('stand');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setActionTimer(timer);

      return () => {
        clearInterval(timer);
        setActionTimer(null);
      };
    } else {
      // Reset timer si ce n'est plus notre tour
      if (actionTimer !== null) {
        clearInterval(actionTimer);
        setActionTimer(null);
      }
      setActionTimeLeft(10);
    }
  }, [gameState?.phase, gameState?.activeSeat, mySeat]);

  // Dealer turn logic - automatic dealer play
  useEffect(() => {
    if (gameState?.phase === 'DEALER_TURN' && id) {
      const playDealerTurn = async () => {
        try {
          // Get current state
          const { data: stateData, error: stateError } = await supabase
            .from('table_state')
            .select('state_json')
            .eq('table_id', id)
            .maybeSingle();

          if (stateError || !stateData) return;

          const currentState = stateData.state_json as GameState;
          let newState: GameState = { ...currentState };
          let shoe = currentState.shoe || [];

          // Flip dealer's hole card
          const dealerHand = { ...currentState.dealerHand };
          dealerHand.cards = dealerHand.cards.map((card: any) => ({ ...card, faceUp: true }));

          // Dealer plays: hit until 17 or more (stand on all 17s - S17)
          while (shouldDealerHit(dealerHand.cards, false)) {
            if (shoe.length < 1) {
              shoe = createShuffledShoe(6);
            }
            const [card, newShoe] = drawCard(shoe, true);
            shoe = newShoe;
            dealerHand.cards.push(card);
          }

          // Update dealer hand
          dealerHand.isBusted = isBusted(dealerHand.cards);
          dealerHand.isBlackjack = isBlackjack(dealerHand.cards) && dealerHand.cards.length === 2;

          newState = {
            ...currentState,
            phase: 'settling',
            shoe: shoe,
            dealerHand: dealerHand,
          };

          await updateGameState(newState);
        } catch (error: any) {
          console.error('[MultiplayerTable] Dealer turn error:', error);
        }
      };

      // Delay dealer turn slightly for visual effect
      const timer = setTimeout(() => {
        playDealerTurn();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState?.phase, id]);

  // Settlement logic - calculate payouts and return to betting
  useEffect(() => {
    if (gameState?.phase === 'settling' && id && table) {
      const settleRound = async () => {
        try {
          // Get current state
          const { data: stateData, error: stateError } = await supabase
            .from('table_state')
            .select('state_json')
            .eq('table_id', id)
            .maybeSingle();

          if (stateError || !stateData) return;

          const currentState = stateData.state_json as GameState;
          const dealerHand = currentState.dealerHand;
          const dealerValue = getBestHandValue(dealerHand.cards);
          const dealerHasBlackjack = dealerHand.isBlackjack && dealerHand.cards.length === 2;

          // Calculate payouts for each player
          const playerUpdates: Array<{ userId: string; payout: number }> = [];

          for (const player of table.table_players) {
            const seat = player.seat;
            const hands = currentState.playerHands[seat] || [];
            let totalPayout = 0;

            for (const hand of hands) {
              const { result, payout } = calculatePayout(
                hand,
                dealerHand.cards,
                { blackjackPayout: 1.5 } as GameConfig, // Default config
                dealerHasBlackjack
              );
              totalPayout += payout;
            }

            if (totalPayout !== 0) {
              playerUpdates.push({
                userId: player.user_id,
                payout: totalPayout,
              });
            }
          }

          // Update player bankrolls
          for (const update of playerUpdates) {
            const player = table.table_players.find(p => p.user_id === update.userId);
            if (player) {
              await supabase
                .from('table_players')
                .update({ bankroll: player.bankroll + update.payout })
                .eq('table_id', id)
                .eq('user_id', update.userId);
            }
          }

          // Wait 3 seconds to show results, then return to betting
          setTimeout(async () => {
            const bettingState: GameState = {
              phase: 'betting',
              shoe: currentState.shoe, // Keep shoe
              dealerHand: createEmptyHand(),
              playerHands: {}, // Clear player hands
              activeSeat: null,
              currentRound: currentState.currentRound,
            };

            await updateGameState(bettingState);

            // Update table status
            await supabase
              .from('tables')
              .update({ status: 'waiting' })
              .eq('id', id);

            // Notification removed
          }, 3000);
        } catch (error: any) {
          console.error('[MultiplayerTable] Settlement error:', error);
        }
      };

      settleRound();
    }
  }, [gameState?.phase, id, table]);

  const loadTable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select(`
          *,
          table_players (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (tableError) throw tableError;
      if (!tableData) {
        // Notification removed
        navigate('/lobby');
        return;
      }

      // Load profiles separately
      if (tableData) {
        const userIds = tableData.table_players.map((p: any) => p.user_id);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          // Attach profiles to players
          tableData.table_players = tableData.table_players.map((p: any) => ({
            ...p,
            profile: profiles?.find((pr: any) => pr.id === p.user_id),
          }));
        }
      }

      setTable(tableData);

      const myPlayer = tableData.table_players.find((p: any) => p.user_id === user.id);
      setMySeat(myPlayer?.seat || null);
      setIsTableCreator(tableData.created_by === user.id);

      const { data: stateData, error: stateError } = await supabase
        .from('table_state')
        .select('state_json')
        .eq('table_id', id)
        .maybeSingle();

      if (!stateError && stateData) {
        setGameState(stateData.state_json);
      }
    } catch (error: any) {
      // Notification removed
      navigate('/lobby');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTable = () => {
    if (!id) return;

    const channel = supabase
      .channel(`table_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'table_state',
          filter: `table_id=eq.${id}`,
        },
        (payload) => {
          setGameState(payload.new.state_json as GameState);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${id}`,
        },
        () => {
          loadTable();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_players',
          filter: `table_id=eq.${id}`,
        },
        () => {
          loadTable();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateGameState = async (newState: GameState) => {
    if (!id) return;
    
    const { error } = await supabase
      .from('table_state')
      .update({
        state_json: newState,
        updated_at: new Date().toISOString(),
      })
      .eq('table_id', id);

    if (error) {
      console.error('[MultiplayerTable] Update state error:', error);
      throw error;
    }
  };

  const handleAction = async (actionType: string, payload?: any) => {
    if (!id || !mySeat || !gameState) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Notification removed
        return;
      }

      // Verify it's my turn
      if (gameState.phase === 'playing' && gameState.activeSeat !== mySeat) {
        // Notification removed
        return;
      }

      // Get current state
      const { data: stateData, error: stateError } = await supabase
        .from('table_state')
        .select('state_json')
        .eq('table_id', id)
        .maybeSingle();

      if (stateError || !stateData) {
        // Notification removed
        return;
      }

      const currentState = stateData.state_json as GameState;
      let newState: GameState = { ...currentState };

      // Handle bet action
      if (actionType === 'bet' && payload?.amount) {
        const amount = payload.amount;
        const player = table?.table_players.find(p => p.user_id === user.id);
        
        if (!player || player.bankroll < amount) {
          // Notification removed
          return;
        }

        // Initialize playerHands if needed
        if (!newState.playerHands) {
          newState.playerHands = {};
        }

        // Create hand with bet
        const hand: Hand = {
          ...createEmptyHand(amount),
          cards: [],
        };

        if (!newState.playerHands[mySeat]) {
          newState.playerHands[mySeat] = [];
        }
        newState.playerHands[mySeat] = [hand];

        // Deduct bet from bankroll (update player bankroll in database)
        await supabase
          .from('table_players')
          .update({ bankroll: player.bankroll - amount })
          .eq('table_id', id)
          .eq('user_id', user.id);

        // Toast removed - was blocking betting UI
      }

      // Handle game actions (hit, stand, double, split)
      else if (gameState.phase === 'playing' && gameState.activeSeat === mySeat) {
        const hands = currentState.playerHands[mySeat] || [];
        if (hands.length === 0) {
          // Notification removed
          return;
        }

        const activeHandIndex = 0; // For multiplayer, we use seat-based hands
        const hand = hands[activeHandIndex];

        if (actionType === 'hit') {
          let shoe = currentState.shoe || [];
          if (shoe.length < 1) {
            shoe = createShuffledShoe(6);
          }

          const [card, newShoe] = drawCard(shoe, true);
          const newHand = addCardToHand(hand, card);
          
          const newHands = [...hands];
          newHands[activeHandIndex] = newHand;

          newState = {
            ...currentState,
            shoe: newShoe,
            playerHands: {
              ...currentState.playerHands,
              [mySeat]: newHands,
            },
          };

          // If busted, move to next player
          if (newHand.isBusted || newHand.isBlackjack) {
            const nextSeat = getNextActiveSeat(currentState, mySeat);
            newState.activeSeat = nextSeat;
            if (nextSeat === null) {
              newState.phase = 'DEALER_TURN';
            }
          }
        }

        else if (actionType === 'stand') {
          const newHands = [...hands];
          newHands[activeHandIndex] = { ...hand, isStood: true };

          newState = {
            ...currentState,
            playerHands: {
              ...currentState.playerHands,
              [mySeat]: newHands,
            },
          };

          const nextSeat = getNextActiveSeat(currentState, mySeat);
          newState.activeSeat = nextSeat;
          if (nextSeat === null) {
            newState.phase = 'DEALER_TURN';
          }
        }

        else if (actionType === 'double') {
          const player = table?.table_players.find(p => p.user_id === user.id);
          if (!player || player.bankroll < hand.bet) {
            // Notification removed
            return;
          }

          let shoe = currentState.shoe || [];
          if (shoe.length < 1) {
            shoe = createShuffledShoe(6);
          }

          const [card, newShoe] = drawCard(shoe, true);
          const newHand: Hand = {
            ...addCardToHand(hand, card),
            bet: hand.bet * 2,
            isDoubled: true,
            isStood: true,
          };

          const newHands = [...hands];
          newHands[activeHandIndex] = newHand;

          // Update bankroll
          await supabase
            .from('table_players')
            .update({ bankroll: player.bankroll - hand.bet })
            .eq('table_id', id)
            .eq('user_id', user.id);

          newState = {
            ...currentState,
            shoe: newShoe,
            playerHands: {
              ...currentState.playerHands,
              [mySeat]: newHands,
            },
          };

          const nextSeat = getNextActiveSeat(currentState, mySeat);
          newState.activeSeat = nextSeat;
          if (nextSeat === null) {
            newState.phase = 'DEALER_TURN';
          }
        }

        else if (actionType === 'split') {
          if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank) {
            // Notification removed
            return;
          }

          const player = table?.table_players.find(p => p.user_id === user.id);
          if (!player || player.bankroll < hand.bet) {
            // Notification removed
            return;
          }

          let shoe = currentState.shoe || [];
          if (shoe.length < 2) {
            shoe = createShuffledShoe(6);
          }

          const [card1, shoe1] = drawCard(shoe, true);
          const [card2, shoe2] = drawCard(shoe1, true);

          const hand1: Hand = {
            ...createEmptyHand(hand.bet),
            cards: [hand.cards[0], card1],
            isSplit: true,
            isBlackjack: isBlackjack([hand.cards[0], card1]),
          };

          const hand2: Hand = {
            ...createEmptyHand(hand.bet),
            cards: [hand.cards[1], card2],
            isSplit: true,
            isBlackjack: isBlackjack([hand.cards[1], card2]),
          };

          // Update bankroll
          await supabase
            .from('table_players')
            .update({ bankroll: player.bankroll - hand.bet })
            .eq('table_id', id)
            .eq('user_id', user.id);

          newState = {
            ...currentState,
            shoe: shoe2,
            playerHands: {
              ...currentState.playerHands,
              [mySeat]: [hand1, hand2],
            },
          };

          // If both hands are finished, move to next player
          if (hand1.isBlackjack && hand2.isBlackjack) {
            const nextSeat = getNextActiveSeat(currentState, mySeat);
            newState.activeSeat = nextSeat;
            if (nextSeat === null) {
              newState.phase = 'DEALER_TURN';
            }
          }
        }
      }

      // Update state
      await updateGameState(newState);
    } catch (error: any) {
      console.error('[MultiplayerTable] Action error:', error);
      // Notification removed
    }
  };

  const getNextActiveSeat = (state: GameState, currentSeat: number): number | null => {
    const seats = Object.keys(state.playerHands || {})
      .map(Number)
      .sort((a, b) => a - b);
    
    const currentIndex = seats.indexOf(currentSeat);
    if (currentIndex === -1) return null;

    // Check next seats
    for (let i = currentIndex + 1; i < seats.length; i++) {
      const seat = seats[i];
      const hands = state.playerHands[seat] || [];
      const hasActiveHand = hands.some(h => !h.isStood && !h.isBusted && !h.isBlackjack);
      if (hasActiveHand) return seat;
    }

    return null; // All players finished
  };

  const handleStartRound = async () => {
    if (!id) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Notification removed
        return;
      }

      // Verify user is table creator
      if (!isTableCreator) {
        // Notification removed
        return;
      }

      // Check minimum players (at least 1 player required)
      if (!table || table.table_players.length < 1) {
        // Notification removed
        return;
      }

      // Get current state
      const { data: stateData, error: stateError } = await supabase
        .from('table_state')
        .select('state_json')
        .eq('table_id', id)
        .maybeSingle();

      if (stateError || !stateData) {
        // Notification removed
        return;
      }

      const currentState = stateData.state_json as GameState;

      // If in waiting phase, transition to betting phase first
      if (currentState.phase === 'waiting') {
        const bettingState: GameState = {
          ...currentState,
          phase: 'betting',
        };

        const { error: updateError } = await supabase
          .from('table_state')
          .update({
            state_json: bettingState,
            updated_at: new Date().toISOString(),
          })
          .eq('table_id', id);

        if (updateError) throw updateError;

        // Notification removed
        return;
      }

      // If in betting phase, check if we can deal cards
      if (currentState.phase === 'betting') {
        const playersWithBets = Object.keys(currentState.playerHands || {}).length;
        
        if (playersWithBets === 0) {
          // Notification removed
          return;
        }

        // Initialize shoe if needed
        let shoe = currentState.shoe || [];
        if (!Array.isArray(shoe) || shoe.length < 20) {
          shoe = createShuffledShoe(6); // Default 6 decks
        }

        // Deal cards to each player who has bet
        const dealerHand = createEmptyHand();
        const playerHands: Record<number, Hand[]> = {};

        for (const player of table.table_players) {
          const seat = player.seat;
          const hands = currentState.playerHands?.[seat] || [];
          if (hands.length === 0) continue; // Skip players without bets

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
          currentRound: (currentState.currentRound || 0) + 1,
        };

        // Update database
        const { error: updateError } = await supabase
          .from('table_state')
          .update({
            state_json: newState,
            updated_at: new Date().toISOString(),
          })
          .eq('table_id', id);

        if (updateError) throw updateError;

        // Update table status
        await supabase
          .from('tables')
          .update({ status: 'playing' })
          .eq('id', id);

        // Notification removed
      }
    } catch (error: any) {
      console.error('[MultiplayerTable] Start round error:', error);
      // Notification removed
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!table || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <div className="text-center">
          <p className="text-destructive mb-4">Table introuvable</p>
          <Button onClick={() => navigate('/lobby')}>Retour au lobby</Button>
        </div>
      </div>
    );
  }

  const isMyTurn = gameState.activeSeat === mySeat && gameState.phase === 'playing';
  const myHands = mySeat ? gameState.playerHands[mySeat] || [] : [];
  const activePlayer = gameState.activeSeat ? table.table_players.find(p => p.seat === gameState.activeSeat) : null;
  const myPlayer = table.table_players.find(p => p.user_id === currentUser?.id);

  return (
    <div className="h-screen bg-table-felt flex flex-col relative overflow-hidden">
      {/* Casino-style table border */}
      <div className="absolute inset-0 border-8 border-gold/30 rounded-lg pointer-events-none" />
      <div className="absolute inset-2 border-4 border-gold/20 rounded-lg pointer-events-none" />

      {/* Header - Compact */}
      <header className="p-3 border-b border-gold/20 bg-black/20 backdrop-blur-sm relative z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/lobby')} className="text-gold hover:text-gold/80 h-8 px-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Lobby
            </Button>
            <h1 className="text-lg font-bold text-gold font-heading">{table.name}</h1>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gold/20 text-gold border border-gold/30">
              {table.status}
            </span>
            {table.room_code && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 rounded border border-gold/20">
                <Hash className="h-3 w-3 text-gold/70" />
                <code className="text-xs font-mono font-bold text-gold">{table.room_code}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-gold hover:text-gold/80"
                  onClick={() => {
                    navigator.clipboard.writeText(table.room_code!);
                    // Notification removed
                  }}
                  title="Copier le code"
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gold/80 font-semibold">
              Round {gameState.currentRound}
            </div>
            {/* Active Player Indicator */}
            {gameState.phase === 'playing' && activePlayer && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gold/20 rounded-full border border-gold/30">
                <Users className="h-3 w-3 text-gold" />
                <span className="text-xs font-bold text-gold">
                  {activePlayer.user_id === currentUser?.id ? 'Your Turn' : `Turn: ${activePlayer.profile?.username || `Player ${activePlayer.seat}`}`}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setChatOpen(!chatOpen)}
              className="text-gold hover:text-gold/80 hover:bg-gold/10 h-8 w-8"
              title="Ouvrir le chat"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Panel */}
      {currentUser && id && (
        <ChatPanel
          tableId={id}
          currentUserId={currentUser.id}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Game Area - Optimized Layout */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Dealer Section - Top Center */}
        <div className="flex-shrink-0 pt-4 pb-2 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-sm font-bold text-gold mb-2 tracking-wider">CROUPIER</div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border-2 border-gold/30 shadow-xl inline-block">
              <HandView
                hand={gameState.dealerHand}
                isDealer
                showValue={gameState.phase === 'settling' || gameState.phase === 'playing'}
              />
            </div>
          </motion.div>
        </div>

        {/* Opponents Section - Using OpponentsZone */}
        {table.table_players.filter(p => p.user_id !== currentUser?.id).length > 0 && (
          <OpponentsZone
            opponents={table.table_players
              .filter(p => p.user_id !== currentUser?.id)
              .map(player => ({
                id: player.id,
                seat: player.seat,
                username: player.profile?.username || `J${player.seat}`,
                bankroll: player.bankroll,
                hands: gameState.playerHands[player.seat] || [],
              }))}
            activeSeat={gameState.activeSeat}
            phase={gameState.phase}
          />
        )}

        {/* MY CARDS SECTION - Fixed Bottom, Always Visible */}
        {mySeat && myPlayer && (
          <div className="flex-shrink-0 border-t-2 border-gold/50 bg-gradient-to-t from-black/90 via-black/80 to-black/70 backdrop-blur-lg p-3 shadow-2xl">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                {/* My Cards Display - Enhanced */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gold">MES CARTES</h3>
                    <div className="text-xs text-gold/80">
                      Bankroll: <span className="font-bold text-gold">${myPlayer.bankroll.toLocaleString()}</span>
                    </div>
                    {myHands.length > 0 && myHands.reduce((sum, h) => sum + h.bet, 0) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gold/60">Mise:</span>
                        <ChipStack amount={myHands.reduce((sum, h) => sum + h.bet, 0)} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
                    {myHands.length > 0 ? (
                      myHands.map((hand, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0.9, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          <div className={`
                            p-3 rounded-lg border-2 bg-black/50 backdrop-blur-sm min-w-[200px]
                            ${isMyTurn && idx === 0 ? 'border-gold bg-gold/30 shadow-xl shadow-gold/50 ring-2 ring-gold/50' : 'border-gold/40 bg-black/50'}
                            transition-all duration-300
                          `}>
                            <div className="mb-1.5 text-xs font-semibold text-gold uppercase tracking-wider flex items-center justify-between">
                              <span>Main {idx + 1} {hand.isSplit && '✂️'}</span>
                              {hand.bet > 0 && (
                                <span className="text-xs text-gold/70">${hand.bet}</span>
                              )}
                            </div>
                            <HandView
                              hand={hand}
                              isActive={isMyTurn && idx === 0}
                              showValue={true}
                            />
                            {hand.bet > 0 && (
                              <div className="mt-1.5 flex justify-center">
                                <ChipStack amount={hand.bet} size="sm" />
                              </div>
                            )}
                            {/* Hand status indicators */}
                            {hand.isBlackjack && (
                              <div className="absolute top-2 left-2 bg-gold text-black text-xs font-bold px-2 py-1 rounded">
                                BJ
                              </div>
                            )}
                            {hand.isBusted && (
                              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                BUST
                              </div>
                            )}
                            {hand.isStood && !hand.isBusted && !hand.isBlackjack && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                                STAND
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-gold/60 text-sm py-6 px-4 bg-black/30 rounded-lg border border-gold/20">
                        Aucune carte - Placez une mise pour commencer
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls Section - Right Side */}
                <div className="flex-shrink-0 w-80">
                  {/* Betting Phase */}
                  {gameState.phase === 'betting' && myPlayer && (
                    <BetComposerMultiplayer
                      bankroll={myPlayer.bankroll}
                      minBet={10}
                      maxBet={500}
                      onBet={(amount) => handleAction('bet', { amount })}
                      onDeal={isTableCreator && Object.keys(gameState.playerHands || {}).length > 0 ? handleStartRound : undefined}
                      isTableCreator={isTableCreator}
                      bettingTimeLeft={bettingTimeLeft}
                      canDeal={isTableCreator && Object.keys(gameState.playerHands || {}).length > 0}
                      soundEnabled={false}
                      soundVolume={0.5}
                    />
                  )}

                  {/* Playing Phase - My Turn */}
                  {gameState.phase === 'playing' && isMyTurn && (() => {
                    const activeHand = myHands[0];
                    const canSplitHand = activeHand && 
                      activeHand.cards.length === 2 && 
                      activeHand.cards[0].rank === activeHand.cards[1].rank &&
                      myPlayer.bankroll >= activeHand.bet &&
                      !activeHand.isStood &&
                      !activeHand.isBusted;
                    
                    const canDoubleHand = activeHand && 
                      activeHand.cards.length === 2 &&
                      myPlayer.bankroll >= activeHand.bet &&
                      !activeHand.isDoubled &&
                      !activeHand.isStood &&
                      !activeHand.isBusted;
                    
                    const dealerUpCard = gameState.dealerHand.cards.find((c: any) => c.faceUp);
                    const canInsurance = dealerUpCard?.rank === 'A' && 
                      activeHand?.cards.length === 2 &&
                      myPlayer.bankroll >= (activeHand?.bet || 0) / 2;
                    
                    const actions = [
                      { action: 'hit' as PlayerAction, label: 'Hit', enabled: true },
                      { action: 'stand' as PlayerAction, label: 'Stand', enabled: true },
                      { action: 'double' as PlayerAction, label: 'Double', enabled: !!canDoubleHand, reason: !canDoubleHand ? 'Can only double on first two cards' : undefined },
                      { action: 'split' as PlayerAction, label: 'Split', enabled: !!canSplitHand, reason: !canSplitHand ? 'Can only split with two cards of same rank' : undefined },
                    ];
                    
                    if (canInsurance) {
                      actions.push({ action: 'insurance' as PlayerAction, label: 'Insurance', enabled: true });
                    }
                    
                    return (
                      <ActionBarMultiplayer
                        actions={actions}
                        onAction={(action) => handleAction(action)}
                        actionTimeLeft={actionTimeLeft}
                        isAnimating={false}
                        soundEnabled={false}
                        soundVolume={0.5}
                      />
                    );
                  })()}

                  {/* Playing Phase - Not My Turn */}
                  {gameState.phase === 'playing' && !isMyTurn && (
                    <div className="bg-black/40 rounded-lg p-3 border border-gold/20 text-center">
                      <p className="text-gold/80 text-sm">
                        ⏳ En attente du joueur actif...
                      </p>
                      {activePlayer && (
                        <p className="text-xs text-gold/60 mt-1">
                          {activePlayer.profile?.username || `Joueur ${activePlayer.seat}`} joue
                        </p>
                      )}
                    </div>
                  )}

                  {/* Waiting Phase */}
                  {gameState.phase === 'waiting' && (
                    <div className="bg-black/40 rounded-lg p-3 border border-gold/20">
                      <p className="text-gold text-sm font-semibold mb-2">
                        {isTableCreator ? 'Démarrez la partie' : 'En attente du créateur'}
                      </p>
                      {isTableCreator && (
                        <Button
                          onClick={handleStartRound}
                          size="sm"
                          disabled={table.table_players.length < 1}
                          className="w-full bg-gold hover:bg-gold/90 text-black font-bold"
                        >
                          🎰 Démarrer ({table.table_players.length} joueur{table.table_players.length > 1 ? 's' : ''})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Settlement Phase */}
                  {gameState.phase === 'settling' && (
                    <div className="bg-black/40 rounded-lg p-3 border border-gold/20 text-center">
                      <p className="text-gold text-sm font-semibold">Règlement en cours...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
