// ─── Dividend Remittance Form ───────────────────────────────────────────────
// Modal for recording a dividend remittance into Thailand.

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DividendRecord, DividendRemittance } from '../types/trade';
import { calculateWhtCredit, validateRemittance } from '../engine/dividendEngine';

interface DividendRemitFormProps {
  open: boolean;
  onClose: () => void;
  onRemit: (remittance: DividendRemittance) => void;
  dividend: DividendRecord;
}

export function DividendRemitForm({
  open,
  onClose,
  onRemit,
  dividend,
}: DividendRemitFormProps) {
  const { t } = useTranslation();

  const [amountUSD, setAmountUSD] = useState(0);
  const [remitDate, setRemitDate] = useState('');
  const [remitFxRate, setRemitFxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // ─── Computed ────────────────────────────────────────────────────────

  const validation = useMemo(
    () => validateRemittance(dividend, amountUSD),
    [dividend, amountUSD],
  );

  const whtCreditTHB = useMemo(
    () => calculateWhtCredit(
      amountUSD,
      dividend.netAmountUSD,
      dividend.whtAmountUSD,
      remitFxRate,
    ),
    [amountUSD, dividend.netAmountUSD, dividend.whtAmountUSD, remitFxRate],
  );

  const remitTHB = amountUSD * remitFxRate;
  const reportableIncomeTHB = remitTHB;  // must derive from remitFxRate, never dividendFxRate (BR2)

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleRemitAll = () => {
    setAmountUSD(dividend.remainingToRemitUSD);
  };

  const handleSubmit = () => {
    setError('');

    if (!remitDate) { setError('Remittance date is required'); return; }
    if (remitFxRate <= 0) { setError('FX rate must be > 0'); return; }
    if (!validation.valid) { setError(validation.message ?? 'Invalid amount'); return; }
    if (amountUSD > dividend.remainingToRemitUSD) {
      setError(`Amount exceeds remaining $${dividend.remainingToRemitUSD.toFixed(2)}`);
      return;
    }

    const remittance: DividendRemittance = {
      id: crypto.randomUUID(),
      dividendId: dividend.id,
      amountUSD,
      remitDate,
      remitFxRate,
      remitTHB,
      reportableIncomeTHB,
      whtCreditTHB,
      notes: notes || undefined,
    };

    onRemit(remittance);
    setAmountUSD(0);
    setRemitDate('');
    setRemitFxRate(0);
    setNotes('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '460px' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>
            {t('dividend:remitDialogTitle')}
            <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
              ({dividend.symbol} — ${dividend.remainingToRemitUSD.toFixed(2)} {t('dividend:remitRemaining')})
            </span>
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="form-error-banner">⚠️ {error}</div>
          )}

          {/* Row 1: Remit Date + FX Rate */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dremit-date">{t('dividend:remitDate')}</label>
              <input
                id="dremit-date"
                type="date"
                value={remitDate}
                onChange={e => setRemitDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dremit-fx">{t('dividend:remitFxRate')}</label>
              <input
                id="dremit-fx"
                type="number"
                step="0.01"
                min={0}
                value={remitFxRate || ''}
                onChange={e => setRemitFxRate(Number(e.target.value))}
                className="form-input"
                placeholder="e.g. 35.00"
              />
            </div>
          </div>

          {/* Row 2: Amount */}
          <div className="form-group">
            <label htmlFor="dremit-amount">{t('dividend:remitAmount')}</label>
            <div className="form-input-with-action">
              <input
                id="dremit-amount"
                type="number"
                step="0.01"
                min={0}
                max={dividend.remainingToRemitUSD}
                value={amountUSD || ''}
                onChange={e => setAmountUSD(Number(e.target.value))}
                className="form-input"
                placeholder="0.00"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-sm btn-ghost"
                onClick={handleRemitAll}
                title={t('dividend:remitRemitAll')}
              >
                {t('dividend:remitRemitAll')}
              </button>
            </div>
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
              {t('dividend:remitMax')}: ${dividend.remainingToRemitUSD.toFixed(2)}
            </small>
          </div>

          {/* Preview */}
          {amountUSD > 0 && remitFxRate > 0 && (
            <div className="remit-preview">
              <div className="remit-preview-title">{t('dividend:remitPreviewTitle')}</div>
              <div className="remit-preview-line">
                <span>{t('dividend:remitPreviewReceived')}:</span>
                <span className="mono">${amountUSD.toFixed(2)} × {remitFxRate.toFixed(2)} = ฿{remitTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-divider" />
              <div className="remit-preview-line" style={{ fontWeight: 600 }}>
                <span>{t('dividend:remitPreviewReportable')}:</span>
                <span className="mono">฿{reportableIncomeTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-line">
                <span>{t('dividend:remitPreviewWhtCredit')}:</span>
                <span className="mono">฿{whtCreditTHB.toFixed(2)}</span>
              </div>
              <div className="remit-preview-info">{t('dividend:remitPreviewInfo')}</div>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="dremit-notes">{t('dividend:formNotes')}</label>
            <input
              id="dremit-notes"
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
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={amountUSD <= 0 || remitFxRate <= 0}
          >
            {t('dividend:remitSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}