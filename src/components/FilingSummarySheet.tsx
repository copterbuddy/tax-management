import { useTranslation } from 'react-i18next';
import { changedFilingFields, type FilingFigures, type FilingIssue } from '../engine/filingSummary';
import type { YearLock } from '../store/filingSlice';

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