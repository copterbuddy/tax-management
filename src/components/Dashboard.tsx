import { useState, useCallback } from 'react';
import type { TradeTransaction } from '../types/trade';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addTrade,
  updateTrade,
  deleteTrade,
  setSelectedTaxYear,
} from '../store/tradeSlice';
import { formatGainIndicator, validateSellLots } from '../engine/fifoEngine';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/translations';
import { KpiCard } from './KpiCard';
import { TradeForm } from './TradeForm';
import { TradeTable } from './TradeTable';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { t, lang, setLang } = useLanguage();
  const {
    trades,
    gains,
    remainingLots,
    selectedTaxYear,
    taxSummaries,
  } = useAppSelector(state => state.trade);

  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeTransaction | null>(null);

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
    const msg = lang === 'th'
      ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?'
      : 'Are you sure you want to delete this trade?';
    if (window.confirm(msg)) {
      dispatch(deleteTrade(id));
    }
  }, [dispatch, lang]);

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

  const handleLangSwitch = useCallback((next: Lang) => {
    setLang(next);
  }, [setLang]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>{t.appTitle}</h1>
          <p className="header-subtitle">{t.appSubtitle}</p>
        </div>
        <div className="header-right">
          <div className="lang-switcher">
            <button
              className="lang-btn"
              onClick={() => handleLangSwitch(lang === 'th' ? 'en' : 'th')}
              title={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              {lang === 'th' ? 'EN' : 'TH'}
            </button>
          </div>
        </div>
      </header>

      {/* Year Filter */}
      <div className="year-filter">
        <label htmlFor="year-select">{t.taxYear}:</label>
        <select
          id="year-select"
          value={selectedTaxYear}
          onChange={e => dispatch(setSelectedTaxYear(Number(e.target.value)))}
        >
          {allYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard
          title={t.taxableGain}
          value={summary ? formatGainIndicator(summary.taxableGainTHB) : '฿0.00'}
          subValue={summary ? `${summary.totalTransactions} ${t.transactionsCount}, ${summary.totalSellCount} ${t.sellsCount}` : t.noData}
          variant={
            summary?.taxableGainTHB > 0
              ? 'positive'
              : 'neutral'
          }
          icon="💰"
        />
        <KpiCard
          title={t.excludedLosses}
          value={summary ? `-฿${summary.excludedLossesTHB.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
          subValue={summary?.excludedLossesTHB > 0 ? t.excludedLossesSub : t.excludedLossesSubNone}
          variant={
            summary?.excludedLossesTHB > 0
              ? 'negative'
              : 'neutral'
          }
          icon="⚠️"
        />
        <KpiCard
          title={t.totalRevenue}
          value={summary ? `฿${summary.totalRevenueTHB.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
          variant="neutral"
          icon="📈"
        />
        <KpiCard
          title={t.totalCostBasis}
          value={summary ? `฿${summary.totalCostBasisTHB.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
          variant="neutral"
          icon="📉"
        />
        <KpiCard
          title={t.stockTaxableGain}
          value={summary ? formatGainIndicator(summary.assetTypeBreakdown.FOREIGN_STOCK.taxableGainTHB) : '฿0.00'}
          variant={
            summary?.assetTypeBreakdown.FOREIGN_STOCK.taxableGainTHB > 0
              ? 'positive'
              : 'neutral'
          }
          icon="🏢"
        />
        <KpiCard
          title={t.cryptoTaxableGain}
          value={summary ? formatGainIndicator(summary.assetTypeBreakdown.CRYPTO.taxableGainTHB) : '฿0.00'}
          variant={
            summary?.assetTypeBreakdown.CRYPTO.taxableGainTHB > 0
              ? 'positive'
              : 'neutral'
          }
          icon="₿"
        />
      </div>

      {/* Trade Table */}
      <TradeTable
        trades={trades}
        gains={gains}
        selectedYear={selectedTaxYear}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
        onAddNew={() => setShowForm(true)}
      />

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
        />
      )}
    </div>
  );
}
