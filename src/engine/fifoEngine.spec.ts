/**
 * FIFO Engine — Unit Tests
 * Tests the core FIFO matching logic, USD calculations, and remittance tax.
 */

import {
  calculateBuyCostUSD,
  calculateSellRevenueUSD,
  calculateUnitCostUSD,
  validateSellLots,
  processSellTrade,
  computeAllRealizedGains,
  applyRemittance,
  applyReinvestedAmount,
  computeGainSummary,
  computeTaxableGainsTHB,
  computeTaxSummary,
  formatGainIndicator,
  notionalUSD,
  isNotionalFromFallback,
  notionalMismatchUSD,
  validateRemittance,
} from './fifoEngine';
import type {
  TradeTransaction,
  FifoLot,
  RealizedGainResult,
  RemittanceRecord,
} from '../types/trade';

// ─── Helpers ─────────────────────────────────────────────────────────────

type TradeOverride = Partial<Omit<TradeTransaction, 'id'>> & { id?: string };
type LotOverride = Partial<Omit<FifoLot, 'tradeId'>> & { tradeId?: string };

function makeTrade(overrides: TradeOverride = {}): TradeTransaction {
  return {
    id: overrides.id ?? `t_${Math.random().toString(36).slice(2)}`,
    date: overrides.date ?? '2026-01-15',
    symbol: overrides.symbol ?? 'AAPL',
    type: overrides.type ?? 'BUY',
    provider: overrides.provider ?? 'Dime',
    quantity: overrides.quantity ?? 10,
    priceUSD: overrides.priceUSD ?? 150,
    commissionUSD: overrides.commissionUSD ?? 1,
    exchangeFeeUSD: overrides.exchangeFeeUSD ?? 0,
    tafFeeUSD: overrides.tafFeeUSD ?? 0,
    commissionRebateUSD: overrides.commissionRebateUSD ?? 0,
    vatUSD: overrides.vatUSD ?? 0,
    ...overrides,
  } as TradeTransaction;
}

function makeLot(overrides: LotOverride = {}): FifoLot {
  return {
    tradeId: overrides.tradeId ?? 'lot_1',
    date: overrides.date ?? '2026-01-15',
    symbol: overrides.symbol ?? 'AAPL',
    provider: overrides.provider ?? 'Dime',
    unitCostUSD: overrides.unitCostUSD ?? 150.1,
    remainingQuantity: overrides.remainingQuantity ?? 10,
    originalQuantity: overrides.originalQuantity ?? 10,
    ...overrides,
  } as FifoLot;
}

// ─── calculateBuyCostUSD ────────────────────────────────────────────────

describe('calculateBuyCostUSD', () => {
  it('computes quantity × price + commission for BUY', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1 });
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1); // 1501
  });

  it('returns 0 for SELL trade', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 5, priceUSD: 200, commissionUSD: 2 });
    expect(calculateBuyCostUSD(trade)).toBe(0);
  });

  it('includes exchangeFeeUSD in BUY cost', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1, exchangeFeeUSD: 0.5 });
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1 + 0.5); // 1501.5
  });

  it('tafFeeUSD is NOT included in BUY cost (only for SELL)', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 999 });
    // tafFee is only subtracted on SELL, not added on BUY
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1 + 0.5); // 1501.5
  });
});

// ─── calculateSellRevenueUSD ────────────────────────────────────────────

describe('calculateSellRevenueUSD', () => {
  it('computes quantity × price − commission for SELL', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2 });
    expect(calculateSellRevenueUSD(trade)).toBe(200 * 10 - 2); // 1998
  });

  it('returns 0 for BUY trade', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 5, priceUSD: 100, commissionUSD: 1 });
    expect(calculateSellRevenueUSD(trade)).toBe(0);
  });

  it('subtracts exchangeFeeUSD from SELL revenue', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2, exchangeFeeUSD: 0.5 });
    expect(calculateSellRevenueUSD(trade)).toBe(200 * 10 - 2 - 0.5); // 1997.5
  });

  it('subtracts tafFeeUSD from SELL revenue', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2, exchangeFeeUSD: 0.5, tafFeeUSD: 0.15 });
    expect(calculateSellRevenueUSD(trade)).toBe(200 * 10 - 2 - 0.5 - 0.15); // 1997.35
  });

  it('subtracts all three fees from SELL revenue', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 5, priceUSD: 100, commissionUSD: 1, exchangeFeeUSD: 0.3, tafFeeUSD: 0.08 });
    expect(calculateSellRevenueUSD(trade)).toBe(100 * 5 - 1 - 0.3 - 0.08); // 498.62
  });

  it('subtracts commissionRebateUSD from BUY cost (reduces cost)', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1, exchangeFeeUSD: 0.5, commissionRebateUSD: 0.5 });
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1 + 0.5 - 0.5); // 1501
  });

  it('adds commissionRebateUSD to SELL revenue (increases revenue)', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2, exchangeFeeUSD: 0.5, tafFeeUSD: 0.15, commissionRebateUSD: 1 });
    expect(calculateSellRevenueUSD(trade)).toBe(200 * 10 - 2 - 0.5 - 0.15 + 1); // 1998.35
  });

  it('zero rebate — same as before', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1, exchangeFeeUSD: 0.5 });
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1 + 0.5); // 1501.5
  });

  it('includes vatUSD in BUY cost (like commission)', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1, exchangeFeeUSD: 0.5, vatUSD: 0.07 });
    expect(calculateBuyCostUSD(trade)).toBe(150 * 10 + 1 + 0.5 + 0.07); // 1501.57
  });

  it('subtracts vatUSD from SELL revenue (like commission)', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2, exchangeFeeUSD: 0.5, tafFeeUSD: 0.15, vatUSD: 0.14 });
    expect(calculateSellRevenueUSD(trade)).toBe(200 * 10 - 2 - 0.5 - 0.15 - 0.14); // 1997.21
  });
});

// ─── calculateUnitCostUSD ────────────────────────────────────────────────

describe('calculateUnitCostUSD', () => {
  it('returns cost per unit for BUY', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 1 });
    expect(calculateUnitCostUSD(trade)).toBeCloseTo(150.1);
  });

  it('returns 0 for SELL', () => {
    const trade = makeTrade({ type: 'SELL', quantity: 5, priceUSD: 200, commissionUSD: 1 });
    expect(calculateUnitCostUSD(trade)).toBe(0);
  });

  it('returns 0 when quantity is 0', () => {
    const trade = makeTrade({ type: 'BUY', quantity: 0, priceUSD: 150, commissionUSD: 0 });
    expect(calculateUnitCostUSD(trade)).toBe(0);
  });
});

