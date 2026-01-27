// ============================================================================
// UX Preview Page - Test new UI components
// ============================================================================

import { useState } from 'react';
import { NewTable } from '@/components/NewTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/store/useGameStore';
import { Play, RotateCcw, Settings } from 'lucide-react';

export default function UxPreview() {
  const phase = useGameStore((s) => s.gameState.phase);
  const resetGame = useGameStore((s) => s.resetGame);
  const placeBet = useGameStore((s) => s.placeBet);
  const bankroll = useGameStore((s) => s.gameState.bankroll);

  const [testMode, setTestMode] = useState(false);

  // Test mode: Quick actions for testing
  const handleQuickTest = () => {
    if (phase === 'BETTING' && bankroll >= 10) {
      try {
        placeBet(10);
      } catch (error) {
        console.error('Quick test error:', error);
      }
    }
  };

  return (
    <>
      {/* Test Controls Overlay */}
      {testMode && (
        <div className="fixed top-4 left-4 z-[200] bg-card/95 backdrop-blur-md border-2 border-primary/30 rounded-lg p-4 shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-primary">Test Controls</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTestMode(false)}
              className="h-6 w-6"
            >
              ✕
            </Button>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">
              Phase: <Badge variant="outline">{phase}</Badge>
            </div>
            {phase === 'BETTING' && (
              <Button onClick={handleQuickTest} size="sm" className="w-full">
                <Play className="h-3 w-3 mr-1" />
                Quick Test ($10)
              </Button>
            )}
            <Button onClick={resetGame} size="sm" variant="outline" className="w-full">
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset Game
            </Button>
          </div>
        </div>
      )}

      {/* Back to Home Button */}
      <Button
        onClick={() => window.location.href = '/'}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-[200] bg-card/95 backdrop-blur-md border-2 border-primary/30"
        aria-label="Back to home"
      >
        ← Retour
      </Button>

      {/* Toggle Test Mode Button */}
      {!testMode && (
        <Button
          onClick={() => setTestMode(true)}
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-[200] bg-card/95 backdrop-blur-md border-2 border-primary/30"
          aria-label="Toggle test controls"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Use NewTable directly - same as main page */}
      <NewTable />
    </>
  );
}
