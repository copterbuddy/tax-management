// ─── i18next Setup ─────────────────────────────────────────────────────────
// Proper multi-language support with namespace-split JSON resources.
// OCP: Add a new language → add locale JSON files + update SupportedLang type.
//      Add a new namespace → create JSON files + update namespaces array.

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '../constants';

// Namespace JSON imports
import thCommon from './locales/th/common.json';
import thTrade from './locales/th/trade.json';
import thRemittance from './locales/th/remittance.json';
import thDividend from './locales/th/dividend.json';
import enCommon from './locales/en/common.json';
import enTrade from './locales/en/trade.json';
import enRemittance from './locales/en/remittance.json';
import enDividend from './locales/en/dividend.json';

// ─── Types ─────────────────────────────────────────────────────────────────

export type SupportedLang = 'th' | 'en';
export const FALLBACK_LANG: SupportedLang = 'th';

// ─── Resources ─────────────────────────────────────────────────────────────

const resources = {
  th: { common: thCommon, trade: thTrade, remittance: thRemittance, dividend: thDividend },
  en: { common: enCommon, trade: enTrade, remittance: enRemittance, dividend: enDividend },
} as const;

// ─── Language Detection ────────────────────────────────────────────────────

function detectLanguage(): SupportedLang {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'th' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable
  }
  return FALLBACK_LANG;
}

// ─── Init ──────────────────────────────────────────────────────────────────

i18next.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: FALLBACK_LANG,
  ns: ['common', 'trade', 'remittance', 'dividend'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  returnNull: false,    // Return key name instead of null on missing key
});

// ─── Language Persistence ──────────────────────────────────────────────────

export function persistLanguage(lang: SupportedLang): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // Silently fail — app still works
  }
}

export default i18next;
