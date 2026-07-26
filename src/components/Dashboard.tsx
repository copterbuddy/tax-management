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
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/translations';
import { useTheme } from '../context/ThemeContext';
import { KpiCard } from './KpiCard';
import { TradeForm } from './TradeForm';
import { TradeTable } from './TradeTable';
import { RemitForm } from './RemitForm';
import { ConfirmDialog } from './ConfirmDialog';
import { RemittanceLog } from './RemittanceLog';

export function Dashboard() {
  const dispatch = useAppDispatch();
  const { t, lang, setLang } = useLanguage();
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

  const handleLangSwitch = useCallback((next: Lang) => {
    setLang(next);
  }, [setLang]);

  // Data freshness: find most recent date in trades
  const lastUpdated = useMemo(() => {
    if (trades.length === 0) return null;
    const dates = trades.map(tc => tc.date).sort().reverse();
    return dates[0];
  }, [trades]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>{t.appTitle}</h1>
          <p className="header-subtitle">{t.appSubtitle}</p>
        </div>
        <div className="header-right">
          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'เปลี่ยนเป็นโหมดกลางคืน' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Language Switcher */}
          <div className="lang-switcher">
            <button
              className={`lang-btn${lang === 'th' ? ' active' : ''}`}
              onClick={() => handleLangSwitch('th')}
              title="ภาษาไทย"
            >
              TH
            </button>
            <button
              className={`lang-btn${lang === 'en' ? ' active' : ''}`}
              onClick={() => handleLangSwitch('en')}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Year Filter + Data Freshness */}
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
        {lastUpdated && (
          <span className="data-freshness">
            <span className="fresh-dot" />
            {lang === 'th' ? 'ข้อมูลล่าสุด' : 'Last updated'}: {lastUpdated}
          </span>
        )}
      </div>

      {/* KPI Cards — เรียงตามความสำคัญ (F-pattern) */}
      <div className="kpi-grid">
        <KpiCard
          title={lang === 'th' ? 'ภาษีที่ต้องจ่าย (ประมาณการ)' : 'Est. Tax Payable'}
          value={summary ? formatGainIndicator(summary.taxableGainTHB) : '฿0.00'}
          subValue={summary ? `≈ $${summary.taxableGainUSD.toFixed(2)} USD` : undefined}
          subValue2={summary && summary.totalRemittanceCount > 0
            ? `${lang === 'th' ? 'จาก' : 'From'} ${summary.totalRemittanceCount} ${lang === 'th' ? 'รายการนำเข้า' : 'remittance(s)'}`
            : undefined}
          variant={summary?.taxableGainTHB > 0 ? 'highlight' : 'neutral'}
          icon="💰"
          tooltip={lang === 'th'
            ? 'คำนวณจากส่วนกำไรของเงินที่นำเข้าไทย × อัตราแลกเปลี่ยน ณ วันที่นำเข้า\nเฉพาะส่วนกำไรที่ต้องเสียภาษีตามประมวลรัษฎากร ป.161/2566'
            : 'Calculated from the gain portion of funds remitted to Thailand × FX rate on remittance date\nOnly the gain portion is taxable per Revenue Code'}
        />
        <KpiCard
          title={lang === 'th' ? 'นำเงินเข้าแล้ว (USD)' : 'Total Remitted (USD)'}
          value={summary ? `$${summary.totalRemittedUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
          subValue={summary ? `${summary.totalSellCount} ${lang === 'th' ? 'รายการขาย' : 'sell trades'}` : undefined}
          variant="neutral"
          icon="🏦"
          tooltip={lang === 'th'
            ? 'ยอดเงินที่โอนเข้าประเทศไทยแล้ว (ทั้งเงินต้นและกำไร)\nใช้คำนวณภาษีตามหลักเกณฑ์การนำเงินเข้า'
            : 'Total funds brought into Thailand (cost basis + gain)\nUsed to calculate tax per remittance rules'}
        />
        <KpiCard
          title={lang === 'th' ? 'กำไร/ขาดทุน สุทธิ (USD)' : 'Net Gain/Loss (USD)'}
          value={summary ? `$${summary.netGainUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
          subValue={summary?.netGainUSD !== 0 && summary
            ? `${summary.totalBuyCount} ${lang === 'th' ? 'ซื้อ' : 'buys'} / ${summary.totalSellCount} ${lang === 'th' ? 'ขาย' : 'sells'}`
            : undefined}
          variant={summary?.netGainUSD > 0 ? 'positive' : summary?.netGainUSD < 0 ? 'negative' : 'neutral'}
          icon="📈"
          tooltip={lang === 'th'
            ? 'กำไรรวมทุกการขาย (USD) — ยังไม่หักส่วนที่นำเข้า\nและยังไม่คำนวณภาษี ขาดทุนหักลบกับกำไรไม่ได้'
            : 'Total realized gain from all sells (USD)\nLosses cannot offset gains per Thai tax law'}
        />
        <KpiCard
          title={lang === 'th' ? 'ยังไม่นำเข้า (USD)' : 'Not Yet Remitted (USD)'}
          value={summary ? `$${(summary.totalRevenueUSD - summary.totalRemittedUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
          subValue={lang === 'th' ? 'เงินอยู่ในบัญชีต่างประเทศ — ยังไม่ต้องเสียภาษี' : 'Funds still offshore — not yet taxable'}
          variant="neutral"
          icon="🌏"
          tooltip={lang === 'th'
            ? 'เงินที่ได้จากการขายแต่ยังอยู่ในบัญชีต่างประเทศ\nยังไม่ต้องเสียภาษีจนกว่าจะโอนเข้าไทย'
            : 'Sale proceeds still in foreign accounts\nNot taxable until remitted to Thailand'}
        />
      </div>

      {/* Tabs: Trade Log | Remittance Log */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          📊 {lang === 'th' ? 'บันทึกซื้อขาย' : 'Trade Log'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'remittances' ? 'active' : ''}`}
          onClick={() => setActiveTab('remittances')}
        >
          🏦 {lang === 'th' ? 'บันทึกนำเงินเข้า' : 'Remittance Log'}
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
          message={lang === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?' : 'Are you sure you want to delete this trade?'}
          confirmLabel={lang === 'th' ? 'ลบรายการ' : 'Delete'}
          cancelLabel={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
          danger
        />
      )}
    </div>
  );
}
