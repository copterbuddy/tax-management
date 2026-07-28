// ─── Zod Validation Schemas ────────────────────────────────────────────────
// Runtime type validation for localStorage data and form inputs.
// OCP: Add a new field to the schema — TypeScript + Zod both enforce completeness.

import { z } from 'zod';
import { VALIDATION } from '../constants';

// ─── Enums ─────────────────────────────────────────────────────────────────

export const providerTypeSchema = z.enum([
  'Dime',
  'Liberator',
  'FinansiaSyrus',
] as const);

export const tradeTypeSchema = z.enum(['BUY', 'SELL']);

// ─── Trade Transaction ─────────────────────────────────────────────────────

export const tradeTransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  symbol: z.string().min(1).max(VALIDATION.SYMBOL_MAX_LENGTH),
  type: tradeTypeSchema,
  provider: providerTypeSchema,
  quantity: z.number().positive().max(VALIDATION.QUANTITY_MAX),
  priceUSD: z.number().min(VALIDATION.PRICE_MIN).max(VALIDATION.PRICE_MAX),
  commissionUSD: z.number().min(0),
  exchangeFeeUSD: z.number().min(0).default(0),
  tafFeeUSD: z.number().min(0).default(0),
  commissionRebateUSD: z.number().min(0).default(0),
  notes: z.string().optional(),
});

/** Array of TradeTransaction — used for localStorage validation */
export const tradeArraySchema = z.array(tradeTransactionSchema);

// ─── Remittance Record ─────────────────────────────────────────────────────

export const remittanceRecordSchema = z.object({
  id: z.string().min(1),
  sellTradeId: z.string().min(1),
  amountUSD: z.number().positive(),
  remitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  fxRateTHB: z.number().min(VALIDATION.FX_RATE_MIN).max(VALIDATION.FX_RATE_MAX),
  notes: z.string().optional(),
});

/** Array of RemittanceRecord */
export const remittanceArraySchema = z.array(remittanceRecordSchema);

// ─── Realized Gain (partial — for localStorage validation) ─────────────────

export const fifoMatchDetailSchema = z.object({
  buyTradeId: z.string(),
  buyDate: z.string(),
  buyProvider: providerTypeSchema,
  matchedQuantity: z.number(),
  buyUnitCostUSD: z.number(),
  buyTotalCostUSD: z.number(),
});

export const realizedGainSchema = z.object({
  sellTradeId: z.string(),
  sellDate: z.string(),
  symbol: z.string(),
  provider: providerTypeSchema,
  sellQuantity: z.number(),
  sellRevenueUSD: z.number(),
  buyCostBasisUSD: z.number(),
  gainUSD: z.number(),
  gainPercent: z.number(),
  matchedLots: z.array(fifoMatchDetailSchema),
  totalRemittedUSD: z.number(),
  remainingProceedsUSD: z.number(),
  remittances: z.array(remittanceRecordSchema),
  taxableGainTHB: z.number(),
});

export const gainsArraySchema = z.array(realizedGainSchema);

// ─── Safe Parsers (returns fallback on failure) ────────────────────────────

/**
 * Safely parse localStorage data with a zod schema.
 * Returns the parsed data on success, or `fallback` on any error.
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown, fallback: T): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  console.warn('Data validation failed — using fallback:', result.error.issues);
  return fallback;
}
