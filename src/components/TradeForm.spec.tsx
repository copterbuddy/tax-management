import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { TradeForm } from './TradeForm';
import type { FifoLot, TradeTransaction } from '../types/trade';

function renderForm(props: Partial<React.ComponentProps<typeof TradeForm>> = {}) {
  return render(
    <TradeForm
      onSubmit={props.onSubmit ?? (() => {})}
      onCancel={props.onCancel ?? (() => {})}
      onValidate={props.onValidate}
      trade={props.trade}
      remainingLots={props.remainingLots}
    />,
  );
}

const buyButton = () => screen.getByRole('radio', { name: 'Buy' });
const sellButton = () => screen.getByRole('radio', { name: 'Sell' });

const formValues = () => ({
  date: (screen.getByLabelText('Date') as HTMLInputElement).value,
  symbol: (screen.getByLabelText('Symbol') as HTMLInputElement).value,
  quantity: (screen.getByLabelText('Quantity') as HTMLInputElement).value,
  price: (screen.getByLabelText('Unit Price (USD)') as HTMLInputElement).value,
  notes: (screen.getByLabelText('Notes (optional)') as HTMLInputElement).value,
});

function fillBuyFields() {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-01-15' } });
  fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'AAPL' } });
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Unit Price (USD)'), { target: { value: '185.5' } });
  fireEvent.change(screen.getByLabelText('Notes (optional)'), { target: { value: 'first lot' } });
}

const aaplLot: FifoLot = {
  tradeId: 'trd_lot',
  date: '2026-01-10',
  symbol: 'AAPL',
  provider: 'Dime',
  unitCostUSD: 100,
  remainingQuantity: 20,
  originalQuantity: 20,
};

const editTrade: TradeTransaction = {
  id: 'trd_1',
  date: '2026-02-02',
  symbol: 'AAPL',
  type: 'BUY',
  provider: 'Dime',
  quantity: 5,
  priceUSD: 100,
  commissionUSD: 1,
  exchangeFeeUSD: 0,
  tafFeeUSD: 0,
  commissionRebateUSD: 0,
  vatUSD: 0,
};

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

