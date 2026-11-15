import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changedFilingFields, type FilingFigures, type FilingIssue } from '../engine/filingSummary';
import type { YearLock } from '../store/filingSlice';
import { estimateThaiTax } from '../engine/taxEstimate';
import { THAI_TAX } from '../constants';

interface FilingSummarySheetProps {
  figures: FilingFigures;
  issues: FilingIssue[];
  locked?: YearLock | null;
  onLock: () => void;
  onUnlock: () => void;
  onExport: () => void;
  onClose: () => void;
}

/**
 * Year-end view: the figures a return asks for, what blocks filing, and one
 * export action. Presentational only — numbers and flags arrive as props.
 */
export function FilingSummarySheet({ figures, issues, locked, onLock, onUnlock, onExport, onClose }: FilingSummarySheetProps) {
  const { t } = useTranslation();
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [otherIncome, setOtherIncome] = useState('');
  const [deductions, setDeductions] = useState(String(THAI_TAX.DEFAULT_DEDUCTION));

  const estimate = useMemo(
    () =>
      estimateThaiTax({
        assessableTHB: figures.totalAssessableTHB,
        otherIncomeTHB: Number(otherIncome) || 0,
        deductionsTHB: Number(deductions) || 0,
        creditTHB: figures.dividendCreditTHB,
      }),
    [figures.totalAssessableTHB, figures.dividendCreditTHB, otherIncome, deductions],
  );

  const money = (value: number): string =>
    `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div
      className="trade-form-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t('common:filingSummaryTitle', { year: figures.year })}
    >
      <div className="trade-form-modal filing-sheet">
        <div className="trade-form-header">
          <h2>{t('common:filingSummaryTitle', { year: figures.year })}</h2>
          <button className="btn-close" onClick={onClose} aria-label={t('common:close')}>
            &times;
          </button>
        </div>

        <p className="filing-subtitle">{t('common:filingSummarySubtitle', { year: figures.year })}</p>

        <dl className="filing-figures">
          <div>
            <dt>{t('common:filingDividendGross')}</dt>
            <dd className="mono">฿{fmt(figures.dividendGrossTHB)}</dd>
          </div>
          <div>
            <dt>{t('common:filingDividendCredit')}</dt>
            <dd className="mono">฿{fmt(figures.dividendCreditTHB)}</dd>
          </div>
          <div>
            <dt>{t('common:filingCapitalGain')}</dt>
            <dd className="mono">฿{fmt(figures.capitalGainTHB)}</dd>
          </div>
          <div className="filing-total">
            <dt>{t('common:filingTotal')}</dt>
            <dd className="mono">฿{fmt(figures.totalAssessableTHB)}</dd>
          </div>
        </dl>

        <div className="filing-issues">
          {issues.length === 0 ? (
            <p className="filing-ready">✓ {t('common:filingReady')}</p>
          ) : (
            <ul>
              {issues.map(issue => (
                <li key={issue.code}>
                  {issue.code === 'noData'
                    ? t('common:filingIssueNoData', { year: figures.year })
                    : t('common:filingIssueUnapplied', { count: issue.count })}
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="filing-estimate">
          <summary>{t('common:filingEstimate')}</summary>

          <div className="estimate-inputs">
            <div className="form-group">
              <label htmlFor="estimate-other-income">{t('common:estimateOtherIncome')}</label>
              <input
                id="estimate-other-income"
                type="number"
                min="0"
                step="1000"
                inputMode="decimal"
                value={otherIncome}
                onChange={e => setOtherIncome(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="estimate-deductions">{t('common:estimateDeductions')}</label>
              <input
                id="estimate-deductions"
                type="number"
                min="0"
                step="1000"
                inputMode="decimal"
                value={deductions}
                onChange={e => setDeductions(e.target.value)}
              />
            </div>
          </div>

          <dl className="estimate-lines">
            <div><dt>{t('common:estimateNetIncome')}</dt><dd>{money(estimate.netIncomeTHB)}</dd></div>
            <div><dt>{t('common:estimateTax')}</dt><dd>{money(estimate.taxTHB)}</dd></div>
            <div><dt>{t('common:estimateCredit')}</dt><dd>{money(estimate.creditTHB)}</dd></div>
            {estimate.overpaidTHB > 0 ? (
              <div><dt>{t('common:estimateOverpaid')}</dt><dd className="estimate-overpaid">{money(estimate.overpaidTHB)}</dd></div>
            ) : (
              <div><dt>{t('common:estimatePayable')}</dt><dd className="estimate-payable">{money(estimate.payableTHB)}</dd></div>
            )}
            <div><dt>{t('common:estimateMarginal')}</dt><dd>{Math.round(estimate.marginalRate * 100)}%</dd></div>
          </dl>

          <p className="estimate-hint">{t('common:estimateHint')}</p>
        </details>

        <div className="filing-lock">
          {locked ? (
            <>
              <p className="filing-locked-at">
                {t('common:filingLockedAt', { date: locked.lockedAt.slice(0, 10) })}
              </p>
              {changedFilingFields(figures, locked.figures).length === 0 ? (
                <p className="filing-ready">✓ {t('common:filingLockMatches')}</p>
              ) : (
                <p className="filing-lock-warn">
                  {t('common:filingLockChanged', {
                    fields: changedFilingFields(figures, locked.figures)
                      .map(field => t(`common:filingField_${field}`))
                      .join(' · '),
                  })}
                </p>
              )}
              <button type="button" className="btn btn-secondary" onClick={onUnlock}>
                {t('common:filingUnlock')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onLock}>
              {t('common:filingLock')}
            </button>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common:filingClose')}
          </button>
          <button type="button" className="btn btn-primary" onClick={onExport}>
            {t('common:filingExport')}
          </button>
        </div>
      </div>
    </div>
  );
}