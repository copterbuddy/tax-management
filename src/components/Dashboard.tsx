import { useState, useCallback, useMemo } from 'react';
import type { TradeTransaction, RemittanceRecord, DividendRecord, DividendRemittance } from '../types/trade';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTrade,
  updateTrade,
  deleteTrade,
  addRemittance,
  updateRemittance,
  deleteRemittance,
  setSelectedTaxYear,
} from '../store/tradeSlice';
import {
  addDividend,
  updateDividend,
  deleteDividend,
  addDividendRemittance,
  removeDividendRemittance,
  setDividendDisplayYear,
} from '../store/dividendSlice';
import { formatGainIndicator, validateSellLots, computeAllRealizedGains } from '../engine/fifoEngine';
import { computeDividendSummary, getAvailableSymbols } from '../engine/dividendEngine';
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
import { DividendTab } from './DividendTab';
import { DividendForm } from './DividendForm';
import { DividendRemitForm } from './DividendRemitForm';

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
  const [editingRemittance, setEditingRemittance] = useState<RemittanceRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'trades' | 'dividends' | 'remittances'>('trades');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteRemitConfirm, setDeleteRemitConfirm] = useState<RemittanceRecord | null>(null);

  // Dividend state
  const dividendRecords = useAppSelector(state => state.dividend.records);
  const dividendDisplayYear = useAppSelector(state => state.dividend.displayYear);
  const dividendAvailableYears = useAppSelector(state => state.dividend.availableYears);
  const [showDividendForm, setShowDividendForm] = useState(false);
  const [editingDividend, setEditingDividend] = useState<DividendRecord | null>(null);
  const [showDividendRemitForm, setShowDividendRemitForm] = useState(false);
  const [remittingDividend, setRemittingDividend] = useState<DividendRecord | null>(null);
  const [dividendDeleteConfirm, setDividendDeleteConfirm] = useState<string | null>(null);

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
    // R1: Remittance guard — SELL ที่มี remittance ต้องลบก่อนถึงจะแก้ได้
    if (trade.type === 'SELL') {
      const sellGain = gains.find(g => g.sellTradeId === trade.id);
      if (sellGain && sellGain.remittances.length > 0) {
        alert(t('trade:remitBeforeEdit') ?? '⚠️ กรุณาลบรายการนำเงินเข้าก่อนแก้ไขรายการขายนี้');
        return;
      }
    }
    setEditingTrade(trade);
  }, [gains, t]);

  const handleValidate = useCallback((trade: TradeTransaction): string | null => {
    if (trade.type !== 'SELL') return null;

    // R4: exclude tradeId ที่กำลัง edit — คืน lots ที่ SELL ตัวนี้กินอยู่
    const tempResult = computeAllRealizedGains(trades, trade.id);
    const relevantLots = tempResult.remainingLots.filter(
      lot => lot.symbol === trade.symbol && lot.provider === trade.provider
    );

    const validation = validateSellLots(trade, relevantLots);
    return validation.valid ? null : validation.message!;
  }, [trades]);

  const handleAddRemittance = useCallback((remit: RemittanceRecord) => {
    dispatch(addRemittance(remit));
    setShowRemitForm(false);
  }, [dispatch]);

  const handleEditRemittance = useCallback((remit: RemittanceRecord) => {
    setEditingRemittance(remit);
  }, []);

  const handleUpdateRemittance = useCallback((remit: RemittanceRecord) => {
    dispatch(updateRemittance(remit));
    setEditingRemittance(null);
  }, [dispatch]);

  const handleDeleteRemittance = useCallback((remit: RemittanceRecord) => {
    setDeleteRemitConfirm(remit);
  }, []);

  const confirmDeleteRemittance = useCallback(() => {
    if (deleteRemitConfirm) {
      dispatch(deleteRemittance({ id: deleteRemitConfirm.id, sellTradeId: deleteRemitConfirm.sellTradeId }));
      setDeleteRemitConfirm(null);
    }
  }, [dispatch, deleteRemitConfirm]);

  // ─── Dividend Handlers ────────────────────────────────────────────

  const dividendSummary = useMemo(
    () => {
      if (dividendRecords.length === 0) return null;
      return computeDividendSummary(dividendRecords, dividendDisplayYear);
    },
    [dividendRecords, dividendDisplayYear],
  );

  const availableSymbols = useMemo(
    () => getAvailableSymbols(trades),
    [trades],
  );

  const handleAddDividend = useCallback((record: DividendRecord) => {
    dispatch(addDividend(record));
    setShowDividendForm(false);
  }, [dispatch]);

  const handleUpdateDividend = useCallback((record: DividendRecord) => {
    dispatch(updateDividend(record));
    setEditingDividend(null);
  }, [dispatch]);

  const handleDeleteDividend = useCallback((id: string) => {
    const record = dividendRecords.find(r => r.id === id);
    if (record && record.remittances.length > 0) {
      alert(t('dividend:hasRemittance'));
      return;
    }
    setDividendDeleteConfirm(id);
  }, [dividendRecords, t]);

  const confirmDeleteDividend = useCallback(() => {
    if (dividendDeleteConfirm) {
      dispatch(deleteDividend(dividendDeleteConfirm));
      setDividendDeleteConfirm(null);
    }
  }, [dispatch, dividendDeleteConfirm]);

  const handleEditDividend = useCallback((id: string) => {
    const record = dividendRecords.find(r => r.id === id);
    if (!record) return;
    if (record.remittances.length > 0) {
      alert(t('dividend:hasRemittance'));
      return;
    }
    setEditingDividend(record);
  }, [dividendRecords, t]);

  const handleRemitDividend = useCallback((id: string) => {
    const record = dividendRecords.find(r => r.id === id);
    if (!record) return;
    setRemittingDividend(record);
    setShowDividendRemitForm(true);
  }, [dividendRecords]);

  const handleAddDividendRemittance = useCallback((remittance: DividendRemittance) => {
    dispatch(addDividendRemittance(remittance));
    setShowDividendRemitForm(false);
    setRemittingDividend(null);
  }, [dispatch]);

  const handleDeleteDividendRemittance = useCallback((dividendId: string, remittanceId: string) => {
    dispatch(removeDividendRemittance({ dividendId, remittanceId }));
  }, [dispatch]);

  const handleDividendYearChange = useCallback((year: number) => {
    dispatch(setDividendDisplayYear(year));
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
          className={`tab-btn ${activeTab === 'dividends' ? 'active' : ''}`}
          onClick={() => setActiveTab('dividends')}
        >
          💵 {t('dividend:tabDividends')}
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
      ) : activeTab === 'dividends' ? (
        <DividendTab
          dividends={dividendRecords}
          displayYear={dividendDisplayYear}
          summary={dividendSummary}
          onAdd={() => setShowDividendForm(true)}
          onEdit={handleEditDividend}
          onDelete={handleDeleteDividend}
          onRemit={handleRemitDividend}
          onYearChange={handleDividendYearChange}
          availableYears={dividendAvailableYears}
          onDeleteRemittance={handleDeleteDividendRemittance}
        />
      ) : (
        <RemittanceLog
          gains={gains}
          onRecordRemit={() => setShowRemitForm(true)}
          onEditRemittance={handleEditRemittance}
          onDeleteRemittance={handleDeleteRemittance}
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

      {(showRemitForm || editingRemittance) && (
        <RemitForm
          gains={gains}
          remittance={editingRemittance}
          onSubmit={editingRemittance ? handleUpdateRemittance : handleAddRemittance}
          onCancel={() => {
            setShowRemitForm(false);
            setEditingRemittance(null);
          }}
        />
      )}

      {/* Dividend Form Modal */}
      {(showDividendForm || editingDividend) && (
        <DividendForm
          open={true}
          onClose={() => {
            setShowDividendForm(false);
            setEditingDividend(null);
          }}
          onSave={editingDividend ? handleUpdateDividend : handleAddDividend}
          editRecord={editingDividend}
          availableSymbols={availableSymbols}
        />
      )}

      {/* Dividend Remit Form Modal */}
      {showDividendRemitForm && remittingDividend && (
        <DividendRemitForm
          open={true}
          onClose={() => {
            setShowDividendRemitForm(false);
            setRemittingDividend(null);
          }}
          onRemit={handleAddDividendRemittance}
          dividend={remittingDividend}
        />
      )}

      {/* Confirm Delete Trade Dialog */}
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

      {/* Confirm Delete Remittance Dialog */}
      {deleteRemitConfirm && (
        <ConfirmDialog
          message={t('remittance:confirmDeleteRemit')}
          confirmLabel={t('common:delete')}
          cancelLabel={t('common:cancel')}
          onConfirm={confirmDeleteRemittance}
          onCancel={() => setDeleteRemitConfirm(null)}
          danger
        />
      )}

      {/* Confirm Delete Dividend Dialog */}
      {dividendDeleteConfirm && (
        <ConfirmDialog
          message={t('dividend:deleteConfirm')}
          confirmLabel={t('common:delete')}
          cancelLabel={t('common:cancel')}
          onConfirm={confirmDeleteDividend}
          onCancel={() => setDividendDeleteConfirm(null)}
          danger
        />
      )}
    </div>
  );
}
