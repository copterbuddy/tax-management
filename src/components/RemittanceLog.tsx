import { useState } from 'react';
import type { RealizedGainResult } from '../types/trade';

interface RemittanceLogProps {
  gains: RealizedGainResult[];
  onRecordRemit: () => void;
}

export function RemittanceLog({ gains, onRecordRemit }: RemittanceLogProps) {
  const [remitYear, setRemitYear] = useState<number>(new Date().getFullYear());

  // Flatten all remittances with their parent gain info
  const allRemittances = gains.flatMap(g =>
    g.remittances.map(r => ({
      ...r,
      symbol: g.symbol,
      provider: g.provider,
      sellDate: g.sellDate,
      gainPercent: g.gainPercent,
      taxableTHB: r.amountUSD * g.gainPercent * r.fxRateTHB,
    }))
  );

  // Filter by remittance year
  const yearRemittances = allRemittances.filter(r =>
    r.remitDate.startsWith(String(remitYear))
  ).sort((a, b) => b.remitDate.localeCompare(a.remitDate));

  // Collect remittance years
  const years = [...new Set(allRemittances.map(r => parseInt(r.remitDate.substring(0, 4))))]
    .sort((a, b) => b - a);
  if (!years.includes(remitYear)) years.unshift(remitYear);

  const totalRemitted = yearRemittances.reduce((s, r) => s + r.amountUSD, 0);
  const totalTaxable = yearRemittances.reduce((s, r) => s + r.taxableTHB, 0);

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>Remittance Log — {remitYear}</h2>
          <span className="trade-count">
            {yearRemittances.length} remittance{yearRemittances.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn btn-primary" onClick={onRecordRemit}>
          🏦 Record Remittance
        </button>
      </div>

      {/* Remittance Year Filter */}
      {years.length > 1 && (
        <div className="year-filter" style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="remit-year-select">Remittance Year:</label>
          <select
            id="remit-year-select"
            value={remitYear}
            onChange={e => setRemitYear(Number(e.target.value))}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      {yearRemittances.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <p>No remittances recorded for {remitYear}</p>
          <p className="empty-hint">When you remit funds from a stock sale into Thailand, record it here.</p>
          <button className="btn btn-primary" onClick={onRecordRemit}>
            🏦 Record Remittance
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table">
            <thead>
              <tr>
                <th>Remit Date</th>
                <th>Symbol</th>
                <th>Provider</th>
                <th>Amount (USD)</th>
                <th>FX Rate</th>
                <th>Gain %</th>
                <th>Taxable (THB)</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {yearRemittances.map(r => (
                <tr key={r.id}>
                  <td>{r.remitDate}</td>
                  <td><span className="symbol-badge">{r.symbol}</span></td>
                  <td>{r.provider}</td>
                  <td className="num">${r.amountUSD.toFixed(2)}</td>
                  <td className="num">{r.fxRateTHB.toFixed(2)}</td>
                  <td className="num">{(r.gainPercent * 100).toFixed(1)}%</td>
                  <td className="num gain-cell">
                    <span className="gain-indicator gain-positive">
                      ฿{r.taxableTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td>{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="summary-row">
                <td colSpan={3}><strong>Total ({yearRemittances.length} remittances)</strong></td>
                <td className="num"><strong>${totalRemitted.toFixed(2)}</strong></td>
                <td></td>
                <td></td>
                <td className="num gain-cell">
                  <span className="gain-indicator gain-positive">
                    <strong>฿{totalTaxable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