// ─── validateSellLots ───────────────────────────────────────────────────

describe('validateSellLots', () => {
  it('valid — sufficient lots', () => {
    const sell = makeTrade({ type: 'SELL', quantity: 5 });
    const lots: FifoLot[] = [
      makeLot({ remainingQuantity: 10, originalQuantity: 10 }),
    ];
    const result = validateSellLots(sell, lots);
    expect(result.valid).toBe(true);
    expect(result.availableQuantity).toBe(10);
    expect(result.requestedQuantity).toBe(5);
  });

  it('invalid — insufficient lots', () => {
    const sell = makeTrade({ type: 'SELL', quantity: 15 });
    const lots: FifoLot[] = [
      makeLot({ remainingQuantity: 10, originalQuantity: 10 }),
    ];
    const result = validateSellLots(sell, lots);
    expect(result.valid).toBe(false);
    expect(result.availableQuantity).toBe(10);
    expect(result.requestedQuantity).toBe(15);
    expect(result.message).toContain('Insufficient lots');
  });

  it('invalid — no lots at all', () => {
    const sell = makeTrade({ type: 'SELL', quantity: 5 });
    const result = validateSellLots(sell, []);
    expect(result.valid).toBe(false);
    expect(result.availableQuantity).toBe(0);
    expect(result.requestedQuantity).toBe(5);
  });

  it('valid — exact quantity match', () => {
    const sell = makeTrade({ type: 'SELL', quantity: 10 });
    const lots: FifoLot[] = [
      makeLot({ remainingQuantity: 10, originalQuantity: 10 }),
    ];
    const result = validateSellLots(sell, lots);
    expect(result.valid).toBe(true);
  });
});

// ─── processSellTrade ───────────────────────────────────────────────────

describe('processSellTrade', () => {
  it('single lot — full match', () => {
    // SELL 5 @ $200, commission $2 → revenue = 5*200 - 2 = $998
    // Matched 5 @ unitCost $150.1 → cost = 5 * 150.1 = $750.5
    // Gain = $998 - $750.5 = $247.5
    const sell = makeTrade({ type: 'SELL', quantity: 5, priceUSD: 200, commissionUSD: 2 });
    const lots: FifoLot[] = [
      makeLot({ tradeId: 'b1', remainingQuantity: 10, unitCostUSD: 150.1 }),
    ];

    const { result, updatedLots } = processSellTrade(sell, lots);

    expect(result.gainUSD).toBeCloseTo(247.5);
    expect(result.sellRevenueUSD).toBeCloseTo(998);
    expect(result.matchedLots).toHaveLength(1);
    expect(result.matchedLots[0].buyTradeId).toBe('b1');
    expect(result.matchedLots[0].matchedQuantity).toBe(5);
    expect(updatedLots).toHaveLength(1);
    expect(updatedLots[0].remainingQuantity).toBe(5); // 10 - 5
  });

  it('multiple lots — partial fill from each', () => {
    // SELL 8 @ $200, commission $0 → revenue = 8*200 = $1,600
    // b1 (5 @ $100): matched 5, cost = $500, newRemaining = 0 (NOT added)
    // b2 (5 @ $120): matched 3, cost = $360, newRemaining = 2 (ADDED)
    // Total cost = $860, Gain = $1600 - $860 = $740
    const sell = makeTrade({ type: 'SELL', quantity: 8, priceUSD: 200, commissionUSD: 0 });
    const lots: FifoLot[] = [
      makeLot({ tradeId: 'b1', remainingQuantity: 5, unitCostUSD: 100 }),
      makeLot({ tradeId: 'b2', remainingQuantity: 5, unitCostUSD: 120 }),
    ];

    const { result, updatedLots } = processSellTrade(sell, lots);

    expect(result.matchedLots).toHaveLength(2);
    expect(result.matchedLots[0].matchedQuantity).toBe(5);
    expect(result.matchedLots[1].matchedQuantity).toBe(3);
    // Only lots with remainingQuantity > 0 are returned
    expect(updatedLots).toHaveLength(1);
    expect(updatedLots[0].tradeId).toBe('b2');
    expect(updatedLots[0].remainingQuantity).toBe(2); // 5 - 3
  });

  it('throws when not enough lots', () => {
    const sell = makeTrade({ type: 'SELL', quantity: 20 });
    const lots: FifoLot[] = [
      makeLot({ remainingQuantity: 10 }),
    ];

    expect(() => processSellTrade(sell, lots)).toThrow('Insufficient lots');
  });

  it('gainPercent computed correctly', () => {
    // BUY: 10 × $150 + $1 = $1501 → unit cost $150.1
    // SELL: 10 × $200 - $2 = $1998
    // Gain: $1998 - $1501 = $497, gainPercent: 497/1998
    const sell = makeTrade({ type: 'SELL', quantity: 10, priceUSD: 200, commissionUSD: 2 });
    const lots: FifoLot[] = [
      makeLot({ remainingQuantity: 10, unitCostUSD: 150.1 }),
    ];

    const { result } = processSellTrade(sell, lots);
    expect(result.gainPercent).toBeCloseTo(result.gainUSD / result.sellRevenueUSD);
  });
});

// ─── computeAllRealizedGains ────────────────────────────────────────────

