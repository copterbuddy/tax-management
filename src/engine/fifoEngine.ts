import type { TradeTransaction, FifoLot, FifoMatchDetail, RealizedGainResult, RemittanceRecord, TaxSummary, ProviderType } from '../types/trade';

// ─── Key generation ──────────────────────────────────────────────────────
function lotKey(symbol: string, provider: ProviderType): string {
  return `${symbol}|${provider}`;
}

// ─── USD helpers ─────────────────────────────────────────────────────────

export function calculateBuyCostUSD(trade: TradeTransaction): number {
  if (trade.type !== 'BUY') return 0;
  return trade.quantity * trade.priceUSD + trade.commissionUSD;
}

export function calculateSellRevenueUSD(trade: TradeTransaction): number {
  if (trade.type !== 'SELL') return 0;
  return trade.quantity * trade.priceUSD - trade.commissionUSD;
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
  trades: TradeTransaction[]
): { gains: RealizedGainResult[]; remainingLots: FifoLot[] } {
  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
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
  if (remittance.amountUSD <= 0) {
    throw new Error('Remittance amount must be positive');
  }
  if (remittance.sellTradeId !== gainResult.sellTradeId) {
    throw new Error('Remittance does not match sell trade');
  }

  const newTotalRemitted = gainResult.totalRemittedUSD + remittance.amountUSD;
  if (newTotalRemitted > gainResult.sellRevenueUSD) {
    throw new Error(
      `Remittance exceeds remaining proceeds. Available: $${(gainResult.sellRevenueUSD - gainResult.totalRemittedUSD).toFixed(2)}`
    );
  }

  // Only the gain portion is taxable — gainPercent × amountUSD
  const taxableUSD = remittance.amountUSD * gainResult.gainPercent;
  const taxableTHB = taxableUSD * remittance.fxRateTHB;

  return {
    ...gainResult,
    totalRemittedUSD: newTotalRemitted,
    remainingProceedsUSD: gainResult.sellRevenueUSD - newTotalRemitted,
    remittances: [...gainResult.remittances, remittance],
    taxableGainTHB: gainResult.taxableGainTHB + taxableTHB,
  };
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

export function computeTaxSummary(
  trades: TradeTransaction[],
  taxYear: number,
  allGains: RealizedGainResult[] = []
): TaxSummary {
  const yearTrades = trades.filter(t => {
    const year = parseInt(t.date.substring(0, 4), 10);
    return year === taxYear;
  });

  const { gains } = computeAllRealizedGains(yearTrades);

  // Apply remittances from existing gain results (retain remittance history)
  const gainMap = new Map<string, RealizedGainResult>();
  for (const g of allGains) gainMap.set(g.sellTradeId, g);
  const mergedGains = gains.map(g => gainMap.get(g.sellTradeId) || g);

  // Filter gains where remittances occurred in this tax year
  const yearGains = mergedGains.filter(g =>
    g.remittances.some(r => r.remitDate.startsWith(String(taxYear)))
  );

  const totalRevenueUSD = yearGains.reduce((s, g) => s + g.sellRevenueUSD, 0);
  const totalCostBasisUSD = yearGains.reduce((s, g) => s + g.buyCostBasisUSD, 0);
  const netGainUSD = yearGains.reduce((s, g) => s + g.gainUSD, 0);
  const totalRemittedUSD = yearGains.reduce((s, g) => s + g.totalRemittedUSD, 0);

  const yearRemittances = mergedGains.flatMap(g =>
    g.remittances.filter(r => r.remitDate.startsWith(String(taxYear)))
  );

  const taxableGainUSD = yearRemittances.reduce((s, r) => {
    const gain = mergedGains.find(g => g.sellTradeId === r.sellTradeId);
    return s + (gain ? r.amountUSD * gain.gainPercent : 0);
  }, 0);

  const taxableGainTHB = yearRemittances.reduce((s, r) => {
    const gain = mergedGains.find(g => g.sellTradeId === r.sellTradeId);
    return s + (gain ? r.amountUSD * gain.gainPercent * r.fxRateTHB : 0);
  }, 0);

  const { excludedLossesTHB } = computeTaxableGainsTHB(mergedGains);

  // Provider breakdown — per-provider KPI
  const providers = ['Dime', 'Liberator', 'FinansiaSyrus'] as const;
  const providerBreakdown = providers.map(prov => {
    const provGains = yearGains.filter(g => g.provider === prov);
    const provRemitTHB = provGains.reduce((s, g) => s + g.taxableGainTHB, 0);
    const provRemitUSD = provGains.reduce((s, g) => s + g.totalRemittedUSD, 0);
    const provNetUSD = provGains.reduce((s, g) => s + g.gainUSD, 0);
    return {
      provider: prov,
      taxableGainTHB: provRemitTHB,
      totalRemittedUSD: provRemitUSD,
      netGainUSD: provNetUSD,
      sellCount: provGains.length,
    };
  });

  return {
    taxYear,
    totalRevenueUSD,
    totalCostBasisUSD,
    netGainUSD,
    totalRemittedUSD,
    taxableGainUSD,
    taxableGainTHB,
    excludedLossesUSD: excludedLossesTHB,
    totalTransactions: yearTrades.length,
    totalBuyCount: yearTrades.filter(t => t.type === 'BUY').length,
    totalSellCount: yearTrades.filter(t => t.type === 'SELL').length,
    totalRemittanceCount: yearRemittances.length,
    providerBreakdown,
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────

export function formatGainIndicator(gainTHB: number): string {
  if (gainTHB > 0) return `+฿${gainTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (gainTHB < 0) return `-฿${Math.abs(gainTHB).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return '฿0.00';
}
