import { useEffect, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TradeTransaction, TradeType, ProviderType, FifoLot } from '../types/trade';
import { PROVIDER_OPTIONS, DATE_LIMITS, VALIDATION } from '../constants';
import { useTranslation } from 'react-i18next';

// ─── Form Schema ───────────────────────────────────────────────────────────

const tradeFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  symbol: z.string().min(1, 'Symbol is required').max(VALIDATION.SYMBOL_MAX_LENGTH),
  type: z.enum(['BUY', 'SELL']),
  provider: z.enum(PROVIDER_OPTIONS as [string, ...string[]]),
  quantity: z.number().positive('Must be positive').max(VALIDATION.QUANTITY_MAX),
  priceUSD: z.number().min(VALIDATION.PRICE_MIN).max(VALIDATION.PRICE_MAX),
  commissionUSD: z.number().min(0),
  exchangeFeeUSD: z.number().min(0),
  tafFeeUSD: z.number().min(0),
  notes: z.string().optional(),
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

interface TradeFormProps {
  trade?: TradeTransaction | null;
  onSubmit: (trade: TradeTransaction) => void;
  onCancel: () => void;
  onValidate?: (trade: TradeTransaction) => string | null;
  /** DIP: Pass remaining lots for real-time provider availability display */
  remainingLots?: FifoLot[];
}

