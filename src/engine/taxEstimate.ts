import { calculateThaiTax, marginalRate } from './taxBrackets';

export interface TaxEstimateInput {
  /** Assessable income from the filing sheet (THB). */
  assessableTHB: number;
  /** Other assessable income the ledger does not know (THB). */
  otherIncomeTHB: number;
  /** Total allowances and deductions (THB). */
  deductionsTHB: number;
  /** Withholding credit already counted in the dividend records (THB). */
  creditTHB: number;
}

export interface TaxEstimate {
  assessableTHB: number;
  netIncomeTHB: number;
  taxTHB: number;
  creditTHB: number;
  /** Amount still owed; zero when the credit covers the tax. */
  payableTHB: number;
  /** Amount the credit exceeds the tax by; zero when nothing is overpaid. */
  overpaidTHB: number;
  marginalRate: number;
}

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * What the year would cost at the progressive rates, given the two facts the
 * app cannot derive: other income and deductions.
 */
export function estimateThaiTax(input: TaxEstimateInput): TaxEstimate {
  const assessable = Math.max(0, input.assessableTHB) + Math.max(0, input.otherIncomeTHB);
  const netIncome = Math.max(0, assessable - Math.max(0, input.deductionsTHB));
  const tax = calculateThaiTax(netIncome);
  const credit = Math.max(0, input.creditTHB);

  return {
    assessableTHB: round2(assessable),
    netIncomeTHB: round2(netIncome),
    taxTHB: tax,
    creditTHB: round2(credit),
    payableTHB: credit >= tax ? 0 : round2(tax - credit),
    overpaidTHB: credit > tax ? round2(credit - tax) : 0,
    marginalRate: marginalRate(netIncome),
  };
}
