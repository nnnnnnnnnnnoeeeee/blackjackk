// ============================================================================
// Poker Lobby — list / create / join No-Limit Hold'em tables
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/ui/blackjack/i18n';
import { ArrowLeft, Plus, Users, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PokerTableRow {
  id: string;
  name: string;
  room_code?: string;
  is_public?: boolean;
  max_players: number;
  table_players: Array<{ user_id: string }>;
}

export default function PokerLobby() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tables, setTables] = useState<PokerTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const loadTables = useCallback(async () => {
    const { data } = await supabase
      .from('tables')
      .select('*, table_players(user_id)')
      .eq('game_type', 'poker')
      .eq('is_public', true)
      .neq('status', 'finished')
      .order('created_at', { ascending: false });
    setTables((data as PokerTableRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTables();
    const channel = supabase
      .channel('poker_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => loadTables())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTables]);

  const createTable = useCallback(async (isPublic: boolean) => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('poker_create_table', {
      body: { name: name.trim(), isPublic, max_players: 8 },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const tableId = (data as { table?: { id: string } })?.table?.id;
    if (tableId) navigate(`/poker/table/${tableId}`);
  }, [name, navigate]);

  const joinTable = useCallback(async (tableId: string) => {
    setBusy(true);
    const { error } = await supabase.functions.invoke('join_table', { body: { table_id: tableId } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate(`/poker/table/${tableId}`);
  }, [navigate]);

  const joinByCode = useCallback(async () => {
    if (!code.trim()) return;
    const { data } = await supabase.from('tables').select('id').eq('game_type', 'poker')
      .eq('room_code', code.trim().toUpperCase()).maybeSingle();
    if (!data) { toast.error('Table introuvable'); return; }
    joinTable(data.id);
  }, [code, joinTable]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3622] via-[#062114] to-[#030e09] text-white font-outfit p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => navigate('/mode-selection')} variant="outline" size="sm" className="bg-black/40 border-white/15">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t.common.back}
          </Button>
          <div className="text-right">
            <div className="text-xl font-black text-[#d4af37]">{t.poker.title}</div>
            <div className="text-[11px] text-white/50">{t.poker.subtitle}</div>
          </div>
        </div>

        {/* Create */}
        <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la table"
            className="bg-black/40 border-white/15" />
          <div className="flex gap-2">
            <Button onClick={() => createTable(true)} disabled={busy} className="flex-1">
              <Plus className="h-4 w-4 mr-2" /> Publique
            </Button>
            <Button onClick={() => createTable(false)} disabled={busy} variant="outline" className="flex-1 border-white/15">
              <Plus className="h-4 w-4 mr-2" /> Privée
            </Button>
          </div>
        </div>

        {/* Join by code */}
        <div className="rounded-2xl bg-black/40 border border-white/10 p-4 mb-4 flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code de salon"
            className="bg-black/40 border-white/15 uppercase" />
          <Button onClick={joinByCode} disabled={busy}><Hash className="h-4 w-4 mr-2" /> Rejoindre</Button>
        </div>

        {/* Public tables */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" /></div>
        ) : (
          <div className="space-y-2">
            {tables.length === 0 && <div className="text-center text-white/40 py-6">{t.poker.waitingForPlayers}</div>}
            {tables.map((tbl) => (
              <button key={tbl.id} onClick={() => joinTable(tbl.id)} disabled={busy}
                className="w-full flex items-center justify-between rounded-xl bg-black/30 border border-white/10 hover:bg-black/50 p-3 transition-colors">
                <span className="font-bold">{tbl.name}</span>
                <span className="flex items-center gap-1 text-white/60 text-sm">
                  <Users className="h-4 w-4" /> {tbl.table_players?.length ?? 0}/{tbl.max_players}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
