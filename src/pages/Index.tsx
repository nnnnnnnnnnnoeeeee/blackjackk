import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from "@/components/Table";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <div className="text-center text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mode Selector Overlay */}
      {!user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-card rounded-lg p-8 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Choisissez un mode</h2>
            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-auto py-6 flex flex-col items-center gap-2"
                size="lg"
              >
                <Users className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Mode Multijoueur</div>
                  <div className="text-xs opacity-80">Jouez avec d'autres joueurs en temps réel</div>
                </div>
              </Button>
              <Button
                onClick={() => setUser({ solo: true })}
                variant="outline"
                className="w-full h-auto py-6 flex flex-col items-center gap-2"
                size="lg"
              >
                <User className="h-6 w-6" />
                <div>
                  <div className="font-semibold">Mode Solo</div>
                  <div className="text-xs opacity-80">Entraînez-vous seul, hors ligne</div>
                </div>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Game Table */}
      <Table />

      {/* Quick Access Button for Multiplayer */}
      {user && !user.solo && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed top-4 right-4 z-40"
        >
          <Button onClick={() => navigate('/lobby')} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Multijoueur
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
