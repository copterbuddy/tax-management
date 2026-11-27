// ─── Dividend Tab ───────────────────────────────────────────────────────────
// Main content for the Dividend tab in Dashboard.
// Shows KPI cards, year filter, dividend table with expandable remittance history.

import { Fragment, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DividendRecord } from '../types/trade';
import { KpiCard } from './KpiCard';
import { ConfirmDialog } from './ConfirmDialog';
import { DocRefDialog } from './DocRefDialog';
import {
  IconCheckCircle,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconCoins,
  IconPaperclip,
  IconPencil,
  IconPercent,
  IconReceipt,
  IconTrash,
  IconWallet,
} from './Icons';

interface DividendTabProps {
  dividends: DividendRecord[];
  displayYear: number;
  summary: {
    totalGrossUSD: number;
    totalWhtUSD: number;
    totalRemittedUSD: number;
    totalReportableIncomeTHB: number;
    totalWhtCreditTHB: number;
    totalGrossEquivalentTHB: number;
    totalUnremittedUSD: number;
    recordCount: number;
    remittedCount: number;
  } | null;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRemit: (id: string) => void;
  onYearChange: (year: number) => void;
  availableYears: number[];
  onDeleteRemittance: (dividendId: string, remittanceId: string) => void;
  onSetRemittanceDocRef: (dividendId: string, remittanceId: string, docRef?: string) => void;
}

