// ============================================================================
// Settings Panel - Game Rules Configuration
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, selectConfig } from '@/store/useGameStore';
import { useTranslation } from '@/ui/blackjack/i18n';
import { KeyBindingConfig } from './KeyBindingConfig';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
  const { t, language, setLanguage } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border"
    >
      <h2 className="text-xl font-bold mb-4 text-center">{t.settings.title}</h2>
      
      {/* Language Selector - Always visible at the top */}
      <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <Label htmlFor="language-select" className="text-base font-semibold block mb-1">
              {t.settings.language}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Changer la langue de l\'interface' : 'Change the interface language'}
            </p>
          </div>
          <div className="flex-shrink-0 relative z-[100]">
            <Select value={language} onValueChange={(value) => setLanguage(value as 'fr' | 'en')}>
              <SelectTrigger id="language-select" className="w-full sm:w-[200px] min-h-[44px] text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                position="popper"
                sideOffset={4}
              >
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="w-full">

        {/* Dealer Rules */}
        {/* Dealer Rules */}
        <AccordionItem value="dealer-rules">
          <AccordionTrigger>{t.settings.dealerRules}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="h17-toggle">{t.settings.dealerHitsSoft17}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.dealerHitsSoft17Desc}
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
          <AccordionTrigger>{t.settings.playerRules}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="das-toggle">{t.settings.doubleAfterSplit}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.doubleAfterSplitDesc}
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
                <Label htmlFor="resplit-aces-toggle">{t.settings.resplitAces}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.resplitAcesDesc}
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
              <Label htmlFor="max-splits">{t.settings.maxSplits}: {config.maxSplits}</Label>
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
          <AccordionTrigger>{t.settings.sideBets}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="perfect-pairs-toggle">{t.settings.perfectPairs}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.perfectPairsDesc}
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
                <Label htmlFor="21plus3-toggle">{t.settings.twentyOnePlus3}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.twentyOnePlus3Desc}
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
          <AccordionTrigger>{t.settings.soundSettings}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-toggle">{t.settings.enableSounds}</Label>
                <p className="text-xs text-muted-foreground">
                  {t.settings.enableSoundsDesc}
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
                  {t.settings.volume}: {Math.round((config.soundVolume ?? 0.5) * 100)}%
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

        {/* Keyboard Shortcuts */}
        <AccordionItem value="key-bindings">
          <AccordionTrigger>{t.settings.keyBindings}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <KeyBindingConfig
              keyBindings={config.keyBindings || {
                hit: 'H',
                stand: 'S',
                double: 'D',
                split: 'P',
                insurance: 'I',
                surrender: 'R',
                enter: 'Enter',
                space: ' ',
              }}
              onUpdate={(keyBindings) => {
                updateConfig({ keyBindings });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
});
