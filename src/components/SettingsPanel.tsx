// ============================================================================
// Settings Panel - Game Rules Configuration
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectConfig } from '@/store/useGameStore';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

export const SettingsPanel = memo(function SettingsPanel() {
  const config = useGameStore(selectConfig);
  const updateConfig = useGameStore(s => s.updateConfig);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
    >
      <h2 className="text-xl font-bold mb-4 text-center">Game Settings</h2>
      
      <Accordion type="single" collapsible className="w-full">
        {/* Dealer Rules */}
        <AccordionItem value="dealer-rules">
          <AccordionTrigger>Dealer Rules</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="h17-toggle">Dealer Hits Soft 17 (H17)</Label>
                <p className="text-xs text-muted-foreground">
                  When OFF: Dealer stands on all 17s (S17)
                </p>
              </div>
              <Switch
                id="h17-toggle"
                checked={config.dealerHitsSoft17}
                onCheckedChange={(checked) => {
                  updateConfig({ dealerHitsSoft17: checked });
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Player Rules */}
        <AccordionItem value="player-rules">
          <AccordionTrigger>Player Rules</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="das-toggle">Double After Split (DAS)</Label>
                <p className="text-xs text-muted-foreground">
                  Allow doubling on hands created by splitting
                </p>
              </div>
              <Switch
                id="das-toggle"
                checked={config.allowDoubleAfterSplit}
                onCheckedChange={(checked) => {
                  updateConfig({ allowDoubleAfterSplit: checked });
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="resplit-aces-toggle">Resplit Aces</Label>
                <p className="text-xs text-muted-foreground">
                  Allow resplitting aces (up to max splits)
                </p>
              </div>
              <Switch
                id="resplit-aces-toggle"
                checked={config.resplitAces}
                onCheckedChange={(checked) => {
                  updateConfig({ resplitAces: checked });
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-splits">Max Splits: {config.maxSplits}</Label>
              <Slider
                id="max-splits"
                min={1}
                max={4}
                step={1}
                value={[config.maxSplits]}
                onValueChange={([value]) => {
                  updateConfig({ maxSplits: value });
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Side Bets */}
        <AccordionItem value="side-bets">
          <AccordionTrigger>Side Bets</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="perfect-pairs-toggle">Perfect Pairs</Label>
                <p className="text-xs text-muted-foreground">
                  Bet on matching pairs in your initial hand
                </p>
              </div>
              <Switch
                id="perfect-pairs-toggle"
                checked={config.perfectPairs.enabled}
                onCheckedChange={(checked) => {
                  updateConfig({
                    perfectPairs: { ...config.perfectPairs, enabled: checked },
                  });
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="21plus3-toggle">21+3</Label>
                <p className="text-xs text-muted-foreground">
                  Bet on poker hand with your 2 cards + dealer upcard
                </p>
              </div>
              <Switch
                id="21plus3-toggle"
                checked={config.twentyOnePlus3?.enabled ?? false}
                onCheckedChange={(checked) => {
                  updateConfig({
                    twentyOnePlus3: { 
                      ...(config.twentyOnePlus3 || { enabled: false, minBet: 5, maxBet: 500, payouts: { flush: 5, straight: 10, threeOfAKind: 30, straightFlush: 40, suitedTrips: 100 } }), 
                      enabled: checked 
                    },
                  });
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sound Settings */}
        <AccordionItem value="sound-settings">
          <AccordionTrigger>Sound Settings</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-toggle">Enable Sounds</Label>
                <p className="text-xs text-muted-foreground">
                  Play sound effects during gameplay
                </p>
              </div>
              <Switch
                id="sound-toggle"
                checked={config.soundEnabled ?? false}
                onCheckedChange={(checked) => {
                  updateConfig({ soundEnabled: checked });
                }}
              />
            </div>
            
            {config.soundEnabled && (
              <div className="space-y-2">
                <Label htmlFor="sound-volume">
                  Volume: {Math.round((config.soundVolume ?? 0.5) * 100)}%
                </Label>
                <Slider
                  id="sound-volume"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.soundVolume ?? 0.5]}
                  onValueChange={([value]) => {
                    updateConfig({ soundVolume: value });
                  }}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
});
