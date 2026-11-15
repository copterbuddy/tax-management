import type { TradeTransaction, FifoLot, FifoMatchDetail, RealizedGainResult, RemittanceRecord, TaxSummary, ProviderType, ProviderBreakdown, OutstandingProceedsRow } from '../types/trade';
import type { ValidationResult } from './dividendEngine';

// ─── Key generation ──────────────────────────────────────────────────────
function lotKey(symbol: string, provider: ProviderType): string {
  return `${symbol}|${provider}`;
}

// ─── USD helpers ─────────────────────────────────────────────────────────

/**
 * Pre-fee trade value in USD. The broker slip's gross amount is authoritative
 * when present; older trades without one fall back to quantity × price.
 */
export type NotionalTrade = Pick<TradeTransaction, 'quantity' | 'priceUSD' | 'grossAmountUSD'>;

export function notionalUSD(trade: NotionalTrade): number {
  return trade.grossAmountUSD ?? trade.quantity * trade.priceUSD;
}

/** True when the notional had to be derived instead of read from the slip. */
export function isNotionalFromFallback(trade: NotionalTrade): boolean {
  return trade.grossAmountUSD === undefined;
}

export interface NotionalMismatch {
  derived: number;
  gross: number;
  delta: number;
}

const MISMATCH_REL_TOLERANCE = 0.005;
const MISMATCH_ABS_TOLERANCE = 0.01;

/**
 * Binary float error on cent amounts (e.g. 6647.13 − 10.86 land on
 * 6636.2699999999995) must not reject a legitimate full remittance.
 */
const MONEY_TOLERANCE_USD = 0.005;

/**
 * Compare the slip gross amount with quantity × price.
 * Returns null when the field is absent or the gap is within tolerance
 * (half a cent per share plus one cent for rounding).
 */
export function notionalMismatchUSD(trade: NotionalTrade): NotionalMismatch | null {
  const gross = trade.grossAmountUSD;
  if (gross === undefined) return null;
  const derived = trade.quantity * trade.priceUSD;
  const delta = gross - derived;
  const tolerance = trade.quantity * MISMATCH_REL_TOLERANCE + MISMATCH_ABS_TOLERANCE;
  return Math.abs(delta) > tolerance ? { derived, gross, delta } : null;
}

export function calculateBuyCostUSD(trade: TradeTransaction): number {
  if (trade.type !== 'BUY') return 0;
  return notionalUSD(trade) + trade.commissionUSD + (trade.exchangeFeeUSD ?? 0) + (trade.vatUSD ?? 0) - (trade.commissionRebateUSD ?? 0);
}

export function calculateSellRevenueUSD(trade: TradeTransaction): number {
  if (trade.type !== 'SELL') return 0;
  return notionalUSD(trade) - trade.commissionUSD - (trade.exchangeFeeUSD ?? 0) - (trade.tafFeeUSD ?? 0) - (trade.vatUSD ?? 0) + (trade.commissionRebateUSD ?? 0);
}

export function calculateUnitCostUSD(trade: TradeTransaction): number {
  if (trade.type !== 'BUY' || trade.quantity === 0) return 0;
  return calculateBuyCostUSD(trade) / trade.quantity;
}

// ─── Lot validation ──────────────────────────────────────────────────────

export interface LotValidationResult {
  valid: boolean;
  availableQuantity: number;
  requestedQuantity: number;
  symbol: string;
  provider: ProviderType;
  message?: string;
}

export function validateSellLots(
  sell: TradeTransaction,
  lots: FifoLot[]
): LotValidationResult {
  const totalAvailable = lots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  return {
    valid: totalAvailable >= sell.quantity,
    availableQuantity: totalAvailable,
    requestedQuantity: sell.quantity,
    symbol: sell.symbol,
    provider: sell.provider,
    message: totalAvailable >= sell.quantity
      ? undefined
      : `Insufficient lots for ${sell.symbol} via ${sell.provider}. Available: ${totalAvailable}, Requested: ${sell.quantity}`,
  };
}

