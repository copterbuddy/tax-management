import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Lang, TranslationDict } from './translations';
import translations from './translations';

// ─── Types ─────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationDict;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'lang';

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'th' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable (SSR, privacy mode)
  }
  return 'th'; // Default: Thai
}

function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Silently fail — app still works, just no persistence
  }
}

// ─── Context ───────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persistLang(next);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    setLang,
    t: translations[lang],
  }), [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within <LanguageProvider>');
  }
  return ctx;
}
