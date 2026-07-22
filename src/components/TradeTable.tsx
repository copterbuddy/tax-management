import { useState } from 'react';
import type { TradeTransaction, RealizedGainResult } from '../types/trade';
import { formatGainIndicator } from '../engine/fifoEngine';

interface TradeTableProps {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  selectedYear: number;
  onEdit: (trade: TradeTransaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function TradeTable({ trades, gains, selectedYear, onEdit, onDelete, onAddNew }: TradeTableProps) {
  const [sortField, setSortField] = useState<'date' | 'symbol'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const yearTrades = trades.filter(t => t.date.startsWith(String(selectedYear)));
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

  const totalBuys = yearTrades.filter(t => t.type === 'BUY').length;
  const totalSells = yearTrades.filter(t => t.type === 'SELL').length;

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>Trade History — {selectedYear}</h2>
          <span className="trade-count">
            {yearTrades.length} trade{yearTrades.length !== 1 ? 's' : ''}
            ({totalBuys} buys / {totalSells} sells)
          </span>
        </div>
        <button className="btn btn-primary" onClick={onAddNew}>
          + Add Trade
        </button>
      </div>

      {yearTrades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No trades recorded for {selectedYear}</p>
          <p className="empty-hint">Click "Add Trade" to enter your first transaction.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('date')}>
                  Date {sortField === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="sortable" onClick={() => handleSort('symbol')}>
                  Symbol {sortField === 'symbol' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Type</th>
                <th>Qty</th>
                <th>Price (USD)</th>
                <th>Fee (USD)</th>
                <th>FX Rate</th>
                <th>Total (THB)</th>
                <th>FIFO Gain (THB)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map(trade => {
                const totalTHB = trade.type === 'BUY'
                  ? (trade.quantity * trade.priceUSD + trade.commissionUSD) * trade.fxRateTHB
                  : (trade.quantity * trade.priceUSD - trade.commissionUSD) * trade.fxRateTHB;

                const gain = trade.type === 'SELL' ? gainMap.get(trade.id) : null;

                return (
                  <tr key={trade.id} className={trade.type === 'SELL' ? 'row-sell' : 'row-buy'}>
                    <td>{trade.date}</td>
                    <td>
                      <span className="symbol-badge">{trade.symbol}</span>
                      <span className={`asset-type asset-${trade.assetType.toLowerCase()}`}>
                        {trade.assetType === 'FOREIGN_STOCK' ? 'STK' : 'CRYPTO'}
                      </span>
                    </td>
                    <td>
                      <span className={`trade-type-badge ${trade.type.toLowerCase()}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="num">{trade.quantity}</td>
                    <td className="num">${trade.priceUSD.toFixed(2)}</td>
                    <td className="num">${trade.commissionUSD.toFixed(2)}</td>
                    <td className="num">{trade.fxRateTHB.toFixed(2)}</td>
                    <td className="num">฿{totalTHB.toFixed(2)}</td>
                    <td className="num gain-cell">
                      {gain ? (
                        <span className={`gain-indicator ${gain.realizedGainTHB >= 0 ? 'gain-positive' : 'gain-negative'}`}>
                          {formatGainIndicator(gain.realizedGainTHB)}
                        </span>
                      ) : (
                        <span className="gain-na">-</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(trade)}
                        title="Edit trade"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(trade.id)}
                        title="Delete trade"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}