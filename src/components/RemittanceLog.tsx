import { useState } from 'react';
import type { RealizedGainResult, RemittanceRecord } from '../types/trade';
import { useTranslation } from 'react-i18next';

interface RemittanceLogProps {
  gains: RealizedGainResult[];
  onRecordRemit: () => void;
  onEditRemittance: (remittance: RemittanceRecord) => void;
  onDeleteRemittance: (remittance: RemittanceRecord) => void;
}

export function RemittanceLog({ gains, onRecordRemit, onEditRemittance, onDeleteRemittance }: RemittanceLogProps) {
  const { t } = useTranslation();
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
  const years = [...new Set(allRemittances.map(r => Number.parseInt(r.remitDate.substring(0, 4), 10)))]
    .sort((a, b) => b - a);
  if (!years.includes(remitYear)) years.unshift(remitYear);

  const totalRemitted = yearRemittances.reduce((s, r) => s + r.amountUSD, 0);
  const totalTaxable = yearRemittances.reduce((s, r) => s + r.taxableTHB, 0);

  return (
    <div className="trade-table-section">
      <div className="trade-table-header">
        <div className="trade-table-title">
          <h2>{t('remittance:remittanceLog')} — {remitYear}</h2>
          <span className="trade-count">
            {yearRemittances.length} {t('remittance:remittanceCount')}
          </span>
        </div>
        <button className="btn btn-primary" onClick={onRecordRemit}>
          {t('remittance:recordRemit')}
        </button>
      </div>

      {/* Remittance Year Filter */}
      {years.length > 1 && (
        <div className="year-filter" style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="remit-year-select">{t('remittance:remitYear')}:</label>
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
          <p>{t('remittance:noRemittances')} {remitYear}</p>
          <p className="empty-hint">{t('remittance:noRemittancesHint')}</p>
          <button className="btn btn-primary" onClick={onRecordRemit}>
            {t('remittance:recordRemit')}
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table">
            <thead>
              <tr>
                <th>{t('remittance:colRemitDate')}</th>
                <th>{t('remittance:colSymbol')}</th>
                <th>{t('remittance:colProvider')}</th>
                <th>{t('remittance:colAmount')}</th>
                <th>{t('remittance:colFxRate')}</th>
                <th>{t('remittance:colGainPercent')}</th>
                <th>{t('remittance:colTaxable')}</th>
                <th>{t('remittance:colNotes')}</th>
                <th>{t('remittance:colActions')}</th>
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
                  <td className="actions-cell">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => onEditRemittance({
                        id: r.id,
                        sellTradeId: r.sellTradeId,
                        amountUSD: r.amountUSD,
                        remitDate: r.remitDate,
                        fxRateTHB: r.fxRateTHB,
                        notes: r.notes,
                      })}
                      title={t('remittance:editRemit')}
                      aria-label={t('remittance:editRemit')}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => onDeleteRemittance({
                        id: r.id,
                        sellTradeId: r.sellTradeId,
                        amountUSD: r.amountUSD,
                        remitDate: r.remitDate,
                        fxRateTHB: r.fxRateTHB,
                        notes: r.notes,
                      })}
                      title={t('remittance:deleteRemit')}
                      aria-label={t('remittance:deleteRemit')}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="summary-row">
                <td colSpan={3}><strong>{t('common:total')} ({yearRemittances.length} {t('remittance:remittanceCount')})</strong></td>
                <td className="num"><strong>${totalRemitted.toFixed(2)}</strong></td>
                <td></td>
                <td></td>
                <td className="num gain-cell">
                  <span className="gain-indicator gain-positive">
                    <strong>฿{totalTaxable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </span>
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
