import type { TradeTransaction, FifoLot, FifoMatchDetail, RealizedGainResult, TaxSummary, ProviderType } from '../types/trade';

// ─── SRP: Centralized key generation ────────────────────────────────────────
/**
 * Generate a grouping key for FIFO lot matching.
 * Lots are matched only when both symbol AND provider are identical.
 * OCP: If future requirements change the grouping logic (e.g., add exchange),
 *      only this function needs to change.
 */
function lotKey(symbol: string, provider: ProviderType): string {
  return `${symbol}|${provider}`;
}

// ─── Pure calculation helpers ────────────────────────────────────────────────

/**
 * Calculate gross THB cost basis for a buy trade.
 * Formula: (Quantity × Price USD + Commission USD) × FX Rate THB
 */
export function calculateBuyCostTHB(trade: TradeTransaction): number {
  if (trade.type !== 'BUY') return 0;
  return (trade.quantity * trade.priceUSD + trade.commissionUSD) * trade.fxRateTHB;
}

/**
 * Calculate gross THB revenue for a sell trade.
 * Formula: (Quantity × Price USD - Commission USD) × FX Rate THB
 */
export function calculateSellRevenueTHB(trade: TradeTransaction): number {
  if (trade.type !== 'SELL') return 0;
  return (trade.quantity * trade.priceUSD - trade.commissionUSD) * trade.fxRateTHB;
}

/**
 * Calculate the unit cost in THB for a buy trade (including proportional commission).
 */
export function calculateUnitCostTHB(trade: TradeTransaction): number {
  if (trade.type !== 'BUY' || trade.quantity === 0) return 0;
  return calculateBuyCostTHB(trade) / trade.quantity;
}

// ─── SRP: Lot validation ─────────────────────────────────────────────────────

/**
 * Validation result for checking whether a sell trade can be executed
 * against available lots for a given symbol+provider combination.
 */
export interface LotValidationResult {
  valid: boolean;
  availableQuantity: number;
  requestedQuantity: number;
  symbol: string;
  provider: ProviderType;
  message?: string;
}

/**
 * SRP: Validate that sufficient lots exist BEFORE attempting to process a sell.
 * Separated from processSellTrade so callers (e.g., TradeForm) can pre-validate
 * without actually mutating lot state.
 */
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
      : `Insufficient lots for ${sell.symbol} via ${sell.provider}. ` +
        `Available: ${totalAvailable}, Requested: ${sell.quantity}`,
  };
}

// ─── FIFO lot builder ────────────────────────────────────────────────────────

/**
 * Build FIFO lots from an array of buy trades, sorted by date.
 * Each lot represents a buy trade with its remaining (unmatched) quantity.
 */
export function buildFifoLots(buys: TradeTransaction[]): FifoLot[] {
  const sortedBuys = [...buys]
    .filter(t => t.type === 'BUY')
    .sort((a, b) => a.date.localeCompare(b.date));

  return sortedBuys.map(buy => ({
    tradeId: buy.id,
    date: buy.date,
    symbol: buy.symbol,
    provider: buy.provider,
    unitCostTHB: calculateUnitCostTHB(buy),
    remainingQuantity: buy.quantity,
    originalQuantity: buy.quantity,
    fxRateTHB: buy.fxRateTHB,
  }));
}

// ─── Core FIFO sell processor ────────────────────────────────────────────────

/**
 * Process a single sell trade against existing FIFO lots.
 * LSP: Returns a well-defined result for any valid input — callers can rely
 *      on the result shape regardless of matching outcome.
 *
 * @throws {Error} If insufficient lots exist for the sell (symbol + provider mismatch)
 */
