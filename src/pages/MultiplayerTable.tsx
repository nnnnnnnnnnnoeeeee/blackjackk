// ============================================================================
// Multiplayer Table Page
// ============================================================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HandView } from '@/components/HandView';
import { TimerBadge, TurnIndicator, BetComposerMultiplayer, ActionBarMultiplayer } from '@/ui/blackjack/components';
import { TableShell } from '@/ui/blackjack/layout';
import { OpponentsZone } from '@/ui/blackjack/table';
import { ChipStack } from '@/components/ChipStack';
import { TableChat } from '@/ui/blackjack/components/TableChat';
import { QuickChatBar } from '@/components/QuickChatBar';
import { EmoteOverlay, type ActiveEmote } from '@/components/EmoteOverlay';
// Toast import removed - all notifications disabled
import { ArrowLeft, Copy, Hash, MessageSquare, Trophy, Users } from 'lucide-react';
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
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [activeEmotes, setActiveEmotes] = useState<ActiveEmote[]>([]);
  const [initialBankrolls, setInitialBankrolls] = useState<Record<string, number>>({});
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  const spawnEmote = useCallback((emote: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = 10 + Math.random() * 80;
    setActiveEmotes((prev) => [...prev, { id, emote, x }]);
    setTimeout(() => {
      setActiveEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 2600);
  }, []);

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

      // Track initial bankrolls for session leaderboard (only set once per player)
      setInitialBankrolls((prev) => {
        const updated = { ...prev };
        for (const p of tableData.table_players) {
          if (!(p.user_id in updated)) {
            updated[p.user_id] = p.bankroll;
          }
        }
        return updated;
      });

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
      .on('broadcast', { event: 'emote' }, (payload) => {
        if (payload.payload?.emote) {
          spawnEmote(payload.payload.emote as string);
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
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

  // Session leaderboard: net gain since sitting down
  const sessionLeaderboard = table.table_players
    .map((p) => ({
      userId: p.user_id,
      username: p.profile?.username || `J${p.seat}`,
      isMe: p.user_id === currentUser?.id,
      net: p.bankroll - (initialBankrolls[p.user_id] ?? p.bankroll),
      bankroll: p.bankroll,
    }))
    .sort((a, b) => b.net - a.net);

  const headerContent = (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/lobby')} className="text-[#d4af37] hover:text-[#FFDF73] hover:bg-black/20 h-8 px-2 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Lobby
        </Button>
        <h1 className="text-lg font-bold text-[#d4af37] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-playfair">{table.name}</h1>
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">
          {table.status}
        </span>
        {table.room_code && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-black/40 rounded border border-[#d4af37]/20 backdrop-blur-md">
            <Hash className="h-3 w-3 text-[#d4af37]/70" />
            <code className="text-xs font-mono font-bold text-[#d4af37]">{table.room_code}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-[#d4af37]/70 hover:text-[#d4af37] transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(table.room_code!);
              }}
              title="Copier le code"
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-[#d4af37]/80 font-bold uppercase tracking-widest bg-black/40 px-2 py-1 rounded border border-white/5">
          Round {gameState.currentRound}
        </div>
        {/* Active Player Indicator */}
        {gameState.phase === 'playing' && activePlayer && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#d4af37]/20 rounded-full border border-[#d4af37]/30 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Users className="h-3 w-3 text-[#d4af37]" />
            <span className="text-xs font-bold text-[#d4af37]">
              {activePlayer.user_id === currentUser?.id ? 'Votre tour !' : `Tour : ${activePlayer.profile?.username || `J${activePlayer.seat}`}`}
            </span>
          </div>
        )}

        {/* Session Leaderboard toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeaderboardOpen((v) => !v)}
            className="text-[#d4af37] hover:text-[#FFDF73] hover:bg-[#d4af37]/10 h-8 w-8 transition-colors"
            title="Classement de la session"
          >
            <Trophy className="h-4 w-4" />
          </Button>
          <AnimatePresence>
            {leaderboardOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 bg-black/80 backdrop-blur-xl border border-[#d4af37]/30 rounded-xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 w-64"
              >
                <div className="text-xs font-bold text-[#d4af37] mb-3 flex items-center gap-2 uppercase tracking-wider border-b border-white/10 pb-2">
                  <Trophy className="h-4 w-4" />
                  Classement session
                </div>
                <div className="space-y-2">
                  {sessionLeaderboard.map((p, i) => (
                    <div
                      key={p.userId}
                      className={`flex items-center justify-between text-sm px-2 py-1.5 rounded-lg ${p.isMe ? 'bg-[#d4af37]/20 text-[#FFDF73] font-bold border border-[#d4af37]/30' : 'text-white/80'}`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-[#d4af37]/50 text-xs">{i + 1}.</span>
                        <span className="truncate">{p.username}</span>
                        {p.isMe && <span className="text-[9px] opacity-60 ml-1 uppercase tracking-wider">(vous)</span>}
                      </span>
                      <span className={`font-mono font-bold ml-2 ${p.net >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                        {p.net >= 0 ? '+' : ''}{p.net}$
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Chat */}
        {currentUser && id && (
          <QuickChatBar
            tableId={id}
            userId={currentUser.id}
            onEmote={(emote) => spawnEmote(emote)}
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setChatOpen(!chatOpen)}
          className="text-[#d4af37] hover:text-[#FFDF73] hover:bg-[#d4af37]/10 h-8 w-8 transition-colors"
          title="Ouvrir le chat"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const dealerZoneContent = (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="text-[10px] font-black text-[#d4af37] mb-2 tracking-[0.3em] uppercase drop-shadow-md">Croupier</div>
      <div className="inline-block relative">
        <div className="absolute -inset-4 bg-[#d4af37]/10 blur-xl rounded-full pointer-events-none" />
        <div className="relative">
          <HandView
            hand={gameState.dealerHand}
            isDealer
            showValue={gameState.phase === 'settling' || gameState.phase === 'playing'}
          />
        </div>
      </div>
    </motion.div>
  );

  const centerZoneContent = (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Opponents Section */}
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

      {/* Messages */}
      {gameState.phase === 'playing' && !isMyTurn && (
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-[#d4af37]/20 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <p className="text-[#d4af37]/90 text-sm font-bold tracking-wide">
            ⏳ En attente du joueur actif...
          </p>
          {activePlayer && (
            <p className="text-xs text-[#d4af37]/60 mt-1 uppercase tracking-wider">
              {activePlayer.profile?.username || `Joueur ${activePlayer.seat}`} joue
            </p>
          )}
        </div>
      )}

      {gameState.phase === 'waiting' && (
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-5 border border-[#d4af37]/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[280px]">
          <p className="text-[#d4af37] text-center text-sm font-bold tracking-wide uppercase mb-4">
            {isTableCreator ? 'Démarrez la partie' : 'En attente du créateur'}
          </p>
          {isTableCreator && (
            <Button
              onClick={handleStartRound}
              disabled={table.table_players.length < 1}
              className="w-full py-6 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#997A15] hover:from-[#FFDF73] hover:to-[#d4af37] text-black font-black text-lg uppercase tracking-wider border border-[#FFDF73]/50 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
            >
              🎰 Démarrer ({table.table_players.length} joueur{table.table_players.length > 1 ? 's' : ''})
            </Button>
          )}
        </div>
      )}

      {gameState.phase === 'settling' && (
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-[#d4af37]/20 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <p className="text-[#d4af37] text-sm font-black tracking-widest uppercase">Règlement en cours...</p>
        </div>
      )}
    </div>
  );

  const playerZoneContent = mySeat && myPlayer && myHands.length > 0 ? (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-4 flex-wrap justify-center overflow-visible px-4">
        {myHands.map((hand, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            className="relative"
          >
            {/* Hand Highlight Glow */}
            {isMyTurn && idx === 0 && (
              <div className="absolute -inset-4 bg-[#d4af37]/20 blur-xl rounded-full pointer-events-none" />
            )}
            
            <div className={`
              p-4 rounded-2xl border min-w-[220px] relative z-10
              ${isMyTurn && idx === 0 ? 'bg-black/60 backdrop-blur-xl border-[#d4af37] shadow-[0_10px_40px_rgba(212,175,55,0.3)] ring-1 ring-[#d4af37]/50' : 'bg-black/40 backdrop-blur-md border-white/10 shadow-xl'}
              transition-all duration-500
            `}>
              <div className="mb-3 text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] flex items-center justify-between border-b border-white/10 pb-2">
                <span>Main {idx + 1} {hand.isSplit && '✂️'}</span>
                {hand.bet > 0 && (
                  <span className="text-[#FFDF73] text-xs">${hand.bet}</span>
                )}
              </div>
              <div className="flex justify-center">
                <HandView
                  hand={hand}
                  isActive={isMyTurn && idx === 0}
                  showValue={true}
                />
              </div>
              {hand.bet > 0 && (
                <div className="mt-4 flex justify-center scale-110">
                  <ChipStack amount={hand.bet} size="sm" />
                </div>
              )}
              {/* Status Badges */}
              {hand.isBlackjack && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-br from-[#FFDF73] to-[#997A15] text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-[#FFDF73]/50">
                  BLACKJACK
                </div>
              )}
              {hand.isBusted && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-br from-red-500 to-red-800 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-red-400/50">
                  BUSTED
                </div>
              )}
              {hand.isStood && !hand.isBusted && !hand.isBlackjack && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-br from-blue-500 to-blue-800 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-blue-400/50">
                  STOOD
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  ) : null;

  const bottomDockContent = mySeat && myPlayer ? (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md">
        {/* Betting Phase */}
        {gameState.phase === 'betting' && (
          <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-5 border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-4 flex justify-between items-end">
              <div className="text-left">
                <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Bankroll</div>
                <div className="text-2xl font-black text-[#d4af37] tracking-tight">${myPlayer.bankroll.toLocaleString()}</div>
              </div>
            </div>
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
          </div>
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
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-2 border border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <ActionBarMultiplayer
                actions={actions}
                onAction={(action) => handleAction(action)}
                actionTimeLeft={actionTimeLeft}
                isAnimating={false}
                soundEnabled={false}
                soundVolume={0.5}
              />
            </div>
          );
        })()}
      </div>
    </div>
  ) : null;

  return (
    <>
      <EmoteOverlay emotes={activeEmotes} />
      {currentUser && id && (
        <TableChat
          tableId={id}
          userId={currentUser.id}
          username={
            table?.table_players.find((p) => p.user_id === currentUser.id)?.profile?.username ??
            currentUser.user_metadata?.username ??
            'Joueur'
          }
          channel={realtimeChannelRef.current}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
      <TableShell
        className="font-outfit"
        header={headerContent}
        dealerZone={dealerZoneContent}
        centerZone={centerZoneContent}
        playerZone={playerZoneContent}
        bottomDock={bottomDockContent}
      />
    </>
  );
}
