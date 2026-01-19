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
import { Plus, Users, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface Table {
  id: string;
  name: string;
  status: string;
  max_players: number;
  created_by: string;
  created_at: string;
  table_players: Array<{ user_id: string; seat: number }>;
}

export default function Lobby() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState('');
  const [creating, setCreating] = useState(false);
  const [user, setUser] = useState<any>(null);
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
      const { data, error } = await supabase
        .from('tables')
        .select('*, table_players(user_id, seat)')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTables(data || []);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des tables');
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

      const { data, error } = await supabase.functions.invoke('create_table', {
        body: { name: tableName.trim(), max_players: 5 },
      });

      if (error) {
        console.error('Create table error:', error);
        throw error;
      }

      if (!data || !data.table) {
        throw new Error('Réponse invalide du serveur');
      }

      toast.success('Table créée !');
      navigate(`/table/${data.table.id}`);
    } catch (error: any) {
      console.error('Error creating table:', error);
      const errorMessage = error?.message || error?.error || 'Erreur lors de la création de la table';
      const errorDetails = error?.details ? ` (${error.details})` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    } finally {
      setCreating(false);
      setTableName('');
    }
  };

  const handleJoinTable = async (tableId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('join_table', {
        body: { table_id: tableId },
      });

      if (error) throw error;

      toast.success('Table rejointe !');
      navigate(`/table/${tableId}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la connexion à la table');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getPlayerCount = (table: Table) => table.table_players?.length || 0;

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
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nom de la table"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTable()}
                disabled={creating}
              />
              <Button onClick={handleCreateTable} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tables List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tables disponibles</h2>
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
                        <div>
                          <CardTitle>{table.name}</CardTitle>
                          <CardDescription>
                            <Users className="h-4 w-4 inline mr-1" />
                            {getPlayerCount(table)} / {table.max_players} joueurs
                          </CardDescription>
                        </div>
                        <span className="px-2 py-1 text-xs rounded bg-muted">
                          {table.status}
                        </span>
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
