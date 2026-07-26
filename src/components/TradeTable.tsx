import { useState } from 'react';
import type { TradeTransaction, RealizedGainResult } from '../types/trade';
import { formatGainIndicator } from '../engine/fifoEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface TradeTableProps {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  selectedYear: number;
  onEdit: (trade: TradeTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

function translateTradeType(type: string, t: any): string {
  return type === 'BUY' ? t.tradeTypeBuy : t.tradeTypeSell;
}

export function TradeTable({ trades, gains, selectedYear, onEdit, onDelete, onAddNew }: TradeTableProps) {
  const { t, lang } = useLanguage();
  const [sortField, setSortField] = useState<'date' | 'symbol'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const yearTrades = trades.filter(tc => tc.date.startsWith(String(selectedYear)));
  const gainMap = new Map<string, RealizedGainResult>();
  for (const g of gains) {
    gainMap.set(g.sellTradeId, g);
  }

  const handleSort = (field: 'date' | 'symbol') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedTrades = [...yearTrades].sort((a, b) => {
    const cmp = sortField === 'date'
      ? a.date.localeCompare(b.date)
      : a.symbol.localeCompare(b.symbol);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalBuys = yearTrades.filter(tc => tc.type === 'BUY').length;
  const totalSells = yearTrades.filter(tc => tc.type === 'SELL').length;

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>{t.tradeHistory} — {selectedYear}</h2>
          <span className="trade-count">
            {yearTrades.length} {t.trades}
            ({totalBuys} {t.buys} / {totalSells} {t.sells})
          </span>
        </div>
        <button className="btn btn-primary" onClick={onAddNew}>
          {t.addTrade}
        </button>
      </div>

      {yearTrades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>{t.noTrades} {selectedYear}</p>
          <p className="empty-hint">{t.noTradesHint}</p>
          <button className="btn btn-primary" onClick={onAddNew}>
            {lang === 'th' ? '➕ เพิ่มรายการแรก' : '➕ Add First Trade'}
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('date')}>
                  {t.colDate} {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('symbol')}>
                  {t.colSymbol} {sortField === 'symbol' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="col-optional col-provider">{t.colProvider}</th>
                <th>{t.colType}</th>
                <th className="num">{t.colQty}</th>
                <th className="num col-optional col-price">{t.colPrice}</th>
                <th className="num col-optional col-fee">{t.colFee}</th>
                <th className="num">{t.colTotal} (USD)</th>
                <th className="num">Gain (USD)</th>
                <th className="num col-optional col-remitted">Remitted</th>
                <th className="num">Taxable THB</th>
                <th>{t.colActions}</th>
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
                        {translateTradeType(trade.type, t)}
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
                        <span className="taxable-no" title={t.taxableNo}>❌ Loss</span>
                      ) : (
                        <span className="gain-na">-</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(trade)}
                        title={lang === 'th' ? 'แก้ไขรายการ' : 'Edit trade'}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(trade.id)}
                        title={lang === 'th' ? 'ลบรายการ' : 'Delete trade'}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile Card View (<640px) */}
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
                      {translateTradeType(trade.type, t)}
                    </span>
                    <span className="trade-card-provider">{trade.provider}</span>
                    <div className="trade-card-actions">
                      <button className="btn-icon btn-edit" onClick={() => onEdit(trade)} title={lang === 'th' ? 'แก้ไข' : 'Edit'}>✏️</button>
                      <button className="btn-icon btn-delete" onClick={() => onDelete(trade.id)} title={lang === 'th' ? 'ลบ' : 'Delete'}>🗑️</button>
                    </div>
                  </div>
                  <div className="trade-card-body">
                    <div className="trade-card-row">
                      <span className="card-label">{t.colDate}</span>
                      <span className="card-value">{trade.date}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t.colQty}</span>
                      <span className="card-value">{trade.quantity} × ${trade.priceUSD.toFixed(2)}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t.colFee}</span>
                      <span className="card-value">${trade.commissionUSD.toFixed(2)}</span>
                    </div>
                    <div className="trade-card-row">
                      <span className="card-label">{t.colTotal} (USD)</span>
                      <span className="card-value">${totalUSD.toFixed(2)}</span>
                    </div>
                    {gain && (
                      <>
                        <div className="trade-card-row">
                          <span className="card-label">Gain (USD)</span>
                          <span className={`card-value ${gain.gainUSD >= 0 ? 'gain-positive' : 'gain-negative'}`}>
                            {gain.gainUSD >= 0 ? '+' : ''}${gain.gainUSD.toFixed(2)}
                          </span>
                        </div>
                        <div className="trade-card-row">
                          <span className="card-label">Remitted</span>
                          <span className="card-value">
                            <div className="remit-progress" style={{ display: 'inline-flex', width: 120 }}>
                              <div className="remit-bar" style={{ width: `${gain.sellRevenueUSD > 0 ? (gain.totalRemittedUSD / gain.sellRevenueUSD) * 100 : 0}%` }} />
                            </div>
                            {' '}${gain.totalRemittedUSD.toFixed(0)} / ${gain.sellRevenueUSD.toFixed(0)}
                          </span>
                        </div>
                        <div className="trade-card-row">
                          <span className="card-label">Taxable THB</span>
                          <span className="card-value gain-positive">
                            {gain.taxableGainTHB > 0 ? formatGainIndicator(gain.taxableGainTHB) : '❌ Loss'}
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
