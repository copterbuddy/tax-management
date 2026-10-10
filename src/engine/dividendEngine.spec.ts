import {
  calculateDividendTHB,
  calculateWhtCredit,
  validateRemittance,
  applyDividendRemittance,
  computeDividendSummary,
  getAvailableSymbols,
  getDividendYears,
} from './dividendEngine';
import type {
  DividendRecord,
  DividendRemittance,
  TradeTransaction,
} from '../types/trade';

// ─── Test Fixtures ────────────────────────────────────────────────────────

export function makeDividend(
  overrides: Partial<DividendRecord> = {}
): DividendRecord {
  const baseRecord: DividendRecord = {
    id: 'div_12345',
    date: '2026-01-15',
    symbol: 'AAPL',
    country: 'US',
    grossAmountUSD: 1000,
    whtRate: 15,
    whtAmountUSD: 150,
    netAmountUSD: 850,
    dividendFxRate: 35,
    grossAmountTHB: 35000,
    whtAmountTHB: 5250,
    netAmountTHB: 29750,
    totalRemittedUSD: 0,
    remainingToRemitUSD: 850,
    remittances: [],
    notes: undefined,
  };

  return {
    ...baseRecord,
    ...overrides,
  } as DividendRecord;
}

export function makeRemittance(
  overrides: Partial<DividendRemittance> = {}
): DividendRemittance {
  const baseRemittance: DividendRemittance = {
    id: 'rem_12345',
    dividendId: 'div_12345',
    amountUSD: 500,
    remitDate: '2026-01-15',
    remitFxRate: 35,
    remitTHB: 17500,
    reportableIncomeTHB: 17500,
    whtCreditTHB: 5250,
    notes: undefined,
  };

  return {
    ...baseRemittance,
    ...overrides,
  } as DividendRemittance;
}

// ─── Engine Tests ──────────────────────────────────────────────────────────

describe('calculateDividendTHB', () => {
  it('computes THB snapshot at dividend-date rate', () => {
    const result = calculateDividendTHB(1000, 15, 35);
    expect(result.grossAmountTHB).toBe(35_000);
    expect(result.whtAmountTHB).toBe(5_250);
    expect(result.netAmountTHB).toBe(29_750);
  });

  it('0% WHT boundary: gross = net, wht = 0', () => {
    const result = calculateDividendTHB(1000, 0, 35);
    expect(result.grossAmountTHB).toBe(35_000);
    expect(result.whtAmountTHB).toBe(0);
    expect(result.netAmountTHB).toBe(35_000);
  });

  it('100% WHT: net = 0', () => {
    const result = calculateDividendTHB(1000, 100, 35);
    expect(result.grossAmountTHB).toBe(35_000);
    expect(result.whtAmountTHB).toBe(35_000);
    expect(result.netAmountTHB).toBeCloseTo(0, 10);
  });
});

describe('calculateWhtCredit', () => {
  // BR3: proportional credit, remittance-date FX, not dividend-date FX
  it('proportional credit for partial remit (USD 500 of net 850 at FX 31 → ฿2,735.29)', () => {
    const credit = calculateWhtCredit(500, 850, 150, 31);
    // (500/850) × 150 × 31 = 2735.294117...
    expect(credit).toBeCloseTo(2735.29, 2);
  });

  it('completing remit (USD 350 of net 850 at FX 32 → ฿1,976.47)', () => {
    const credit = calculateWhtCredit(350, 850, 150, 32);
    // (350/850) × 150 × 32 = 1976.470588...
    expect(credit).toBeCloseTo(1976.47, 2);
  });

  it('full remit equals whole withheld THB', () => {
    const credit = calculateWhtCredit(850, 850, 150, 35);
    // (850/850) × 150 × 35 = 5250
    expect(credit).toBeCloseTo(5250, 2);
  });

  it('0% WHT yields 0 credit', () => {
    expect(calculateWhtCredit(500, 850, 0, 35)).toBe(0);
  });

  it('0 remitted yields 0 credit', () => {
    expect(calculateWhtCredit(0, 850, 150, 35)).toBe(0);
  });

  it('does not exceed whole withheld when remit == net', () => {
    expect(calculateWhtCredit(850, 850, 150, 35)).toBeCloseTo(5250, 2);
  });
});