export function processSellTrade(
  sell: TradeTransaction,
  lots: FifoLot[]
): { result: RealizedGainResult; updatedLots: FifoLot[] } {
  const sellRevenueTHB = calculateSellRevenueTHB(sell);
  let remainingSellQty = sell.quantity;
  const matchedLots: FifoMatchDetail[] = [];
  const updatedLots: FifoLot[] = [];
  let totalBuyCostTHB = 0;

  for (const lot of lots) {
    if (remainingSellQty <= 0) {
      // No more quantity to match — pass remaining lots through unchanged
      updatedLots.push(lot);
      continue;
    }

    const matchedQty = Math.min(remainingSellQty, lot.remainingQuantity);
    if (matchedQty <= 0) {
      updatedLots.push(lot);
      continue;
    }

    const matchedCost = matchedQty * lot.unitCostTHB;
    totalBuyCostTHB += matchedCost;
    remainingSellQty -= matchedQty;

    matchedLots.push({
      buyTradeId: lot.tradeId,
      buyDate: lot.date,
      buyProvider: lot.provider,
      matchedQuantity: matchedQty,
      buyUnitCostTHB: lot.unitCostTHB,
      buyTotalCostTHB: matchedCost,
    });

    // Push updated lot with reduced remaining quantity (immutable-style update)
    const newRemaining = lot.remainingQuantity - matchedQty;
    if (newRemaining > 0) {
      updatedLots.push({ ...lot, remainingQuantity: newRemaining });
    }
    // If newRemaining === 0, the lot is fully consumed — don't push it back
  }

  // Guard: if sell quantity wasn't fully matched, the caller passed wrong lots
  if (remainingSellQty > 0) {
    throw new Error(
      `Insufficient lots for ${sell.symbol} via ${sell.provider}. ` +
      `${remainingSellQty.toFixed(4)} units could not be matched.`
    );
  }

  const realizedGainTHB = sellRevenueTHB - totalBuyCostTHB;

  const result: RealizedGainResult = {
    sellTradeId: sell.id,
    sellDate: sell.date,
    symbol: sell.symbol,
    assetType: sell.assetType,
    provider: sell.provider,
    quantity: sell.quantity,
    sellRevenueTHB,
    buyCostBasisTHB: totalBuyCostTHB,
    realizedGainTHB,
    matchedLots,
  };

  return { result, updatedLots };
}

// ─── Batch computation ───────────────────────────────────────────────────────

/**
 * Process all trades (sorted by date) and compute realized gains using FIFO.
 * OCP: Lot grouping is abstracted behind lotKey() — changing the grouping
 *      dimension only requires changing that one function.
 */
export function computeAllRealizedGains(
  trades: TradeTransaction[]
): { gains: RealizedGainResult[]; remainingLots: FifoLot[] } {
  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const gains: RealizedGainResult[] = [];

  // DIP: Map keyed by abstraction (string), not a concrete field
  const lotsByKey: Record<string, FifoLot[]> = {};

  for (const trade of sortedTrades) {
    const key = lotKey(trade.symbol, trade.provider);

    if (trade.type === 'BUY') {
      if (!lotsByKey[key]) {
        lotsByKey[key] = [];
      }
      lotsByKey[key].push({
        tradeId: trade.id,
        date: trade.date,
        symbol: trade.symbol,
        provider: trade.provider,
        unitCostTHB: calculateUnitCostTHB(trade),
        remainingQuantity: trade.quantity,
        originalQuantity: trade.quantity,
        fxRateTHB: trade.fxRateTHB,
      });
    } else if (trade.type === 'SELL') {
      const symbolLots = lotsByKey[key] || [];

      // Validate before processing
      const validation = validateSellLots(trade, symbolLots);
      if (!validation.valid) {
        throw new Error(validation.message!);
      }

      const { result, updatedLots } = processSellTrade(trade, symbolLots);
      lotsByKey[key] = updatedLots;
      gains.push(result);
    }
  }

  // Flatten remaining lots across all providers
  const remainingLots: FifoLot[] = Object.values(lotsByKey).flat();

  return { gains, remainingLots };
}

// ─── Taxable gain computation (Thai law: losses cannot offset gains) ─────────