// ─── FIFO sell processor (USD) ───────────────────────────────────────────

export function processSellTrade(
  sell: TradeTransaction,
  lots: FifoLot[]
): { result: RealizedGainResult; updatedLots: FifoLot[] } {
  const sellRevenueUSD = calculateSellRevenueUSD(sell);
  let remainingSellQty = sell.quantity;
  const matchedLots: FifoMatchDetail[] = [];
  const updatedLots: FifoLot[] = [];
  let totalBuyCostUSD = 0;

  for (const lot of lots) {
    if (remainingSellQty <= 0) {
      updatedLots.push(lot);
      continue;
    }
    const matchedQty = Math.min(remainingSellQty, lot.remainingQuantity);
    if (matchedQty <= 0) {
      updatedLots.push(lot);
      continue;
    }
    const matchedCost = matchedQty * lot.unitCostUSD;
    totalBuyCostUSD += matchedCost;
    remainingSellQty -= matchedQty;

    matchedLots.push({
      buyTradeId: lot.tradeId,
      buyDate: lot.date,
      buyProvider: lot.provider,
      matchedQuantity: matchedQty,
      buyUnitCostUSD: lot.unitCostUSD,
      buyTotalCostUSD: matchedCost,
    });

    const newRemaining = lot.remainingQuantity - matchedQty;
    if (newRemaining > 0) {
      updatedLots.push({ ...lot, remainingQuantity: newRemaining });
    }
  }

  if (remainingSellQty > 0) {
    throw new Error(
      `Insufficient lots for ${sell.symbol} via ${sell.provider}. ` +
      `${remainingSellQty.toFixed(4)} units could not be matched.`
    );
  }

  const gainUSD = sellRevenueUSD - totalBuyCostUSD;
  const gainPercent = sellRevenueUSD > 0 ? gainUSD / sellRevenueUSD : 0;

  return {
    result: {
      sellTradeId: sell.id,
      sellDate: sell.date,
      symbol: sell.symbol,
      provider: sell.provider,
      sellQuantity: sell.quantity,
      sellRevenueUSD,
      buyCostBasisUSD: totalBuyCostUSD,
      gainUSD,
      gainPercent,
      matchedLots,
      totalRemittedUSD: 0,
      remainingProceedsUSD: sellRevenueUSD,
      remittances: [],
      taxableGainTHB: 0,
    },
    updatedLots,
  };
}

// ─── Batch computation ───────────────────────────────────────────────────

