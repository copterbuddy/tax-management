// ─── Dividend Engine ─────────────────────────────────────────────────────────
// Pure functions — no React/Redux/DOM side effects.
// Handles THB conversion, WHT credit calculation, remittance tracking,
// and annual summary computation for foreign dividend records.

import type {
  DividendRecord,
  DividendRemittance,
  DividendSummary,
  TradeTransaction,
} from '../types/trade';

// ─── THB Snapshot at Dividend Date ──────────────────────────────────────────

export interface DividendSnapshot {
  grossAmountTHB: number;
  whtAmountTHB: number;
  netAmountTHB: number;
}

/**
 * Compute THB snapshot from USD dividend amounts + FX rate at dividend date.
 * All values are reference only — not used for tax calculation.
 */
export function calculateDividendTHB(
  grossAmountUSD: number,
  whtRate: number,
  fxRate: number,
): DividendSnapshot {
  const whtAmountUSD = grossAmountUSD * (whtRate / 100);
  const netAmountUSD = grossAmountUSD - whtAmountUSD;

  return {
    grossAmountTHB: grossAmountUSD * fxRate,
    whtAmountTHB: whtAmountUSD * fxRate,
    netAmountTHB: netAmountUSD * fxRate,
  };
}

// ─── WHT Credit Calculation (Remittance Date FX) ────────────────────────────

/**
 * Calculate WHT credit in THB for a remittance.
 * Uses remittance-date FX rate per Thai Revenue Department rules.
 * Credit is proportional to the fraction of net dividend remitted.
 */
export function calculateWhtCredit(
  remitAmountUSD: number,
  netAmountUSD: number,
  whtAmountUSD: number,
  remitFxRate: number,
): number {
  if (netAmountUSD <= 0) return 0;
  const proportion = remitAmountUSD / netAmountUSD;
  return proportion * whtAmountUSD * remitFxRate;
}

// ─── Validate Remittance ────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Check that a remittance amount does not exceed the remaining amount.
 * Returns { valid: true } or { valid: false, message }.
 */
export function validateRemittance(
  dividend: DividendRecord,
  amountUSD: number,
): ValidationResult {
  if (amountUSD <= 0) {
    return { valid: false, message: 'จำนวนเงินต้องมากกว่า 0' };
  }
  if (amountUSD > dividend.remainingToRemitUSD) {
    return { valid: false, message: `จำนวนเงินเกินที่สามารถนำเข้าได้ ($ ${dividend.remainingToRemitUSD.toFixed(2)})` };
  }
  return { valid: true };
}

// ─── Apply Remittance to Dividend ───────────────────────────────────────────

/**
 * Record a remittance against a dividend record.
 * Returns a new DividendRecord with updated totals — does NOT mutate the original.
 * Throws if remittance exceeds remaining amount.
 */
export function applyDividendRemittance(
  record: DividendRecord,
  remittance: DividendRemittance,
): DividendRecord {
  const validation = validateRemittance(record, remittance.amountUSD);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const updatedRemittances = [...record.remittances, remittance];
  const totalRemittedUSD = updatedRemittances.reduce((sum, r) => sum + r.amountUSD, 0);

  return {
    ...record,
    totalRemittedUSD,
    remainingToRemitUSD: record.netAmountUSD - totalRemittedUSD,
    remittances: updatedRemittances,
  };
}

// ─── Get Available Symbols from BUY Trades ──────────────────────────────────

/**
 * Return unique stock symbols from BUY transactions.
 * Used for the Symbol dropdown in the dividend form.
 */
export function getAvailableSymbols(trades: TradeTransaction[]): string[] {
  const symbols = new Set<string>();
  for (const trade of trades) {
    if (trade.type === 'BUY') {
      symbols.add(trade.symbol);
    }
  }
  return Array.from(symbols).sort();
}

// ─── Annual Summary ─────────────────────────────────────────────────────────

/**
 * Build an annual summary of dividends for a given remittance year.
 * Dividends are attributed to a tax year based on their REMITTANCE dates
 * (not dividend pay date), consistent with remittance-based taxation.
 *
 * A dividend contributes to the summary if AT LEAST ONE remittance
 * occurred in the given year.
 */
export function computeDividendSummary(
  records: DividendRecord[],
  year: number,
): DividendSummary {
  let totalGrossUSD = 0;
  let totalWhtUSD = 0;
  let totalNetUSD = 0;
  let totalRemittedUSD = 0;
  let totalReportableIncomeTHB = 0;
  let totalWhtCreditTHB = 0;
  let totalUnremittedUSD = 0;
  let recordCount = 0;
  let remittedCount = 0;

  for (const record of records) {
    // Filter remittances for this year
    const yearRemits = record.remittances.filter(r =>
      r.remitDate.startsWith(String(year)),
    );

    if (yearRemits.length === 0) continue; // No remittance this year → skip

    // Calculate totals for remittances in this year
    let yearRemittedUSD = 0;
    let yearReportableTHB = 0;
    let yearWhtCreditTHB = 0;

    for (const remit of yearRemits) {
      yearRemittedUSD += remit.amountUSD;
      yearReportableTHB += remit.reportableIncomeTHB;
      yearWhtCreditTHB += remit.whtCreditTHB;
    }

    // For partial remit across years, attribute proportional gross/WHT
    const remitProportion = record.netAmountUSD > 0
      ? yearRemittedUSD / record.netAmountUSD
      : 0;

    totalGrossUSD += record.grossAmountUSD * remitProportion;
    totalWhtUSD += record.whtAmountUSD * remitProportion;
    totalNetUSD += yearRemittedUSD;
    totalRemittedUSD += yearRemittedUSD;
    totalReportableIncomeTHB += yearReportableTHB;
    totalWhtCreditTHB += yearWhtCreditTHB;
    recordCount++;
    remittedCount++;
  }

  // Sum unremitted across ALL records (not year-filtered)
  totalUnremittedUSD = records.reduce((sum, r) => sum + r.remainingToRemitUSD, 0);

  return {
    taxYear: year,
    totalGrossUSD,
    totalWhtUSD,
    totalNetUSD,
    totalRemittedUSD,
    totalReportableIncomeTHB,
    totalWhtCreditTHB,
    totalUnremittedUSD,
    recordCount,
    remittedCount,
  };
}

// ─── Get Available Remittance Years ─────────────────────────────────────────

/**
 * Return sorted (descending) list of years that have dividend remittances.
 */
export function getDividendYears(records: DividendRecord[]): number[] {
  const years = new Set<number>();
  for (const record of records) {
    for (const remit of record.remittances) {
      const year = parseInt(remit.remitDate.substring(0, 4), 10);
      if (!isNaN(year)) years.add(year);
    }
  }
  // Also include dividend date year for unremitted records
  for (const record of records) {
    if (record.remittances.length === 0) {
      const year = parseInt(record.date.substring(0, 4), 10);
      if (!isNaN(year)) years.add(year);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}
