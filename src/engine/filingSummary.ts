// ─── Filing summary ───────────────────────────────────────────────────────
// Year-end view: the figures a Thai return asks for, what blocks filing, and
// the CSV handed to an accountant. Pure functions — no React, no i18n.

import type { DividendSummary, RealizedGainResult, TaxSummary } from '../types/trade';

export interface FilingFigures {
  year: number;
  /** Gross dividend income of the remitted slice — the amount to declare. */
  dividendGrossTHB: number;
  /** Withholding credit claimable against that income. */
  dividendCreditTHB: number;
  /** Capital-gain assessable income from the year's remittances. */
  capitalGainTHB: number;
  /** Dividend gross + capital gain. */
  totalAssessableTHB: number;
  remittedUSD: number;
}

export type FilingIssueCode = 'noData' | 'unapplied';

export interface FilingIssue {
  code: FilingIssueCode;
  count: number;
}

export function buildFilingFigures(
  year: number,
  gainSummary: TaxSummary | undefined,
  dividendSummary: DividendSummary | undefined,
): FilingFigures {
  const dividendGrossTHB = dividendSummary?.totalGrossEquivalentTHB ?? 0;
  const capitalGainTHB = gainSummary?.taxableGainTHB ?? 0;

  return {
    year,
    dividendGrossTHB,
    dividendCreditTHB: dividendSummary?.totalWhtCreditTHB ?? 0,
    capitalGainTHB,
    totalAssessableTHB: dividendGrossTHB + capitalGainTHB,
    remittedUSD: gainSummary?.totalRemittedUSD ?? 0,
  };
}

/** What would stop the user filing the selected year, as codes for the view to translate. */
export function findFilingIssues(gains: RealizedGainResult[], year: number): FilingIssue[] {
  const key = String(year);
  const remittances = gains.flatMap(g => g.remittances.filter(r => r.remitDate.startsWith(key)));
  const issues: FilingIssue[] = [];

  if (remittances.length === 0) issues.push({ code: 'noData', count: 0 });

  const unapplied = remittances.filter(r => r.unapplied === true).length;
  if (unapplied > 0) issues.push({ code: 'unapplied', count: unapplied });

  return issues;
}

export interface FilingCsvLabels {
  year: string;
  item: string;
  amount: string;
  dividendGross: string;
  dividendCredit: string;
  capitalGain: string;
  total: string;
}

const cell = (value: string | number): string => `"${String(value).replace(/"/g, '""')}"`;

/**
 * CSV with a UTF-8 BOM: without it Excel reads Thai labels as mojibake, which is
 * the one thing this export must not do.
 */
export function buildFilingCsv(figures: FilingFigures, labels: FilingCsvLabels): string {
  const rows: Array<[string, string]> = [
    [labels.item, labels.amount],
    [labels.dividendGross, figures.dividendGrossTHB.toFixed(2)],
    [labels.dividendCredit, figures.dividendCreditTHB.toFixed(2)],
    [labels.capitalGain, figures.capitalGainTHB.toFixed(2)],
    [labels.total, figures.totalAssessableTHB.toFixed(2)],
  ];

  const lines = [
    `${cell(labels.year)},${cell(figures.year)}`,
    ...rows.map(([label, amount]) => `${cell(label)},${cell(amount)}`),
  ];

  return '\uFEFF' + lines.join('\n');
}


export type FilingField = 'dividendGross' | 'dividendCredit' | 'capitalGain' | 'totalAssessable';

const FIELD_OF: Record<FilingField, keyof FilingFigures> = {
  dividendGross: 'dividendGrossTHB',
  dividendCredit: 'dividendCreditTHB',
  capitalGain: 'capitalGainTHB',
  totalAssessable: 'totalAssessableTHB',
};

/**
 * Fields whose value moved by more than a cent between two figure sets — the
 * question a filed return cares about. Sub-cent float noise is not a change.
 */
export function changedFilingFields(current: FilingFigures, filed: FilingFigures): FilingField[] {
  return (Object.keys(FIELD_OF) as FilingField[]).filter(field => {
    const key = FIELD_OF[field];
    return Math.abs((current[key] as number) - (filed[key] as number)) > 0.005;
  });
}
