import { buildFilingCsv, buildFilingFigures, changedFilingFields, findFilingIssues } from './filingSummary';
import type { DividendSummary, RealizedGainResult, TaxSummary } from '../types/trade';

const gainSummary = {
  taxYear: 2026,
  totalRevenueUSD: 16028.29,
  totalCostBasisUSD: 15687.51,
  netGainUSD: 340.78,
  totalRemittedUSD: 15881.86,
  taxableGainUSD: 337.13,
  taxableGainTHB: 10958.25,
  excludedLossesUSD: 0,
  totalTransactions: 9,
  totalBuyCount: 4,
  totalSellCount: 5,
  totalRemittanceCount: 5,
  remittedSellCount: 5,
  totalReinvestedUSD: 146.43,
  unremittedUSD: 0,
  outstandingRows: [],
  providerBreakdown: [],
} as unknown as TaxSummary;

const dividendSummary = {
  taxYear: 2026,
  totalGrossUSD: 0.49,
  totalWhtUSD: 0.0735,
  totalNetUSD: 0.4165,
  totalRemittedUSD: 0.4165,
  totalReportableIncomeTHB: 13.548745,
  totalWhtCreditTHB: 2.390955,
  totalGrossEquivalentTHB: 15.9397,
  totalUnremittedUSD: 0,
  recordCount: 1,
  remittedCount: 1,
} as unknown as DividendSummary;

const labels = {
  year: 'ปีภาษี', item: 'รายการ', amount: 'จำนวน (บาท)',
  dividendGross: 'เงินปันผล (ยอดเต็ม)', dividendCredit: 'เครดิตภาษีหัก ณ ที่จ่าย',
  capitalGain: 'กำไรจากเงินลงทุนที่โอนเข้า', total: 'รวมเงินได้ที่ต้องยื่น',
};

function gainWith(remittances: Array<{ remitDate: string; unapplied?: boolean }>): RealizedGainResult {
  return {
    sellTradeId: 's1', sellDate: '2026-02-13', symbol: 'ALLW', provider: 'Dime',
    sellQuantity: 7, sellRevenueUSD: 204.75, buyCostBasisUSD: 199.64, gainUSD: 5.11,
    gainPercent: 0.025, matchedLots: [], totalRemittedUSD: 58.32, remainingProceedsUSD: 0,
    taxableGainTHB: 0,
    remittances: remittances.map((r, i) => ({
      id: `r${i}`, sellTradeId: 's1', amountUSD: 58.32, remitDate: r.remitDate,
      fxRateTHB: 32, ...(r.unapplied === undefined ? {} : { unapplied: r.unapplied }),
    })),
  } as RealizedGainResult;
}

describe('buildFilingFigures', () => {
  it('sums the gross dividend and the capital gain', () => {
    const figures = buildFilingFigures(2026, gainSummary, dividendSummary);

    expect(figures.dividendGrossTHB).toBeCloseTo(15.9397, 3);
    expect(figures.dividendCreditTHB).toBeCloseTo(2.390955, 4);
    expect(figures.capitalGainTHB).toBeCloseTo(10958.25, 2);
    expect(figures.totalAssessableTHB).toBeCloseTo(10974.19, 2);
    expect(figures.remittedUSD).toBeCloseTo(15881.86, 2);
  });

  it('returns zeros for a year with nothing computed', () => {
    const figures = buildFilingFigures(2027, undefined, undefined);
    expect(figures.totalAssessableTHB).toBe(0);
  });
});

describe('findFilingIssues', () => {
  it('reports a year without remittances', () => {
    expect(findFilingIssues([gainWith([])], 2026)).toEqual([{ code: 'noData', count: 0 }]);
  });

  it('counts unresolved remittances in the year', () => {
    const gains = [gainWith([
      { remitDate: '2026-03-09', unapplied: true },
      { remitDate: '2026-04-07', unapplied: true },
      { remitDate: '2026-05-19' },
      { remitDate: '2025-12-01', unapplied: true },
    ])];

    expect(findFilingIssues(gains, 2026)).toEqual([{ code: 'unapplied', count: 2 }]);
  });

  it('reports nothing for a clean year', () => {
    expect(findFilingIssues([gainWith([{ remitDate: '2026-05-19' }])], 2026)).toEqual([]);
  });
});

describe('buildFilingCsv', () => {
  const figures = buildFilingFigures(2026, gainSummary, dividendSummary);

  it('starts with a BOM so spreadsheet software reads Thai', () => {
    expect(buildFilingCsv(figures, labels).charCodeAt(0)).toBe(0xfeff);
  });

  it('carries the year and one row per figure', () => {
    const csv = buildFilingCsv(figures, labels);
    const lines = csv.replace(/^\uFEFF/, '').split('\n');

    expect(lines[0]).toContain('2026');
    expect(lines).toHaveLength(6);
    expect(lines[1]).toBe('"รายการ","จำนวน (บาท)"');
    expect(lines[5]).toContain('10974.19');
  });

  it('quotes labels that contain a comma', () => {
    const csv = buildFilingCsv(figures, { ...labels, total: 'รวม, ทั้งหมด' });
    expect(csv).toContain('"รวม, ทั้งหมด"');
  });
});
// ─── changedFilingFields ────────────────────────────────────────────────────

describe('changedFilingFields', () => {
  const filed = buildFilingFigures(2026, gainSummary, dividendSummary);

  it('reports nothing when the year did not move', () => {
    expect(changedFilingFields(filed, filed)).toEqual([]);
  });

  it('ignores sub-cent noise', () => {
    const drifted = { ...filed, capitalGainTHB: filed.capitalGainTHB + 0.004 };
    expect(changedFilingFields(drifted, filed)).toEqual([]);
  });

  it('names every field that moved', () => {
    const moved = { ...filed, dividendCreditTHB: 3.1, capitalGainTHB: 11000 };
    expect(changedFilingFields(moved, filed)).toEqual(['dividendCredit', 'capitalGain']);
  });
});
