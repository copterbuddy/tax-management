import { Fragment, useState, useEffect } from 'react';
import type { TradeTransaction, RealizedGainResult, ProviderType, TradeType } from '../types/trade';
import {
  formatGainIndicator,
  calculateBuyCostUSD,
  calculateSellRevenueUSD,
  isNotionalFromFallback,
} from '../engine/fifoEngine';
import { PROVIDER_OPTIONS } from '../constants';
import { useTranslation } from 'react-i18next';
import { IconBarChart, IconChevronDown, IconChevronRight, IconPencil, IconSearch, IconTrash } from './Icons';

interface TradeTableProps {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  selectedYear: number;
  onEdit: (trade: TradeTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

type SortField = 'date' | 'symbol' | 'provider';
type TypeFilter = 'ALL' | TradeType;

function totalFeesUSD(trade: TradeTransaction): number {
  return (
    (trade.commissionUSD ?? 0) +
    (trade.exchangeFeeUSD ?? 0) +
    (trade.tafFeeUSD ?? 0) +
    (trade.vatUSD ?? 0) -
    (trade.commissionRebateUSD ?? 0)
  );
}

function tradeTotalUSD(trade: TradeTransaction): number {
  return trade.type === 'BUY' ? calculateBuyCostUSD(trade) : calculateSellRevenueUSD(trade);
}

export function TradeTable({ trades, gains, selectedYear, onEdit, onDelete, onAddNew }: TradeTableProps) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [providerFilter, setProviderFilter] = useState<ProviderType | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reset filters and expansion when year changes
  useEffect(() => {
    setProviderFilter('All');
    setTypeFilter('ALL');
    setSearchQuery('');
    setExpandedId(null);
  }, [selectedYear]);

  const yearTrades = trades.filter(tc => tc.date.startsWith(String(selectedYear)));
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTrades = yearTrades.filter(tc => {
    if (providerFilter !== 'All' && tc.provider !== providerFilter) return false;
    if (typeFilter !== 'ALL' && tc.type !== typeFilter) return false;
    if (normalizedQuery) {
      const symbolMatch = tc.symbol.toLowerCase().includes(normalizedQuery);
      const notesMatch = (tc.notes ?? '').toLowerCase().includes(normalizedQuery);
      if (!symbolMatch && !notesMatch) return false;
    }
    return true;
  });

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
  const isFiltered = providerFilter !== 'All' || typeFilter !== 'ALL' || normalizedQuery.length > 0;

  const translateTradeType = (type: string) =>
    type === 'BUY' ? t('trade:tradeTypeBuy') : t('trade:tradeTypeSell');

  const renderDetailRow = (trade: TradeTransaction, fees: number, fallbackNote?: string) => {
    if (expandedId !== trade.id) return null;
    const derivedGross = trade.quantity * trade.priceUSD;

    return (
      <tr className="trade-detail-row">
        <td colSpan={9}>
          <div className="trade-detail-pane">
            <div className="trade-detail-grid">
              <div className="trade-detail-item">
                <span className="trade-detail-label">
                  {trade.grossAmountUSD !== undefined ? t('trade:detailGrossSlip') : t('trade:detailGrossDerived')}
                </span>
                <span className={`trade-detail-value ${fallbackNote ? 'value-fallback' : ''}`}>
                  ${(trade.grossAmountUSD ?? derivedGross).toFixed(2)}
                </span>
              </div>
              <div className="trade-detail-item">
                <span className="trade-detail-label">{t('trade:formFee')}</span>
                <span className="trade-detail-value">${(trade.commissionUSD ?? 0).toFixed(2)}</span>
              </div>
              <div className="trade-detail-item">
                <span className="trade-detail-label">{t('trade:formVat')}</span>
                <span className="trade-detail-value">${(trade.vatUSD ?? 0).toFixed(2)}</span>
              </div>
              <div className="trade-detail-item">
                <span className="trade-detail-label">{t('trade:formExchangeFee')}</span>
                <span className="trade-detail-value">${(trade.exchangeFeeUSD ?? 0).toFixed(2)}</span>
              </div>
              {(trade.type === 'SELL' || (trade.tafFeeUSD ?? 0) > 0) && (
                <div className="trade-detail-item">
                  <span className="trade-detail-label">{t('trade:formTafFee')}</span>
                  <span className="trade-detail-value">${(trade.tafFeeUSD ?? 0).toFixed(2)}</span>
                </div>
              )}
              {(trade.commissionRebateUSD ?? 0) > 0 && (
                <div className="trade-detail-item">
                  <span className="trade-detail-label">{t('trade:formRebate')}</span>
                  <span className="trade-detail-value">-${(trade.commissionRebateUSD ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="trade-detail-item">
                <span className="trade-detail-label">{t('trade:colTotalFees')}</span>
                <span className="trade-detail-value">${fees.toFixed(2)}</span>
              </div>
            </div>
            {(trade.notes || fallbackNote) && (
              <div className="trade-detail-notes">
                {trade.notes && (
                  <div>
                    <strong>{t('trade:detailNotes')}:</strong> {trade.notes}
                  </div>
                )}
                {fallbackNote && <div className="value-fallback">{fallbackNote}</div>}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>{t('trade:tradeHistory')} — {selectedYear}</h2>
          <span className="trade-count">
            {yearTrades.length} {t('trade:trades')}
            ({totalBuys} {t('common:buys')} / {totalSells} {t('common:sells')})
            {isFiltered && ` · ${filteredTrades.length}`}
          </span>
        </div>
        <div className="trade-table-controls">
          {/* Quick Search */}
          <div className="table-search">
            <IconSearch size={14} className="table-search-icon" />
            <input
              type="search"
              className="table-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('trade:searchPlaceholder')}
              aria-label={t('trade:searchPlaceholder')}
            />
          </div>

          {/* Type Filter Pills */}
          <div className="type-filter-group" role="group" aria-label={t('trade:colType')}>
            {(['ALL', 'BUY', 'SELL'] as const).map(kind => (
              <button
                key={kind}
                type="button"
                className={`type-filter-btn${typeFilter === kind ? ' active' : ''}`}
                aria-pressed={typeFilter === kind}
                onClick={() => setTypeFilter(kind)}
              >
                {kind === 'ALL'
                  ? t('trade:filterAll')
                  : kind === 'BUY'
                    ? t('trade:tradeTypeBuy')
                    : t('trade:tradeTypeSell')}
              </button>
            ))}
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={e => setProviderFilter(e.target.value as ProviderType | 'All')}
            className="provider-filter"
            aria-label="Filter by provider"
          >
            <option value="All">{t('trade:allProviders')}</option>
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
          <div className="empty-icon-badge"><IconBarChart size={26} /></div>
          <p>{t('trade:noTrades')} {selectedYear}</p>
          <p className="empty-hint">{t('trade:noTradesHint')}</p>
          <button className="btn btn-primary" onClick={onAddNew}>
            {t('trade:addFirstTrade')}
          </button>
        </div>
      ) : sortedTrades.length === 0 ? (
        <div className="empty-state">
          <p>{t('trade:noMatchingTrades')}</p>
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
                <th>{t('trade:colType')}</th>
                <th className="num">{t('trade:colQty')}</th>
                <th className="num">{t('trade:colTotal')}</th>
                <th className="num">{t('trade:colGain')}</th>
                <th className="num col-optional col-remitted">{t('trade:colRemitted')}</th>
                <th className="num">{t('trade:colTaxable')}</th>
                <th style={{ textAlign: 'center' }}>{t('common:actions')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map(trade => {
                const fees = totalFeesUSD(trade);
                const totalUSD = tradeTotalUSD(trade);
                const fallbackNote = isNotionalFromFallback(trade)
                  ? t('trade:totalFallbackNote', { quantity: trade.quantity, price: trade.priceUSD.toFixed(2) })
                  : undefined;

                const gain = trade.type === 'SELL' ? gainMap.get(trade.id) : null;
                const isExpanded = expandedId === trade.id;

                return (
                  <Fragment key={trade.id}>
                    <tr
                      className={`trade-row-clickable ${trade.type === 'SELL' ? 'row-sell' : 'row-buy'}`}
                      onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                    >
                      <td>{trade.date}</td>
                      <td>
                        <div className="cell-stack">
                          <span className="symbol-badge">{trade.symbol}</span>
                          <span className="cell-sub">{trade.provider}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`trade-type-badge ${trade.type.toLowerCase()}`}>
                          {translateTradeType(trade.type)}
                        </span>
                      </td>
                      <td className="num">
                        <div className="cell-stack cell-stack-right">
                          <span>{trade.quantity}</span>
                          <span className="cell-sub">@ ${trade.priceUSD.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="num col-total">
                        <span className={fallbackNote ? 'value-fallback' : undefined} title={fallbackNote}>
                          ${totalUSD.toFixed(2)}
                        </span>
                      </td>
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
                          <div className="remit-progress-wrap">
                            <div className="remit-progress">
                              <div className="remit-bar" style={{ width: `${gain.sellRevenueUSD > 0 ? Math.min(100, (gain.totalRemittedUSD / gain.sellRevenueUSD) * 100) : 0}%` }} />
                            </div>
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
                          <span className="taxable-no" title={t('trade:taxableNo')}>{t('trade:loss')}</span>
                        ) : (
                          <span className="gain-na">-</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-edit"
                            onClick={e => { e.stopPropagation(); onEdit(trade); }}
                            title={t('common:edit')}
                            aria-label={t('common:edit')}
                          >
                            <IconPencil size={15} />
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={e => { e.stopPropagation(); onDelete(trade.id); }}
                            title={t('common:delete')}
                            aria-label={t('common:delete')}
                          >
                            <IconTrash size={15} />
                          </button>
                          <span className="trade-expand-indicator">
                            {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {renderDetailRow(trade, fees, fallbackNote)}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="trade-cards">
            {sortedTrades.map(trade => {
              const fees = totalFeesUSD(trade);
              const totalUSD = tradeTotalUSD(trade);
              const fallbackNote = isNotionalFromFallback(trade)
                ? t('trade:totalFallbackNote', { quantity: trade.quantity, price: trade.priceUSD.toFixed(2) })
                : undefined;

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
                      <button className="btn-icon btn-edit" onClick={() => onEdit(trade)} title={t('common:edit')} aria-label={t('common:edit')}><IconPencil size={15} /></button>
                      <button className="btn-icon btn-delete" onClick={() => onDelete(trade.id)} title={t('common:delete')} aria-label={t('common:delete')}><IconTrash size={15} /></button>
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
                      <span className="card-label">{t('trade:colTotalFees')}</span>
                      <span className="card-value">${fees.toFixed(2)}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t('trade:colTotal')}</span>
                      <span className={`card-value ${fallbackNote ? 'value-fallback' : ''}`} title={fallbackNote}>
                        ${totalUSD.toFixed(2)}
                      </span>
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
                              <div className="remit-bar" style={{ width: `${gain.sellRevenueUSD > 0 ? Math.min(100, (gain.totalRemittedUSD / gain.sellRevenueUSD) * 100) : 0}%` }} />
                            </div>
                            {' '}${gain.totalRemittedUSD.toFixed(0)} / ${gain.sellRevenueUSD.toFixed(0)}
                          </span>
                        </div>
                        <div className="trade-card-row">
                          <span className="card-label">{t('trade:taxableLabel')}</span>
                          <span className={`card-value ${gain.taxableGainTHB > 0 ? 'gain-positive' : gain.gainUSD < 0 ? 'gain-negative' : ''}`}>
                            {gain.taxableGainTHB > 0
                              ? formatGainIndicator(gain.taxableGainTHB)
                              : gain.gainUSD < 0
                                ? t('trade:loss')
                                : '-'}
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
