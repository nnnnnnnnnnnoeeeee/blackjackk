// ============================================================================
// Component - Coach Feedback (Real-time strategy error display)
// ============================================================================

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerAction } from '@/lib/blackjack/types';

export interface CoachFeedbackData {
  handSummary: string;      // e.g. "16 vs 6"
  playerAction: PlayerAction;
  optimalAction: PlayerAction;
  explanation: string;
  isCorrect: boolean;
}

interface CoachFeedbackProps {
  feedback: CoachFeedbackData | null;
}

const ACTION_LABELS: Partial<Record<PlayerAction, string>> = {
  hit: 'Hit',
  stand: 'Stand',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
};

export const CoachFeedback = memo(function CoachFeedback({ feedback }: CoachFeedbackProps) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={`${feedback.handSummary}-${feedback.playerAction}-${feedback.isCorrect}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed bottom-44 left-1/2 -translate-x-1/2 z-[160] w-[min(340px,calc(100vw-2rem))] pointer-events-none"
          role="alert"
          aria-live="polite"
        >
          {feedback.isCorrect ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 border-success/60 bg-success/15 backdrop-blur-md shadow-lg">
              <span className="text-xl flex-shrink-0">✓</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-success leading-tight">Correct !</p>
                <p className="text-xs text-muted-foreground truncate">{feedback.handSummary}</p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-xl border-2 border-destructive/60 bg-destructive/15 backdrop-blur-md shadow-lg">
              <div className="flex items-start gap-2.5 mb-1.5">
                <span className="text-xl flex-shrink-0 mt-0.5">✗</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-destructive leading-tight">
                    Erreur — {feedback.handSummary}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Tu as joué{' '}
                <span className="font-semibold text-foreground">
                  {ACTION_LABELS[feedback.playerAction] ?? feedback.playerAction}
                </span>
                {' '}→ Optimal :{' '}
                <span className="font-semibold text-warning">
                  {ACTION_LABELS[feedback.optimalAction] ?? feedback.optimalAction}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 italic leading-snug">
                {feedback.explanation}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default CoachFeedback;
