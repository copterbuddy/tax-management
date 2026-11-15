import { estimateThaiTax } from './taxEstimate';

describe('estimateThaiTax', () => {
  it('adds other income to the filed figures and applies the brackets', () => {
    const result = estimateThaiTax({
      assessableTHB: 10_974.19,
      otherIncomeTHB: 500_000,
      deductionsTHB: 160_000,
      creditTHB: 2.39,
    });

    expect(result.assessableTHB).toBeCloseTo(510_974.19, 2);
    expect(result.netIncomeTHB).toBeCloseTo(350_974.19, 2);
    expect(result.taxTHB).toBeCloseTo(12_597.42, 2);
    expect(result.payableTHB).toBeCloseTo(12_595.03, 2);
    expect(result.overpaidTHB).toBe(0);
    expect(result.marginalRate).toBeCloseTo(0.1, 4);
  });

  it('floors net income when deductions exceed it', () => {
    const result = estimateThaiTax({ assessableTHB: 10_974.19, otherIncomeTHB: 0, deductionsTHB: 60_000, creditTHB: 2.39 });

    expect(result.netIncomeTHB).toBe(0);
    expect(result.taxTHB).toBe(0);
    expect(result.payableTHB).toBe(0);
    expect(result.overpaidTHB).toBeCloseTo(2.39, 2);
  });

  it('reports the overpaid amount instead of zero', () => {
    const result = estimateThaiTax({ assessableTHB: 200_000, otherIncomeTHB: 0, deductionsTHB: 0, creditTHB: 3_000 });

    expect(result.taxTHB).toBeCloseTo(2_500, 2);
    expect(result.payableTHB).toBe(0);
    expect(result.overpaidTHB).toBeCloseTo(500, 2);
  });

  it('ignores negative inputs', () => {
    const result = estimateThaiTax({ assessableTHB: 100_000, otherIncomeTHB: -50_000, deductionsTHB: -10_000, creditTHB: -5 });

    expect(result.assessableTHB).toBeCloseTo(100_000, 2);
    expect(result.netIncomeTHB).toBeCloseTo(100_000, 2);
    expect(result.creditTHB).toBe(0);
    expect(result.payableTHB).toBe(0);
  });
});
