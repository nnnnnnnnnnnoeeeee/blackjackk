// ============================================================================
// Multiplayer Table Page
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HandView } from '@/components/HandView';
import { BetPanel } from '@/components/BetPanel';
import { Controls } from '@/components/Controls';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface TableData {
  id: string;
  name: string;
  status: string;
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
}

export default function MultiplayerTable() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [table, setTable] = useState<TableData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadTable();
    subscribeToTable();
  }, [id]);

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
        .single();

      if (tableError) throw tableError;

      // Load profiles separately
      if (tableData) {
        const userIds = tableData.table_players.map((p: any) => p.user_id);
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

      setTable(tableData);

      const myPlayer = tableData.table_players.find((p: any) => p.user_id === user.id);
      setMySeat(myPlayer?.seat || null);

      const { data: stateData, error: stateError } = await supabase
        .from('table_state')
        .select('state_json')
        .eq('table_id', id)
        .single();

      if (!stateError && stateData) {
        setGameState(stateData.state_json);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement de la table');
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAction = async (actionType: string, payload?: any) => {
    if (!id || !mySeat) return;

    try {
      const { error } = await supabase.functions.invoke('player_action', {
        body: {
          table_id: id,
          action_type: actionType,
          payload: payload || {},
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'action');
    }
  };

  const handleStartRound = async () => {
    if (!id) return;

    try {
      const { error } = await supabase.functions.invoke('start_round', {
        body: { table_id: id },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du démarrage du round');
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

  return (
    <div className="min-h-screen bg-table-felt flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/lobby')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Lobby
            </Button>
            <h1 className="text-xl font-bold">{table.name}</h1>
            <span className="px-2 py-1 text-xs rounded bg-muted">{table.status}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Round {gameState.currentRound}
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Dealer */}
          <div className="mb-8 flex justify-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">DEALER</div>
              <HandView
                hand={gameState.dealerHand}
                isDealer
                showValue={gameState.phase === 'settling' || gameState.phase === 'playing'}
              />
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {table.table_players
              .sort((a, b) => a.seat - b.seat)
              .map((player) => {
                const hands = gameState.playerHands[player.seat] || [];
                const isActive = gameState.activeSeat === player.seat;
                const isMe = player.user_id === currentUser?.id;

                return (
                  <Card key={player.id} className={isActive ? 'ring-2 ring-primary' : ''}>
                    <CardContent className="p-4">
                      <div className="text-center mb-2">
                        <div className="font-semibold">
                          {isMe ? 'Vous' : player.profile?.username || `Joueur ${player.seat}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${player.bankroll}
                        </div>
                      </div>
                      {hands.map((hand, idx) => (
                        <HandView
                          key={idx}
                          hand={hand}
                          isActive={isActive && idx === 0}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {/* My Controls */}
          {mySeat && (
            <div className="max-w-2xl mx-auto">
              {gameState.phase === 'betting' && (
                <div className="text-center">
                  <p className="mb-4 text-muted-foreground">
                    Placez votre mise pour commencer
                  </p>
                  {/* Simplified bet panel for multiplayer */}
                  <div className="flex gap-2 justify-center">
                    {[10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => handleAction('bet', { amount })}
                        variant="outline"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  {table.table_players.length > 1 &&
                    table.table_players.every((p) => {
                      const hands = gameState.playerHands[p.seat] || [];
                      return hands.length > 0;
                    }) && (
                      <Button onClick={handleStartRound} className="mt-4">
                        Démarrer le round
                      </Button>
                    )}
                </div>
              )}

              {gameState.phase === 'playing' && isMyTurn && (
                <div className="text-center">
                  <p className="mb-4 font-semibold">À votre tour !</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => handleAction('hit')}>Hit</Button>
                    <Button onClick={() => handleAction('stand')}>Stand</Button>
                    <Button onClick={() => handleAction('double')}>Double</Button>
                    <Button onClick={() => handleAction('split')}>Split</Button>
                  </div>
                </div>
              )}

              {gameState.phase === 'playing' && !isMyTurn && (
                <div className="text-center text-muted-foreground">
                  En attente du joueur actif...
                </div>
              )}

              {gameState.phase === 'settling' && (
                <div className="text-center">
                  <p className="mb-4">Règlement en cours...</p>
                  <Button onClick={() => navigate('/lobby')}>Retour au lobby</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
