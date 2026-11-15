// Progressive tax brackets per the Thai Revenue Code (ประมวลรัษฎากร).
// Single filing only — Thailand does not use joint/separate household filing.
// One table for the whole app: the tax planner and the filing estimate must
// never disagree about where a band starts.

export interface TaxBracket {
  rate: number;
  threshold: number; // Upper bound of this bracket (บาท)
}

export const THAI_BRACKETS: TaxBracket[] = [
  { rate: 0.00, threshold: 150_000 },   // 0 – 150,000: Exempt
  { rate: 0.05, threshold: 300_000 },   // 150,001 – 300,000: 5%
  { rate: 0.10, threshold: 500_000 },   // 300,001 – 500,000: 10%
  { rate: 0.15, threshold: 750_000 },   // 500,001 – 750,000: 15%
  { rate: 0.20, threshold: 1_000_000 }, // 750,001 – 1,000,000: 20%
  { rate: 0.25, threshold: 2_000_000 }, // 1,000,001 – 2,000,000: 25%
  { rate: 0.30, threshold: 5_000_000 }, // 2,000,001 – 5,000,000: 30%
  { rate: 0.35, threshold: Infinity },  // 5,000,001+: 35%
];

/**
 * Calculate Thai progressive income tax.
 * @param taxableIncome — annual income minus deductions (บาท)
 * @returns tax amount in THB
 */
export function calculateThaiTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousThreshold = 0;

  for (const bracket of THAI_BRACKETS) {
    if (taxableIncome > bracket.threshold) {
      tax += (bracket.threshold - previousThreshold) * bracket.rate;
      previousThreshold = bracket.threshold;
    } else {
      tax += (taxableIncome - previousThreshold) * bracket.rate;
      break;
    }
  }

  return Math.round(tax * 100) / 100;
}

/** The rate applied to the last baht of this income. */
export function marginalRate(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const bracket = THAI_BRACKETS.find(b => taxableIncome <= b.threshold);
  return bracket ? bracket.rate : 0.35;
}
