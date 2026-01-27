// ============================================================================
// Mode Selection Page - Choose Solo or Multiplayer
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Users, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ModeSelection() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      if (!newUser && event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const handleModeSelection = (mode: 'solo' | 'multiplayer') => {
    if (mode === 'solo') {
      navigate('/game', { replace: true });
    } else {
      navigate('/lobby', { replace: true });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-table-felt flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-primary/30"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-primary">♠ Blackjack</h1>
          <p className="text-muted-foreground">Choisissez votre mode de jeu</p>
          {user && (
            <p className="text-sm text-muted-foreground mt-2">
              Connecté en tant que {user.email}
            </p>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => handleModeSelection('multiplayer')}
              className="w-full h-auto py-8 flex flex-col items-center gap-3 bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Users className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold text-lg">Mode Multijoueur</div>
                <div className="text-sm opacity-90 mt-1">
                  Jouez avec d'autres joueurs en temps réel
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => handleModeSelection('solo')}
              variant="outline"
              className="w-full h-auto py-8 flex flex-col items-center gap-3 border-2 border-primary/50 hover:bg-primary/10"
              size="lg"
            >
              <User className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold text-lg">Mode Solo</div>
                <div className="text-sm opacity-90 mt-1">
                  Entraînez-vous seul, hors ligne
                </div>
              </div>
            </Button>
          </motion.div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Se déconnecter
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