export function computeAllRealizedGains(
  trades: TradeTransaction[],
  excludeTradeId?: string
): { gains: RealizedGainResult[]; remainingLots: FifoLot[] } {
  const sortedTrades = [...trades]
    .filter(t => t.id !== excludeTradeId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const gains: RealizedGainResult[] = [];
  const lotsByKey: Record<string, FifoLot[]> = {};

  for (const trade of sortedTrades) {
    const key = lotKey(trade.symbol, trade.provider);
    if (trade.type === 'BUY') {
      if (!lotsByKey[key]) lotsByKey[key] = [];
      lotsByKey[key].push({
        tradeId: trade.id,
        date: trade.date,
        symbol: trade.symbol,
        provider: trade.provider,
        unitCostUSD: calculateUnitCostUSD(trade),
        remainingQuantity: trade.quantity,
        originalQuantity: trade.quantity,
      });
    } else if (trade.type === 'SELL') {
      const symbolLots = lotsByKey[key] || [];
      const validation = validateSellLots(trade, symbolLots);
      if (!validation.valid) throw new Error(validation.message!);
      const { result, updatedLots } = processSellTrade(trade, symbolLots);
      lotsByKey[key] = updatedLots;
      gains.push(result);
    }
  }

  const remainingLots: FifoLot[] = Object.values(lotsByKey).flat();
  return { gains, remainingLots };
}

// ─── Remittance tax calculation (Thai law) ───────────────────────────────

/**
 * Apply a remittance to a realized gain result.
 * Per Thai Revenue Code: only the gain portion is taxable,
 * converted at the exchange rate on the remittance date.
 */
export function applyRemittance(
  gainResult: RealizedGainResult,
  remittance: RemittanceRecord
): RealizedGainResult {
  const validation = validateRemittance(gainResult, remittance);
  if (!validation.valid) throw new Error(validation.message!);

  const reinvested = reinvestedUSDOf(gainResult);
  const newTotalRemitted = gainResult.totalRemittedUSD + remittance.amountUSD;

  // Only the gain portion is taxable — gainPercent × amountUSD
  // Losses cannot create a negative taxable amount
  const taxableUSD = Math.max(0, remittance.amountUSD * gainResult.gainPercent);
  const taxableTHB = taxableUSD * remittance.fxRateTHB;

  return {
    ...gainResult,
    totalRemittedUSD: newTotalRemitted,
    remainingProceedsUSD: gainResult.sellRevenueUSD - newTotalRemitted - reinvested,
    remittances: [...gainResult.remittances, remittance],
    taxableGainTHB: gainResult.taxableGainTHB + taxableTHB,
  };
}

// ─── Remittance validation ───────────────────────────────────────────────

/**
 * Proceeds a sale can still return to Thailand: everything but the part that
 * was spent on another offshore purchase.
 */
function remittableRevenueOf(gain: RealizedGainResult): number {
  return gain.sellRevenueUSD - reinvestedUSDOf(gain);
}

/** Nothing to apply when the amount carries no positive value. */
function hasNonPositiveAmount(amountUSD: number): boolean {
  return amountUSD <= 0;
}

/** A remittance belongs to exactly one sale. */
function belongsToAnotherSale(gain: RealizedGainResult, remittance: RemittanceRecord): boolean {
  return remittance.sellTradeId !== gain.sellTradeId;
}

/** Adding it would push the total past the remittable proceeds, to the cent. */
function exceedsRemittableProceeds(gain: RealizedGainResult, amountUSD: number): boolean {
  return gain.totalRemittedUSD + amountUSD > remittableRevenueOf(gain) + MONEY_TOLERANCE_USD;
}

/** What a sale can still take before the next remittance would not fit. */
function availableForRemittance(gain: RealizedGainResult): number {
  return remittableRevenueOf(gain) - gain.totalRemittedUSD;
}

/**
 * Decide whether a remittance may be applied, with the reason when it may not.
 * `applyRemittance` and the forms both call this, so the limit is defined once.
 */
export function validateRemittance(
  gain: RealizedGainResult,
  remittance: RemittanceRecord
): ValidationResult {
  if (hasNonPositiveAmount(remittance.amountUSD)) {
    return { valid: false, message: 'Remittance amount must be positive' };
  }
  if (belongsToAnotherSale(gain, remittance)) {
    return { valid: false, message: 'Remittance does not match sell trade' };
  }
  if (exceedsRemittableProceeds(gain, remittance.amountUSD)) {
    return {
      valid: false,
      message: `Remittance exceeds remaining proceeds. Available: $${availableForRemittance(gain).toFixed(2)}`,
    };
  }
  return { valid: true };
}

// ─── Reinvested proceeds ─────────────────────────────────────────────────

/** USD amount of a gain's proceeds spent on another offshore purchase. */
export function reinvestedUSDOf(gain: RealizedGainResult): number {
  const amount = gain.reinvestedUSD ?? 0;
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/**
 * Record (or replace) the proceeds of a sale that were spent on another
 * offshore purchase. The amount may not exceed what is left after
 * remittances, so it can only ever reduce the outstanding balance.
 */
export function applyReinvestedAmount(
  gainResult: RealizedGainResult,
  amountUSD: number
): RealizedGainResult {
  if (!Number.isFinite(amountUSD)) {
    throw new Error('Reinvested amount must be a finite number');
  }
  if (amountUSD < 0) {
    throw new Error('Reinvested amount cannot be negative');
  }
  const limit = gainResult.sellRevenueUSD - gainResult.totalRemittedUSD;
  if (amountUSD > limit + MONEY_TOLERANCE_USD) {
    throw new Error(`Reinvested amount exceeds remaining proceeds. Available: $${limit.toFixed(2)}`);
  }

  return {
    ...gainResult,
    reinvestedUSD: amountUSD,
    remainingProceedsUSD: limit - amountUSD,
  };
}

export interface GainSummary {
  totalReinvestedUSD: number;
  unremittedUSD: number;
  rows: OutstandingProceedsRow[];
}

/**
 * Outstanding proceeds across the gains the caller passes in — a pure sum, so
 * one over-recorded gain is clamped at 0 instead of offsetting another gain.
 */
export function computeGainSummary(gains: RealizedGainResult[]): GainSummary {
  let totalReinvestedUSD = 0;
  let unremittedUSD = 0;
  const rows: OutstandingProceedsRow[] = [];

  for (const g of gains) {
    const reinvested = reinvestedUSDOf(g);
    totalReinvestedUSD += reinvested;
    const balance = g.sellRevenueUSD - g.totalRemittedUSD - reinvested;
    unremittedUSD += Math.max(0, balance);
    if (balance > MONEY_TOLERANCE_USD) {
      rows.push({
        sellTradeId: g.sellTradeId,
        sellDate: g.sellDate,
        symbol: g.symbol,
        provider: g.provider,
        sellRevenueUSD: g.sellRevenueUSD,
        totalRemittedUSD: g.totalRemittedUSD,
        reinvestedUSD: reinvested,
        availableBalanceUSD: balance,
      });
    }
  }

  rows.sort((a, b) => a.sellDate.localeCompare(b.sellDate) || a.symbol.localeCompare(b.symbol));
  return { totalReinvestedUSD, unremittedUSD, rows };
}

/**
 * SRP: Separate taxable gain from net gain (Thai law: losses cannot offset).
 */
export function computeTaxableGainsTHB(gains: RealizedGainResult[]): {
  taxableGainTHB: number;
  excludedLossesTHB: number;
} {
  let taxableGainTHB = 0;
  let excludedLossesTHB = 0;

  for (const g of gains) {
    if (g.gainUSD > 0) {
      taxableGainTHB += g.taxableGainTHB; // Only remitted gains count
    } else if (g.gainUSD < 0) {
      excludedLossesTHB += Math.abs(g.gainUSD); // Loss in USD for display
    }
  }

  return { taxableGainTHB, excludedLossesTHB };
}

// ─── Tax summary ─────────────────────────────────────────────────────────

const PROVIDERS: readonly ProviderType[] = ['Dime', 'Liberator', 'FinansiaSyrus'];

/**
 * One pass over the complete book, three explicit populations.
 *
 * Base gains must come from every trade: FIFO cannot match a sale against
 * buy lots that were filtered out by a year slice. From there
 * `saleYearGains` answers what was sold in the year, and `yearRemittances`
 * answers what arrived in Thailand in the year. Mixing the two produced
 * lifetime remitted totals and dropped later-year remittances entirely.
 */
export function computeTaxSummary(
  trades: TradeTransaction[],
  taxYear: number,
  allGains: RealizedGainResult[] = []
): TaxSummary {
  const year = String(taxYear);
  const baseGains = allGains.length ? allGains : computeAllRealizedGains(trades).gains;

  const saleYearGains = baseGains.filter(g => g.sellDate.startsWith(year));
  // The flags filter lives here, not in each reducer below: every derived
  // figure reads this one array, so a record the sale can no longer support
  // (kept for the audit trail) is excluded from all of them at once.
  const yearRemittances = baseGains.flatMap(g =>
    g.remittances
      .filter(r => r.remitDate.startsWith(year) && r.unapplied !== true)
      .map(r => ({ gain: g, remittance: r }))
  );

  // Sale-year figures — the tax basis of the sales dated in this year.
  const totalRevenueUSD = saleYearGains.reduce((s, g) => s + g.sellRevenueUSD, 0);
  const totalCostBasisUSD = saleYearGains.reduce((s, g) => s + g.buyCostBasisUSD, 0);
  const netGainUSD = saleYearGains.reduce((s, g) => s + g.gainUSD, 0);

  // Remittance-year figures — what actually arrived in Thailand this year.
  const totalRemittedUSD = yearRemittances.reduce((s, x) => s + x.remittance.amountUSD, 0);

  // Losses cannot create a negative taxable amount, so each remittance
  // contributes only its positive gain portion.
  const taxableUSDOf = (x: (typeof yearRemittances)[number]) =>
    Math.max(0, x.remittance.amountUSD * x.gain.gainPercent);

  const taxableGainUSD = yearRemittances.reduce((s, x) => s + taxableUSDOf(x), 0);

  const taxableGainTHB = yearRemittances.reduce(
    (s, x) => s + taxableUSDOf(x) * x.remittance.fxRateTHB,
    0
  );

  // Losses are not deductible, so report the loss portion of this year's
  // remittances separately instead of letting it shrink the taxable figure.
  const excludedLossesUSD = yearRemittances.reduce(
    (s, x) => s + Math.max(0, -(x.remittance.amountUSD * x.gain.gainPercent)),
    0
  );

  const remittedSellCount = new Set(yearRemittances.map(x => x.remittance.sellTradeId)).size;

  // Provider rows are a partition of `yearRemittances`: same money, split by
  // provider. A provider with no remittance this year has no row.
  const providerBreakdown: ProviderBreakdown[] = PROVIDERS.flatMap(provider => {
    const rows = yearRemittances.filter(x => x.gain.provider === provider);
    if (rows.length === 0) return [];
    // `taxableGainUSD` and `gainInRemittancesUSD` are the same sum by
    // construction (design D8): the row shows a THB gain beside a USD figure.
    const gainUSD = rows.reduce((s, x) => s + taxableUSDOf(x), 0);
    return [{
      provider,
      taxableGainTHB: rows.reduce(
        (s, x) => s + taxableUSDOf(x) * x.remittance.fxRateTHB,
        0
      ),
      totalRemittedUSD: rows.reduce((s, x) => s + x.remittance.amountUSD, 0),
      taxableGainUSD: gainUSD,
      gainInRemittancesUSD: gainUSD,
      sellCount: new Set(rows.map(x => x.remittance.sellTradeId)).size,
    }];
  });

  const { totalReinvestedUSD, unremittedUSD, rows: outstandingRows } = computeGainSummary(saleYearGains);

  const yearTrades = trades.filter(t => t.date.startsWith(year));

  return {
    taxYear,
    totalRevenueUSD,
    totalCostBasisUSD,
    netGainUSD,
    totalRemittedUSD,
    taxableGainUSD,
    taxableGainTHB,
    excludedLossesUSD,
    totalTransactions: yearTrades.length,
    totalBuyCount: yearTrades.filter(t => t.type === 'BUY').length,
    totalSellCount: saleYearGains.length,
    totalRemittanceCount: yearRemittances.length,
    remittedSellCount,
    totalReinvestedUSD,
    unremittedUSD,
    outstandingRows,
    providerBreakdown,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────

export function formatGainIndicator(gainTHB: number): string {
  if (gainTHB > 0) return `+฿${gainTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (gainTHB < 0) return `-฿${Math.abs(gainTHB).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return '฿0.00';
}
