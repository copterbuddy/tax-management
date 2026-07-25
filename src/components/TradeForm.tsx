import { useState, useEffect, useMemo } from 'react';
import type { TradeTransaction, AssetType, TradeType, ProviderType } from '../types/trade';

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
  const [date, setDate] = useState('');
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('FOREIGN_STOCK');
  const [type, setType] = useState<TradeType>('BUY');
  const [provider, setProvider] = useState<ProviderType>('Dime');
  const [quantity, setQuantity] = useState('');
  const [priceUSD, setPriceUSD] = useState('');
  const [commissionUSD, setCommissionUSD] = useState('');
  const [fxRateTHB, setFxRateTHB] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (trade) {
      setDate(trade.date);
      setSymbol(trade.symbol);
      setAssetType(trade.assetType);
      setType(trade.type);
      setProvider(trade.provider);
      setQuantity(trade.quantity.toString());
      setPriceUSD(trade.priceUSD.toString());
      setCommissionUSD(trade.commissionUSD.toString());
      setFxRateTHB(trade.fxRateTHB.toString());
      setNotes(trade.notes || '');
    } else {
      setDate(new Date().toISOString().substring(0, 10));
      setSymbol('');
      setAssetType('FOREIGN_STOCK');
      setType('BUY');
      setProvider('Dime');
      setQuantity('');
      setPriceUSD('');
      setCommissionUSD('0');
      setFxRateTHB('35.00');
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
    if (!fxRateTHB || isNaN(Number(fxRateTHB)) || Number(fxRateTHB) <= 0) {
      newErrors.fxRateTHB = 'FX rate must be a positive number';
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
      assetType,
      type,
      provider,
      quantity: Number(quantity),
      priceUSD: Number(priceUSD),
      commissionUSD: Number(commissionUSD),
      fxRateTHB: Number(fxRateTHB),
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
          <h2>{trade ? 'Edit Trade' : 'Add New Trade'}</h2>
          <button className="btn-close" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="trade-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-date">Date</label>
              <input
                id="trade-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={errors.date ? 'input-error' : ''}
              />
              {errors.date && <span className="error-msg">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-symbol">Symbol</label>
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
              <label htmlFor="trade-asset-type">Asset Type</label>
              <select
                id="trade-asset-type"
                value={assetType}
                onChange={e => setAssetType(e.target.value as AssetType)}
              >
                <option value="FOREIGN_STOCK">Foreign Stock</option>
                <option value="CRYPTO">Crypto</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="trade-type">Trade Type</label>
              <select
                id="trade-type"
                value={type}
                onChange={e => setType(e.target.value as TradeType)}
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-provider">Provider (Broker)</label>
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
              <label htmlFor="trade-quantity">Quantity</label>
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
              <label htmlFor="trade-price">Unit Price (USD)</label>
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
              <label htmlFor="trade-commission">Fee (USD)</label>
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
            <div className="form-group">
              <label htmlFor="trade-fx">FX Rate (THB)</label>
              <input
                id="trade-fx"
                type="number"
                step="any"
                min="0"
                value={fxRateTHB}
                onChange={e => setFxRateTHB(e.target.value)}
                placeholder="e.g. 36.50"
                className={errors.fxRateTHB ? 'input-error' : ''}
              />
              {errors.fxRateTHB && <span className="error-msg">{errors.fxRateTHB}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="trade-notes">Notes (optional)</label>
            <input
              id="trade-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Broker reference"
            />
          </div>

          {validationError && (
            <div className="validation-error">{validationError}</div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {trade ? 'Update Trade' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}