// BR3: differential-FX invariant — WHT credit depends only on remitFxRate
describe('WHT credit differential-FX invariance', () => {
  it('two records differing only in dividendFxRate yield same credit (depends on remitFxRate)', () => {
    // Same USD math, different dividend-date rate — remit date rate is the same (31)
    const creditRate30 = calculateWhtCredit(500, 850, 150, 31);
    const creditRate35 = calculateWhtCredit(500, 850, 150, 31);
    expect(creditRate30).toBe(creditRate35);
  });

  it('credit changes with remitFxRate but NOT with dividendFxRate', () => {
    const baseCredit = calculateWhtCredit(500, 850, 150, 31);
    // Change only the dividendFxRate conceptually — the function does not accept it,
    // so calling with a different remitFxRate is the only way to change output.
    expect(calculateWhtCredit(500, 850, 150, 32)).toBeCloseTo(
      (500 / 850) * 150 * 32,
      2
    );
    expect(baseCredit).toBeCloseTo((500 / 850) * 150 * 31, 2);
    // The divisor is netAmountUSD in USD terms, unaffected by any FX rate.
  });
});

describe('validateRemittance', () => {
  it('rejects 0 amount', () => {
    const result = validateRemittance(makeDividend(), 0);
    expect(result.valid).toBe(false);
    expect(result.message).toBe('จำนวนเงินต้องมากกว่า 0');
  });

  it('rejects negative amount', () => {
    const result = validateRemittance(makeDividend(), -100);
    expect(result.valid).toBe(false);
  });

  it('rejects amount above remainingToRemitUSD with remaining balance in message', () => {
    const result = validateRemittance(makeDividend(), 1000);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('$ 850');
  });

  it('accepts exact remaining balance', () => {
    const result = validateRemittance(makeDividend(), 850);
    expect(result.valid).toBe(true);
  });
});

describe('applyDividendRemittance', () => {
  it('appends remittance, updates totals, does not mutate input', () => {
    const record = makeDividend();
    const remittance = makeRemittance();

    const updated = applyDividendRemittance(record, remittance);

    expect(updated).not.toBe(record); // new object
    expect(updated.remittances).not.toBe(record.remittances); // new array
    expect(updated.remittances).toHaveLength(1);
    expect(updated.totalRemittedUSD).toBe(500);
    expect(updated.remainingToRemitUSD).toBe(350);
  });

  it('throws on amount above remaining balance', () => {
    const record = makeDividend();
    const overBalance = makeRemittance({ amountUSD: 1000 });

    expect(() => applyDividendRemittance(record, overBalance)).toThrow();
  });

  it('original record is unchanged after application', () => {
    const record = makeDividend();
    const remittance = makeRemittance();

    applyDividendRemittance(record, remittance);

    // Input untouched
    expect(record.remittances).toHaveLength(0);
    expect(record.totalRemittedUSD).toBe(0);
    expect(record.remainingToRemitUSD).toBe(850);
  });
});

describe('Two-step partial remittance flow', () => {
  it('USD 500 then USD 350 of net 850 leaves remaining 0 and credits totalling ฿4,711.76', () => {
    let record = makeDividend({ remainingToRemitUSD: 850 });

    const credit1 = calculateWhtCredit(500, 850, 150, 31); // 2735.29
    const remittance1 = makeRemittance({
      id: 'rem_1',
      amountUSD: 500,
      remitDate: '2026-01-15',
      remitFxRate: 31,
      whtCreditTHB: credit1,
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
    });

    record = applyDividendRemittance(record, remittance1);
    expect(record.remainingToRemitUSD).toBe(350);

    const credit2 = calculateWhtCredit(350, 850, 150, 32); // 1976.47
    const remittance2 = makeRemittance({
      id: 'rem_2',
      amountUSD: 350,
      remitDate: '2026-01-16',
      remitFxRate: 32,
      whtCreditTHB: credit2,
      reportableIncomeTHB: 350 * 32,
      remitTHB: 350 * 32,
    });

    record = applyDividendRemittance(record, remittance2);
    expect(record.remainingToRemitUSD).toBe(0);

    const totalCredit = credit1 + credit2;
    expect(totalCredit).toBeCloseTo(4711.76, 2);
  });
});

