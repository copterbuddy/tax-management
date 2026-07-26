import { useState, useEffect } from 'react';
import type { TradeTransaction, RealizedGainResult, ProviderType } from '../types/trade';
import { formatGainIndicator } from '../engine/fifoEngine';
import { PROVIDER_OPTIONS } from '../constants';
import { useTranslation } from 'react-i18next';

interface TradeTableProps {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  selectedYear: number;
  onEdit: (trade: TradeTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

type SortField = 'date' | 'symbol' | 'provider';

export function TradeTable({ trades, gains, selectedYear, onEdit, onDelete, onAddNew }: TradeTableProps) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [providerFilter, setProviderFilter] = useState<ProviderType | 'All'>('All');

  // Reset filter when year changes
  useEffect(() => {
    setProviderFilter('All');
  }, [selectedYear]);

  const yearTrades = trades.filter(tc => tc.date.startsWith(String(selectedYear)));
  const filteredTrades = providerFilter === 'All'
    ? yearTrades
    : yearTrades.filter(tc => tc.provider === providerFilter);

  const gainMap = new Map<string, RealizedGainResult>();
  for (const g of gains) {
    gainMap.set(g.sellTradeId, g);
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let cmp: number;
    if (sortField === 'date') {
      cmp = a.date.localeCompare(b.date);
    } else if (sortField === 'symbol') {
      cmp = a.symbol.localeCompare(b.symbol);
    } else {
      cmp = a.provider.localeCompare(b.provider);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalBuys = yearTrades.filter(tc => tc.type === 'BUY').length;
  const totalSells = yearTrades.filter(tc => tc.type === 'SELL').length;

  const translateTradeType = (type: string) =>
    type === 'BUY' ? t('trade:tradeTypeBuy') : t('trade:tradeTypeSell');

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>{t('trade:tradeHistory')} — {selectedYear}</h2>
          <span className="trade-count">
            {yearTrades.length} {t('trade:trades')}
            ({totalBuys} {t('common:buys')} / {totalSells} {t('common:sells')})
            {providerFilter !== 'All' && ` | ${providerFilter}: ${filteredTrades.length}`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value as ProviderType | 'All')}
            className="provider-filter"
            aria-label="Filter by provider"
          >
            <option value="All">🏢 All Providers</option>
            {PROVIDER_OPTIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={onAddNew}>
            {t('trade:addTrade')}
          </button>
        </div>
      </div>

      {yearTrades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>{t('trade:noTrades')} {selectedYear}</p>
          <p className="empty-hint">{t('trade:noTradesHint')}</p>
          <button className="btn btn-primary" onClick={onAddNew}>
            {t('trade:addFirstTrade')}
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('date')}>
                  {t('trade:colDate')} {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('symbol')}>
                  {t('trade:colSymbol')} {sortField === 'symbol' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable col-optional col-provider" onClick={() => handleSort('provider')}>
                  {t('trade:colProvider')} {sortField === 'provider' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>{t('trade:colType')}</th>
                <th className="num">{t('trade:colQty')}</th>
                <th className="num col-optional col-price">{t('trade:colPrice')}</th>
                <th className="num col-optional col-fee">{t('trade:colFee')}</th>
                <th className="num">{t('trade:colTotal')}</th>
                <th className="num">{t('trade:colGain')}</th>
                <th className="num col-optional col-remitted">{t('trade:colRemitted')}</th>
                <th className="num">{t('trade:colTaxable')}</th>
                <th>{t('common:actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map(trade => {
                const totalUSD = trade.type === 'BUY'
                  ? (trade.quantity * trade.priceUSD + trade.commissionUSD)
                  : (trade.quantity * trade.priceUSD - trade.commissionUSD);

                const gain = trade.type === 'SELL' ? gainMap.get(trade.id) : null;

                return (
                  <tr key={trade.id} className={trade.type === 'SELL' ? 'row-sell' : 'row-buy'}>
                    <td>{trade.date}</td>
                    <td>
                      <span className="symbol-badge">{trade.symbol}</span>
                    </td>
                    <td className="col-optional col-provider">{trade.provider}</td>
                    <td>
                      <span className={`trade-type-badge ${trade.type.toLowerCase()}`}>
                        {translateTradeType(trade.type)}
                      </span>
                    </td>
                    <td className="num">{trade.quantity}</td>
                    <td className="num col-optional col-price">${trade.priceUSD.toFixed(2)}</td>
                    <td className="num col-optional col-fee">${trade.commissionUSD.toFixed(2)}</td>
                    <td className="num">${totalUSD.toFixed(2)}</td>
                    <td className="num gain-cell">
                      {gain ? (
                        <span className={`gain-indicator ${gain.gainUSD >= 0 ? 'gain-positive' : 'gain-negative'}`}>
                          {gain.gainUSD >= 0 ? '+' : ''}${gain.gainUSD.toFixed(2)}
                        </span>
                      ) : (
                        <span className="gain-na">-</span>
                      )}
                    </td>
                    <td className="num remit-cell col-optional col-remitted">
                      {gain ? (
                        <div className="remit-progress">
                          <div className="remit-bar" style={{ width: `${gain.sellRevenueUSD > 0 ? (gain.totalRemittedUSD / gain.sellRevenueUSD) * 100 : 0}%` }} />
                          <span className="remit-text">${gain.totalRemittedUSD.toFixed(0)} / ${gain.sellRevenueUSD.toFixed(0)}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="num gain-cell">
                      {gain && gain.taxableGainTHB > 0 ? (
                        <span className="gain-indicator gain-positive">
                          {formatGainIndicator(gain.taxableGainTHB)}
                        </span>
                      ) : gain && gain.gainUSD < 0 ? (
                        <span className="taxable-no" title={t('trade:taxableNo')}>❌ {t('trade:loss')}</span>
                      ) : (
                        <span className="gain-na">-</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(trade)}
                        title={t('common:edit')}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(trade.id)}
                        title={t('common:delete')}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="trade-cards">
            {sortedTrades.map(trade => {
              const totalUSD = trade.type === 'BUY'
                ? (trade.quantity * trade.priceUSD + trade.commissionUSD)
                : (trade.quantity * trade.priceUSD - trade.commissionUSD);

              const gain = trade.type === 'SELL' ? gainMap.get(trade.id) : null;

              return (
                <div key={trade.id} className={`trade-card ${trade.type === 'SELL' ? 'card-sell' : 'card-buy'}`}>
                  <div className="trade-card-header">
                    <span className="symbol-badge">{trade.symbol}</span>
                    <span className={`trade-type-badge ${trade.type.toLowerCase()}`}>
                      {translateTradeType(trade.type)}
                    </span>
                    <span className="trade-card-provider">{trade.provider}</span>
                    <div className="trade-card-actions">
                      <button className="btn-icon btn-edit" onClick={() => onEdit(trade)} title={t('common:edit')}>✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => onDelete(trade.id)} title={t('common:delete')}>🗑️</button>
                    </div>
                  </div>
                  <div className="trade-card-body">
                    <div className="trade-card-row">
                      <span className="card-label">{t('trade:colDate')}</span>
                      <span className="card-value">{trade.date}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t('trade:colQty')}</span>
                      <span className="card-value">{trade.quantity} × ${trade.priceUSD.toFixed(2)}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t('trade:colFee')}</span>
                      <span className="card-value">${trade.commissionUSD.toFixed(2)}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t('trade:colTotal')}</span>
                      <span className="card-value">${totalUSD.toFixed(2)}</span>
                    </div>
                    {gain && (
                      <>
                        <div className="trade-card-row">
                          <span className="card-label">{t('trade:gainLabel')}</span>
                          <span className={`card-value ${gain.gainUSD >= 0 ? 'gain-positive' : 'gain-negative'}`}>
                            {gain.gainUSD >= 0 ? '+' : ''}${gain.gainUSD.toFixed(2)}
                          </span>
                        </div>
                        <div className="trade-card-row">
                          <span className="card-label">{t('trade:remittedLabel')}</span>
                          <span className="card-value">
                            <div className="remit-progress" style={{ display: 'inline-flex', width: 120 }}>
                              <div className="remit-bar" style={{ width: `${gain.sellRevenueUSD > 0 ? (gain.totalRemittedUSD / gain.sellRevenueUSD) * 100 : 0}%` }} />
                            </div>
                            {' '}${gain.totalRemittedUSD.toFixed(0)} / ${gain.sellRevenueUSD.toFixed(0)}
                          </span>
                        </div>
                        <div className="trade-card-row">
                          <span className="card-label">{t('trade:taxableLabel')}</span>
                          <span className="card-value gain-positive">
                            {gain.taxableGainTHB > 0 ? formatGainIndicator(gain.taxableGainTHB) : `❌ ${t('trade:loss')}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
