// ─── Centralized Constants ─────────────────────────────────────────────────
// Single source of truth for all magic strings and config values.
// OCP: Add new storage keys, providers, or config here — zero code changes elsewhere.

import type { ProviderType, CountryCode, CountryWhtInfo } from './types/trade';

// ─── Storage Keys ──────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  TRADES: 'tax_tracker_trades',
  GAINS: 'tax_tracker_gains',
  LANGUAGE: 'lang',
  THEME: 'tax_tracker_theme',
} as const;

// ─── Provider Options ──────────────────────────────────────────────────────
// OCP: Add a new ProviderType to the union in types/trade.ts,
//      then add it here — TradeForm auto-picks it up.

export const PROVIDER_OPTIONS: ProviderType[] = [
  'Dime',
  'Liberator',
  'FinansiaSyrus',
];

// ─── Date Limits ───────────────────────────────────────────────────────────

export const DATE_LIMITS = {
  /** New trades limited to this many years in the past */
  MAX_PAST_YEARS: 5,
} as const;

// ─── Validation Limits ─────────────────────────────────────────────────────

export const VALIDATION = {
  SYMBOL_MAX_LENGTH: 10,
  QUANTITY_MAX: 1_000_000,
  PRICE_MIN: 0.0001,
  PRICE_MAX: 1_000_000,
  FX_RATE_MIN: 20,
  FX_RATE_MAX: 50,
  EARLIEST_YEAR: 2000,
} as const;

// ─── Storage Keys (Dividend) ───────────────────────────────────────────────

export const STORAGE_KEYS_DIVIDEND = {
  DIVIDENDS: 'tax_tracker_dividends',
} as const;

// ─── Country WHT Info ───────────────────────────────────────────────────────

export const COUNTRY_WHT_INFO: Record<CountryCode, CountryWhtInfo> = {
  US: {
    code: 'US',
    nameTH: 'สหรัฐอเมริกา',
    nameEN: 'United States',
    defaultWhtRate: 15,
    hasDTATreaty: true,
    noteTH: 'US-Thai Tax Treaty Art.10: 15% สำหรับบุคคลธรรมดาที่มี W-8BEN (ไม่มี W-8BEN = 30%)',
    noteEN: 'US-Thai Tax Treaty Art.10: 15% for individuals with W-8BEN (30% without)',
  },
  UK: {
    code: 'UK',
    nameTH: 'สหราชอาณาจักร',
    nameEN: 'United Kingdom',
    defaultWhtRate: 0,
    hasDTATreaty: true,
    noteTH: 'UK ไม่หัก WHT เงินปันผล — เสียภาษีตาม Thai PIT เท่านั้น',
    noteEN: 'UK does not withhold tax on dividends — taxed under Thai PIT only',
  },
  SG: {
    code: 'SG',
    nameTH: 'สิงคโปร์',
    nameEN: 'Singapore',
    defaultWhtRate: 0,
    hasDTATreaty: true,
    noteTH: 'สิงคโปร์ไม่มี WHT เงินปันผล — เสียภาษีตาม Thai PIT เท่านั้น',
    noteEN: 'Singapore has no dividend WHT — taxed under Thai PIT only',
  },
  OTHER: {
    code: 'OTHER',
    nameTH: 'อื่น ๆ',
    nameEN: 'Other',
    defaultWhtRate: 0,
    hasDTATreaty: false,
    noteTH: 'กรุณาตรวจสอบอัตรา WHT กับประเทศต้นทาง — อาจไม่มี DTA กับไทย',
    noteEN: 'Please verify WHT rate — may not have DTA with Thailand',
  },
};

// ─── Tax Constants (Thai) ──────────────────────────────────────────────────

export const THAI_TAX = {
  /** Personal allowance — every taxpayer gets this */
  PERSONAL_ALLOWANCE: 60_000,
  /** Standard expense deduction for employment/investment income */
  EXPENSE_DEDUCTION: 100_000,
  /** Default total deduction */
  DEFAULT_DEDUCTION: 160_000,
} as const;
