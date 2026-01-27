// ============================================================================
// Internationalization - Translation Hook
// ============================================================================

import { createContext, useContext, useMemo } from 'react';
import { translations, type Language, type Translations } from './translations';
import { useGameStore } from '@/store/useGameStore';

interface TranslationContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const language = useGameStore((s) => s.language || 'en');
  const setLanguage = useGameStore((s) => s.setLanguage);

  const t = useMemo(() => translations[language], [language]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    // Fallback to English if context is not available
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: translations.en,
    };
  }
  return context;
}
