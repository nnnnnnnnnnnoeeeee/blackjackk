// ============================================================================
// Lobby Page - Liste des tables multijoueurs
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Users, LogOut, Trash2, Copy, Hash, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface Table {
  id: string;
  name: string;
  status: string;
  max_players: number;
  created_by: string;
  created_at: string;
  room_code?: string;
  is_public?: boolean;
  table_players: Array<{ user_id: string; seat: number }>;
}

export default function Lobby() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    loadTables();
    subscribeToTables();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUser(user);
  };

  const loadTables = async () => {
    try {
      // First, try to load tables without the relation to avoid RLS issues
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('id, name, status, max_players, created_by, created_at, room_code, is_public')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (tablesError) {
        console.error('[Lobby] Error loading tables:', tablesError);
        throw tablesError;
      }

      // Then load players separately for each table
      if (tablesData && tablesData.length > 0) {
        const tableIds = tablesData.map(t => t.id);
        const { data: playersData, error: playersError } = await supabase
          .from('table_players')
          .select('table_id, user_id, seat')
          .in('table_id', tableIds);

        if (playersError) {
          console.error('[Lobby] Error loading players:', playersError);
          // Continue without players data
        }

        // Combine tables with their players
        const tablesWithPlayers = tablesData.map(table => ({
          ...table,
          table_players: playersData?.filter(p => p.table_id === table.id) || [],
        }));

        setTables(tablesWithPlayers);
      } else {
        setTables([]);
      }
    } catch (error: any) {
      console.error('[Lobby] Error loading tables:', error);
      toast.error(`Erreur lors du chargement des tables: ${error.message || 'Erreur inconnue'}`);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToTables = () => {
    const channel = supabase
      .channel('tables_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        () => {
          loadTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateTable = async () => {
    if (!tableName.trim()) {
      toast.error('Veuillez entrer un nom de table');
      return;
    }

    setCreating(true);
    try {
      // Get current session to ensure we have auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      console.log('[Lobby] Creating table with name:', tableName.trim());
      console.log('[Lobby] Session:', { userId: session.user.id, email: session.user.email });
      console.log('[Lobby] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        toast.error('Configuration Supabase manquante', {
          description: 'Les variables d\'environnement Supabase ne sont pas configurées',
        });
        return;
      }

      // Verify user is authenticated
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('[Lobby] User verification error:', userError);
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      // Ensure session is fresh and valid
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[Lobby] Session refresh error:', refreshError);
        toast.error('Erreur de session. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      const activeSession = refreshedSession || session;
      
      if (!activeSession || !activeSession.access_token) {
        toast.error('Session invalide. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (activeSession.expires_at && activeSession.expires_at < now) {
        console.error('[Lobby] Token expired:', { expiresAt: activeSession.expires_at, now });
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      console.log('[Lobby] Creating table directly via Supabase API');

      // Generate a unique room code (6 characters)
      const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let roomCode = generateRoomCode();
      let attempts = 0;
      let codeExists = true;

      // Ensure code is unique (check up to 10 times)
      while (codeExists && attempts < 10) {
        const { data: existing, error: checkError } = await supabase
          .from('tables')
          .select('id')
          .eq('room_code', roomCode)
          .maybeSingle();
        
        // If error or no existing table, code is available
        if (checkError || !existing) {
          codeExists = false;
        } else {
          roomCode = generateRoomCode();
          attempts++;
        }
      }

      // Create table directly via Supabase API (bypass Edge Function)
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .insert({
          name: tableName.trim(),
          max_players: 5,
          created_by: activeSession.user.id,
          status: 'waiting',
          room_code: roomCode,
          is_public: isPublic,
        })
        .select()
        .single();

      if (tableError) {
        console.error('[Lobby] Table creation error:', tableError);
        toast.error(`Erreur lors de la création: ${tableError.message}`);
        return;
      }

      // Add creator as first player (seat 1)
      const { data: player, error: playerError } = await supabase
        .from('table_players')
        .insert({
          table_id: table.id,
          user_id: activeSession.user.id,
          seat: 1,
          bankroll: 1000,
        })
        .select()
        .single();

      if (playerError) {
        console.error('[Lobby] Player insertion error:', playerError);
        // Rollback table creation
        await supabase.from('tables').delete().eq('id', table.id);
        toast.error(`Erreur lors de l'ajout du joueur: ${playerError.message}`);
        return;
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

      const { error: stateError } = await supabase
        .from('table_state')
        .insert({
          table_id: table.id,
          state_json: initialState,
        });

      if (stateError) {
        console.error('[Lobby] State initialization error:', stateError);
        // Rollback
        await supabase.from('tables').delete().eq('id', table.id);
        await supabase.from('table_players').delete().eq('table_id', table.id);
        toast.error(`Erreur lors de l'initialisation: ${stateError.message}`);
        return;
      }

      console.log('[Lobby] Table created successfully:', table.id);
      toast.success('Table créée !');
      navigate(`/table/${table.id}`);
    } catch (error: any) {
      console.error('[Lobby] Unexpected error creating table:', error);
      const errorMessage = error?.message || error?.error || 'Erreur lors de la création de la table';
      const errorDetails = error?.details ? ` (${error.details})` : '';
      toast.error(`${errorMessage}${errorDetails}`, {
        description: 'Ouvrez la console (F12) pour voir les détails',
        duration: 5000,
      });
    } finally {
      setCreating(false);
      setTableName('');
    }
  };

  const handleJoinByCode = async () => {
    if (!roomCodeInput.trim()) {
      toast.error('Veuillez entrer un code de salle');
      return;
    }

    setJoiningByCode(true);
    try {
      const code = roomCodeInput.trim().toUpperCase();

      // Find table by room code
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('id, name, status, max_players, table_players(*)')
        .eq('room_code', code)
        .single();

      if (tableError || !table) {
        toast.error('Code de salle invalide');
        return;
      }

      if (table.status !== 'waiting') {
        toast.error('Cette table n\'accepte plus de nouveaux joueurs');
        return;
      }

      // Use the same join logic
      await handleJoinTable(table.id);
      setRoomCodeInput('');
    } catch (error: any) {
      console.error('[Lobby] Join by code error:', error);
      toast.error(error.message || 'Erreur lors de la connexion');
    } finally {
      setJoiningByCode(false);
    }
  };

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papiers !');
  };

  const handleJoinTable = async (tableId: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour rejoindre une table');
        navigate('/login');
        return;
      }

      // Check if user is already in table
      const { data: existingPlayer } = await supabase
        .from('table_players')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .single();

      if (existingPlayer) {
        // User is already in table, just navigate
        toast.success('Vous êtes déjà dans cette table');
        navigate(`/table/${tableId}`);
        return;
      }

      // Get table info
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('*, table_players(*)')
        .eq('id', tableId)
        .single();

      if (tableError || !table) {
        toast.error('Table introuvable');
        return;
      }

      if (table.status !== 'waiting') {
        toast.error('Cette table n\'accepte plus de nouveaux joueurs');
        return;
      }

      // Check if table is full
      if (table.table_players.length >= table.max_players) {
        toast.error('Cette table est pleine');
        return;
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
      const { error: playerError } = await supabase
        .from('table_players')
        .insert({
          table_id: tableId,
          user_id: user.id,
          seat: availableSeat,
          bankroll: 1000,
        });

      if (playerError) {
        console.error('[Lobby] Join table error:', playerError);
        toast.error(`Erreur: ${playerError.message}`);
        return;
      }

      toast.success('Table rejointe !');
      navigate(`/table/${tableId}`);
    } catch (error: any) {
      console.error('[Lobby] Join table error:', error);
      toast.error(error.message || 'Erreur lors de la connexion à la table');
    }
  };

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Verify user is the creator
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('created_by')
        .eq('id', tableId)
        .single();

      if (tableError || !table) {
        toast.error('Table introuvable');
        return;
      }

      if (table.created_by !== user.id) {
        toast.error('Vous ne pouvez supprimer que vos propres tables');
        return;
      }

      // Confirm deletion
      if (!confirm(`Êtes-vous sûr de vouloir supprimer la table "${tableName}" ?`)) {
        return;
      }

      // Delete table (cascade will delete players and state)
      const { error: deleteError } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);

      if (deleteError) {
        console.error('[Lobby] Delete table error:', deleteError);
        toast.error(`Erreur: ${deleteError.message}`);
        return;
      }

      toast.success('Table supprimée');
      // Reload tables list
      loadTables();
    } catch (error: any) {
      console.error('[Lobby] Delete table error:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getPlayerCount = (table: Table) => table.table_players?.length || 0;

  const isTableCreator = (table: Table) => {
    return user && table.created_by === user.id;
  };

  return (
    <div className="min-h-screen bg-table-felt p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">🎰 Lobby Multijoueur</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              Mode Solo
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Create Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Créer une table</CardTitle>
            <CardDescription>Créez une nouvelle table de jeu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nom de la table"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTable()}
                disabled={creating}
                className="flex-1"
              />
              <Button onClick={handleCreateTable} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 flex-1">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="public-toggle" className="cursor-pointer">
                  {isPublic ? 'Table publique' : 'Table privée'}
                </Label>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={creating}
              />
              <span className="text-xs text-muted-foreground">
                {isPublic 
                  ? 'Visible par tous les joueurs' 
                  : 'Visible uniquement par vous'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Join by Code */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rejoindre par code</CardTitle>
            <CardDescription>Entrez le code de la salle pour rejoindre une partie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Code de la salle (ex: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
                  disabled={joiningByCode}
                  className="pl-10"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={handleJoinByCode} 
                disabled={joiningByCode || !roomCodeInput.trim()}
              >
                {joiningByCode ? 'Connexion...' : 'Rejoindre'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tables List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {user ? 'Mes tables et tables publiques' : 'Tables disponibles'}
          </h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune table disponible. Créez-en une !
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tables.map((table) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle>{table.name}</CardTitle>
                          <div className="space-y-1">
                            <CardDescription>
                              <Users className="h-4 w-4 inline mr-1" />
                              {getPlayerCount(table)} / {table.max_players} joueurs
                            </CardDescription>
                            {table.room_code && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">Code:</span>
                                <code className="px-2 py-1 bg-muted rounded text-sm font-mono font-bold">
                                  {table.room_code}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyRoomCode(table.room_code!)}
                                  title="Copier le code"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {table.is_public !== false ? (
                            <Globe className="h-4 w-4 text-primary" title="Table publique" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" title="Table privée" />
                          )}
                          <span className="px-2 py-1 text-xs rounded bg-muted">
                            {table.status}
                          </span>
                          {isTableCreator(table) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteTable(table.id, table.name)}
                              title="Supprimer la table"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleJoinTable(table.id)}
                        className="w-full"
                        disabled={getPlayerCount(table) >= table.max_players}
                      >
                        {getPlayerCount(table) >= table.max_players
                          ? 'Table pleine'
                          : 'Rejoindre'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