describe('TradeForm trade type toggle', () => {
  it('defaults to BUY and no longer renders a type select', () => {
    renderForm();

    expect(buyButton()).toHaveAttribute('aria-checked', 'true');
    expect(sellButton()).toHaveAttribute('aria-checked', 'false');
    expect(document.querySelector('#trade-type')).toBeNull();
  });

  it('clears every field except the date when the type changes', () => {
      renderForm({ remainingLots: [aaplLot] });
    fillBuyFields();
      fireEvent.change(document.querySelector('#trade-commission')!, { target: { value: '1.5' } });

    fireEvent.click(sellButton());

    expect(sellButton()).toHaveAttribute('aria-checked', 'true');
    expect(formValues().date).toBe('2026-01-15');
    expect(formValues().symbol).toBe('');
      expect(formValues().quantity).toBe('0');
    expect(formValues().price).toBe('0');
    expect(formValues().notes).toBe('');
      expect((document.querySelector('#trade-commission') as HTMLInputElement).value).toBe('0');
  });

      it('clears the slip gross amount when the type changes', () => {
        renderForm({ remainingLots: [aaplLot] });
        fillBuyFields();
        fireEvent.change(document.querySelector('#trade-gross-amount')!, { target: { value: '1855.5' } });

        fireEvent.click(sellButton());

        expect((document.querySelector('#trade-gross-amount') as HTMLInputElement).value).toBe('');
      });

  it('does not clear the fields when the active type is clicked again', () => {
    renderForm();
    fillBuyFields();

    fireEvent.click(buyButton());

    expect(formValues().symbol).toBe('AAPL');
    expect(formValues().quantity).toBe('10');
    expect(formValues().notes).toBe('first lot');
  });

  it('keeps both type buttons enabled in edit mode', () => {
    renderForm({ trade: editTrade });

    expect(buyButton()).not.toBeDisabled();
    expect(sellButton()).not.toBeDisabled();
    expect(buyButton()).toHaveAttribute('aria-checked', 'true');
  });

  it('clears a form-level validation error when the type changes', async () => {
    renderForm({ onValidate: () => 'lot conflict' });
    fillBuyFields();

    fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

    await waitFor(() => {
      expect(document.querySelector('.validation-error')).toHaveTextContent('lot conflict');
    });

    fireEvent.click(sellButton());

    expect(document.querySelector('.validation-error')).toBeNull();
  });

  it('submits a BUY trade when the validator accepts it', async () => {
    const onSubmit = jest.fn();
    const onValidate = jest.fn(() => null);
    renderForm({ onSubmit, onValidate });
    fillBuyFields();

    fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

    await waitFor(() => { expect(onSubmit).toHaveBeenCalledTimes(1); });
    expect(onValidate).toHaveBeenCalledWith(expect.objectContaining({ type: 'BUY', symbol: 'AAPL', quantity: 10 }));
  });

  it('blocks a BUY trade when the validator reports a conflict', async () => {
    const onSubmit = jest.fn();
    renderForm({ onSubmit, onValidate: () => 'lot conflict' });
    fillBuyFields();

    fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

    await waitFor(() => {
      expect(document.querySelector('.validation-error')).toHaveTextContent('lot conflict');
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

    describe('TradeForm slip gross amount', () => {
      const grossInput = () => document.querySelector('#trade-gross-amount') as HTMLInputElement;

      it('stores no slip gross amount when the field is left empty', async () => {
        const onSubmit = jest.fn();
        renderForm({ onSubmit });
        fillBuyFields();

        fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

        await waitFor(() => { expect(onSubmit).toHaveBeenCalledTimes(1); });
        const saved = onSubmit.mock.calls[0][0] as TradeTransaction;
        expect('grossAmountUSD' in saved).toBe(false);
      });

      it('keeps the slip gross amount that was entered', async () => {
        const onSubmit = jest.fn();
        renderForm({ onSubmit });
        fillBuyFields();
        fireEvent.change(grossInput(), { target: { value: '1855.50' } });

        fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

        await waitFor(() => { expect(onSubmit).toHaveBeenCalledTimes(1); });
        expect((onSubmit.mock.calls[0][0] as TradeTransaction).grossAmountUSD).toBe(1855.5);
      });

      it('warns when the slip gross amount is outside the round-off tolerance', async () => {
        const onSubmit = jest.fn();
        renderForm({ onSubmit });
        fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-01-30' } });
        fireEvent.change(screen.getByLabelText('Symbol'), { target: { value: 'ALLW' } });
        fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '173' } });
        fireEvent.change(screen.getByLabelText('Unit Price (USD)'), { target: { value: '29.15' } });
        fireEvent.change(grossInput(), { target: { value: '5103.50' } });

        expect(document.querySelector('.warning-msg')).toHaveTextContent('5103.50');
        expect(document.querySelector('.warning-msg')).toHaveTextContent('5042.95');

        fireEvent.click(screen.getByRole('button', { name: 'Add Trade' }));

        await waitFor(() => { expect(onSubmit).toHaveBeenCalledTimes(1); });
        expect((onSubmit.mock.calls[0][0] as TradeTransaction).grossAmountUSD).toBe(5103.5);
      });

      it('does not warn when the difference is within the round-off tolerance', () => {
        renderForm();
        fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '224' } });
        fireEvent.change(screen.getByLabelText('Unit Price (USD)'), { target: { value: '29.67' } });
        fireEvent.change(grossInput(), { target: { value: '6647.13' } });

        expect(document.querySelector('.warning-msg')).toBeNull();
      });

      it('prefills the slip gross amount in edit mode', () => {
        renderForm({ trade: { ...editTrade, grossAmountUSD: 500.25 } });

        expect(grossInput().value).toBe('500.25');
      });
    });