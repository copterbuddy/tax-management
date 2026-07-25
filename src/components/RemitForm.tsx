import { useState } from 'react';
import type { RealizedGainResult, RemittanceRecord } from '../types/trade';

interface RemitFormProps {
  gains: RealizedGainResult[];
  onSubmit: (remittance: RemittanceRecord) => void;
  onCancel: () => void;
}

function generateId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export function RemitForm({ gains, onSubmit, onCancel }: RemitFormProps) {
  const [sellTradeId, setSellTradeId] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  const [remitDate, setRemitDate] = useState(new Date().toISOString().substring(0, 10));
  const [fxRateTHB, setFxRateTHB] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedGain = gains.find(g => g.sellTradeId === sellTradeId);
  const sellTrades = gains.filter(g => g.remainingProceedsUSD > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sellTradeId) { setError('Please select a sell trade'); return; }
    if (!amountUSD || isNaN(Number(amountUSD)) || Number(amountUSD) <= 0) {
      setError('Amount must be positive'); return;
    }
    if (!fxRateTHB || isNaN(Number(fxRateTHB)) || Number(fxRateTHB) <= 0) {
      setError('FX rate must be positive'); return;
    }
    if (!remitDate) { setError('Date is required'); return; }

    const amount = Number(amountUSD);
    if (selectedGain && amount > selectedGain.remainingProceedsUSD) {
      setError(`Remittance exceeds remaining proceeds. Available: $${selectedGain.remainingProceedsUSD.toFixed(2)}`);
      return;
    }

    const remittance: RemittanceRecord = {
      id: generateId(),
      sellTradeId,
      amountUSD: amount,
      remitDate,
      fxRateTHB: Number(fxRateTHB),
      notes: notes.trim() || undefined,
    };

    onSubmit(remittance);
  };

  return (
    <div className="trade-form-overlay">
      <div className="trade-form-modal">
        <div className="trade-form-header">
          <h2>Record Remittance (นำเงินเข้าไทย)</h2>
          <button className="btn-close" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="trade-form">
          <div className="form-group">
            <label htmlFor="remit-trade">Sell Trade</label>
            <select
              id="remit-trade"
              value={sellTradeId}
              onChange={e => setSellTradeId(e.target.value)}
            >
              <option value="">-- Select sell trade --</option>
              {sellTrades.map(g => (
                <option key={g.sellTradeId} value={g.sellTradeId}>
                  {g.symbol} ({g.sellDate}) — Remaining: ${g.remainingProceedsUSD.toFixed(2)} | Gain: {g.gainUSD >= 0 ? '+' : ''}${g.gainUSD.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {sellTrades.length === 0 && (
            <p className="empty-hint">No sell trades with remaining proceeds. Add sell trades first.</p>
          )}

          {selectedGain && (
            <div className="remit-info">
              <span>Gain: ${selectedGain.gainUSD.toFixed(2)} ({(selectedGain.gainPercent * 100).toFixed(1)}%)</span>
              <span>Remaining: ${selectedGain.remainingProceedsUSD.toFixed(2)}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="remit-date">Remittance Date (วันที่นำเข้า)</label>
              <input
                id="remit-date"
                type="date"
                value={remitDate}
                max={new Date().toISOString().substring(0, 10)}
                onChange={e => setRemitDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="remit-amount">Amount (USD)</label>
              <input
                id="remit-amount"
                type="number"
                step="any"
                min="0"
                value={amountUSD}
                onChange={e => setAmountUSD(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="remit-fx">FX Rate (THB/USD on remittance date)</label>
              <input
                id="remit-fx"
                type="number"
                step="any"
                min="0"
                value={fxRateTHB}
                onChange={e => setFxRateTHB(e.target.value)}
                placeholder="e.g. 36.50"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="remit-notes">Notes (optional)</label>
            <input
              id="remit-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Bank transfer reference"
            />
          </div>

          {error && <div className="validation-error">{error}</div>}

          {selectedGain && amountUSD && !isNaN(Number(amountUSD)) && Number(amountUSD) > 0 && fxRateTHB && !isNaN(Number(fxRateTHB)) && (
            <div className="remit-preview">
              <p>
                <strong>Estimated Taxable Gain:</strong>{' '}
                ${(Number(amountUSD) * selectedGain.gainPercent).toFixed(2)} USD × {Number(fxRateTHB).toFixed(2)} THB/USD
                {' = '}
                ฿{(Number(amountUSD) * selectedGain.gainPercent * Number(fxRateTHB)).toFixed(2)}
              </p>
              <p className="remit-note">Only the gain portion ({(selectedGain.gainPercent * 100).toFixed(1)}%) is taxable. Cost basis is not taxed.</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Record Remittance</button>
          </div>
        </form>
      </div>
    </div>
  );
}
