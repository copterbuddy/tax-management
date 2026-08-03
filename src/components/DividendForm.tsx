// ─── Dividend Form ──────────────────────────────────────────────────────────
// Modal form for adding/editing dividend records.
// Uses react-hook-form + zodResolver (pattern matches TradeForm).

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COUNTRY_WHT_INFO,
} from '../constants';
import type { CountryCode, DividendRecord } from '../types/trade';
import { calculateDividendTHB } from '../engine/dividendEngine';

interface DividendFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (record: DividendRecord) => void;
  editRecord?: DividendRecord;
  availableSymbols: string[];
}

export function DividendForm({
  open,
  onClose,
  onSave,
  editRecord,
  availableSymbols,
}: DividendFormProps) {
  const { t } = useTranslation();
  const isEdit = !!editRecord;

  // ─── Form State ───────────────────────────────────────────────────────

  const [date, setDate] = useState(editRecord?.date ?? '');
  const [symbol, setSymbol] = useState(editRecord?.symbol ?? '');
  const [country, setCountry] = useState<CountryCode>(editRecord?.country ?? 'US');
  const [grossAmountUSD, setGrossAmountUSD] = useState(editRecord?.grossAmountUSD ?? 0);
  const [whtRate, setWhtRate] = useState(editRecord?.whtRate ?? COUNTRY_WHT_INFO.US.defaultWhtRate);
  const [dividendFxRate, setDividendFxRate] = useState(editRecord?.dividendFxRate ?? 0);
  const [notes, setNotes] = useState(editRecord?.notes ?? '');
  const [error, setError] = useState('');

  // ─── Country Note ─────────────────────────────────────────────────────

  const countryInfo = COUNTRY_WHT_INFO[country];
  const countryNote = useMemo(() => {
    const lang = document.documentElement.lang === 'th' || localStorage.getItem('lang') === 'th' ? 'TH' : 'EN';
    return lang === 'TH' ? countryInfo.noteTH : countryInfo.noteEN;
  }, [country, countryInfo]);

  // ─── Auto-calc ────────────────────────────────────────────────────────

  const whtAmountUSD = grossAmountUSD * (whtRate / 100);
  const netAmountUSD = grossAmountUSD - whtAmountUSD;

  const snapshots = useMemo(
    () => calculateDividendTHB(grossAmountUSD, whtRate, dividendFxRate),
    [grossAmountUSD, whtRate, dividendFxRate],
  );

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    setWhtRate(COUNTRY_WHT_INFO[newCountry].defaultWhtRate);
  };

  const handleSubmit = () => {
    setError('');

    if (!date) { setError(t('dividend:formDate') + ' required'); return; }
    if (!symbol && !isEdit) { setError(t('dividend:formSymbol') + ' required'); return; }
    if (grossAmountUSD <= 0) { setError(t('dividend:formGrossUSD') + ' must be > 0'); return; }
    if (dividendFxRate <= 0) { setError(t('dividend:formFxRate') + ' must be > 0'); return; }
    if (whtRate < 0 || whtRate > 100) { setError('WHT rate must be 0-100'); return; }

    const whtAmt = grossAmountUSD * (whtRate / 100);
    const netAmt = grossAmountUSD - whtAmt;

    const record: DividendRecord = {
      id: editRecord?.id ?? crypto.randomUUID(),
      date,
      symbol: symbol.toUpperCase(),
      country,
      grossAmountUSD,
      whtRate,
      whtAmountUSD: whtAmt,
      netAmountUSD: netAmt,
      dividendFxRate,
      grossAmountTHB: snapshots.grossAmountTHB,
      whtAmountTHB: snapshots.whtAmountTHB,
      netAmountTHB: snapshots.netAmountTHB,
      totalRemittedUSD: editRecord?.totalRemittedUSD ?? 0,
      remainingToRemitUSD: editRecord?.remainingToRemitUSD ?? netAmt,
      remittances: editRecord?.remittances ?? [],
      notes: notes || undefined,
    };

    onSave(record);
    if (!isEdit) {
      setDate('');
      setSymbol('');
      setCountry('US');
      setGrossAmountUSD(0);
      setWhtRate(COUNTRY_WHT_INFO.US.defaultWhtRate);
      setDividendFxRate(0);
      setNotes('');
    }
    onClose();
  };

  if (!open) return null;

  // ─── Render ───────────────────────────────────────────────────────────

  const lang = document.documentElement.lang === 'th' || localStorage.getItem('lang') === 'th' ? 'TH' : 'EN';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '540px' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>{isEdit ? t('dividend:editDividend') : t('dividend:addDividend')}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="form-error-banner">⚠️ {error}</div>
          )}

          {/* Row 1: Date + Symbol */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="div-date">{t('dividend:formDate')}</label>
              <input
                id="div-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="div-symbol">{t('dividend:formSymbol')}</label>
              {isEdit ? (
                <input
                  id="div-symbol"
                  type="text"
                  value={symbol}
                  disabled
                  className="form-input"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              ) : (
                <select
                  id="div-symbol"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  className="form-input"
                >
                  <option value="">{t('dividend:formSymbolSelect')}</option>
                  {availableSymbols.length === 0 ? (
                    <option value="" disabled>{t('dividend:formNoSymbols')}</option>
                  ) : (
                    availableSymbols.map(sym => (
                      <option key={sym} value={sym}>{sym}</option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Row 2: Country + WHT Rate */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="div-country">{t('dividend:formCountry')}</label>
              <select
                id="div-country"
                value={country}
                onChange={e => handleCountryChange(e.target.value as CountryCode)}
                className="form-input"
              >
                {(['US', 'UK', 'SG', 'OTHER'] as CountryCode[]).map(code => (
                  <option key={code} value={code}>
                    {lang === 'TH' ? COUNTRY_WHT_INFO[code].nameTH : COUNTRY_WHT_INFO[code].nameEN}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="div-wht">{t('dividend:formWhtRate')}</label>
              <input
                id="div-wht"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={whtRate}
                onChange={e => setWhtRate(Number(e.target.value))}
                className="form-input"
              />
              {countryNote && (
                <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  {countryNote}
                </small>
              )}
            </div>
          </div>

          {/* Row 3: Gross + FX */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="div-gross">{t('dividend:formGrossUSD')}</label>
              <input
                id="div-gross"
                type="number"
                step="0.01"
                min={0}
                value={grossAmountUSD || ''}
                onChange={e => setGrossAmountUSD(Number(e.target.value))}
                className="form-input"
                placeholder="e.g. 1000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="div-fx">{t('dividend:formFxRate')}</label>
              <input
                id="div-fx"
                type="number"
                step="0.01"
                min={0}
                value={dividendFxRate || ''}
                onChange={e => setDividendFxRate(Number(e.target.value))}
                className="form-input"
                placeholder="e.g. 35.00"
              />
            </div>
          </div>

          {/* Preview Box */}
          {grossAmountUSD > 0 && dividendFxRate > 0 && (
            <div className="remit-preview">
              <div className="remit-preview-title">{t('dividend:formPreviewTitle')}</div>
              <div className="remit-preview-line">
                <span>{t('dividend:formPreviewGross')}:</span>
                <span className="mono">${grossAmountUSD.toFixed(2)} × {dividendFxRate.toFixed(2)} = ฿{snapshots.grossAmountTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-line">
                <span>{t('dividend:formPreviewWht')} ({whtRate.toFixed(1)}%):</span>
                <span className="mono">-${whtAmountUSD.toFixed(2)} × {dividendFxRate.toFixed(2)} = -฿{snapshots.whtAmountTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-divider" />
              <div className="remit-preview-line" style={{ fontWeight: 600 }}>
                <span>{t('dividend:formPreviewNet')}:</span>
                <span className="mono">${netAmountUSD.toFixed(2)} × {dividendFxRate.toFixed(2)} = ฿{snapshots.netAmountTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-info">{t('dividend:formPreviewInfo')}</div>
            </div>
          )}

          {/* Row 4: Notes */}
          <div className="form-group">
            <label htmlFor="div-notes">{t('dividend:formNotes')}</label>
            <input
              id="div-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-input"
              placeholder={t('dividend:formNotesPlaceholder')}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('dividend:formCancel')}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {t('dividend:formSave')}
          </button>
        </div>
      </div>
    </div>
  );
}