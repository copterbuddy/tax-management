import { useState, useEffect, useMemo } from 'react';
import type { TradeTransaction, TradeType, ProviderType } from '../types/trade';
import { useLanguage } from '../i18n/LanguageContext';

// OCP: Centralized provider list — add new providers here only
const PROVIDER_OPTIONS: ProviderType[] = ['Dime', 'Liberator', 'FinansiaSyrus'];

interface TradeFormProps {
  trade?: TradeTransaction | null;
  onSubmit: (trade: TradeTransaction) => void;
  onCancel: () => void;
  /** DIP: Optional external validator — caller injects validation logic */
  onValidate?: (trade: TradeTransaction) => string | null;
}

function generateId(): string {
  return `trd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export function TradeForm({ trade, onSubmit, onCancel, onValidate }: TradeFormProps) {
  const { t } = useLanguage();

  // Date constraints: new trades limited to last 5 years, edits keep original date
  const dateConstraints = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const minDate = fiveYearsAgo.toISOString().substring(0, 10);

    if (trade) {
      // Editing: allow original date even if > 5 years old
      return { min: trade.date < minDate ? trade.date : minDate, max: today };
    }
    // New trade: limit to last 5 years
    return { min: minDate, max: today };
  }, [trade]);

  const [date, setDate] = useState('');
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState<TradeType>('BUY');
  const [provider, setProvider] = useState<ProviderType>('Dime');
  const [quantity, setQuantity] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [commissionUSD, setCommissionUSD] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (trade) {
      setDate(trade.date);
      setSymbol(trade.symbol);
      setType(trade.type);
      setProvider(trade.provider);
      setQuantity(trade.quantity.toString());
      setPriceUSD(trade.priceUSD.toString());
      setCommissionUSD(trade.commissionUSD.toString());
      setNotes(trade.notes || '');
    } else {
      setDate(new Date().toISOString().substring(0, 10));
      setSymbol('');
      setType('BUY');
      setProvider('Dime');
      setQuantity('');
      setPriceUSD('');
      setCommissionUSD('0');
      setNotes('');
    }
    setErrors({});
    setValidationError(null);
  }, [trade]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = 'Date is required';
    if (!symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    if (!priceUSD || isNaN(Number(priceUSD)) || Number(priceUSD) <= 0) {
      newErrors.priceUSD = 'Price must be a positive number';
    }
    if (commissionUSD === '' || isNaN(Number(commissionUSD)) || Number(commissionUSD) < 0) {
      newErrors.commissionUSD = 'Fee must be a non-negative number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!validate()) return;

    const tradeData: TradeTransaction = {
      id: trade?.id || generateId(),
      date,
      symbol: symbol.trim().toUpperCase(),
      type,
      provider,
      quantity: Number(quantity),
      priceUSD: Number(priceUSD),
      commissionUSD: Number(commissionUSD),
      notes: notes.trim() || undefined,
    };

    // DIP: Delegate business validation to the caller via injected callback
    if (type === 'SELL' && onValidate) {
      const validationMessage = onValidate(tradeData);
      if (validationMessage) {
        setValidationError(validationMessage);
        return;
      }
    }

    onSubmit(tradeData);
  };

    return (
    <div className="trade-form-overlay">
      <div className="trade-form-modal">
        <div className="trade-form-header">
          <h2>{trade ? t.formEditTitle : t.formAddTitle}</h2>
          <button className="btn-close" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="trade-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-date">{t.formDate}</label>
              <input
                id="trade-date"
                type="date"
                value={date}
                min={dateConstraints.min}
                max={dateConstraints.max}
                onChange={e => setDate(e.target.value)}
                className={errors.date ? 'input-error' : ''}
              />
              {errors.date && <span className="error-msg">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-symbol">{t.formSymbol}</label>
              <input
                id="trade-symbol"
                type="text"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="e.g. AAPL"
                className={errors.symbol ? 'input-error' : ''}
              />
              {errors.symbol && <span className="error-msg">{errors.symbol}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-type">{t.formTradeType}</label>
              <select
                id="trade-type"
                value={type}
                onChange={e => setType(e.target.value as TradeType)}
              >
                <option value="BUY">{t.tradeTypeBuy}</option>
                <option value="SELL">{t.tradeTypeSell}</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-provider">{t.formProvider}</label>
              <select
                id="trade-provider"
                value={provider}
                onChange={e => setProvider(e.target.value as ProviderType)}
              >
                {PROVIDER_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-quantity">{t.formQuantity}</label>
              <input
                id="trade-quantity"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 10"
                className={errors.quantity ? 'input-error' : ''}
              />
              {errors.quantity && <span className="error-msg">{errors.quantity}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-price">{t.formPrice}</label>
              <input
                id="trade-price"
                type="number"
                step="any"
                min="0"
                value={priceUSD}
                onChange={e => setPriceUSD(e.target.value)}
                placeholder="e.g. 185.50"
                className={errors.priceUSD ? 'input-error' : ''}
              />
              {errors.priceUSD && <span className="error-msg">{errors.priceUSD}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-commission">{t.formFee}</label>
              <input
                id="trade-commission"
                type="number"
                step="any"
                min="0"
                value={commissionUSD}
                onChange={e => setCommissionUSD(e.target.value)}
                placeholder="e.g. 1.50"
                className={errors.commissionUSD ? 'input-error' : ''}
              />
              {errors.commissionUSD && <span className="error-msg">{errors.commissionUSD}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="trade-notes">{t.formNotes}</label>
            <input
              id="trade-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.formNotesPlaceholder}
            />
          </div>

          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>{t.formCancel}</button>
            <button type="submit" className="btn btn-primary">
              {trade ? t.formUpdate : t.formSubmit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}