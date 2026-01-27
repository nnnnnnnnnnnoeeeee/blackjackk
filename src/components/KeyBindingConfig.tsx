// ============================================================================
// Component - Key Binding Configuration
// ============================================================================

import { memo, useState, useCallback, useEffect } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useTranslation } from '@/ui/blackjack/i18n';
import type { KeyBindings } from '@/lib/blackjack/types';
import { Keyboard } from 'lucide-react';
import { toast } from 'sonner';

interface KeyBindingConfigProps {
  keyBindings: KeyBindings;
  onUpdate: (keyBindings: KeyBindings) => void;
}

export const KeyBindingConfig = memo(function KeyBindingConfig({
  keyBindings,
  onUpdate,
}: KeyBindingConfigProps) {
  const { t } = useTranslation();
  const [editingKey, setEditingKey] = useState<keyof KeyBindings | null>(null);
  
  // Default bindings to ensure all keys are present
  const defaultBindings: KeyBindings = {
    hit: 'H',
    stand: 'S',
    double: 'D',
    split: 'P',
    insurance: 'I',
    surrender: 'R',
    enter: 'Enter',
    space: ' ',
    clear: 'C',
    rebet: 'R',
    allIn: 'A',
    deal: 'Enter',
  };
  
  // Merge with defaults to ensure all keys are present
  const initialBindings: KeyBindings = {
    ...defaultBindings,
    ...keyBindings,
  };
  
  const [tempBindings, setTempBindings] = useState<KeyBindings>(initialBindings);

  useEffect(() => {
    // Merge with defaults when keyBindings change
    const mergedBindings: KeyBindings = {
      hit: 'H',
      stand: 'S',
      double: 'D',
      split: 'P',
      insurance: 'I',
      surrender: 'R',
      enter: 'Enter',
      space: ' ',
      clear: 'C',
      rebet: 'R',
      allIn: 'A',
      deal: 'Enter',
      ...keyBindings,
    };
    setTempBindings(mergedBindings);
  }, [keyBindings]);

  const actionLabels: Record<keyof KeyBindings, string> = {
    hit: t.settings.hitKey,
    stand: t.settings.standKey,
    double: t.settings.doubleKey,
    split: t.settings.splitKey,
    insurance: t.settings.insuranceKey,
    surrender: t.settings.surrenderKey,
    enter: 'Enter',
    space: 'Space',
    clear: t.settings.clearKey,
    rebet: t.settings.rebetKey,
    allIn: t.settings.allInKey,
    deal: t.settings.dealKey,
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, action: keyof KeyBindings) => {
      e.preventDefault();
      e.stopPropagation();

      // Don't allow modifier keys alone
      if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
        return;
      }

      // Get the key name
      let keyName = e.key;
      
      // Handle special keys
      if (keyName === ' ') {
        keyName = 'Space';
      } else if (keyName === 'Enter') {
        keyName = 'Enter';
      } else if (keyName.length === 1) {
        keyName = keyName.toUpperCase();
      }

      // Check if key is already used
      const isUsed = Object.values(tempBindings).some(
        (value, index) => value === keyName && Object.keys(tempBindings)[index] !== action
      );

      if (isUsed) {
        // Find which action uses this key
        const usedBy = Object.entries(tempBindings).find(
          ([key, value]) => value === keyName && key !== action
        )?.[0];
        const usedByLabel = usedBy ? actionLabels[usedBy as keyof KeyBindings] : '';
        const currentActionLabel = actionLabels[action];
        
        // Format key name for display
        const displayKey = keyName === 'Space' ? 'Space' : keyName === 'Enter' ? 'Enter' : keyName.toUpperCase();
        
        // Show error toast
        toast.error('Touche déjà utilisée', {
          description: `La touche "${displayKey}" est déjà assignée à "${usedByLabel}". Veuillez choisir une autre touche pour "${currentActionLabel}".`,
          duration: 4000,
        });
        
        // Reset editing state
        setEditingKey(null);
        return;
      }

      const newBindings = { ...tempBindings, [action]: keyName };
      setTempBindings(newBindings);
      onUpdate(newBindings);
      setEditingKey(null);
    },
    [tempBindings, onUpdate, t, actionLabels]
  );

  useEffect(() => {
    if (editingKey) {
      const handleKeyDownEvent = (e: KeyboardEvent) => handleKeyDown(e, editingKey);
      window.addEventListener('keydown', handleKeyDownEvent);
      return () => window.removeEventListener('keydown', handleKeyDownEvent);
    }
  }, [editingKey, handleKeyDown]);

  const handleReset = useCallback(() => {
    const defaultBindings: KeyBindings = {
      hit: 'H',
      stand: 'S',
      double: 'D',
      split: 'P',
      insurance: 'I',
      surrender: 'R',
      enter: 'Enter',
      space: ' ',
      clear: 'C',
      rebet: 'R',
      allIn: 'A',
      deal: 'Enter',
    };
    setTempBindings(defaultBindings);
    onUpdate(defaultBindings);
  }, [onUpdate]);

  const formatKey = useCallback((key: string): string => {
    if (key === ' ') return 'Space';
    if (key === 'Enter') return 'Enter';
    return key.toUpperCase();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Label className="text-base font-semibold">{t.settings.keyBindings}</Label>
          <p className="text-xs text-muted-foreground mt-1">{t.settings.keyBindingsDesc}</p>
        </div>
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {t.settings.resetToDefault}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Game Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Actions de Jeu</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(tempBindings) as Array<keyof KeyBindings>)
              .filter(key => ['hit', 'stand', 'double', 'split', 'insurance', 'surrender'].includes(key))
              .map((action) => (
                <div key={action} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                  <Label htmlFor={`key-${action}`} className="text-sm font-medium">
                    {actionLabels[action]}
                  </Label>
                  <Button
                    id={`key-${action}`}
                    onClick={() => setEditingKey(editingKey === action ? null : action)}
                    variant={editingKey === action ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[80px] font-mono"
                  >
                    {editingKey === action ? (
                      <span className="text-xs">{t.settings.pressKey}...</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Keyboard className="h-3 w-3" />
                        {formatKey(tempBindings[action])}
                      </span>
                    )}
                  </Button>
                </div>
              ))}
          </div>
        </div>

        {/* Betting Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Actions de Mise</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(tempBindings) as Array<keyof KeyBindings>)
              .filter(key => ['clear', 'rebet', 'allIn', 'deal'].includes(key))
              .map((action) => (
                <div key={action} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                  <Label htmlFor={`key-${action}`} className="text-sm font-medium">
                    {actionLabels[action]}
                  </Label>
                  <Button
                    id={`key-${action}`}
                    onClick={() => setEditingKey(editingKey === action ? null : action)}
                    variant={editingKey === action ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[80px] font-mono"
                  >
                    {editingKey === action ? (
                      <span className="text-xs">{t.settings.pressKey}...</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Keyboard className="h-3 w-3" />
                        {formatKey(tempBindings[action])}
                      </span>
                    )}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Special keys - Enter and Space can be used for Stand or Deal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
          <Label className="text-sm font-medium">Enter</Label>
          <span className="text-xs text-muted-foreground">
            {t.settings.standKey} / {t.settings.dealKey}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
          <Label className="text-sm font-medium">Space</Label>
          <span className="text-xs text-muted-foreground">
            {t.settings.standKey}
          </span>
        </div>
      </div>
    </div>
  );
});