/**
 * SRP: Separate taxable gain from net gain.
 * Per Thai Revenue Code Section 40(4)(g) and PwC Thai Tax 2024/25:
 * "Capital losses cannot be offset against capital gains."
 *
 * This function splits gains into:
 * - taxableGainTHB: Sum of only positive realizedGainTHB
 * - excludedLossesTHB: Absolute value of all negative realizedGainTHB (not deductible)
 */
export function computeTaxableGains(gains: RealizedGainResult[]): {
  taxableGainTHB: number;
  excludedLossesTHB: number;
} {
  let taxableGainTHB = 0;
  let excludedLossesTHB = 0;

  for (const g of gains) {
    if (g.realizedGainTHB > 0) {
      taxableGainTHB += g.realizedGainTHB;
    } else if (g.realizedGainTHB < 0) {
      excludedLossesTHB += Math.abs(g.realizedGainTHB);
    }
    // realizedGainTHB === 0 → neither taxable nor loss
  }

  return { taxableGainTHB, excludedLossesTHB };
}

// ─── Tax summary ─────────────────────────────────────────────────────────────

/**
 * Compute a tax summary for a given year.
 * SRP: This function only aggregates — it delegates FIFO computation to computeAllRealizedGains
 *      and taxable split to computeTaxableGains.
 */
export function computeTaxSummary(
  trades: TradeTransaction[],
  taxYear: number
): TaxSummary {
  const yearTrades = trades.filter(t => {
    const year = parseInt(t.date.substring(0, 4), 10);
    return year === taxYear;
  });

  const { gains } = computeAllRealizedGains(yearTrades);

  const totalRevenueTHB = gains.reduce((sum, g) => sum + g.sellRevenueTHB, 0);
  const totalCostBasisTHB = gains.reduce((sum, g) => sum + g.buyCostBasisTHB, 0);
  const netRealizedGainTHB = gains.reduce((sum, g) => sum + g.realizedGainTHB, 0);

  const { taxableGainTHB, excludedLossesTHB } = computeTaxableGains(gains);

  const stockGains = gains.filter(g => g.assetType === 'FOREIGN_STOCK');
  const cryptoGains = gains.filter(g => g.assetType === 'CRYPTO');

  const stockTaxable = computeTaxableGains(stockGains);
  const cryptoTaxable = computeTaxableGains(cryptoGains);

  const assetTypeBreakdown = {
    FOREIGN_STOCK: {
      revenueTHB: stockGains.reduce((s, g) => s + g.sellRevenueTHB, 0),
      costBasisTHB: stockGains.reduce((s, g) => s + g.buyCostBasisTHB, 0),
      gainTHB: stockGains.reduce((s, g) => s + g.realizedGainTHB, 0),
      taxableGainTHB: stockTaxable.taxableGainTHB,
      excludedLossesTHB: stockTaxable.excludedLossesTHB,
    },
    CRYPTO: {
      revenueTHB: cryptoGains.reduce((s, g) => s + g.sellRevenueTHB, 0),
      costBasisTHB: cryptoGains.reduce((s, g) => s + g.buyCostBasisTHB, 0),
      gainTHB: cryptoGains.reduce((s, g) => s + g.realizedGainTHB, 0),
      taxableGainTHB: cryptoTaxable.taxableGainTHB,
      excludedLossesTHB: cryptoTaxable.excludedLossesTHB,
    },
  };

  return {
    taxYear,
    totalRevenueTHB,
    totalCostBasisTHB,
    netRealizedGainTHB,
    taxableGainTHB,
    excludedLossesTHB,
    totalTransactions: yearTrades.length,
    totalBuyCount: yearTrades.filter(t => t.type === 'BUY').length,
    totalSellCount: yearTrades.filter(t => t.type === 'SELL').length,
    assetTypeBreakdown,
  };
}

// ─── Formatting utility ──────────────────────────────────────────────────────

/**
 * Generate a human-readable gain/loss indicator string in THB.
 */
export function formatGainIndicator(gainTHB: number): string {
  if (gainTHB > 0) return `+฿${gainTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (gainTHB < 0) return `-฿${Math.abs(gainTHB).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return '฿0.00';
}