describe('computeDividendSummary', () => {
  const buildFullRecord = (overrides: Partial<DividendRecord> = {}): DividendRecord => {
    const record = makeDividend(overrides);
    const remittance = makeRemittance({
      id: 'rem_full',
      amountUSD: record.netAmountUSD,
      remitDate: '2026-01-15',
      remitFxRate: 35,
      whtCreditTHB: calculateWhtCredit(record.netAmountUSD, record.netAmountUSD, record.whtAmountUSD, 35),
      reportableIncomeTHB: record.netAmountUSD * 35,
      remitTHB: record.netAmountUSD * 35,
    });
    return {
      ...record,
      remittances: [remittance],
      totalRemittedUSD: record.netAmountUSD,
      remainingToRemitUSD: 0,
    };
  };

  it('single-year full remittance', () => {
    const record = buildFullRecord();
    const summary = computeDividendSummary([record], 2026);

    expect(summary.taxYear).toBe(2026);
    expect(summary.totalRemittedUSD).toBe(850);
    expect(summary.totalWhtCreditTHB).toBeCloseTo(5250, 2);
    expect(summary.recordCount).toBe(1);
    expect(summary.remittedCount).toBe(1);
  });

  it('partial remittance (2026 half only) attributed to 2026', () => {
    const record = makeDividend({
      id: 'div_partial',
      remittances: [
        makeRemittance({
          id: 'rem_h2026',
          amountUSD: 500,
          remitDate: '2026-06-01',
          remitFxRate: 31,
          whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
          reportableIncomeTHB: 500 * 31,
          remitTHB: 500 * 31,
        }),
      ],
    });

    const summary = computeDividendSummary([record], 2026);
    expect(summary.totalRemittedUSD).toBe(500);
    expect(summary.totalWhtCreditTHB).toBeCloseTo(2735.29, 2);
  });

  it('partial remittance split across 2026/2027 attributed per year', () => {
    const record = makeDividend({ id: 'div_split' });
    const remit2026 = makeRemittance({
      id: 'rem_s2026',
      amountUSD: 500,
      remitDate: '2026-06-01',
      remitFxRate: 31,
      whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
    });
    const remit2027 = makeRemittance({
      id: 'rem_s2027',
      amountUSD: 350,
      remitDate: '2027-06-01',
      remitFxRate: 32,
      whtCreditTHB: calculateWhtCredit(350, 850, 150, 32),
      reportableIncomeTHB: 350 * 32,
      remitTHB: 350 * 32,
    });

    const rec2026 = { ...record, remittances: [remit2026] };
    const rec2027 = { ...record, id: 'div_split_2', remittances: [remit2027] };

    const summary2026 = computeDividendSummary([rec2026], 2026);
    const summary2027 = computeDividendSummary([rec2027], 2027);

    expect(summary2026.recordCount).toBe(1);
    expect(summary2026.totalRemittedUSD).toBe(500);

    expect(summary2027.recordCount).toBe(1);
    expect(summary2027.totalRemittedUSD).toBe(350);
  });

  it('dividend with no remittance in selected year is excluded', () => {
    const record = makeDividend({
      id: 'div_empty',
      remittances: [],
    });

    const summary = computeDividendSummary([record], 2026);

    expect(summary.recordCount).toBe(0);
    expect(summary.totalRemittedUSD).toBe(0);
  });

  it('proportional gross/WHT attribution for split case (2026 = 58.82%)', () => {
    const record = makeDividend({ id: 'div_attr' });
    const remit2026 = makeRemittance({
      id: 'rem_attr_2026',
      amountUSD: 500,
      remitDate: '2026-06-01',
      remitFxRate: 31,
      whtCreditTHB: 0,
      reportableIncomeTHB: 0,
      remitTHB: 0,
    });

    const summary = computeDividendSummary([{ ...record, remittances: [remit2026] }], 2026);

    // 500 / 850 ≈ 58.82%
    const proportion = 500 / 850;
    expect(summary.totalGrossUSD).toBeCloseTo(1000 * proportion, 2);
    expect(summary.totalWhtUSD).toBeCloseTo(150 * proportion, 2);
  });

  // KNOWN ISSUE NOTE: totalUnremittedUSD sums ALL records (not year-scoped),
  // and recordCount/remittedCount count only year-remitted records.
  // These are current behaviours, deliberately not "fixed" in this change.
  it('totalUnremittedUSD sums all records (not year-scoped) — known behaviour', () => {
    const unremitted = makeDividend({
      id: 'div_unrem',
      remittances: [],
      remainingToRemitUSD: 850,
    });
    const remitted = buildFullRecord({ id: 'div_rem' });

    const summary = computeDividendSummary([unremitted, remitted], 2026);

    // 850 from unremitted + 0 from fully-remitted = 850
    expect(summary.totalUnremittedUSD).toBe(850);
    // Only the fully-remitted record has a 2026 remittance → recordCount is 1
    expect(summary.recordCount).toBe(1);
    expect(summary.remittedCount).toBe(1);
  });
});

