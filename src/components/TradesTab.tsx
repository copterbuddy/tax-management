// ─── Trades Tab ─────────────────────────────────────────────────────────────
// Main content for the Trades tab in Dashboard.
// Shows the tax-year filter, data freshness, the capital-gain KPI cards,
// the per-provider breakdown row and the trade table.
//
// Presentational: all data and handlers arrive as props from Dashboard.

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  TradeTransaction,
  RealizedGainResult,
  TaxSummary,
  OutstandingProceedsRow,
  LedgerError,
} from '../types/trade';
import { formatGainIndicator } from '../engine/fifoEngine';
import { KpiCard } from './KpiCard';
import { TradeTable } from './TradeTable';

/** Each refusal code owns exactly one message key — no branching in the JSX. */
const LEDGER_ERROR_KEYS = {
  reinvestedExceedsBalance: 'common:ledgerErrorReinvestedExceedsBalance',
} as const;

interface TradesTabProps {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  summary: TaxSummary | undefined;
  selectedYear: number;
  availableYears: number[];
  lastUpdated: string | null;
  onYearChange: (year: number) => void;
  onEdit: (trade: TradeTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onRemitGain: (sellTradeId: string) => void;
  onMarkReinvested: (row: OutstandingProceedsRow) => void;
    ledgerError: LedgerError | null;
    onDismissLedgerError: () => void;
}

export function TradesTab({
  trades,
  gains,
  summary,
  selectedYear,
  availableYears,
  lastUpdated,
  onYearChange,
  onEdit,
  onDelete,
  onAddNew,
  onRemitGain,
  onMarkReinvested,
    ledgerError,
    onDismissLedgerError,
}: TradesTabProps) {
  const { t } = useTranslation();

  // Number formatter respecting locale
  const fmtUSD = useCallback((n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  []);

  const remitCount = summary?.totalRemittanceCount ?? 0;
  const outstandingRows = summary?.outstandingRows ?? [];

  return (
    <div className="trades-tab">
      {/* Year Filter + Data Freshness */}
      <div className="year-filter">
        <label htmlFor="year-select">{t('common:taxYear')}:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        {lastUpdated && (
          <span className="data-freshness">
            <span className="fresh-dot" />
            {t('common:lastUpdated')}: {lastUpdated}
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          title={t('common:kpiEstTax')}
          value={summary ? formatGainIndicator(summary.taxableGainTHB) : '฿0.00'}
          subValue={summary ? `≈ $${fmtUSD(summary.taxableGainUSD)} USD` : undefined}
          subValue2={remitCount > 0
            ? `${t('common:kpiRemitFrom')} ${remitCount} ${remitCount === 1 ? t('common:kpiRemitCountSingular') : t('common:kpiRemitCountPlural')}`
            : undefined}
          variant={summary && summary.taxableGainTHB > 0 ? 'highlight' : 'neutral'}
          icon="💰"
          tooltip={t('common:tooltipEstTax')}
        />
        <KpiCard
          title={t('common:kpiRemitted')}
          value={summary ? `$${fmtUSD(summary.totalRemittedUSD)}` : '$0.00'}
          subValue={summary ? `${summary.remittedSellCount} ${t('common:sellsCount')}` : undefined}
          variant="neutral"
          icon="🏦"
          tooltip={t('common:tooltipRemitted')}
        />
        <KpiCard
          title={t('common:kpiNetGain')}
          value={summary ? `$${fmtUSD(summary.netGainUSD)}` : '$0.00'}
          subValue={summary?.netGainUSD !== 0 && summary
            ? `${summary.totalBuyCount} ${t('common:buys')} / ${summary.totalSellCount} ${t('common:sells')}`
            : undefined}
          variant={summary && summary.netGainUSD > 0 ? 'positive' : summary && summary.netGainUSD < 0 ? 'negative' : 'neutral'}
          icon="📈"
          tooltip={t('common:tooltipNetGain')}
        />
        <KpiCard
          title={t('common:kpiNotRemitted')}
          value={summary ? `$${fmtUSD(summary.unremittedUSD)}` : '$0.00'}
          subValue={t('common:kpiNotRemittedSub')}
          variant="neutral"
          icon="🌏"
          tooltip={t('common:tooltipNotRemitted')}
        />
      </div>

      {/* A refused ledger write — inline and dismissible, never a blocking alert */}
            {ledgerError && (
              <div className="ledger-error" role="alert">
                <span>{t(LEDGER_ERROR_KEYS[ledgerError.code])}</span>
                <button type="button" className="btn btn-secondary" onClick={onDismissLedgerError}>
                  {t('common:dismiss')}
                </button>
              </div>
            )}

            {/* Outstanding proceeds — the gains behind the "not yet returned" figure */}
      {outstandingRows.length > 0 && (
              <div className="outstanding-proceeds">
                <h3>{t('common:outstandingTitle', { year: selectedYear })}</h3>
                <p className="outstanding-hint">{t('common:outstandingHint')}</p>
                <ul className="outstanding-list">
                  {outstandingRows.map(row => (
                    <li key={row.sellTradeId} className="outstanding-row">
                      <span className="outstanding-identity">
                        <strong>{row.symbol}</strong> · {row.provider} · {row.sellDate}
                      </span>
                      <span className="outstanding-balance">
                        {t('common:outstandingBalanceLabel')}: ${fmtUSD(row.availableBalanceUSD)}
                      </span>
                      <span className="outstanding-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onRemitGain(row.sellTradeId)}
                        >
                          {t('common:outstandingRemitAction')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onMarkReinvested(row)}
                        >
                          {t('common:outstandingMarkReinvestedAction')}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

      {/* Provider KPI Row */}
      {summary?.providerBreakdown && summary.providerBreakdown.length > 0 && (
        <div className="kpi-grid kpi-provider-row">
          {summary.providerBreakdown.map(pb => {
            const pctText = summary.taxableGainTHB > 0
              ? ` (${((pb.taxableGainTHB / summary.taxableGainTHB) * 100).toFixed(0)}%)`
              : '';
            return (
              <KpiCard
                key={pb.provider}
                title={`🏢 ${pb.provider}`}
                value={formatGainIndicator(pb.taxableGainTHB)}
                subValue={`$${fmtUSD(pb.totalRemittedUSD)} ${t('common:providerRemittedSuffix')}${pctText}`}
                subValue2={pb.sellCount > 0
                  ? `${pb.sellCount} ${t('common:sellsCount')} · ${t('common:providerGainLabel')}: ${pb.gainInRemittancesUSD >= 0 ? '+' : ''}$${fmtUSD(pb.gainInRemittancesUSD)}`
                  : t('common:noData')}
                variant={pb.taxableGainTHB > 0 ? 'positive' : pb.taxableGainTHB < 0 ? 'negative' : 'neutral'}
              />
            );
          })}
        </div>
      )}

      <TradeTable
        trades={trades}
        gains={gains}
        selectedYear={selectedYear}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddNew={onAddNew}
      />
    </div>
  );
}
