import { useState, useCallback, useMemo } from 'react';
import type { TradeTransaction, RemittanceRecord } from '../types/trade';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTrade,
  updateTrade,
  deleteTrade,
  addRemittance,
  setSelectedTaxYear,
} from '../store/tradeSlice';
import { formatGainIndicator, validateSellLots } from '../engine/fifoEngine';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import type { SupportedLang } from '../i18n/index';
import i18next from 'i18next';
import { persistLanguage } from '../i18n/index';
import { KpiCard } from './KpiCard';
import { TradeForm } from './TradeForm';
import { TradeTable } from './TradeTable';
import { RemitForm } from './RemitForm';
import { ConfirmDialog } from './ConfirmDialog';
import { RemittanceLog } from './RemittanceLog';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const {
    trades,
    gains,
    remainingLots,
    selectedTaxYear,
    taxSummaries,
  } = useAppSelector(state => state.trade);

  const [showForm, setShowForm] = useState(false);
  const [showRemitForm, setShowRemitForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeTransaction | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'remittances'>('trades');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const summary = taxSummaries[selectedTaxYear];

  const availableYears = Object.keys(taxSummaries)
    .map(Number)
    .sort((a, b) => b - a);

  const allYears = availableYears.includes(selectedTaxYear)
    ? availableYears
    : [...availableYears, selectedTaxYear].sort((a, b) => b - a);

  const handleAddTrade = useCallback((trade: TradeTransaction) => {
    dispatch(addTrade(trade));
    setShowForm(false);
  }, [dispatch]);

  const handleUpdateTrade = useCallback((trade: TradeTransaction) => {
    dispatch(updateTrade(trade));
    setEditingTrade(null);
  }, [dispatch]);

  const handleDeleteTrade = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      dispatch(deleteTrade(deleteConfirmId));
      setDeleteConfirmId(null);
    }
  }, [dispatch, deleteConfirmId]);

  const handleEditTrade = useCallback((trade: TradeTransaction) => {
    setEditingTrade(trade);
  }, []);

  const handleValidate = useCallback((trade: TradeTransaction): string | null => {
    if (trade.type !== 'SELL') return null;

    const relevantLots = remainingLots.filter(
      lot => lot.symbol === trade.symbol && lot.provider === trade.provider
    );

    const validation = validateSellLots(trade, relevantLots);
    return validation.valid ? null : validation.message!;
  }, [remainingLots]);

  const handleAddRemittance = useCallback((remit: RemittanceRecord) => {
    dispatch(addRemittance(remit));
    setShowRemitForm(false);
  }, [dispatch]);

  const handleLangSwitch = useCallback((next: SupportedLang) => {
    i18next.changeLanguage(next);
    persistLanguage(next);
  }, []);

  const currentLang = i18next.language as SupportedLang;

  // Data freshness
  const lastUpdated = useMemo(() => {
    if (trades.length === 0) return null;
    const dates = trades.map(tc => tc.date).sort().reverse();
    return dates[0];
  }, [trades]);

  // Number formatter respecting locale
  const fmtUSD = useCallback((n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  []);

  // KPI labels are now all from translation keys — no inline lang conditions
  const remitCount = summary?.totalRemittanceCount ?? 0;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>{t('common:appTitle')}</h1>
          <p className="header-subtitle">{t('common:appSubtitle')}</p>
        </div>
        <div className="header-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? t('common:switchToDark') : t('common:switchToLight')}
            aria-label={theme === 'light' ? t('common:switchToDark') : t('common:switchToLight')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Language Switcher */}
          <div className="lang-switcher">
            <button
              className={`lang-btn${currentLang === 'th' ? ' active' : ''}`}
              onClick={() => handleLangSwitch('th')}
              title={t('common:thaiLabel')}
            >
              TH
            </button>
            <button
              className={`lang-btn${currentLang === 'en' ? ' active' : ''}`}
              onClick={() => handleLangSwitch('en')}
              title={t('common:englishLabel')}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Year Filter + Data Freshness */}
      <div className="year-filter">
        <label htmlFor="year-select">{t('common:taxYear')}:</label>
        <select
          id="year-select"
          value={selectedTaxYear}
          onChange={e => dispatch(setSelectedTaxYear(Number(e.target.value)))}
        >
          {allYears.map(year => (
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
          variant={summary?.taxableGainTHB > 0 ? 'highlight' : 'neutral'}
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
          variant={summary?.netGainUSD > 0 ? 'positive' : summary?.netGainUSD < 0 ? 'negative' : 'neutral'}
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

      {/* Tabs */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          📊 {t('common:tabTrades')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'remittances' ? 'active' : ''}`}
          onClick={() => setActiveTab('remittances')}
        >
          🏦 {t('common:tabRemittances')}
        </button>
      </div>

      {activeTab === 'trades' ? (
        <TradeTable
          trades={trades}
          gains={gains}
          selectedYear={selectedTaxYear}
          onEdit={handleEditTrade}
          onDelete={handleDeleteTrade}
          onAddNew={() => setShowForm(true)}
        />
      ) : (
        <RemittanceLog
          gains={gains}
          onRecordRemit={() => setShowRemitForm(true)}
        />
      )}

      {/* Trade Form Modal */}
      {(showForm || editingTrade) && (
        <TradeForm
          trade={editingTrade}
          onSubmit={editingTrade ? handleUpdateTrade : handleAddTrade}
          onCancel={() => {
            setShowForm(false);
            setEditingTrade(null);
          }}
          onValidate={handleValidate}
          remainingLots={remainingLots}
        />
      )}

      {showRemitForm && (
        <RemitForm
          gains={gains}
          onSubmit={handleAddRemittance}
          onCancel={() => setShowRemitForm(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          message={t('common:confirmDelete')}
          confirmLabel={t('common:delete')}
          cancelLabel={t('common:cancel')}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
          danger
        />
      )}
    </div>
  );
}
