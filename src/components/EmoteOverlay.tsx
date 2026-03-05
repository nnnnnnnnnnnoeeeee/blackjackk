// ============================================================================
// EmoteOverlay - Floating emoji animations on the table
// ============================================================================

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveEmote {
  id: string;
  emote: string;
  x: number; // percent 10-90
}

interface EmoteOverlayProps {
  emotes: ActiveEmote[];
}

export function EmoteOverlay({ emotes }: EmoteOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {emotes.map(({ id, emote, x }) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: '80vh', scale: 0.5 }}
            animate={{ opacity: 0, y: '10vh', scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: [0.22, 0.68, 0, 1.2] }}
            style={{ left: `${x}%`, position: 'absolute', bottom: 0 }}
            className="text-4xl select-none"
          >
            {emote}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage emote state
export function useEmoteOverlay() {
  const emotesRef = useRef<ActiveEmote[]>([]);
  const setEmotesRef = useRef<React.Dispatch<React.SetStateAction<ActiveEmote[]>> | null>(null);

  const spawnEmote = (emote: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = 10 + Math.random() * 80;
    const newEmote: ActiveEmote = { id, emote, x };

    if (setEmotesRef.current) {
      setEmotesRef.current((prev) => [...prev, newEmote]);
      // Auto-remove after animation
      setTimeout(() => {
        setEmotesRef.current?.((prev) => prev.filter((e) => e.id !== id));
      }, 2500);
    }
  };

  return { spawnEmote, setEmotesRef };
}

export default EmoteOverlay;
