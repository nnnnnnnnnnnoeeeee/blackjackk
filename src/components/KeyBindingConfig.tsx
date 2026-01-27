// ============================================================================
// Component - Key Binding Configuration
// ============================================================================

import { memo, useState, useCallback, useEffect } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTranslation } from '@/ui/blackjack/i18n';
import type { KeyBindings } from '@/lib/blackjack/types';
import { Keyboard, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface KeyBindingConfigProps {
  keyBindings: KeyBindings;
  onUpdate: (keyBindings: KeyBindings) => void;
}

export const KeyBindingConfig = memo(function KeyBindingConfig({
  keyBindings,
  onUpdate,
}: KeyBindingConfigProps) {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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
    setHasChanges(false);
    setValidationErrors({});
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

  // Normalize key input (handle Space, Enter, and single letters)
  const normalizeKey = useCallback((value: string): string => {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'space' || trimmed === ' ') {
      return 'Space';
    }
    if (trimmed.toLowerCase() === 'enter' || trimmed === 'Enter') {
      return 'Enter';
    }
    // Take only the first character and uppercase it
    if (trimmed.length > 0) {
      return trimmed[0].toUpperCase();
    }
    return trimmed;
  }, []);

  // Handle input change
  const handleInputChange = useCallback((action: keyof KeyBindings, value: string) => {
    const normalized = normalizeKey(value);
    setTempBindings(prev => ({
      ...prev,
      [action]: normalized,
    }));
    setHasChanges(true);
    // Clear validation error for this field when user types
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[action];
      return newErrors;
    });
  }, [normalizeKey]);

  // Validate all bindings - normalize first, then check
  const validateBindings = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // First, normalize all bindings
    const normalizedBindings: Record<string, string> = {};
    Object.entries(tempBindings).forEach(([action, key]) => {
      normalizedBindings[action] = normalizeKey(key);
    });
    
    // Check for duplicate keys
    const keyCounts: Record<string, string[]> = {};
    Object.entries(normalizedBindings).forEach(([action, key]) => {
      if (!keyCounts[key]) {
        keyCounts[key] = [];
      }
      keyCounts[key].push(action);
    });

    // Find duplicates
    Object.entries(keyCounts).forEach(([key, actions]) => {
      if (actions.length > 1 && key !== '') {
        actions.forEach(action => {
          const otherActions = actions.filter(a => a !== action);
          const otherLabels = otherActions.map(a => actionLabels[a as keyof KeyBindings]).join(', ');
          errors[action] = `Cette touche est déjà utilisée pour: ${otherLabels}`;
        });
      }
    });

    // Check for empty values
    Object.entries(normalizedBindings).forEach(([action, key]) => {
      if (!key || key.trim() === '') {
        errors[action] = 'Veuillez entrer une touche';
      }
    });

    setValidationErrors(errors);
    
    // Update tempBindings with normalized values if no errors
    if (Object.keys(errors).length === 0) {
      setTempBindings(normalizedBindings as KeyBindings);
    }
    
    return Object.keys(errors).length === 0;
  }, [tempBindings, actionLabels, normalizeKey]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validateBindings()) {
      toast.error('Erreur de validation', {
        description: 'Veuillez corriger les erreurs avant de sauvegarder.',
        duration: 4000,
      });
      return;
    }
    
    onUpdate(tempBindings);
    setHasChanges(false);
    setValidationErrors({});
    toast.success('Raccourcis sauvegardés', {
      description: 'Vos raccourcis clavier ont été mis à jour.',
      duration: 2000,
    });
  }, [tempBindings, validateBindings, onUpdate]);

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
    setHasChanges(true);
    setValidationErrors({});
  }, []);

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
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {t.settings.resetToDefault}
          </Button>
          {hasChanges && (
            <Button
              onClick={handleSave}
              size="sm"
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Game Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Actions de Jeu</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(tempBindings) as Array<keyof KeyBindings>)
              .filter(key => ['hit', 'stand', 'double', 'split', 'insurance', 'surrender'].includes(key))
              .map((action) => (
                <div key={action} className="space-y-1">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <Label htmlFor={`key-${action}`} className="text-sm font-medium">
                      {actionLabels[action]}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`key-${action}`}
                        type="text"
                        value={tempBindings[action] || ''}
                        onChange={(e) => handleInputChange(action, e.target.value)}
                        onBlur={() => {
                          // Normalize on blur
                          const normalized = normalizeKey(tempBindings[action]);
                          if (normalized !== tempBindings[action]) {
                            setTempBindings(prev => ({ ...prev, [action]: normalized }));
                          }
                        }}
                        className={cn(
                          "w-20 text-center font-mono text-sm",
                          validationErrors[action] && "border-destructive"
                        )}
                        placeholder="H"
                        maxLength={10}
                      />
                      {validationErrors[action] && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {validationErrors[action] && (
                    <p className="text-xs text-destructive px-3">{validationErrors[action]}</p>
                  )}
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
                <div key={action} className="space-y-1">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <Label htmlFor={`key-${action}`} className="text-sm font-medium">
                      {actionLabels[action]}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`key-${action}`}
                        type="text"
                        value={formatKey(tempBindings[action])}
                        onChange={(e) => handleInputChange(action, e.target.value)}
                        onBlur={() => {
                          // Normalize on blur
                          const normalized = normalizeKey(tempBindings[action]);
                          if (normalized !== tempBindings[action]) {
                            setTempBindings(prev => ({ ...prev, [action]: normalized }));
                          }
                        }}
                        className={cn(
                          "w-20 text-center font-mono text-sm",
                          validationErrors[action] && "border-destructive"
                        )}
                        placeholder="C"
                        maxLength={10}
                      />
                      {validationErrors[action] && (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {validationErrors[action] && (
                    <p className="text-xs text-destructive px-3">{validationErrors[action]}</p>
                  )}
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
