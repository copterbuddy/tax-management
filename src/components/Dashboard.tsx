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
import { KpiCard } from './KpiCard';
import { TradeForm } from './TradeForm';
import { TradeTable } from './TradeTable';

export function Dashboard() {
  const dispatch = useAppDispatch();
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

  // Also include the selected year if not in summaries (empty year)
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
    if (window.confirm('Are you sure you want to delete this trade?')) {
      dispatch(deleteTrade(id));
    }
  }, [dispatch]);

  const handleEditTrade = useCallback((trade: TradeTransaction) => {
    setEditingTrade(trade);
  }, []);

  // DIP: Inject validation logic into TradeForm so it doesn't need to know about engine internals
  const handleValidate = useCallback((trade: TradeTransaction): string | null => {
    if (trade.type !== 'SELL') return null;

    // Filter remaining lots to the same symbol + provider only
    const relevantLots = remainingLots.filter(
      lot => lot.symbol === trade.symbol && lot.provider === trade.provider
    );

    const validation = validateSellLots(trade, relevantLots);
    return validation.valid ? null : validation.message!;
  }, [remainingLots]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📊 Thai Tax Tracker</h1>
          <p className="header-subtitle">FIFO Capital Gains Calculator — Revenue Dept. Rules</p>
        </div>
        <div className="header-right">
          {/* Export/Import removed per BA spec */}
        </div>
      </header>

      {/* Year Filter */}
      <div className="year-filter">
        <label htmlFor="year-select">Tax Year:</label>
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
          title="Net Realized Gain"
          value={summary ? formatGainIndicator(summary.netRealizedGainTHB) : '฿0.00'}
          subValue={summary ? `${summary.totalTransactions} transactions` : 'No data'}
          variant={
            summary?.netRealizedGainTHB > 0
              ? 'positive'
              : summary?.netRealizedGainTHB < 0
              ? 'negative'
              : 'neutral'
          }
          icon="💰"
        />
        <KpiCard
          title="Total Revenue (THB)"
          value={summary ? `฿${summary.totalRevenueTHB.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
          variant="neutral"
          icon="📈"
        />
        <KpiCard
          title="Total Cost Basis (THB)"
          value={summary ? `฿${summary.totalCostBasisTHB.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '฿0.00'}
          variant="neutral"
          icon="📉"
        />
        <KpiCard
          title="Stock Gain"
          value={summary ? formatGainIndicator(summary.assetTypeBreakdown.FOREIGN_STOCK.gainTHB) : '฿0.00'}
          variant={
            summary?.assetTypeBreakdown.FOREIGN_STOCK.gainTHB > 0
              ? 'positive'
              : summary?.assetTypeBreakdown.FOREIGN_STOCK.gainTHB < 0
              ? 'negative'
              : 'neutral'
          }
          icon="🏢"
        />
        <KpiCard
          title="Crypto Gain"
          value={summary ? formatGainIndicator(summary.assetTypeBreakdown.CRYPTO.gainTHB) : '฿0.00'}
          variant={
            summary?.assetTypeBreakdown.CRYPTO.gainTHB > 0
              ? 'positive'
              : summary?.assetTypeBreakdown.CRYPTO.gainTHB < 0
              ? 'negative'
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