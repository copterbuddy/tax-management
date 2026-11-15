import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { RemitForm } from './RemitForm';
import type { RealizedGainResult, RemittanceRecord } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeGain(overrides: Partial<RealizedGainResult> = {}): RealizedGainResult {
  return {
    sellTradeId: 'sell_allw',
    symbol: 'ALLW',
    provider: 'Dime',
    sellDate: '2026-02-13',
    sellQuantity: 7,
    matchedLots: [],
    remittances: [],
    taxableGainTHB: 0,
    buyCostBasisUSD: 179.27,
    sellRevenueUSD: 204.75,
    gainUSD: 25.48,
    gainPercent: 0.024957264957265024,
    totalRemittedUSD: 58.32,
    remainingProceedsUSD: 146.43,
    ...overrides,
  };
}

const allw = makeGain();
const spgi = makeGain({
  sellTradeId: 'sell_spgi',
  symbol: 'SPGI',
  sellDate: '2026-05-26',
  sellRevenueUSD: 207.18,
  totalRemittedUSD: 0,
  remainingProceedsUSD: 207.18,
});

const existing: RemittanceRecord = {
  id: 'rem_1',
  sellTradeId: 'sell_allw',
  amountUSD: 58.32,
  remitDate: '2026-03-09',
  fxRateTHB: 32.0355,
};

function renderForm(props: Partial<Parameters<typeof RemitForm>[0]> = {}) {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();
  render(
    <RemitForm
      gains={[allw, spgi]}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel };
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

// ─── Preselection ───────────────────────────────────────────────────────────

describe('RemitForm gain preselection', () => {
  it('opens with the requested gain selected', () => {
    renderForm({ initialSellTradeId: 'sell_spgi' });
    expect((screen.getByLabelText(/sell trade/i) as HTMLSelectElement).value).toBe('sell_spgi');
  });

  it('opens with no gain selected when none is requested', () => {
    renderForm();
    expect((screen.getByLabelText(/sell trade/i) as HTMLSelectElement).value).toBe('');
  });

  it('preselects the remittance own gain when editing, ignoring the requested gain', () => {
    renderForm({ remittance: existing, initialSellTradeId: 'sell_spgi' });
    expect((screen.getByLabelText(/sell trade/i) as HTMLSelectElement).value).toBe('sell_allw');
  });

  it('submits against the preselected gain', async () => {
    const { onSubmit } = renderForm({ initialSellTradeId: 'sell_spgi' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/FX Rate/i), { target: { value: '32.5' } });
    fireEvent.click(screen.getByRole('button', { name: /record/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      sellTradeId: 'sell_spgi',
      amountUSD: 100,
      fxRateTHB: 32.5,
    });
  });

  it('refuses an amount above the selected gain remaining proceeds', async () => {
    const { onSubmit } = renderForm({ initialSellTradeId: 'sell_allw' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText(/FX Rate/i), { target: { value: '32.5' } });
    fireEvent.click(screen.getByRole('button', { name: /record/i }));

    await waitFor(() => {
      expect(document.querySelector('.error-msg')?.textContent).toContain('146.43');
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('accepts exactly the remaining proceeds', async () => {
    const { onSubmit } = renderForm({ initialSellTradeId: 'sell_allw' });
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '146.43' } });
    fireEvent.change(screen.getByLabelText(/FX Rate/i), { target: { value: '32.5' } });
    fireEvent.click(screen.getByRole('button', { name: /record/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ amountUSD: 146.43 });
  });

  it('lists only gains that still have proceeds available', () => {
    renderForm({ gains: [allw, makeGain({ sellTradeId: 'sell_done', symbol: 'DONE', remainingProceedsUSD: 0 })] });
    const options = Array.from((screen.getByLabelText(/sell trade/i) as HTMLSelectElement).options);
    expect(options.some(o => o.value === 'sell_done')).toBe(false);
  });
});

  // ─── Tolerance agreement with the engine ────────────────────────────────────

  describe('RemitForm cent tolerance', () => {
    const noisy = makeGain({
      sellTradeId: 'sell_noise',
      symbol: 'NOISE',
      sellRevenueUSD: 6636.2699999999995,
      totalRemittedUSD: 0,
      remainingProceedsUSD: 6636.2699999999995,
    });

    it('accepts a slip-exact amount that exceeds the float by rounding noise', async () => {
      const onSubmit = jest.fn();
      renderForm({ gains: [noisy], initialSellTradeId: 'sell_noise', onSubmit });

      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '6636.27' } });
      fireEvent.change(screen.getByLabelText(/FX Rate/i), { target: { value: '32.5' } });
      fireEvent.click(screen.getByRole('button', { name: /record/i }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toMatchObject({ amountUSD: 6636.27 });
    });

    it('keeps the form open with a message when the dispatch reports a refusal', async () => {
      const onSubmit = jest.fn(() => false);
      renderForm({ initialSellTradeId: 'sell_allw', onSubmit });

      fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText(/FX Rate/i), { target: { value: '32.5' } });
      fireEvent.click(screen.getByRole('button', { name: /record/i }));

      await waitFor(() => {
        expect(document.querySelector('.validation-error')?.textContent).toContain('could not be recorded');
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /record/i })).toBeInTheDocument();
    });
  });