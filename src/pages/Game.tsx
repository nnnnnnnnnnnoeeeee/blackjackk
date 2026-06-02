// ============================================================================
// Solo Game Page
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isPlaceholder } from '@/lib/supabaseClient';
import { NewTable } from '@/components/NewTable';
import { Loader2 } from 'lucide-react';

export default function Game() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, [navigate]);

  const checkUser = async () => {
    if (isPlaceholder) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }
      setLoading(false);
    } catch (e) {
      console.warn("Auth failed, proceeding as guest in solo mode");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <NewTable />;
}
