// ============================================================================
// Forgot Password Page
// ============================================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current URL for the redirect
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-table-felt p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Email envoyé</CardTitle>
              <CardDescription className="text-center">
                Vérifiez votre boîte de réception
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Mail className="h-16 w-16 text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Nous avons envoyé un email à <strong>{email}</strong> avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Si vous ne recevez pas l'email dans quelques minutes, vérifiez votre dossier spam.
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
                variant="outline"
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-table-felt p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Mot de passe oublié</CardTitle>
            <CardDescription className="text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link to="/login" className="text-primary hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
            <div className="mt-2 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:underline">
                ← Retour au jeu solo
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
