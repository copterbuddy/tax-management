import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { MarkReinvestedDialog } from './MarkReinvestedDialog';
import type { OutstandingProceedsRow } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const row: OutstandingProceedsRow = {
  sellTradeId: 'sell_allw',
  sellDate: '2026-02-13',
  symbol: 'ALLW',
  provider: 'Dime',
  sellRevenueUSD: 204.75,
  totalRemittedUSD: 58.32,
  reinvestedUSD: 0,
  availableBalanceUSD: 146.43,
};

function renderDialog(overrides: Partial<OutstandingProceedsRow> = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(<MarkReinvestedDialog row={{ ...row, ...overrides }} onSubmit={onSubmit} onCancel={onCancel} />);
  return { onSubmit, onCancel };
}

function submit(amount: string) {
  fireEvent.change(screen.getByLabelText(/Reinvested amount/i), { target: { value: amount } });
  fireEvent.click(screen.getByRole('button', { name: /record reinvested amount/i }));
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

// ─── Prefill and submission ─────────────────────────────────────────────────

describe('MarkReinvestedDialog', () => {
  it('prefills the full outstanding balance', () => {
    renderDialog();
    expect((screen.getByLabelText(/Reinvested amount/i) as HTMLInputElement).value).toBe('146.43');
  });

  it('emits the amount together with its sale when the full balance is kept', async () => {
    const { onSubmit } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /record reinvested amount/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ sellTradeId: 'sell_allw', amountUSD: 146.43 });
  });

  it('accepts a smaller amount, editable down', async () => {
    const { onSubmit } = renderDialog();
    submit('100');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ sellTradeId: 'sell_allw', amountUSD: 100 });
  });

  it('accepts zero to clear a previously recorded reinvested amount', async () => {
    const { onSubmit } = renderDialog({ reinvestedUSD: 146.43 });
    submit('0');

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ sellTradeId: 'sell_allw', amountUSD: 0 });
  });

  it('refuses an amount above the outstanding balance', async () => {
    const { onSubmit } = renderDialog();
    submit('200');

    const error = await screen.findByText(/Amount cannot exceed/i);
        expect(error.textContent).toContain('146.43');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels without emitting an amount', () => {
    const { onSubmit, onCancel } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});