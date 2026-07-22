import type { TradeTransaction, FifoLot, FifoMatchDetail, RealizedGainResult, TaxSummary } from '../types/trade';

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
    unitCostTHB: calculateUnitCostTHB(buy),
    remainingQuantity: buy.quantity,
    originalQuantity: buy.quantity,
    fxRateTHB: buy.fxRateTHB,
  }));
}

/**
 * Process a single sell trade against existing FIFO lots for the same symbol.
 * Returns the realized gain result and the updated lots array.
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
      matchedQuantity: matchedQty,
      buyUnitCostTHB: lot.unitCostTHB,
      buyTotalCostTHB: matchedCost,
    });

    // Push updated lot with reduced remaining quantity
    const newRemaining = lot.remainingQuantity - matchedQty;
    if (newRemaining > 0) {
      updatedLots.push({ ...lot, remainingQuantity: newRemaining });
    }
  }

  const realizedGainTHB = sellRevenueTHB - totalBuyCostTHB;

  const result: RealizedGainResult = {
    sellTradeId: sell.id,
    sellDate: sell.date,
    symbol: sell.symbol,
    assetType: sell.assetType,
    quantity: sell.quantity - remainingSellQty, // Actual matched quantity
    sellRevenueTHB,
    buyCostBasisTHB: totalBuyCostTHB,
    realizedGainTHB,
    matchedLots,
  };

  return { result, updatedLots };
}

/**
 * Process all trades (sorted by date) and compute realized gains using FIFO.
 * Returns an array of realized gain results (one per sell trade) and the remaining open lots.
 */
export function computeAllRealizedGains(
  trades: TradeTransaction[]
): { gains: RealizedGainResult[]; remainingLots: FifoLot[] } {
  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const gains: RealizedGainResult[] = [];
  let lotsBySymbol: Record<string, FifoLot[]> = {};

  for (const trade of sortedTrades) {
    if (trade.type === 'BUY') {
      if (!lotsBySymbol[trade.symbol]) {
        lotsBySymbol[trade.symbol] = [];
      }
      lotsBySymbol[trade.symbol].push({
        tradeId: trade.id,
        date: trade.date,
        symbol: trade.symbol,
        unitCostTHB: calculateUnitCostTHB(trade),
        remainingQuantity: trade.quantity,
        originalQuantity: trade.quantity,
        fxRateTHB: trade.fxRateTHB,
      });
    } else if (trade.type === 'SELL') {
      const symbolLots = lotsBySymbol[trade.symbol] || [];
      const { result, updatedLots } = processSellTrade(trade, symbolLots);
      lotsBySymbol[trade.symbol] = updatedLots;
      gains.push(result);
    }
  }

  // Flatten remaining lots
  const remainingLots: FifoLot[] = Object.values(lotsBySymbol).flat();

  return { gains, remainingLots };
}

/**
 * Compute a tax summary for a given year.
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

  const stockGains = gains.filter(g => g.assetType === 'FOREIGN_STOCK');
  const cryptoGains = gains.filter(g => g.assetType === 'CRYPTO');

  const assetTypeBreakdown = {
    FOREIGN_STOCK: {
      revenueTHB: stockGains.reduce((s, g) => s + g.sellRevenueTHB, 0),
      costBasisTHB: stockGains.reduce((s, g) => s + g.buyCostBasisTHB, 0),
      gainTHB: stockGains.reduce((s, g) => s + g.realizedGainTHB, 0),
    },
    CRYPTO: {
      revenueTHB: cryptoGains.reduce((s, g) => s + g.sellRevenueTHB, 0),
      costBasisTHB: cryptoGains.reduce((s, g) => s + g.buyCostBasisTHB, 0),
      gainTHB: cryptoGains.reduce((s, g) => s + g.realizedGainTHB, 0),
    },
  };

  return {
    taxYear,
    totalRevenueTHB,
    totalCostBasisTHB,
    netRealizedGainTHB,
    totalTransactions: yearTrades.length,
    totalBuyCount: yearTrades.filter(t => t.type === 'BUY').length,
    totalSellCount: yearTrades.filter(t => t.type === 'SELL').length,
    assetTypeBreakdown,
  };
}

/**
 * Generate a FIFO gain indicator string for a sell trade.
 * Returns a human-readable string showing the gain/loss.
 */
export function formatGainIndicator(gainTHB: number): string {
  if (gainTHB > 0) return `+฿${gainTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (gainTHB < 0) return `-฿${Math.abs(gainTHB).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return '฿0.00';
}

/**
 * Generate a Markdown trade log table from trades and gains.
 */
export function generateMarkdownTable(
  trades: TradeTransaction[],
  gains: RealizedGainResult[]
): string {
  const gainMap = new Map<string, RealizedGainResult>();
  for (const g of gains) {
    gainMap.set(g.sellTradeId, g);
  }

  const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));

  let md = '| Date | Symbol | Type | Quantity | Unit Price (USD) | Fee (USD) | FX Rate (THB) | Total THB | FIFO Realized Gain (THB) |\n';
  md += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';

  for (const t of sortedTrades) {
    const totalTHB = t.type === 'BUY'
      ? calculateBuyCostTHB(t)
      : calculateSellRevenueTHB(t);

    let gainStr = '-';
    if (t.type === 'SELL') {
      const gain = gainMap.get(t.id);
      if (gain) {
        gainStr = `**${formatGainIndicator(gain.realizedGainTHB)}**`;
      }
    }

    md += `| ${t.date} | ${t.symbol} | ${t.type} | ${t.quantity} | $${t.priceUSD.toFixed(2)} | $${t.commissionUSD.toFixed(2)} | ${t.fxRateTHB.toFixed(2)} | ฿${totalTHB.toFixed(2)} | ${gainStr} |\n`;
  }

  return md;
}

/**
 * Generate a CSV string from trades.
 */
export function generateCSV(trades: TradeTransaction[]): string {
  const headers = ['Date', 'Symbol', 'AssetType', 'Type', 'Quantity', 'PriceUSD', 'CommissionUSD', 'FxRateTHB', 'Notes'];
  const rows = trades.map(t => [
    t.date,
    t.symbol,
    t.assetType,
    t.type,
    t.quantity.toString(),
    t.priceUSD.toString(),
    t.commissionUSD.toString(),
    t.fxRateTHB.toString(),
    t.notes || '',
  ]);

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  return [headers.join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
}

/**
 * Parse CSV string into TradeTransaction array.
 */
export function parseCSV(csv: string): TradeTransaction[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const trades: TradeTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 8) continue;

    const trade: TradeTransaction = {
      id: `trd_${Date.now()}_${i}`,
      date: values[0],
      symbol: values[1],
      assetType: values[2] === 'CRYPTO' ? 'CRYPTO' : 'FOREIGN_STOCK',
      type: values[3] === 'SELL' ? 'SELL' : 'BUY',
      quantity: parseFloat(values[4]) || 0,
      priceUSD: parseFloat(values[5]) || 0,
      commissionUSD: parseFloat(values[6]) || 0,
      fxRateTHB: parseFloat(values[7]) || 0,
      notes: values[8] || '',
    };

    if (trade.quantity > 0 && trade.priceUSD > 0) {
      trades.push(trade);
    }
  }

  return trades;
}