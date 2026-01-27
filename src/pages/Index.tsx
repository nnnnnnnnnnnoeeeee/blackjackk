import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndRedirect();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      
      if (event === 'SIGNED_IN' && user) {
        // Vérifier si on vient d'un callback OAuth
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        if (hashParams.get('access_token') || searchParams.get('code')) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            navigate('/mode-selection', { replace: true });
          }, 100);
        } else {
          navigate('/mode-selection', { replace: true });
        }
      } else if (event === 'SIGNED_OUT' && !user) {
        navigate('/login', { replace: true });
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserAndRedirect = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Utilisateur connecté → rediriger vers la sélection de mode
      navigate('/mode-selection', { replace: true });
    } else {
      // Utilisateur non connecté → rediriger vers login
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-table-felt">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default Index;
