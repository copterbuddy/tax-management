// ─── Mark Reinvested Dialog ─────────────────────────────────────────────────
// Records how much of a sale's proceeds were spent on another offshore
// purchase instead of being returned to Thailand. Prefilled with the gain's
// outstanding balance and editable down, never up.

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { OutstandingProceedsRow } from '../types/trade';

/** What the dialog hands back: the amount always travels with the sale it belongs to. */
export interface ReinvestedAmountInput {
  sellTradeId: string;
  amountUSD: number;
}

interface MarkReinvestedDialogProps {
  row: OutstandingProceedsRow;
  onSubmit: (input: ReinvestedAmountInput) => void;
  onCancel: () => void;
}

function toCents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function MarkReinvestedDialog({ row, onSubmit, onCancel }: MarkReinvestedDialogProps) {
  const { t } = useTranslation();
  const balance = toCents(row.availableBalanceUSD);

  const schema = useMemo(
    () => z.object({
      amountUSD: z.number({ message: t('remittance:markReinvestedInvalid') })
        .min(0, { message: t('remittance:markReinvestedInvalid') })
        .max(row.availableBalanceUSD, {
          message: t('remittance:markReinvestedExceeds', { balance: balance.toFixed(2) }),
        }),
    }),
    [row.availableBalanceUSD, balance, t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ amountUSD: number }>({
    resolver: zodResolver(schema),
    defaultValues: { amountUSD: balance },
  });

  const onFormSubmit = (data: { amountUSD: number }) => {
    onSubmit({ sellTradeId: row.sellTradeId, amountUSD: Number(data.amountUSD) });
  };

  return (
    <div className="trade-form-overlay" onClick={onCancel}>
      <div
        className="trade-form-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('remittance:markReinvestedTitle')}
      >
        <div className="trade-form-header">
          <h2>
            {t('remittance:markReinvestedTitle')}
            <span className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
              ({row.symbol} · {row.sellDate})
            </span>
          </h2>
          <button className="btn-close" onClick={onCancel} aria-label={t('common:close')}>&times;</button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="trade-form">
          <div className="form-group">
            <p className="remit-note">{t('remittance:markReinvestedHelp')}</p>
          </div>

          <div className="form-group">
            <label htmlFor="mark-reinvested-amount">{t('remittance:markReinvestedAmount')}</label>
            <input
              id="mark-reinvested-amount"
              type="number"
              step="0.01"
              min={0}
              {...register('amountUSD', { valueAsNumber: true })}
              className={errors.amountUSD ? 'input-error' : ''}
            />
            <span className="hint-text">
              {t('remittance:markReinvestedAmountHint', { balance: balance.toFixed(2) })}
            </span>
            {errors.amountUSD && <span className="error-msg">{errors.amountUSD.message}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              {t('common:cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('remittance:markReinvestedSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}