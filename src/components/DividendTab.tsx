// ─── Dividend Tab ───────────────────────────────────────────────────────────
// Main content for the Dividend tab in Dashboard.
// Shows KPI cards, year filter, dividend table with expandable remittance history.

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DividendRecord, DividendRemittance } from '../types/trade';
import { KpiCard } from './KpiCard';
import { ConfirmDialog } from './ConfirmDialog';

interface DividendTabProps {
  dividends: DividendRecord[];
  displayYear: number;
  summary: {
    totalGrossUSD: number;
    totalWhtUSD: number;
    totalRemittedUSD: number;
    totalReportableIncomeTHB: number;
    totalWhtCreditTHB: number;
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
}: DividendTabProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteRemitConfirm, setDeleteRemitConfirm] = useState<{ dividendId: string; remittanceId: string } | null>(null);

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
      <div>
        <div className="table-header">
          <h2>{t('dividend:tabDividends')}</h2>
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
    );
  }

  if (filteredDividends.length === 0) {
    return (
      <div>
        <div className="table-header">
          <h2>{t('dividend:tabDividends')}</h2>
          <select
            className="year-select"
            value={displayYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
        <td colSpan={12}>
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
                        className="btn btn-sm btn-ghost"
                        onClick={() => setDeleteRemitConfirm({ dividendId: record.id, remittanceId: remit.id })}
                        title={t('common:delete')}
                        aria-label={t('common:delete')}
                      >
                        🗑️
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
    <div>
      {/* KPI Row — 6 cards */}
      <div className="kpi-grid kpi-dividend-grid">
        <KpiCard
          title={t('dividend:kpiGrossDiv')}
          value={`$${summary ? fmtUSD(summary.totalGrossUSD) : '0.00'}`}
          subValue={summary ? `${summary.recordCount} ${t('dividend:remitRecorded')}` : undefined}
          icon="💵"
          tooltip={t('dividend:kpiTooltipGrossDiv')}
        />
        <KpiCard
          title={t('dividend:kpiWhtTotal')}
          value={`-$${summary ? fmtUSD(summary.totalWhtUSD) : '0.00'}`}
          variant={summary && summary.totalWhtUSD > 0 ? 'negative' : 'neutral'}
          icon="💸"
          tooltip={t('dividend:kpiTooltipWht')}
        />
        <KpiCard
          title={t('dividend:kpiRemitted')}
          value={`$${summary ? fmtUSD(summary.totalRemittedUSD) : '0.00'}`}
          subValue={summary ? `${summary.remittedCount} ${t('dividend:remitRecorded')}` : undefined}
          variant={summary && summary.totalRemittedUSD > 0 ? 'positive' : 'neutral'}
          icon="✅"
          tooltip={t('dividend:kpiTooltipRemitted')}
        />
        <KpiCard
          title={t('dividend:kpiReportable')}
          value={`฿${summary ? fmtTHB(summary.totalReportableIncomeTHB) : '0.00'}`}
          variant={summary && summary.totalReportableIncomeTHB > 0 ? 'highlight' : 'neutral'}
          icon="💰"
          tooltip={t('dividend:kpiTooltipReportable')}
        />
        <KpiCard
          title={t('dividend:kpiWhtCredit')}
          value={`฿${summary ? fmtTHB(summary.totalWhtCreditTHB) : '0.00'}`}
          icon="🧾"
          tooltip={t('dividend:kpiTooltipWhtCredit')}
        />
        <KpiCard
          title={t('dividend:kpiUnremitted')}
          value={`$${summary ? fmtUSD(summary.totalUnremittedUSD) : '0.00'}`}
          variant={summary && summary.totalUnremittedUSD > 0 ? 'warning' : 'neutral'}
          icon="⏳"
          tooltip={t('dividend:kpiTooltipUnremitted')}
        />
      </div>

      {/* Header */}
      <div className="table-header">
        <h2>
          {t('dividend:tabDividends')}
          <span className="count-badge">({filteredDividends.length})</span>
        </h2>
        <div className="header-controls">
          <select
            className="year-select"
            value={displayYear}
            onChange={e => onYearChange(Number(e.target.value))}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={onAdd}>
            {t('dividend:addDividend')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="trade-table-container">
        <table className="trade-table">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>{t('dividend:colDate')}</th>
              <th style={{ width: '80px' }}>{t('dividend:colSymbol')}</th>
              <th style={{ width: '80px' }}>{t('dividend:colCountry')}</th>
              <th style={{ textAlign: 'right', width: '100px' }}>{t('dividend:colGrossUSD')}</th>
              <th style={{ textAlign: 'center', width: '60px' }}>{t('dividend:colWhtPct')}</th>
              <th style={{ textAlign: 'right', width: '100px' }} className="col-optional">{t('dividend:colWhtUSD')}</th>
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
              <>
                <tr
                  key={record.id}
                  className="trade-row"
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <td>{record.date}</td>
                  <td><span className="symbol-text">{record.symbol}</span></td>
                  <td>
                    {record.country === 'US' ? '🇺🇸' : record.country === 'UK' ? '🇬🇧' : record.country === 'SG' ? '🇸🇬' : '🌏'}
                    {' '}{record.country}
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>${fmtUSD(record.grossAmountUSD)}</td>
                  <td style={{ textAlign: 'center' }}>{record.whtRate}%</td>
                  <td className="mono col-optional" style={{ textAlign: 'right' }}>${fmtUSD(record.whtAmountUSD)}</td>
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
                          className="btn btn-sm btn-primary"
                          onClick={e => { e.stopPropagation(); onRemit(record.id); }}
                          title={t('dividend:remitBtn')}
                        >
                          💰
                        </button>
                      )}
                      {record.remittances.length === 0 && (
                        <>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={e => { e.stopPropagation(); onEdit(record.id); }}
                            title={t('common:edit')}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={e => { e.stopPropagation(); setDeleteConfirm(record.id); }}
                            title={t('common:delete')}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {expandedId === record.id ? (
                        <span className="mono" style={{ color: 'var(--color-text-tertiary)' }}>▼</span>
                      ) : (
                        <span className="mono" style={{ color: 'var(--color-text-tertiary)' }}>▶</span>
                      )}
                    </div>
                  </td>
                </tr>
                {renderRemittanceHistory(record)}
              </>
            ))}
          </tbody>
        </table>
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
                  <button className="btn btn-sm btn-primary" onClick={() => onRemit(record.id)}>💰</button>
                )}
                {record.remittances.length === 0 && (
                  <>
                    <button className="btn btn-sm btn-ghost" onClick={() => onEdit(record.id)}>✏️</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setDeleteConfirm(record.id)}>🗑️</button>
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