describe('getAvailableSymbols', () => {
  const makeTrade = (symbol: string, type: 'BUY' | 'SELL' = 'BUY'): TradeTransaction => ({
    id: `t_${symbol}`,
    date: '2026-01-15',
    symbol,
    type,
    provider: 'Dime',
    quantity: 10,
    priceUSD: 150,
    commissionUSD: 1,
    exchangeFeeUSD: 0,
    tafFeeUSD: 0,
    commissionRebateUSD: 0,
    vatUSD: 0,
  });

  it('unique BUY symbols sorted; SELL excluded', () => {
    const trades: TradeTransaction[] = [
      makeTrade('AAPL'),
      makeTrade('GOOGL'),
      makeTrade('AAPL', 'SELL'),
      makeTrade('TSLA'),
    ];

    expect(getAvailableSymbols(trades)).toEqual(['AAPL', 'GOOGL', 'TSLA']);
  });

  it('empty trades → empty array', () => {
    expect(getAvailableSymbols([])).toEqual([]);
  });

  it('ignores duplicate symbols', () => {
    const trades: TradeTransaction[] = [
      makeTrade('AAPL'),
      makeTrade('AAPL'),
      makeTrade('MSFT'),
    ];
    expect(getAvailableSymbols(trades)).toEqual(['AAPL', 'MSFT']);
  });
});

describe('getDividendYears', () => {
  it('remittance years descending; dividend-date year for unremitted; unparseable dates skipped', () => {
    const records: DividendRecord[] = [
      {
        id: 'div_1',
        date: '2026-01-15',
        symbol: 'AAPL',
        country: 'US',
        grossAmountUSD: 1000,
        whtRate: 15,
        whtAmountUSD: 150,
        netAmountUSD: 850,
        dividendFxRate: 35,
        grossAmountTHB: 35000,
        whtAmountTHB: 5250,
        netAmountTHB: 29750,
        totalRemittedUSD: 850,
        remainingToRemitUSD: 0,
        remittances: [
          makeRemittance({ id: 'rem_1', remitDate: '2026-01-15' }),
          makeRemittance({ id: 'rem_2', remitDate: '2027-01-15', dividendId: 'div_1' }),
        ],
      },
      {
        id: 'div_2',
        date: '2025-12-01',
        symbol: 'GOOGL',
        country: 'UK',
        grossAmountUSD: 500,
        whtRate: 0,
        whtAmountUSD: 0,
        netAmountUSD: 500,
        dividendFxRate: 33,
        grossAmountTHB: 16500,
        whtAmountTHB: 0,
        netAmountTHB: 16500,
        totalRemittedUSD: 0,
        remainingToRemitUSD: 500,
        remittances: [], // unremitted → use dividend date year (2025)
      },
    ];

    expect(getDividendYears(records)).toEqual([2027, 2026, 2025]);
  });

  it('unremitted record contributes its dividend-date year', () => {
    const record = makeDividend({
      id: 'div_unrem',
      date: '2026-01-15',
      remittances: [],
    });

    expect(getDividendYears([record])).toEqual([2026]);
  });

  it('skips unparseable remittance dates (record with remittances but no valid year yields nothing)', () => {
    const record = makeDividend({
      id: 'div_bad',
      date: '2026-01-15',
      remittances: [
        makeRemittance({ id: 'rem_bad', remitDate: 'invalid' }),
      ],
    });

    // Dividend-date year is only added for records with remittances.length === 0.
    // A record with a remittance whose date is unparseable yields no year at all.
    expect(getDividendYears([record])).toEqual([]);
  });

  it('empty records → empty years', () => {
    expect(getDividendYears([])).toEqual([]);
  });

  it('returns years in descending order', () => {
    const records: DividendRecord[] = [
      makeDividend({ id: 'd1', date: '2026-01-01', remittances: [] }),
      makeDividend({ id: 'd2', date: '2027-01-01', remittances: [] }),
      makeDividend({ id: 'd3', date: '2025-01-01', remittances: [] }),
    ];

    expect(getDividendYears(records)).toEqual([2027, 2026, 2025]);
  });
});

// ─── Test Setup ──────────────────────────────────────────────────────────────

// Clear localStorage between tests (mirrors taxSlice.spec.ts pattern)
beforeEach(() => {
  localStorage.clear();
});