export function DividendTab({
  dividends,
  displayYear,
  summary,
  onAdd,
  onEdit,
  onDelete,
  onRemit,
  onYearChange,
  availableYears,
  onDeleteRemittance,
  onSetRemittanceDocRef,
}: DividendTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteRemitConfirm, setDeleteRemitConfirm] = useState<{ dividendId: string; remittanceId: string } | null>(null);
  const [docTarget, setDocTarget] = useState<{ dividendId: string; remittanceId: string; label: string; value?: string } | null>(null);

  // ─── Filter by year ─────────────────────────────────────────────────

  const filteredDividends = useMemo(() => {
    return dividends.filter(record => {
      // Show if has remittances in this year, or if unremitted
      const hasRemitThisYear = record.remittances.some(r =>
        r.remitDate.startsWith(String(displayYear)),
      );
      // Show unremitted dividends from any year based on dividend date
      const isUnremitted = record.remittances.length === 0 &&
        record.date.startsWith(String(displayYear));
      return hasRemitThisYear || isUnremitted;
    });
  }, [dividends, displayYear]);

  // ─── Empty state ────────────────────────────────────────────────────

  if (dividends.length === 0) {
    return (
      <div className="trades-tab">
        <div className="trade-table-section">
          <div className="trade-table-header">
            <div className="trade-table-title">
              <h2>{t('dividend:tabDividends')}</h2>
            </div>
            <button className="btn btn-primary" onClick={onAdd}>
              {t('dividend:addDividend')}
            </button>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">💵</div>
            <div className="empty-state-title">{t('dividend:noDividends')}</div>
            <div className="empty-state-desc">{t('dividend:noDividendsHint')}</div>
            <button className="btn btn-primary" onClick={onAdd}>
              {t('dividend:addDividend')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (filteredDividends.length === 0) {
    return (
      <div className="trades-tab">
        <div className="year-filter">
          <label htmlFor="dividend-year-select">{t('dividend:divYear')}:</label>
          <select
            id="dividend-year-select"
            value={displayYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="trade-table-section">
          <div className="trade-table-header">
            <div className="trade-table-title">
              <h2>{t('dividend:tabDividends')}</h2>
            </div>
            <button className="btn btn-primary" onClick={onAdd}>
              {t('dividend:addDividend')}
            </button>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">{t('dividend:noDividendsYear')} {displayYear}</div>
            <div className="empty-state-desc">{t('dividend:noDividendsYearHint')}</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Status helpers ─────────────────────────────────────────────────

  const getStatusBadge = (record: DividendRecord) => {
    if (record.remainingToRemitUSD <= 0) {
      return <span className="badge badge-success">{t('dividend:statusRemitted')}</span>;
    }
    if (record.totalRemittedUSD > 0) {
      return <span className="badge badge-warning">{t('dividend:statusPartial')}</span>;
    }
    return <span className="badge badge-neutral">{t('dividend:statusNotRemitted')}</span>;
  };

  // ─── Render remittance history (expanded) ───────────────────────────

  const renderRemittanceHistory = (record: DividendRecord) => {
    if (expandedId !== record.id) return null;

    return (
      <tr className="remittance-history-row">
        <td colSpan={11}>
          <div className="remittance-history-pane">
            <div className="remittance-history-title">
              📋 {t('dividend:remitHistory')} ({record.remittances.length} {t('dividend:remitRecorded')})
            </div>
            <table className="remittance-history-table">
              <thead>
                <tr>
                  <th>{t('dividend:remitColDate')}</th>
                  <th style={{ textAlign: 'right' }}>{t('dividend:remitColAmount')}</th>
                  <th style={{ textAlign: 'right' }}>{t('dividend:remitColFx')}</th>
                  <th style={{ textAlign: 'right' }}>{t('dividend:remitColReportable')}</th>
                  <th style={{ textAlign: 'right' }}>{t('dividend:remitColCredit')}</th>
                  <th style={{ textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {record.remittances.map(remit => (
                  <tr key={remit.id}>
                    <td>{remit.remitDate}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>${remit.amountUSD.toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{remit.remitFxRate.toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--color-primary)' }}>฿{remit.reportableIncomeTHB.toFixed(2)}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--color-success)' }}>฿{remit.whtCreditTHB.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`btn-icon doc-link${remit.docRef ? ' has-doc' : ''}`}
                        onClick={() => setDocTarget({
                          dividendId: record.id,
                          remittanceId: remit.id,
                          label: `${record.symbol} · ${remit.remitDate}`,
                          value: remit.docRef,
                        })}
                        title={remit.docRef ? t('remittance:docAttached') : t('remittance:docAttach')}
                        aria-label={remit.docRef ? t('remittance:docAttached') : t('remittance:docAttach')}
                      >
                        <IconPaperclip size={15} />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setDeleteRemitConfirm({ dividendId: record.id, remittanceId: remit.id })}
                        title={t('common:delete')}
                        aria-label={t('common:delete')}
                      >
                        <IconTrash size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    );
  };

  // ─── Number formatter ───────────────────────────────────────────────

  const fmtUSD = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtTHB = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="trades-tab">
      {/* Year Filter — same position as the trades tab */}
      <div className="year-filter">
        <label htmlFor="dividend-year-select">{t('dividend:divYear')}:</label>
        <select
          id="dividend-year-select"
          value={displayYear}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* KPI Row — 6 cards in balanced 3×2 desktop grid */}
      <div className="kpi-grid kpi-grid-3">
        <KpiCard
          title={t('dividend:kpiGrossDiv')}
          value={`$${summary ? fmtUSD(summary.totalGrossUSD) : '0.00'}`}
          subValue={summary ? `${summary.recordCount} ${t('dividend:remitRecorded')}` : undefined}
          icon={<IconCoins size={18} />}
          tooltip={t('dividend:kpiTooltipGrossDiv')}
        />
        <KpiCard
          title={t('dividend:kpiWhtTotal')}
          value={`-$${summary ? fmtUSD(summary.totalWhtUSD) : '0.00'}`}
          variant={summary && summary.totalWhtUSD > 0 ? 'negative' : 'neutral'}
          icon={<IconPercent size={18} />}
          tooltip={t('dividend:kpiTooltipWht')}
        />
        <KpiCard
          title={t('dividend:kpiRemitted')}
          value={`$${summary ? fmtUSD(summary.totalRemittedUSD) : '0.00'}`}
          subValue={summary ? `${summary.remittedCount} ${t('dividend:remitRecorded')}` : undefined}
          variant={summary && summary.totalRemittedUSD > 0 ? 'positive' : 'neutral'}
          icon={<IconCheckCircle size={18} />}
          tooltip={t('dividend:kpiTooltipRemitted')}
        />
        <KpiCard
          title={t('dividend:kpiReportable')}
          value={`฿${summary ? fmtTHB(summary.totalGrossEquivalentTHB) : '0.00'}`}
          subValue={summary ? `${t('dividend:kpiReceivedLabel')}: ฿${fmtTHB(summary.totalReportableIncomeTHB)}` : undefined}
          variant={summary && summary.totalGrossEquivalentTHB > 0 ? 'highlight' : 'neutral'}
          icon={<IconWallet size={18} />}
          tooltip={t('dividend:kpiTooltipReportable')}
        />
        <KpiCard
          title={t('dividend:kpiWhtCredit')}
          value={`฿${summary ? fmtTHB(summary.totalWhtCreditTHB) : '0.00'}`}
          icon={<IconReceipt size={18} />}
          tooltip={t('dividend:kpiTooltipWhtCredit')}
        />
        <KpiCard
          title={t('dividend:kpiUnremitted')}
          value={`$${summary ? fmtUSD(summary.totalUnremittedUSD) : '0.00'}`}
          variant={summary && summary.totalUnremittedUSD > 0 ? 'warning' : 'neutral'}
          icon={<IconClock size={18} />}
          tooltip={t('dividend:kpiTooltipUnremitted')}
        />
      </div>

      {/* Table — same card/header pattern as the trades tab */}
      <div className="trade-table-section">
        <div className="trade-table-header">
          <div className="trade-table-title">
            <h2>{t('dividend:tabDividends')} — {displayYear}</h2>
            <span className="trade-count">({filteredDividends.length})</span>
          </div>
          <button className="btn btn-primary" onClick={onAdd}>
            {t('dividend:addDividend')}
          </button>
        </div>
        <div className="table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>{t('dividend:colDate')}</th>
              <th style={{ width: '80px' }}>{t('dividend:colSymbol')}</th>
              <th style={{ width: '80px' }}>{t('dividend:colCountry')}</th>
              <th style={{ textAlign: 'right', width: '100px' }}>{t('dividend:colGrossUSD')}</th>
              <th style={{ textAlign: 'right', width: '105px' }}>{t('dividend:colWhtUSD')}</th>
              <th style={{ textAlign: 'right', width: '100px' }}>{t('dividend:colNetUSD')}</th>
              <th style={{ textAlign: 'right', width: '100px' }}>{t('dividend:colRemitted')}</th>
              <th style={{ textAlign: 'right', width: '100px' }}>{t('dividend:colRemaining')}</th>
              <th style={{ textAlign: 'right', width: '120px' }}>{t('dividend:colReportable')}</th>
              <th style={{ textAlign: 'right', width: '120px' }} className="col-optional">{t('dividend:colWhtCredit')}</th>
              <th style={{ textAlign: 'center', width: '100px' }}>{t('common:colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDividends.map(record => (
              <Fragment key={record.id}>
                <tr
                  className="trade-row trade-row-clickable"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <td>{record.date}</td>
                  <td><span className="symbol-text">{record.symbol}</span></td>
                  <td>
                    {record.country === 'US' ? '🇺🇸' : record.country === 'UK' ? '🇬🇧' : record.country === 'SG' ? '🇸🇬' : '🌏'}
                    {' '}{record.country}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>${fmtUSD(record.grossAmountUSD)}</td>
                  <td className="mono col-wht" style={{ textAlign: 'right' }}>
                    <div className="cell-stack cell-stack-right">
                      <span>${fmtUSD(record.whtAmountUSD)}</span>
                      <span className="cell-sub">{record.whtRate}%</span>
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>${fmtUSD(record.netAmountUSD)}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>${fmtUSD(record.totalRemittedUSD)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {getStatusBadge(record)}
                    <div className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                      ${fmtUSD(record.remainingToRemitUSD)}
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--color-primary)' }}>
                    ฿{fmtTHB(record.remittances.reduce((s, r) => s + r.reportableIncomeTHB, 0))}
                  </td>
                  <td className="mono col-optional" style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                    ฿{fmtTHB(record.remittances.reduce((s, r) => s + r.whtCreditTHB, 0))}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons">
                      {record.remainingToRemitUSD > 0 && (
                        <button
                          className="btn-icon btn-remit"
                          onClick={e => { e.stopPropagation(); onRemit(record.id); }}
                          title={t('dividend:remitBtn')}
                          aria-label={t('dividend:remitBtn')}
                        >
                          <IconWallet size={15} />
                        </button>
                      )}
                      {record.remittances.length === 0 && (
                        <>
                          <button
                            className="btn-icon btn-edit"
                            onClick={e => { e.stopPropagation(); onEdit(record.id); }}
                            title={t('common:edit')}
                            aria-label={t('common:edit')}
                          >
                            <IconPencil size={15} />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={e => { e.stopPropagation(); setDeleteConfirm(record.id); }}
                            title={t('common:delete')}
                            aria-label={t('common:delete')}
                          >
                            <IconTrash size={15} />
                          </button>
                        </>
                      )}
                      {expandedId === record.id ? (
                        <IconChevronDown size={15} />
                      ) : (
                        <IconChevronRight size={15} />
                      )}
                    </div>
                  </td>
                </tr>
                {renderRemittanceHistory(record)}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="trade-cards">
        {filteredDividends.map(record => (
          <div key={record.id} className="trade-card">
            <div className="trade-card-header">
              <span>
                {record.country === 'US' ? '🇺🇸' : record.country === 'UK' ? '🇬🇧' : record.country === 'SG' ? '🇸🇬' : '🌏'}
                {' '}<strong>{record.symbol}</strong> {getStatusBadge(record)}
              </span>
              <div className="action-buttons">
                {record.remainingToRemitUSD > 0 && (
                  <button className="btn-icon btn-remit" onClick={() => onRemit(record.id)} aria-label={t('dividend:remitBtn')}><IconWallet size={15} /></button>
                )}
                {record.remittances.length === 0 && (
                  <>
                    <button className="btn-icon btn-edit" onClick={() => onEdit(record.id)} aria-label={t('common:edit')}><IconPencil size={15} /></button>
                    <button className="btn-icon btn-delete" onClick={() => setDeleteConfirm(record.id)} aria-label={t('common:delete')}><IconTrash size={15} /></button>
                  </>
                )}
              </div>
            </div>
            <div className="trade-card-body">
              <div className="trade-card-row">
                <span>{t('dividend:colDate')}:</span>
                <span>{record.date}</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colGrossUSD')}:</span>
                <span className="mono">${fmtUSD(record.grossAmountUSD)}</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colWhtPct')}:</span>
                <span>{record.whtRate}%</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colWhtUSD')}:</span>
                <span className="mono">${fmtUSD(record.whtAmountUSD)}</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colNetUSD')}:</span>
                <span className="mono">${fmtUSD(record.netAmountUSD)}</span>
              </div>
              <div className="trade-card-divider" />
              <div className="trade-card-row">
                <span>{t('dividend:colRemitted')}:</span>
                <span className="mono">${fmtUSD(record.totalRemittedUSD)}</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colReportable')}:</span>
                <span className="mono" style={{ color: 'var(--color-primary)' }}>฿{fmtTHB(record.remittances.reduce((s, r) => s + r.reportableIncomeTHB, 0))}</span>
              </div>
              <div className="trade-card-row">
                <span>{t('dividend:colWhtCredit')}:</span>
                <span className="mono" style={{ color: 'var(--color-success)' }}>฿{fmtTHB(record.remittances.reduce((s, r) => s + r.whtCreditTHB, 0))}</span>
              </div>
              {record.remittances.length > 0 && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  style={{ marginTop: '8px', width: '100%' }}
                >
                  {expandedId === record.id ? '▼ ' : '▶ '}
                  {t('dividend:remitHistory')} ({record.remittances.length})
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirm */}
      {docTarget && (
        <DocRefDialog
          subject={docTarget.label}
          value={docTarget.value}
          onSave={docRef => {
            onSetRemittanceDocRef(docTarget.dividendId, docTarget.remittanceId, docRef ?? undefined);
            setDocTarget(null);
          }}
          onClose={() => setDocTarget(null)}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          message={t('dividend:deleteConfirm')}
          confirmLabel={t('common:delete')}
          cancelLabel={t('common:cancel')}
          onConfirm={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}

      {/* Delete Remittance Confirm */}
      {deleteRemitConfirm && (
        <ConfirmDialog
          message={t('dividend:deleteRemitConfirm')}
          confirmLabel={t('common:delete')}
          cancelLabel={t('common:cancel')}
          onConfirm={() => {
            onDeleteRemittance(deleteRemitConfirm.dividendId, deleteRemitConfirm.remittanceId);
            setDeleteRemitConfirm(null);
          }}
          onCancel={() => setDeleteRemitConfirm(null)}
          danger
        />
      )}
    </div>
  );
}