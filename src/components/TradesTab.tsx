// ─── Trades Tab ─────────────────────────────────────────────────────────────
// Main content for the Trades tab in Dashboard.
// Shows the tax-year filter, data freshness, the capital-gain KPI cards,
// the per-provider breakdown row and the trade table.
//
// Presentational: all data and handlers arrive as props from Dashboard.

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TradeTransaction, RealizedGainResult, TaxSummary } from '../types/trade';
import { formatGainIndicator } from '../engine/fifoEngine';
import { KpiCard } from './KpiCard';
import { TradeTable } from './TradeTable';

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
}: TradesTabProps) {
  const { t } = useTranslation();

  // Number formatter respecting locale
  const fmtUSD = useCallback((n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  []);

  const remitCount = summary?.totalRemittanceCount ?? 0;

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
          subValue={summary ? `${summary.totalSellCount} ${t('common:sellsCount')}` : undefined}
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
          value={summary ? `$${fmtUSD(summary.totalRevenueUSD - summary.totalRemittedUSD)}` : '$0.00'}
          subValue={t('common:kpiNotRemittedSub')}
          variant="neutral"
          icon="🌏"
          tooltip={t('common:tooltipNotRemitted')}
        />
      </div>

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
                subValue={`$${fmtUSD(pb.totalRemittedUSD)} remitted${pctText}`}
                subValue2={pb.sellCount > 0
                  ? `${pb.sellCount} sell${pb.sellCount !== 1 ? 's' : ''} | Net: ${pb.netGainUSD >= 0 ? '+' : ''}$${fmtUSD(pb.netGainUSD)}`
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
