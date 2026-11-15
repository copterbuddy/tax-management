import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RealizedGainResult, RemittanceRecord } from '../types/trade';
import { validateRemittance } from '../engine/fifoEngine';
import { useTranslation } from 'react-i18next';

// ─── Form Schema ───────────────────────────────────────────────────────────

const remitFormSchema = z.object({
  sellTradeId: z.string().min(1, 'Please select a sell trade'),
  amountUSD: z.number().positive('Amount must be positive'),
  remitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required'),
  fxRateTHB: z.number().positive('FX rate must be positive'),
  notes: z.string().optional(),
});

type RemitFormData = z.infer<typeof remitFormSchema>;

// ─── Props ─────────────────────────────────────────────────────────────────

interface RemitFormProps {
  gains: RealizedGainResult[];
  remittance?: RemittanceRecord | null;
  /** Gain to preselect when the form is opened for a specific outstanding sale. */
  initialSellTradeId?: string;
    /** Returns `false` when the dispatch was refused, so the form can stay open. */
      onSubmit: (remittance: RemittanceRecord) => boolean | void;
  onCancel: () => void;
}

function generateId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function RemitForm({ gains, remittance, initialSellTradeId, onSubmit, onCancel }: RemitFormProps) {
  const { t } = useTranslation();
  const isEdit = !!remittance;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RemitFormData>({
    resolver: zodResolver(remitFormSchema),
    defaultValues: {
      sellTradeId: remittance?.sellTradeId || initialSellTradeId || '',
      amountUSD: remittance?.amountUSD ?? 0,
      remitDate: remittance?.remitDate || new Date().toISOString().substring(0, 10),
      fxRateTHB: remittance?.fxRateTHB ?? 0,
      notes: remittance?.notes || '',
    },
  });

  const sellTradeId = watch('sellTradeId');
  const amountUSD = watch('amountUSD');
  const fxRateTHB = watch('fxRateTHB');

  const sellTrades = gains.filter(g => {
    if (g.remainingProceedsUSD > 0) return true;
    // When editing, always include the trade the remittance currently belongs to
    if (isEdit && remittance && g.sellTradeId === remittance.sellTradeId) return true;
    return false;
  });
  const selectedGain = gains.find(g => g.sellTradeId === sellTradeId);

  const rejectionMessage = (reason: string | undefined, availableUSD: number): string => {
    if (reason?.includes('exceeds remaining')) {
      return `${t('remittance:remitExceeds')}: $${availableUSD.toFixed(2)}`;
    }
    if (reason?.includes('positive')) {
      return t('remittance:remitAmountPositive');
    }
    return t('remittance:remitWrongSale');
  };

  const onFormSubmit = (data: RemitFormData) => {
    const amount = Number(data.amountUSD);

    // When editing, the old remittance still counts toward totalRemitted,
    // so the effective available = remaining + oldAmount
        const previousAmount = isEdit && remittance ? remittance.amountUSD : 0;
    const effectiveRemaining = selectedGain
          ? selectedGain.remainingProceedsUSD + previousAmount
      : 0;

    const remittanceRecord: RemittanceRecord = {
      id: remittance?.id || generateId(),
      sellTradeId: data.sellTradeId,
      amountUSD: amount,
      remitDate: data.remitDate,
      fxRateTHB: Number(data.fxRateTHB),
      notes: data.notes?.trim() || undefined,
    };

      if (selectedGain) {
            // Validate against a candidate gain that does not double-count the record being edited.
            const candidate: RealizedGainResult = {
              ...selectedGain,
              totalRemittedUSD: selectedGain.totalRemittedUSD - previousAmount,
              remainingProceedsUSD: effectiveRemaining,
            };
            const result = validateRemittance(candidate, remittanceRecord);
            if (!result.valid) {
              setError('amountUSD', {
                message: rejectionMessage(result.message, effectiveRemaining),
              });
              return;
      }
          }

          if (onSubmit(remittanceRecord) === false) {
            setError('root', { message: t('remittance:remitRejected') });
          }
  };

  const estimatedTaxable = selectedGain && amountUSD && fxRateTHB
    ? Number(amountUSD) * selectedGain.gainPercent * Number(fxRateTHB)
    : 0;

  return (
    <div className="trade-form-overlay">
      <div className="trade-form-modal">
        <div className="trade-form-header">
          <h2>{isEdit ? t('remittance:remitEditTitle') : t('remittance:remitFormTitle')}</h2>
          <button className="btn-close" onClick={onCancel} aria-label={t('common:close')}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onFormSubmit)} className="trade-form">
          <div className="form-group">
            <label htmlFor="remit-trade">{t('remittance:remitFormTrade')}</label>
            <select
              id="remit-trade"
              {...register('sellTradeId')}
            >
              <option value="">{t('remittance:remitFormSelect')}</option>
              {sellTrades.map(g => (
                <option key={g.sellTradeId} value={g.sellTradeId}>
                  {g.symbol} ({g.sellDate}) — {t('remittance:remitFormRemaining')}: ${g.remainingProceedsUSD.toFixed(2)} | {t('remittance:remitFormGain')}: {g.gainUSD >= 0 ? '+' : ''}${g.gainUSD.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {sellTrades.length === 0 && (
            <p className="empty-hint">{t('remittance:remitFormNoSells')}</p>
          )}

          {selectedGain && (
            <div className="remit-info">
              <span>{t('remittance:remitFormGain')}: ${selectedGain.gainUSD.toFixed(2)} ({(selectedGain.gainPercent * 100).toFixed(1)}%)</span>
              <span>{t('remittance:remitFormRemaining')}: ${selectedGain.remainingProceedsUSD.toFixed(2)}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="remit-date">{t('remittance:remitFormDate')}</label>
              <input
                id="remit-date"
                type="date"
                max={new Date().toISOString().substring(0, 10)}
                {...register('remitDate')}
                className={errors.remitDate ? 'input-error' : ''}
              />
              {errors.remitDate && <span className="error-msg">{errors.remitDate.message}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="remit-amount">{t('remittance:remitFormAmount')}</label>
              <input
                id="remit-amount"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 1000"
                {...register('amountUSD', { valueAsNumber: true })}
                className={errors.amountUSD ? 'input-error' : ''}
              />
              <span className="hint-text">
                {t('remittance:remitFormAmountHint')}
              </span>
              {selectedGain && selectedGain.remainingProceedsUSD > 0 && (
                <button
                  type="button"
                  className="btn btn-link"
                  style={{ fontSize: '0.85rem', padding: '4px 0' }}
                  onClick={() => setValue('amountUSD', selectedGain.remainingProceedsUSD)}
                >
                  {t('remittance:remitFormRemitRemaining', { amount: selectedGain.remainingProceedsUSD.toFixed(2) })}
                </button>
              )}
              {errors.amountUSD && <span className="error-msg">{errors.amountUSD.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="remit-fx">{t('remittance:remitFormFx')}</label>
              <input
                id="remit-fx"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 36.50"
                {...register('fxRateTHB', { valueAsNumber: true })}
                className={errors.fxRateTHB ? 'input-error' : ''}
              />
              {errors.fxRateTHB && <span className="error-msg">{errors.fxRateTHB.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="remit-notes">{t('remittance:remitFormNotes')}</label>
            <input
              id="remit-notes"
              type="text"
              placeholder={t('remittance:remitFormNotesPlaceholder')}
              {...register('notes')}
            />
          </div>

          {errors.root && <div className="validation-error">{errors.root.message}</div>}

          {selectedGain && amountUSD && !isNaN(Number(amountUSD)) && Number(amountUSD) > 0 && fxRateTHB && !isNaN(Number(fxRateTHB)) && (
            <div className="remit-preview">
              <p><strong>{t('remittance:remitFormPreview')}:</strong></p>
              <div className="remit-breakdown">
                <p className="remit-breakdown-row">
                  {t('remittance:remitFormPreviewRemit')}: <strong>${Number(amountUSD).toFixed(2)}</strong>
                </p>
                <p className="remit-breakdown-row">
                  {t('remittance:remitFormPreviewGain', { pct: (selectedGain.gainPercent * 100).toFixed(1) })}:
                  {' '}<strong>${(Number(amountUSD) * selectedGain.gainPercent).toFixed(2)}</strong>
                </p>
                <p className="remit-breakdown-row">
                  {t('remittance:remitFormPreviewCost')}:{' '}
                  <strong>${(Number(amountUSD) - Number(amountUSD) * selectedGain.gainPercent).toFixed(2)}</strong>
                </p>
                <p className="remit-breakdown-result">
                  {t('remittance:remitFormPreviewTaxable', {
                    usd: (Number(amountUSD) * selectedGain.gainPercent).toFixed(2),
                    fx: Number(fxRateTHB).toFixed(2),
                    thb: estimatedTaxable.toFixed(2)
                  })}
                </p>
              </div>
              <p className="remit-note">{t('remittance:remitFormPreviewNote')}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              {t('remittance:remitFormCancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? t('remittance:remitEditSubmit') : t('remittance:remitFormSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