describe('computeAllRealizedGains', () => {
  it('FIFO matches same symbol + same provider only', () => {
    const trades: TradeTransaction[] = [
      makeTrade({ id: 'b1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 }),
      makeTrade({ id: 'b2', date: '2026-01-02', symbol: 'AAPL', type: 'BUY', provider: 'Liberator', quantity: 10, priceUSD: 160, commissionUSD: 0 }),
      makeTrade({ id: 's1', date: '2026-01-10', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 5, priceUSD: 200, commissionUSD: 0 }),
    ];

    const { gains } = computeAllRealizedGains(trades);

    expect(gains).toHaveLength(1);
    expect(gains[0].sellTradeId).toBe('s1');
    expect(gains[0].matchedLots[0].buyTradeId).toBe('b1');
    expect(gains[0].matchedLots[0].buyProvider).toBe('Dime');
  });

  it('cross-provider SELL throws', () => {
    const trades: TradeTransaction[] = [
      makeTrade({ id: 'b1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 }),
      makeTrade({ id: 's1', date: '2026-01-10', symbol: 'AAPL', type: 'SELL', provider: 'Liberator', quantity: 5, priceUSD: 200, commissionUSD: 0 }),
    ];

    expect(() => computeAllRealizedGains(trades)).toThrow('Insufficient lots');
  });

  it('multi-provider — separate pools', () => {
    const trades: TradeTransaction[] = [
      makeTrade({ id: 'b1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 }),
      makeTrade({ id: 'b2', date: '2026-01-02', symbol: 'AAPL', type: 'BUY', provider: 'Liberator', quantity: 20, priceUSD: 160, commissionUSD: 0 }),
      makeTrade({ id: 's1', date: '2026-01-10', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 8, priceUSD: 200, commissionUSD: 0 }),
      makeTrade({ id: 's2', date: '2026-01-11', symbol: 'AAPL', type: 'SELL', provider: 'Liberator', quantity: 5, priceUSD: 200, commissionUSD: 0 }),
    ];

    const { gains, remainingLots } = computeAllRealizedGains(trades);

    expect(gains).toHaveLength(2);
    // SELL1 — Dime AAPL 8 → matches b1 (10)
    expect(gains[0].provider).toBe('Dime');
    expect(gains[0].matchedLots[0].buyTradeId).toBe('b1');
    // SELL2 — Liberator AAPL 5 → matches b2 (20)
    expect(gains[1].provider).toBe('Liberator');
    expect(gains[1].matchedLots[0].buyTradeId).toBe('b2');
    // Remaining: Dime AAPL b1 2, Liberator AAPL b2 15
    expect(remainingLots).toHaveLength(2);
  });

  it('trades sorted by date — FIFO order respected', () => {
    const trades: TradeTransaction[] = [
      makeTrade({ id: 'b2', date: '2026-02-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 100, commissionUSD: 0 }),
      makeTrade({ id: 'b1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 }),
      makeTrade({ id: 's1', date: '2026-03-01', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 10, priceUSD: 200, commissionUSD: 0 }),
    ];

    const { gains } = computeAllRealizedGains(trades);

    // Older lot (b1, Jan) should be matched first
    expect(gains[0].matchedLots[0].buyTradeId).toBe('b1');
    expect(gains[0].matchedLots[0].buyDate).toBe('2026-01-01');
  });

  it('loss trade — negative gainUSD', () => {
    const trades: TradeTransaction[] = [
      makeTrade({ id: 'b1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 200, commissionUSD: 0 }),
      makeTrade({ id: 's1', date: '2026-01-10', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 }),
    ];

    const { gains } = computeAllRealizedGains(trades);

    expect(gains[0].gainUSD).toBeLessThan(0); // Sold cheaper than bought
  });
});

// ─── applyRemittance ────────────────────────────────────────────────────

describe('applyRemittance', () => {
  it('full remit — taxable gain = gainPercent × amount × fxRate', () => {
    const gainResult = {
      sellTradeId: 's1',
      sellDate: '2026-01-10',
      symbol: 'AAPL',
      provider: 'Dime' as const,
      sellQuantity: 10,
      sellRevenueUSD: 2000,
      buyCostBasisUSD: 1500,
      gainUSD: 500,
      gainPercent: 0.25, // 500/2000
      matchedLots: [],
      totalRemittedUSD: 0,
      remainingProceedsUSD: 2000,
      remittances: [],
      taxableGainTHB: 0,
    };

    const remittance = {
      id: 'r1',
      sellTradeId: 's1',
      amountUSD: 2000,
      remitDate: '2026-02-01',
      fxRateTHB: 36,
    };

    const result = applyRemittance(gainResult, remittance);

    // Taxable = 2000 × 0.25 × 36 = 18,000
    expect(result.taxableGainTHB).toBeCloseTo(2000 * 0.25 * 36);
    expect(result.totalRemittedUSD).toBe(2000);
    expect(result.remainingProceedsUSD).toBe(0);
    expect(result.remittances).toHaveLength(1);
  });

  it('partial remit — only gain portion taxable', () => {
    const gainResult = {
      sellTradeId: 's1',
      sellDate: '2026-01-10',
      symbol: 'AAPL',
      provider: 'Dime' as const,
      sellQuantity: 10,
      sellRevenueUSD: 2000,
      buyCostBasisUSD: 1500,
      gainUSD: 500,
      gainPercent: 0.25,
      matchedLots: [],
      totalRemittedUSD: 0,
      remainingProceedsUSD: 2000,
      remittances: [],
      taxableGainTHB: 0,
    };

    const remittance = {
      id: 'r1',
      sellTradeId: 's1',
      amountUSD: 500, // Partial
      remitDate: '2026-02-01',
      fxRateTHB: 35,
    };

    const result = applyRemittance(gainResult, remittance);

    // Taxable = 500 × 0.25 × 35 = 4,375
    expect(result.taxableGainTHB).toBeCloseTo(500 * 0.25 * 35);
    expect(result.totalRemittedUSD).toBe(500);
    expect(result.remainingProceedsUSD).toBe(1500);
  });

  it('throws on zero amount', () => {
    const gainResult = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 2000, buyCostBasisUSD: 1500, gainUSD: 500,
      gainPercent: 0.25, matchedLots: [], totalRemittedUSD: 0, remainingProceedsUSD: 2000,
      remittances: [], taxableGainTHB: 0,
    };
    const remittance = { id: 'r1', sellTradeId: 's1', amountUSD: 0, remitDate: '2026-02-01', fxRateTHB: 36 };

    expect(() => applyRemittance(gainResult, remittance)).toThrow('must be positive');
  });

  it('throws when remittance exceeds remaining proceeds', () => {
    const gainResult = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 2000, buyCostBasisUSD: 1500, gainUSD: 500,
      gainPercent: 0.25, matchedLots: [], totalRemittedUSD: 1500, remainingProceedsUSD: 500,
      remittances: [], taxableGainTHB: 0,
    };
    const remittance = { id: 'r1', sellTradeId: 's1', amountUSD: 1000, remitDate: '2026-02-01', fxRateTHB: 36 };

    expect(() => applyRemittance(gainResult, remittance)).toThrow('exceeds remaining proceeds');
  });

  it('accepts the exact remaining proceeds as the last remittance', () => {
    const gainResult = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 2000, buyCostBasisUSD: 1500, gainUSD: 500,
      gainPercent: 0.25, matchedLots: [], totalRemittedUSD: 1500, remainingProceedsUSD: 500,
      remittances: [], taxableGainTHB: 0,
    };
    const remittance = { id: 'r1', sellTradeId: 's1', amountUSD: 500, remitDate: '2026-02-01', fxRateTHB: 36 };

    expect(validateRemittance(gainResult, remittance)).toEqual({ valid: true });
    expect(applyRemittance(gainResult, remittance).remainingProceedsUSD).toBe(0);
  });

  it('loss trade — taxableGainTHB stays 0', () => {
    const gainResult = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 1000, buyCostBasisUSD: 1500, gainUSD: -500,
      gainPercent: -0.5, matchedLots: [], totalRemittedUSD: 0, remainingProceedsUSD: 1000,
      remittances: [], taxableGainTHB: 0,
    };
    const remittance = { id: 'r1', sellTradeId: 's1', amountUSD: 500, remitDate: '2026-02-01', fxRateTHB: 36 };

    const result = applyRemittance(gainResult, remittance);

    // Even though we remitted money, there's no gain so taxable = 0
    expect(result.taxableGainTHB).toBe(0);
    expect(result.totalRemittedUSD).toBe(500);
  });
});

// ─── validateRemittance ─────────────────────────────────────────────────

describe('validateRemittance', () => {
  /** Sale with 2,000 of proceeds, 1,500 remitted, so 500 still available. */
  const gainWithRoom = (): RealizedGainResult => ({
    sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
    sellQuantity: 10, sellRevenueUSD: 2000, buyCostBasisUSD: 1500, gainUSD: 500,
    gainPercent: 0.25, matchedLots: [], totalRemittedUSD: 1500, remainingProceedsUSD: 500,
    remittances: [], taxableGainTHB: 0,
  });

  const remittanceOf = (amountUSD: number, sellTradeId = 's1'): RemittanceRecord => ({
    id: `r-${amountUSD}`, sellTradeId, amountUSD, remitDate: '2026-02-01', fxRateTHB: 36,
  });

  it('rejects zero and negative amounts', () => {
    expect(validateRemittance(gainWithRoom(), remittanceOf(0)).valid).toBe(false);
    expect(validateRemittance(gainWithRoom(), remittanceOf(-1)).valid).toBe(false);
  });

  it('accepts an amount inside the tolerance above the remaining proceeds', () => {
    expect(validateRemittance(gainWithRoom(), remittanceOf(500.004))).toEqual({ valid: true });
  });

  it('rejects an amount outside the tolerance above the remaining proceeds', () => {
    const result = validateRemittance(gainWithRoom(), remittanceOf(500.006));

    expect(result.valid).toBe(false);
    expect(result.message).toContain('500.00');
  });

  it('rejects a remittance recorded against another sale', () => {
    const result = validateRemittance(gainWithRoom(), remittanceOf(100, 's2'));

    expect(result.valid).toBe(false);
    expect(result.message).toContain('does not match');
  });

  it('agrees with applyRemittance for the same input', () => {
    const cases = [500, 500.004, 500.006, 0, -1];

    for (const amountUSD of cases) {
      const gain = gainWithRoom();
      const remittance = remittanceOf(amountUSD);
      const verdict = validateRemittance(gain, remittance);

      if (verdict.valid) {
        expect(() => applyRemittance(gain, remittance)).not.toThrow();
      } else {
        expect(() => applyRemittance(gain, remittance)).toThrow(verdict.message);
      }
    }
  });
});

// ─── computeTaxableGainsTHB ─────────────────────────────────────────────

describe('computeTaxableGainsTHB', () => {
  it('only gains with gainUSD > 0 contribute to taxableGainTHB', () => {
    const gains = [
      { gainUSD: 500, taxableGainTHB: 18000 },
      { gainUSD: -200, taxableGainTHB: 0 },
    ] as any[];

    const result = computeTaxableGainsTHB(gains);
    expect(result.taxableGainTHB).toBe(18000);
    expect(result.excludedLossesTHB).toBe(200);
  });

  it('multiple gains accumulated', () => {
    const gains = [
      { gainUSD: 100, taxableGainTHB: 1000 },
      { gainUSD: 200, taxableGainTHB: 2000 },
      { gainUSD: -50, taxableGainTHB: 0 },
    ] as any[];

    const result = computeTaxableGainsTHB(gains);
    expect(result.taxableGainTHB).toBe(3000);
    expect(result.excludedLossesTHB).toBe(50);
  });
});

// ─── formatGainIndicator ────────────────────────────────────────────────

describe('formatGainIndicator', () => {
  it('positive — shows +฿', () => {
    expect(formatGainIndicator(1234.5)).toBe('+฿1,234.50');
  });

  it('negative — shows -฿', () => {
    expect(formatGainIndicator(-999.99)).toBe('-฿999.99');
  });

  it('zero — shows ฿0.00', () => {
    expect(formatGainIndicator(0)).toBe('฿0.00');
  });
});

// ─── Notional (slip gross amount) ───────────────────────────────────────

describe('notionalUSD', () => {
  it('prefers a recorded gross amount over quantity × price', () => {
    const trade = makeTrade({ quantity: 224, priceUSD: 29.67, grossAmountUSD: 6647.13 });
    expect(notionalUSD(trade)).toBe(6647.13);
  });

  it('falls back to quantity × price when the gross amount is absent', () => {
    const trade = makeTrade({ quantity: 173, priceUSD: 29.15 });
    expect(notionalUSD(trade)).toBeCloseTo(5042.95, 2);
  });

  it('uses a recorded gross amount even when it is 0', () => {
    const trade = makeTrade({ quantity: 10, priceUSD: 150, grossAmountUSD: 0 });
    expect(notionalUSD(trade)).toBe(0);
  });
});

describe('isNotionalFromFallback', () => {
  it('is true when the gross amount is absent', () => {
    expect(isNotionalFromFallback(makeTrade({ quantity: 10, priceUSD: 150 }))).toBe(true);
  });

  it('is false when the gross amount is 0', () => {
    expect(isNotionalFromFallback(makeTrade({ quantity: 10, priceUSD: 150, grossAmountUSD: 0 }))).toBe(false);
  });

  it('is false when the gross amount is recorded', () => {
    expect(isNotionalFromFallback(makeTrade({ quantity: 224, priceUSD: 29.67, grossAmountUSD: 6647.13 }))).toBe(false);
  });
});

describe('notionalMismatchUSD', () => {
  it('stays silent for the 224-share price rounding gap of 1.05', () => {
    const trade = makeTrade({ quantity: 224, priceUSD: 29.67, grossAmountUSD: 6647.13 });
    expect(notionalMismatchUSD(trade)).toBeNull();
  });

  it('stays silent for the one-cent gap on 43 shares', () => {
    const trade = makeTrade({ quantity: 43, priceUSD: 28.61, grossAmountUSD: 1230.22 });
    expect(notionalMismatchUSD(trade)).toBeNull();
  });

  it('reports a material gap, naming both figures', () => {
    const trade = makeTrade({ quantity: 173, priceUSD: 29.15, grossAmountUSD: 5103.50 });
    const mismatch = notionalMismatchUSD(trade);
    expect(mismatch).not.toBeNull();
    expect(mismatch!.gross).toBe(5103.5);
    expect(mismatch!.derived).toBeCloseTo(5042.95, 2);
    expect(mismatch!.delta).toBeCloseTo(60.55, 2);
  });

  it('stays silent when the gross amount is absent', () => {
    expect(notionalMismatchUSD(makeTrade({ quantity: 173, priceUSD: 29.15 }))).toBeNull();
  });
});

describe('slip gross amount reaching the tax figure', () => {
  const grossSell = makeTrade({
    id: 'sell224', date: '2026-05-18', type: 'SELL', quantity: 224, priceUSD: 29.67, grossAmountUSD: 6647.13,
    commissionUSD: 9.97, exchangeFeeUSD: 0.14, tafFeeUSD: 0.05, vatUSD: 0.7,
  });
  const legacySell = makeTrade({
    id: 'sell224', date: '2026-05-18', type: 'SELL', quantity: 224, priceUSD: 29.67,
    commissionUSD: 9.97, exchangeFeeUSD: 0.14, tafFeeUSD: 0.05, vatUSD: 0.7,
  });
  const remittance = {
    id: 'r224', sellTradeId: 'sell224', amountUSD: 6636.27, remitDate: '2026-07-29', fxRateTHB: 32.68,
  };

  function sellIntoLot(sell: TradeTransaction) {
    const lot = makeLot({
      tradeId: 'buy323',
      unitCostUSD: 28.52,
      remainingQuantity: 224,
      originalQuantity: 323,
    });
    return processSellTrade(sell, [lot]).result;
  }

  it('revenue matches the remittance when the gross amount is recorded', () => {
    const result = sellIntoLot(grossSell);
    expect(result.sellRevenueUSD).toBeCloseTo(6636.27, 2);
    expect(() => applyRemittance(result, remittance)).not.toThrow();
  });

  it('revenue falls short of the remittance without the gross amount', () => {
    const result = sellIntoLot(legacySell);
    expect(result.sellRevenueUSD).toBeCloseTo(6635.22, 2);
    expect(() => applyRemittance(result, remittance)).toThrow(/exceeds remaining proceeds/);
  });

  it('costs lots by their slip gross amount', () => {
    const lots = [
      makeLot({ tradeId: 'b323', unitCostUSD: 9211.96 / 323, originalQuantity: 323, remainingQuantity: 8 }),
      makeLot({ tradeId: 'b173', unitCostUSD: 5042.93 / 173, originalQuantity: 173, remainingQuantity: 173 }),
      makeLot({ tradeId: 'b43', unitCostUSD: 1230.22 / 43, originalQuantity: 43, remainingQuantity: 43 }),
    ];
    const result = processSellTrade(grossSell, lots).result;
    expect(result.buyCostBasisUSD).toBeCloseTo(6501.31, 2);
    expect(result.gainUSD).toBeCloseTo(134.96, 2);
  });
});

// ─── Reinvested proceeds ────────────────────────────────────────────────

type GainOverride = Partial<Omit<RealizedGainResult, 'sellTradeId'>> & { sellTradeId?: string };

function makeGain(overrides: GainOverride = {}): RealizedGainResult {
  const sellRevenueUSD = overrides.sellRevenueUSD ?? 1000;
  const totalRemittedUSD = overrides.totalRemittedUSD ?? 0;
  const reinvestedUSD = overrides.reinvestedUSD;
  const gain: RealizedGainResult = {
    sellTradeId: overrides.sellTradeId ?? `sell_${Math.random().toString(36).slice(2)}`,
    sellDate: overrides.sellDate ?? '2026-03-01',
    symbol: overrides.symbol ?? 'ALLW',
    provider: overrides.provider ?? 'Dime',
    sellQuantity: overrides.sellQuantity ?? 1,
    sellRevenueUSD,
    buyCostBasisUSD: overrides.buyCostBasisUSD ?? sellRevenueUSD * 0.9,
    gainUSD: overrides.gainUSD ?? sellRevenueUSD * 0.1,
    gainPercent: overrides.gainPercent ?? 0.1,
    matchedLots: overrides.matchedLots ?? [],
    totalRemittedUSD,
    remainingProceedsUSD: sellRevenueUSD - totalRemittedUSD - (reinvestedUSD ?? 0),
    remittances: overrides.remittances ?? [],
    taxableGainTHB: overrides.taxableGainTHB ?? 0,
  };
  if (reinvestedUSD !== undefined) gain.reinvestedUSD = reinvestedUSD;
  return gain;
}

function makeRemittance(
  sellTradeId: string,
  amountUSD: number,
  remitDate = '2026-06-01',
  fxRateTHB = 32
): RemittanceRecord {
  return {
    id: `remit_${Math.random().toString(36).slice(2)}`,
    sellTradeId,
    amountUSD,
    remitDate,
    fxRateTHB,
  };
}

describe('applyRemittance with reinvested proceeds', () => {
  // 2026-02-13: sold 7 ALLW for 204.75; 146.43 of it funded another purchase.
  const sellId = 'sell_allw_0213';
  const allw = () =>
    makeGain({
      sellTradeId: sellId,
      sellDate: '2026-02-13',
      sellRevenueUSD: 204.75,
      buyCostBasisUSD: 199.64,
      gainUSD: 5.11,
      gainPercent: 5.11 / 204.75,
      reinvestedUSD: 146.43,
    });

  it('accepts a remittance equal to what the reinvestment left behind', () => {
    const result = applyRemittance(allw(), makeRemittance(sellId, 58.32, '2026-03-09', 32.0355));
    expect(result.totalRemittedUSD).toBeCloseTo(58.32, 2);
    expect(result.remainingProceedsUSD).toBeCloseTo(0, 2);
    expect(result.remittances).toHaveLength(1);
  });

  it('refuses a remittance that would reach into the reinvested portion', () => {
    expect(() => applyRemittance(allw(), makeRemittance(sellId, 58.33))).toThrow(
      /exceeds remaining proceeds/
    );
    expect(() => applyRemittance(allw(), makeRemittance(sellId, 58.33))).toThrow(
      /Available: \$58\.32/
    );
  });

  it('behaves exactly as before when no amount was recorded', () => {
    const gain = makeGain({ sellTradeId: sellId, sellRevenueUSD: 2000, totalRemittedUSD: 1500 });
    const result = applyRemittance(gain, makeRemittance(sellId, 500));
    expect(result.totalRemittedUSD).toBeCloseTo(2000, 2);
    expect(result.remainingProceedsUSD).toBeCloseTo(0, 2);
    expect(() => applyRemittance(gain, makeRemittance(sellId, 500.02))).toThrow(
      /exceeds remaining proceeds/
    );
  });
});

describe('applyReinvestedAmount', () => {
  const base = () => makeGain({ sellRevenueUSD: 1000, totalRemittedUSD: 200 });

  it('records the amount and shrinks the available balance', () => {
    const result = applyReinvestedAmount(base(), 300);
    expect(result.reinvestedUSD).toBe(300);
    expect(result.remainingProceedsUSD).toBeCloseTo(500, 2);
  });

  it('replaces a previously recorded amount instead of adding to it', () => {
    const result = applyReinvestedAmount(applyReinvestedAmount(base(), 300), 100);
    expect(result.reinvestedUSD).toBe(100);
    expect(result.remainingProceedsUSD).toBeCloseTo(700, 2);
  });

  it('clears the amount when zero is recorded', () => {
    const result = applyReinvestedAmount(applyReinvestedAmount(base(), 300), 0);
    expect(result.reinvestedUSD).toBe(0);
    expect(result.remainingProceedsUSD).toBeCloseTo(800, 2);
  });

  it('refuses an amount above what remittances left behind', () => {
    expect(() => applyReinvestedAmount(base(), 800.01)).toThrow(
      /exceeds remaining proceeds. Available: \$800\.00/
    );
  });

  it('refuses negative and non-finite amounts', () => {
    expect(() => applyReinvestedAmount(base(), -1)).toThrow(/cannot be negative/);
    expect(() => applyReinvestedAmount(base(), Number.NaN)).toThrow(/finite/);
  });
});

describe('computeGainSummary', () => {
  it('a fully reinvested sale has nothing outstanding', () => {
    const gain = makeGain({
      sellRevenueUSD: 204.75,
      totalRemittedUSD: 58.32,
      reinvestedUSD: 146.43,
    });
    const summary = computeGainSummary([gain]);
    expect(summary.unremittedUSD).toBeCloseTo(0, 2);
    expect(summary.totalReinvestedUSD).toBeCloseTo(146.43, 2);
    expect(summary.rows).toHaveLength(0);
  });

  it('a partly remitted sale leaves its remainder outstanding', () => {
    const summary = computeGainSummary([makeGain({ sellRevenueUSD: 1000, totalRemittedUSD: 300 })]);
    expect(summary.unremittedUSD).toBeCloseTo(700, 2);
    expect(summary.totalReinvestedUSD).toBe(0);
    expect(summary.rows).toHaveLength(1);
    expect(summary.rows[0].availableBalanceUSD).toBeCloseTo(700, 2);
  });

  it('a sale with no remittances is fully outstanding', () => {
    const summary = computeGainSummary([
      makeGain({ sellTradeId: 'sell_new', sellDate: '2026-05-26', sellRevenueUSD: 500 }),
    ]);
    expect(summary.unremittedUSD).toBeCloseTo(500, 2);
    expect(summary.rows[0]).toMatchObject({
      sellTradeId: 'sell_new',
      sellDate: '2026-05-26',
      sellRevenueUSD: 500,
      totalRemittedUSD: 0,
      reinvestedUSD: 0,
    });
    expect(summary.rows[0].availableBalanceUSD).toBeCloseTo(500, 2);
  });

  it('clamps one over-recorded gain instead of letting it offset another', () => {
    const overRecorded = makeGain({ sellTradeId: 'sell_over', sellRevenueUSD: 100, totalRemittedUSD: 150 });
    const clean = makeGain({ sellTradeId: 'sell_clean', sellRevenueUSD: 100 });
    const summary = computeGainSummary([overRecorded, clean]);
    expect(summary.unremittedUSD).toBeCloseTo(100, 2);
    expect(summary.rows.map(r => r.sellTradeId)).toEqual(['sell_clean']);
  });

  it('orders outstanding rows by sale date then symbol', () => {
    const summary = computeGainSummary([
      makeGain({ sellTradeId: 'b', sellDate: '2026-04-06', symbol: 'SPGI' }),
      makeGain({ sellTradeId: 'a', sellDate: '2026-02-13', symbol: 'ALLW' }),
      makeGain({ sellTradeId: 'c', sellDate: '2026-04-06', symbol: 'ALLW' }),
    ]);
    expect(summary.rows.map(r => r.sellTradeId)).toEqual(['a', 'c', 'b']);
  });

  it('keeps each gain independent of remittance timing and other sales', () => {
    const saleA = makeGain({ sellTradeId: 'sell_a', sellRevenueUSD: 1000 });
    const saleB = makeGain({ sellTradeId: 'sell_b', sellRevenueUSD: 500 });
    const invested = [applyReinvestedAmount(saleA, 400), applyReinvestedAmount(saleB, 200)];

    const before = computeGainSummary(invested);
    expect(before.totalReinvestedUSD).toBeCloseTo(600, 2);
    // 1000 - 400 held offshore in sale A, 500 - 200 in sale B
    expect(before.unremittedUSD).toBeCloseTo(900, 2);

    // Sale B gets its full remittance and gives up its reinvested amount;
    // sale A must not move as a result.
    const afterB = applyReinvestedAmount(
      applyRemittance(invested[1], makeRemittance('sell_b', 300)),
      0
    );
    const after = computeGainSummary([invested[0], afterB]);
    expect(after.totalReinvestedUSD).toBeCloseTo(400, 2);
    expect(after.unremittedUSD).toBeCloseTo(800, 2);
    expect(after.rows.map(r => r.availableBalanceUSD)).toEqual([expect.closeTo(600, 2), expect.closeTo(200, 2)]);
  });
});

describe('computeTaxSummary', () => {
  const priorYearBuy = makeTrade({
    id: 'buy_2025', date: '2025-11-10', type: 'BUY', symbol: 'ALLW', quantity: 1, priceUSD: 100, commissionUSD: 0,
  });
  const currentYearSell = makeTrade({
    id: 'sell_2026', date: '2026-03-02', type: 'SELL', symbol: 'ALLW', quantity: 1, priceUSD: 200, commissionUSD: 0,
  });

  it('summarises a sale of shares bought in an earlier year', () => {
    const summary = computeTaxSummary([priorYearBuy, currentYearSell], 2026);
    expect(summary.totalSellCount).toBe(1);
    expect(summary.totalRevenueUSD).toBeCloseTo(200, 2);
    expect(summary.netGainUSD).toBeCloseTo(100, 2);
  });

  it('uses caller-supplied gains as the base', () => {
    const gains = [
      makeGain({
        sellTradeId: 'sell_supplied',
        sellRevenueUSD: 750,
        totalRemittedUSD: 250,
        remittances: [makeRemittance('sell_supplied', 250, '2026-04-01')],
      }),
    ];
    const summary = computeTaxSummary([], 2026, gains);
    expect(summary.totalRevenueUSD).toBeCloseTo(750, 2);
    expect(summary.totalRemittedUSD).toBeCloseTo(250, 2);
    expect(summary.remittedSellCount).toBe(1);
    expect(summary.providerBreakdown.map(p => p.provider)).toEqual(['Dime']);
  });

  it('counts a sale with no remittance and excludes another year’s sale', () => {
    const thisYear = makeGain({ sellTradeId: 'sell_this', sellDate: '2026-02-13', sellRevenueUSD: 204.75, totalRemittedUSD: 58.32 });
    const otherYear = makeGain({ sellTradeId: 'sell_other', sellDate: '2025-12-01', sellRevenueUSD: 300 });
    const summary = computeTaxSummary([], 2026, [thisYear, otherYear]);
    expect(summary.totalSellCount).toBe(1);
    expect(summary.totalRevenueUSD).toBeCloseTo(204.75, 2);
    expect(summary.unremittedUSD).toBeCloseTo(146.43, 2);
    expect(summary.totalReinvestedUSD).toBe(0);
    expect(summary.outstandingRows.map(r => r.sellTradeId)).toEqual(['sell_this']);
  });

  it('counts each year’s remittances once when a sale is remitted across two years', () => {
    const gain = makeGain({
      sellTradeId: 'sell_split',
      sellDate: '2025-12-01',
      sellRevenueUSD: 1000,
      totalRemittedUSD: 500,
      remittances: [
        makeRemittance('sell_split', 300, '2025-12-20', 32),
        makeRemittance('sell_split', 200, '2026-01-15', 32),
      ],
    });

    const y2025 = computeTaxSummary([], 2025, [gain]);
    expect(y2025.totalRemittedUSD).toBeCloseTo(300, 2);
    expect(y2025.taxableGainTHB).toBeCloseTo(960, 2);
    expect(y2025.providerBreakdown.reduce((s, p) => s + p.totalRemittedUSD, 0)).toBeCloseTo(300, 2);
    expect(y2025.providerBreakdown.reduce((s, p) => s + p.taxableGainTHB, 0)).toBeCloseTo(960, 2);
    // The sale is still partly offshore, so it shows in the year it was sold in.
    expect(y2025.outstandingRows.map(r => r.sellTradeId)).toEqual(['sell_split']);

    const y2026 = computeTaxSummary([], 2026, [gain]);
    expect(y2026.totalRemittedUSD).toBeCloseTo(200, 2);
    expect(y2026.taxableGainUSD).toBeCloseTo(20, 2);
    expect(y2026.taxableGainTHB).toBeCloseTo(640, 2);
    expect(y2026.totalRemittanceCount).toBe(1);
    expect(y2026.remittedSellCount).toBe(1);
    expect(y2026.totalSellCount).toBe(0);
    expect(y2026.unremittedUSD).toBe(0);
    expect(y2026.outstandingRows).toHaveLength(0);
    expect(y2026.providerBreakdown.reduce((s, p) => s + p.totalRemittedUSD, 0)).toBeCloseTo(200, 2);
    expect(y2026.providerBreakdown.reduce((s, p) => s + p.taxableGainTHB, 0)).toBeCloseTo(640, 2);
  });

  it('reads excluded losses from the year’s remittances without letting them shrink the taxable figure', () => {
    const winner = makeGain({
      sellTradeId: 'sell_win',
      sellDate: '2025-07-01',
      sellRevenueUSD: 1000,
      gainPercent: 0.1,
      totalRemittedUSD: 500,
      remittances: [makeRemittance('sell_win', 500, '2026-03-01', 32)],
    });
    const loser = makeGain({
      sellTradeId: 'sell_loss',
      sellDate: '2025-06-01',
      sellRevenueUSD: 1000,
      gainUSD: -100,
      gainPercent: -0.1,
      totalRemittedUSD: 400,
      remittances: [makeRemittance('sell_loss', 400, '2026-02-01', 32)],
    });

    const summary = computeTaxSummary([], 2026, [winner, loser]);
    expect(summary.totalRemittedUSD).toBeCloseTo(900, 2);
    expect(summary.taxableGainUSD).toBeCloseTo(50, 2);
    expect(summary.taxableGainTHB).toBeCloseTo(1600, 2);
    expect(summary.excludedLossesUSD).toBeCloseTo(40, 2);
    expect(summary.remittedSellCount).toBe(2);
  });

  it('splits the year’s remittances across provider rows that sum to the totals', () => {
    const dime = makeGain({
      sellTradeId: 'sell_dime',
      sellRevenueUSD: 1000,
      gainPercent: 0.1,
      totalRemittedUSD: 500,
      remittances: [makeRemittance('sell_dime', 500, '2026-04-01', 32.5)],
    });
    const syrus = makeGain({
      sellTradeId: 'sell_syrus',
      provider: 'FinansiaSyrus',
      sellRevenueUSD: 400,
      gainPercent: 0.05,
      totalRemittedUSD: 200,
      remittances: [makeRemittance('sell_syrus', 200, '2026-05-01', 33.1)],
    });

    const summary = computeTaxSummary([], 2026, [dime, syrus]);
    const sumRemitted = summary.providerBreakdown.reduce((s, p) => s + p.totalRemittedUSD, 0);
    const sumTaxableTHB = summary.providerBreakdown.reduce((s, p) => s + p.taxableGainTHB, 0);
    expect(summary.providerBreakdown.map(p => p.provider)).toEqual(['Dime', 'FinansiaSyrus']);
    expect(sumRemitted).toBeCloseTo(summary.totalRemittedUSD, 2);
    expect(sumTaxableTHB).toBeCloseTo(summary.taxableGainTHB, 2);
    expect(sumRemitted).toBeCloseTo(700, 2);
    expect(sumTaxableTHB).toBeCloseTo(1956, 2);
  });

  it('places a cross-year remittance in exactly one provider row', () => {
    const earlierSale = makeGain({
      sellTradeId: 'sell_2025',
      sellDate: '2025-11-05',
      gainPercent: 0.2,
      sellRevenueUSD: 1000,
      totalRemittedUSD: 100,
      remittances: [makeRemittance('sell_2025', 100, '2026-06-01', 30)],
    });
    const thisYearSale = makeGain({
      sellTradeId: 'sell_2026',
      provider: 'FinansiaSyrus',
      gainPercent: 0.05,
      sellRevenueUSD: 400,
      totalRemittedUSD: 200,
      remittances: [makeRemittance('sell_2026', 200, '2026-05-01', 33.1)],
    });

    const summary = computeTaxSummary([], 2026, [earlierSale, thisYearSale]);
    const dimeRow = summary.providerBreakdown.find(p => p.provider === 'Dime');
    expect(dimeRow).toBeDefined();
    expect(dimeRow?.totalRemittedUSD).toBeCloseTo(100, 2);
    expect(dimeRow?.taxableGainTHB).toBeCloseTo(600, 2);
    expect(dimeRow?.sellCount).toBe(1);
    expect(summary.providerBreakdown.reduce((s, p) => s + p.totalRemittedUSD, 0)).toBeCloseTo(
      summary.totalRemittedUSD,
      2
    );
    expect(summary.providerBreakdown.reduce((s, p) => s + p.taxableGainTHB, 0)).toBeCloseTo(
      summary.taxableGainTHB,
      2
    );
    expect(summary.providerBreakdown.some(p => p.provider === 'Liberator')).toBe(false);
  });

  it('reproduces the imported 2026 book to the cent', () => {
    // Figures measured from the imported book: five Dime sales, 15,881.86
    // remitted in 2026, and 146.43 of the February sale reinvested offshore.
    // The gain percentages are the ones the engine derives from the trades; the
    // planning note quoted ฿10,957.27 from rounded percentages, and the
    // book-measured total is ฿10,958.2488 → ฿10,958.25.
    const book: RealizedGainResult[] = [
      makeGain({
        sellTradeId: 'trd_allw_0213', sellDate: '2026-02-13', symbol: 'ALLW',
        sellRevenueUSD: 204.75, gainPercent: 0.024957264957265024,
        totalRemittedUSD: 58.32, reinvestedUSD: 146.43,
        remittances: [makeRemittance('trd_allw_0213', 58.32, '2026-03-09', 32.0355)],
      }),
      makeGain({
        sellTradeId: 'trd_allw_0406', sellDate: '2026-04-06', symbol: 'ALLW',
        sellRevenueUSD: 7102.84, gainPercent: 0.020267949158364957,
        totalRemittedUSD: 7102.84,
        remittances: [makeRemittance('trd_allw_0406', 7102.84, '2026-04-07', 32.53)],
      }),
      makeGain({
        sellTradeId: 'trd_allw_0408', sellDate: '2026-04-08', symbol: 'ALLW',
        sellRevenueUSD: 1877.25, gainPercent: 0.02768411239845532,
        totalRemittedUSD: 1877.25,
        remittances: [makeRemittance('trd_allw_0408', 1877.25, '2026-04-09', 31.99)],
      }),
      makeGain({
        sellTradeId: 'trd_allw_0518', sellDate: '2026-05-18', symbol: 'ALLW',
        sellRevenueUSD: 6636.27, gainPercent: 0.020336725299000664,
        totalRemittedUSD: 6636.27,
        remittances: [makeRemittance('trd_allw_0518', 6636.27, '2026-05-19', 32.68)],
      }),
      makeGain({
        sellTradeId: 'trd_spgi_0526', sellDate: '2026-05-26', symbol: 'SPGI',
        sellRevenueUSD: 207.18, gainPercent: 0.02307172506998732,
        totalRemittedUSD: 207.18,
        remittances: [makeRemittance('trd_spgi_0526', 207.18, '2026-05-27', 32.55)],
      }),
    ];

    const summary = computeTaxSummary([], 2026, book);
    expect(summary.totalRevenueUSD).toBeCloseTo(16028.29, 2);
    expect(summary.totalRemittedUSD).toBeCloseTo(15881.86, 2);
    expect(summary.totalReinvestedUSD).toBeCloseTo(146.43, 2);
    expect(summary.unremittedUSD).toBeCloseTo(0, 2);
    expect(summary.taxableGainTHB).toBeCloseTo(10958.25, 2);
    expect(summary.providerBreakdown).toHaveLength(1);
    expect(summary.providerBreakdown[0].totalRemittedUSD).toBeCloseTo(summary.totalRemittedUSD, 2);
    expect(summary.providerBreakdown[0].taxableGainTHB).toBeCloseTo(summary.taxableGainTHB, 2);
  });

  it('reports the full proceeds as outstanding when nothing was remitted or reinvested', () => {
    const gain = makeGain({ sellTradeId: 'trd_none', sellRevenueUSD: 321.5 });
    const summary = computeTaxSummary([], 2026, [gain]);
    expect(summary.unremittedUSD).toBeCloseTo(321.5, 2);
    expect(summary.outstandingRows).toHaveLength(1);
  });

  it('leaves a flagged remittance out of every total while the applied one still counts', () => {
    const applied = makeRemittance('trd_flag', 200, '2026-03-10', 32);
    const flagged = { ...makeRemittance('trd_flag', 100, '2026-04-10', 32), unapplied: true as const };
    const gain = makeGain({
      sellTradeId: 'trd_flag',
      sellRevenueUSD: 1000,
      gainPercent: 0.1,
      totalRemittedUSD: 200,
      remittances: [applied, flagged],
    });

    const withFlag = computeTaxSummary([], 2026, [gain]);

    expect(withFlag.totalRemittedUSD).toBeCloseTo(200, 2);
    expect(withFlag.taxableGainUSD).toBeCloseTo(20, 2);
    expect(withFlag.taxableGainTHB).toBeCloseTo(640, 2);
    expect(withFlag.totalRemittanceCount).toBe(1);
    // The stored figure was never recomputed for the flagged record.
    expect(gain.remainingProceedsUSD).toBeCloseTo(800, 2);
    expect(withFlag.providerBreakdown).toHaveLength(1);
    expect(withFlag.providerBreakdown[0].totalRemittedUSD).toBeCloseTo(200, 2);
    expect(withFlag.providerBreakdown[0].taxableGainTHB).toBeCloseTo(640, 2);
    expect(withFlag.providerBreakdown.reduce((s, p) => s + p.totalRemittedUSD, 0))
      .toBeCloseTo(withFlag.totalRemittedUSD, 2);

    const corrected = computeTaxSummary([], 2026, [
      { ...gain, remittances: [applied, { ...flagged, unapplied: false }], totalRemittedUSD: 300, remainingProceedsUSD: 700 },
    ]);

    expect(corrected.totalRemittedUSD).toBeCloseTo(300, 2);
    expect(corrected.taxableGainUSD).toBeCloseTo(30, 2);
    expect(corrected.taxableGainTHB).toBeCloseTo(960, 2);
    expect(corrected.totalRemittanceCount).toBe(2);
    expect(corrected.providerBreakdown[0].totalRemittedUSD).toBeCloseTo(300, 2);
    expect(corrected.providerBreakdown[0].taxableGainTHB).toBeCloseTo(960, 2);
  });
});