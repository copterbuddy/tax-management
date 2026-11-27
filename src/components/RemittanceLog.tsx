import { useEffect, useState } from 'react';
import type { ProviderType, RealizedGainResult, RemittanceRecord } from '../types/trade';
import { PROVIDER_OPTIONS } from '../constants';
import { useTranslation } from 'react-i18next';
import { DocRefDialog } from './DocRefDialog';
import { IconLandmark, IconPaperclip, IconPencil, IconSearch, IconTrash } from './Icons';

interface RemittanceLogProps {
  gains: RealizedGainResult[];
  onRecordRemit: () => void;
  onEditRemittance: (remittance: RemittanceRecord) => void;
  onDeleteRemittance: (remittance: RemittanceRecord) => void;
  onSetDocRef: (sellTradeId: string, remittanceId: string, docRef?: string) => void;
}

export function RemittanceLog({ gains, onRecordRemit, onEditRemittance, onDeleteRemittance, onSetDocRef }: RemittanceLogProps) {
  const { t } = useTranslation();
  const [remitYear, setRemitYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<ProviderType | 'All'>('All');
  const [docTarget, setDocTarget] = useState<{ sellTradeId: string; remittanceId: string; label: string; value?: string } | null>(null);

  useEffect(() => {
    setSearchQuery('');
    setProviderFilter('All');
  }, [remitYear]);

  // Flatten all remittances with their parent gain info
  const allRemittances = gains.flatMap(g =>
    g.remittances.map(r => ({
      ...r,
      symbol: g.symbol,
      provider: g.provider,
      sellDate: g.sellDate,
      gainPercent: g.gainPercent,
      amountTHB: r.amountUSD * r.fxRateTHB,
      taxableTHB: r.amountUSD * g.gainPercent * r.fxRateTHB,
    }))
  );

  // Filter by remittance year
  const yearRemittances = allRemittances.filter(r =>
    r.remitDate.startsWith(String(remitYear))
  ).sort((a, b) => b.remitDate.localeCompare(a.remitDate));

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRemittances = yearRemittances.filter(r => {
    if (providerFilter !== 'All' && r.provider !== providerFilter) return false;
    if (normalizedQuery) {
      const symbolMatch = r.symbol.toLowerCase().includes(normalizedQuery);
      const notesMatch = (r.notes ?? '').toLowerCase().includes(normalizedQuery);
      if (!symbolMatch && !notesMatch) return false;
    }
    return true;
  });

  // Collect remittance years
  const years = [...new Set(allRemittances.map(r => Number.parseInt(r.remitDate.substring(0, 4), 10)))]
    .sort((a, b) => b - a);
  if (!years.includes(remitYear)) years.unshift(remitYear);

  // Flagged records stay listed so they can be corrected, but they never count toward a total —
  // the engine excludes them too, so the footer must agree with the tax-year figures.
  const countedRemittances = filteredRemittances.filter(r => r.unapplied !== true);

  const totalRemitted = countedRemittances.reduce((s, r) => s + r.amountUSD, 0);
  const totalRemittedTHB = countedRemittances.reduce((s, r) => s + r.amountTHB, 0);
  const totalTaxable = countedRemittances.reduce((s, r) => s + r.taxableTHB, 0);
  const isFiltered = providerFilter !== 'All' || normalizedQuery.length > 0;

  return (
    <div className="trades-tab">
      {years.length > 0 && (
        <div className="year-filter">
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

      <div className="trade-table-section">
        <div className="trade-table-header">
          <div className="trade-table-title">
            <h2>{t('remittance:remittanceLog')} — {remitYear}</h2>
            <span className="trade-count">
              {yearRemittances.length} {t('remittance:remittanceCount')}
              {isFiltered && ` · ${filteredRemittances.length}`}
            </span>
          </div>
          <div className="trade-table-controls">
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
            <div className="type-filter-group" role="group" aria-label="Filter by provider">
              <button
                type="button"
                className={`type-filter-btn${providerFilter === 'All' ? ' active' : ''}`}
                aria-pressed={providerFilter === 'All'}
                onClick={() => setProviderFilter('All')}
              >
                {t('trade:filterAll')}
              </button>
              {PROVIDER_OPTIONS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`type-filter-btn${providerFilter === p ? ' active' : ''}`}
                  aria-pressed={providerFilter === p}
                  onClick={() => setProviderFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={onRecordRemit}>
              {t('remittance:recordRemit')}
            </button>
          </div>
        </div>

      {yearRemittances.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-badge"><IconLandmark size={26} /></div>
          <p>{t('remittance:noRemittances')} {remitYear}</p>
          <p className="empty-hint">{t('remittance:noRemittancesHint')}</p>
          <button className="btn btn-primary" onClick={onRecordRemit}>
            {t('remittance:recordRemit')}
          </button>
        </div>
      ) : filteredRemittances.length === 0 ? (
        <div className="empty-state">
          <p>{t('trade:noMatchingTrades')}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="trade-table remit-log-table">
            <thead>
              <tr>
                <th>{t('remittance:colRemitDate')}</th>
                <th>{t('remittance:colSymbol')}</th>
                <th className="num">{t('remittance:colAmount')}</th>
                <th className="num">{t('remittance:colAmountTHB')}</th>
                <th className="num">{t('remittance:colGainPercent')}</th>
                <th className="num">{t('remittance:colTaxable')}</th>
                <th>{t('remittance:colNotes')}</th>
                <th style={{ textAlign: 'center' }}>{t('remittance:colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRemittances.map(r => (
                <tr key={r.id} className={r.unapplied ? 'remittance-row-unapplied' : undefined}>
                  <td>
                    {r.remitDate}
                    {r.unapplied && (
                      <span className="unapplied-badge" title={t('remittance:unappliedReason')}>
                        {t('remittance:unappliedMarker')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="cell-stack">
                      <span className="symbol-badge">{r.symbol}</span>
                      <span className="cell-sub">{r.provider}</span>
                    </div>
                  </td>
                  <td className="num">
                    ${r.amountUSD.toFixed(2)}
                    {r.unapplied && (
                      <div className="unapplied-reason">{t('remittance:unappliedReason')}</div>
                    )}
                  </td>
                  <td className="num">
                    <div className="cell-stack cell-stack-right">
                      <span>฿{r.amountTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="cell-sub">@ {r.fxRateTHB.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="num">{(r.gainPercent * 100).toFixed(1)}%</td>
                  <td className="num gain-cell">
                    {r.unapplied ? (
                      <span className="gain-indicator">—</span>
                    ) : (
                      <span className="gain-indicator gain-positive">
                        ฿{r.taxableTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td>{r.notes || '-'}</td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className={`btn-icon doc-link${r.docRef ? ' has-doc' : ''}`}
                        onClick={() => setDocTarget({
                          sellTradeId: r.sellTradeId,
                          remittanceId: r.id,
                          label: `${r.symbol} · ${r.remitDate}`,
                          value: r.docRef,
                        })}
                        title={r.docRef ? t('remittance:docAttached') : t('remittance:docAttach')}
                        aria-label={r.docRef ? t('remittance:docAttached') : t('remittance:docAttach')}
                      >
                        <IconPaperclip size={15} />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEditRemittance({
                          id: r.id,
                          sellTradeId: r.sellTradeId,
                          amountUSD: r.amountUSD,
                          remitDate: r.remitDate,
                          fxRateTHB: r.fxRateTHB,
                          notes: r.notes,
                          ...(r.docRef ? { docRef: r.docRef } : {}),
                          unapplied: r.unapplied,
                        })}
                        title={t('remittance:editRemit')}
                        aria-label={t('remittance:editRemit')}
                      >
                        <IconPencil size={15} />
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
                          ...(r.docRef ? { docRef: r.docRef } : {}),
                          unapplied: r.unapplied,
                        })}
                        title={t('remittance:deleteRemit')}
                        aria-label={t('remittance:deleteRemit')}
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="summary-row">
                <td colSpan={2}><strong>{t('common:total')} ({countedRemittances.length} {t('remittance:remittanceCount')})</strong></td>
                <td className="num"><strong>${totalRemitted.toFixed(2)}</strong></td>
                <td className="num"><strong>฿{totalRemittedTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
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

      {docTarget && (
        <DocRefDialog
          subject={docTarget.label}
          value={docTarget.value}
          onSave={docRef => {
            onSetDocRef(docTarget.sellTradeId, docTarget.remittanceId, docRef ?? undefined);
            setDocTarget(null);
          }}
          onClose={() => setDocTarget(null)}
        />
      )}
    </div>
  );
}
