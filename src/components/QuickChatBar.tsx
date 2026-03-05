// ============================================================================
// QuickChatBar - Emoji reactions and preset phrase quick-send
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const EMOJI_REACTIONS = ['👍', '😂', '🔥', '😱', '💀', '🎉'];

const PRESET_PHRASES = [
  'Bien joué ! 🃏',
  'Pas de chance...',
  'Ce croupier est imbattable !',
  'All-in au prochain round !',
  'GG à tous !',
  'Doublé ! 💰',
];

interface QuickChatBarProps {
  tableId: string;
  userId: string;
  onEmote: (emote: string, userId: string) => void;
}

export function QuickChatBar({ tableId, userId, onEmote }: QuickChatBarProps) {
  const [open, setOpen] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const startCooldown = () => {
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500);
  };

  const sendPhrase = async (text: string) => {
    if (cooldown) return;
    startCooldown();
    setOpen(false);

    await supabase.from('table_messages').insert({
      table_id: tableId,
      user_id: userId,
      message: text,
    });
  };

  const sendEmote = async (emote: string) => {
    if (cooldown) return;
    startCooldown();
    setOpen(false);

    // Show locally immediately
    onEmote(emote, userId);

    // Broadcast to all players via Supabase Realtime
    const channel = supabase.channel(`table_${tableId}`);
    await channel.send({
      type: 'broadcast',
      event: 'emote',
      payload: { emote, userId },
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-gold transition-colors',
          open ? 'bg-gold/20' : 'hover:bg-gold/10'
        )}
        title="Réactions rapides"
        aria-label="Ouvrir les réactions rapides"
      >
        <Smile className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 bg-black/95 border border-gold/30 rounded-xl p-3 shadow-2xl z-50 w-60"
          >
            {/* Emoji row */}
            <div className="flex justify-around mb-3 pb-3 border-b border-gold/20">
              {EMOJI_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendEmote(emoji)}
                  className="text-xl hover:scale-130 transition-transform leading-none p-1 rounded hover:bg-gold/10"
                  disabled={cooldown}
                  style={{ transform: cooldown ? undefined : undefined }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Preset phrases */}
            <div className="space-y-1">
              {PRESET_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => sendPhrase(phrase)}
                  disabled={cooldown}
                  className="w-full text-left text-xs text-gold/80 hover:text-gold hover:bg-gold/10 px-2 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuickChatBar;