function generateId(): string {
  return `trd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function TradeForm({ trade, onSubmit, onCancel, onValidate, remainingLots = [] }: TradeFormProps) {
  const { t } = useTranslation();

  const dateConstraints = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - DATE_LIMITS.MAX_PAST_YEARS);
    const minDate = fiveYearsAgo.toISOString().substring(0, 10);

    if (trade) {
      return { min: trade.date < minDate ? trade.date : minDate, max: today };
    }
    return { min: minDate, max: today };
  }, [trade]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      date: trade?.date ?? new Date().toISOString().substring(0, 10),
      symbol: trade?.symbol ?? '',
      type: (trade?.type as 'BUY' | 'SELL') ?? 'BUY',
      provider: (trade?.provider as string) ?? 'Dime',
      quantity: trade?.quantity ?? 0,
      priceUSD: trade?.priceUSD ?? 0,
      commissionUSD: trade?.commissionUSD ?? 0,
      exchangeFeeUSD: trade?.exchangeFeeUSD ?? 0,
      tafFeeUSD: trade?.tafFeeUSD ?? 0,
      notes: trade?.notes ?? '',
    },
  });

  // Reset form when trade prop changes (edit vs add)
  useEffect(() => {
    reset({
      date: trade?.date ?? new Date().toISOString().substring(0, 10),
      symbol: trade?.symbol ?? '',
      type: (trade?.type as 'BUY' | 'SELL') ?? 'BUY',
      provider: (trade?.provider as string) ?? 'Dime',
      quantity: trade?.quantity ?? 0,
      priceUSD: trade?.priceUSD ?? 0,
      commissionUSD: trade?.commissionUSD ?? 0,
      exchangeFeeUSD: trade?.exchangeFeeUSD ?? 0,
      tafFeeUSD: trade?.tafFeeUSD ?? 0,
      notes: trade?.notes ?? '',
    });
  }, [trade, reset]);

  // ─── Sellable Options (SELL mode Symbol dropdown) ─────────────────────────

  interface SellableOption {
    symbol: string;
    provider: ProviderType;
    totalRemaining: number;
  }

  const sellableOptions = useMemo<SellableOption[]>(() => {
    const map = new Map<string, SellableOption>();
    for (const lot of remainingLots) {
      const key = `${lot.symbol}|${lot.provider}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalRemaining += lot.remainingQuantity;
      } else {
        map.set(key, {
          symbol: lot.symbol,
          provider: lot.provider,
          totalRemaining: lot.remainingQuantity,
        });
      }
    }
    return Array.from(map.values())
      .filter(o => o.totalRemaining > 0)
      .sort((a, b) => a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider));
  }, [remainingLots]);

  const allSellableOptions = useMemo(() => {
    const options = [...sellableOptions];
    if (trade && trade.type === 'SELL') {
      const exists = options.some(
        o => o.symbol === trade.symbol && o.provider === trade.provider
      );
      if (!exists) {
        options.unshift({
          symbol: trade.symbol,
          provider: trade.provider as ProviderType,
          totalRemaining: 0,
        });
      }
    }
    return options;
  }, [sellableOptions, trade]);

  // ─── Watch form values ───────────────────────────────────────────────────

  const watchedType = watch('type');
  const watchedSymbol = watch('symbol');
  const watchedProvider = watch('provider');

  // ─── Type toggle reset ───────────────────────────────────────────────────

  const previousTypeRef = useRef(watchedType);

  useEffect(() => {
    if (watchedType !== previousTypeRef.current) {
      setValue('symbol', '');
      setValue('provider', 'Dime');
      previousTypeRef.current = watchedType;
    }
  }, [watchedType, setValue]);

  // ─── On Submit ───────────────────────────────────────────────────────────

  const onFormSubmit = (data: TradeFormData) => {
    const tradeData: TradeTransaction = {
      id: trade?.id || generateId(),
      date: data.date,
      symbol: data.symbol.trim().toUpperCase(),
      type: data.type as TradeType,
      provider: data.provider as ProviderType,
      quantity: Number(data.quantity),
      priceUSD: Number(data.priceUSD),
      commissionUSD: Number(data.commissionUSD),
      exchangeFeeUSD: Number(data.exchangeFeeUSD),
      tafFeeUSD: Number(data.tafFeeUSD),
      notes: data.notes?.trim() || undefined,
    };

    // Check real-time availability BEFORE calling onValidate
    if (tradeData.type === 'SELL') {
      const available = getAvailableQty(tradeData.symbol, tradeData.provider);
      if (available !== null && tradeData.quantity > available) {
        setError('quantity', {
          message: `Insufficient lots — only ${available} shares of ${tradeData.symbol} available from ${tradeData.provider}`,
        });
        return;
      }
    }

    // DIP: Delegate business validation via injected callback
    if (tradeData.type === 'SELL' && onValidate) {
      const validationMessage = onValidate(tradeData);
      if (validationMessage) {
        setError('root', { message: validationMessage });
        return;
      }
    }

    onSubmit(tradeData);
  };

  // ─── Real-time Provider Availability ────────────────────────────────────

  const getAvailableQty = (sym: string, prov: string): number | null => {
    if (!sym) return null;
    const lots = remainingLots.filter(
      l => l.symbol === sym.toUpperCase() && l.provider === prov
    );
    return lots.length > 0 ? lots.reduce((sum, l) => sum + l.remainingQuantity, 0) : 0;
  };

  const currentAvailableQty = watchedType === 'SELL'
    ? getAvailableQty(watchedSymbol, watchedProvider)
    : null;

  const hasQuantityError = !!errors.quantity || (watchedType === 'SELL' && currentAvailableQty !== null && currentAvailableQty === 0);

  return (
    <div className="trade-form-overlay">
      <div className="trade-form-modal">
        <div className="trade-form-header">
          <h2>{trade ? t('trade:formEditTitle') : t('trade:formAddTitle')}</h2>
          <button className="btn-close" onClick={onCancel} aria-label={t('common:close')}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onFormSubmit)} className="trade-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-date">{t('trade:formDate')}</label>
              <input
                id="trade-date"
                type="date"
                min={dateConstraints.min}
                max={dateConstraints.max}
                {...register('date')}
                className={errors.date ? 'input-error' : ''}
              />
              {errors.date && <span className="error-msg">{errors.date.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-symbol">{t('trade:formSymbol')}</label>
              {watchedType === 'SELL' ? (
                <Controller
                  name="symbol"
                  control={control}
                  render={({ field }) => {
                    const selectValue = field.value
                      ? `sell|${field.value}|${watchedProvider}`
                      : '';

                    if (allSellableOptions.length === 0) {
                      return (
                        <>
                          <select
                            id="trade-symbol"
                            disabled
                            className={`select-empty${errors.symbol ? ' input-error' : ''}`}
                          >
                            <option>{t('trade:sellSymbolEmpty')}</option>
                          </select>
                          {errors.symbol && <span className="error-msg">{errors.symbol.message}</span>}
                        </>
                      );
                    }

                    return (
                      <>
                        <select
                          id="trade-symbol"
                          value={selectValue}
                          onChange={(e) => {
                            const parts = e.target.value.split('|');
                            const symbol = parts[1];
                            const provider = parts[2];
                            field.onChange(symbol);
                            setValue('provider', provider);
                          }}
                          className={errors.symbol ? 'input-error' : ''}
                        >
                          <option value="" disabled>
                            {t('trade:sellSelectSymbol')}
                          </option>
                          {allSellableOptions.map(opt => {
                            const optValue = `sell|${opt.symbol}|${opt.provider}`;
                            if (opt.totalRemaining === 0) {
                              return (
                                <option key={optValue} value={optValue}>
                                  {opt.symbol} @ {opt.provider} — 0 {t('trade:sharesAvailable')} ({t('trade:sharesSoldOut')})
                                </option>
                              );
                            }
                            return (
                              <option key={optValue} value={optValue}>
                                {opt.symbol} @ {opt.provider} — {opt.totalRemaining} {t('trade:sharesAvailable')}
                              </option>
                            );
                          })}
                        </select>
                        {errors.symbol && <span className="error-msg">{errors.symbol.message}</span>}
                      </>
                    );
                  }}
                />
              ) : (
                <>
                  <input
                    id="trade-symbol"
                    type="text"
                    placeholder="e.g. AAPL"
                    {...register('symbol')}
                    className={errors.symbol ? 'input-error' : ''}
                  />
                  {errors.symbol && <span className="error-msg">{errors.symbol.message}</span>}
                </>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-type">{t('trade:formTradeType')}</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select id="trade-type" {...field}>
                    <option value="BUY">{t('trade:tradeTypeBuy')}</option>
                    <option value="SELL">{t('trade:tradeTypeSell')}</option>
                  </select>
                )}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-provider">{t('trade:formProvider')}</label>
              <Controller
                name="provider"
                control={control}
                render={({ field }) => (
                  <select id="trade-provider" {...field} disabled={watchedType === 'SELL'}>
                    {PROVIDER_OPTIONS.map(p => {
                      const label = p === 'Dime' ? t('trade:providerDime') :
                                    p === 'Liberator' ? t('trade:providerLiberator') :
                                    t('trade:providerFinansiaSyrus');
                      const availQty = watchedType === 'SELL' && watchedSymbol
                        ? getAvailableQty(watchedSymbol, p)
                        : null;
                      const availText = availQty !== null
                        ? ` (${availQty} ${watchedSymbol} ${t('common:available') ?? 'available'})`
                        : '';
                      return (
                        <option key={p} value={p}>{label}{availText}</option>
                      );
                    })}
                  </select>
                )}
              />
              {errors.provider && (
                <span className="error-msg">{errors.provider.message}</span>
              )}
              {watchedType === 'SELL' && watchedSymbol && currentAvailableQty !== null && currentAvailableQty === 0 && (
                <span className="error-msg">
                  {t('common:noLotsAvailable') ?? `No ${watchedSymbol} lots available from ${watchedProvider}`}
                </span>
              )}
              {watchedType === 'SELL' && (
                <span className="hint-text">
                  {watchedSymbol
                    ? `ⓘ ${t('trade:sellAutoFilled')}`
                    : `ⓘ ${t('trade:sellSelectFirst')}`}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trade-quantity">{t('trade:formQuantity')}</label>
              <input
                id="trade-quantity"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 10"
                {...register('quantity', { valueAsNumber: true })}
                className={errors.quantity ? 'input-error' : ''}
              />
              {errors.quantity && <span className="error-msg">{errors.quantity.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-price">{t('trade:formPrice')}</label>
              <input
                id="trade-price"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 185.50"
                {...register('priceUSD', { valueAsNumber: true })}
                className={errors.priceUSD ? 'input-error' : ''}
              />
              {errors.priceUSD && <span className="error-msg">{errors.priceUSD.message}</span>}
            </div>
          </div>

          <div className="form-row form-row-fees">
            <div className="form-group">
              <label htmlFor="trade-commission">{t('trade:formFee')}</label>
              <input
                id="trade-commission"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 1.50"
                {...register('commissionUSD', { valueAsNumber: true })}
                className={errors.commissionUSD ? 'input-error' : ''}
              />
              {errors.commissionUSD && <span className="error-msg">{errors.commissionUSD.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="trade-exchange-fee">{t('trade:formExchangeFee')}</label>
              <input
                id="trade-exchange-fee"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 0.25"
                {...register('exchangeFeeUSD', { valueAsNumber: true })}
                className={errors.exchangeFeeUSD ? 'input-error' : ''}
              />
              {errors.exchangeFeeUSD && <span className="error-msg">{errors.exchangeFeeUSD.message}</span>}
            </div>
            {watchedType === 'SELL' && (
              <div className="form-group">
                <label htmlFor="trade-taf-fee">{t('trade:formTafFee')}</label>
                <input
                  id="trade-taf-fee"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 0.10"
                  {...register('tafFeeUSD', { valueAsNumber: true })}
                  className={errors.tafFeeUSD ? 'input-error' : ''}
                />
                {errors.tafFeeUSD && <span className="error-msg">{errors.tafFeeUSD.message}</span>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="trade-notes">{t('trade:formNotes')}</label>
            <input
              id="trade-notes"
              type="text"
              placeholder={t('trade:formNotesPlaceholder')}
              {...register('notes')}
            />
          </div>

          {errors.root && (
            <div className="validation-error">{errors.root.message}</div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              {t('trade:formCancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!!hasQuantityError}
              title={hasQuantityError ? (t('common:insufficientLots') ?? 'Insufficient lots for this provider') : undefined}
            >
              {trade ? t('trade:formUpdate') : t('trade:formSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
