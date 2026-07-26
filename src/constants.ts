// ─── Centralized Constants ─────────────────────────────────────────────────
// Single source of truth for all magic strings and config values.
// OCP: Add new storage keys, providers, or config here — zero code changes elsewhere.

import type { ProviderType } from './types/trade';

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

// ─── Tax Constants (Thai) ──────────────────────────────────────────────────

export const THAI_TAX = {
  /** Personal allowance — every taxpayer gets this */
  PERSONAL_ALLOWANCE: 60_000,
  /** Standard expense deduction for employment/investment income */
  EXPENSE_DEDUCTION: 100_000,
  /** Default total deduction */
  DEFAULT_DEDUCTION: 160_000,
} as const;
