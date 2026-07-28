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
  computeTaxableGainsTHB,
  computeTaxSummary,
  formatGainIndicator,
} from './fifoEngine';
import type { TradeTransaction, FifoLot } from '../types/trade';

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
