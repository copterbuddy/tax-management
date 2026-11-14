import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { TradeTypeToggle } from './TradeTypeToggle';
import type { TradeType } from '../types/trade';

function renderToggle(value: TradeType, onChange: (type: TradeType) => void = () => {}) {
  return render(
    <div>
      <label id="trade-type-label">Trade Type</label>
      <TradeTypeToggle value={value} onChange={onChange} labelId="trade-type-label" />
    </div>,
  );
}

const buyButton = () => screen.getByRole('radio', { name: 'Buy' });
const sellButton = () => screen.getByRole('radio', { name: 'Sell' });

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

describe('TradeTypeToggle', () => {
  it('marks BUY as checked when the value is BUY', () => {
    renderToggle('BUY');
    expect(buyButton()).toHaveAttribute('aria-checked', 'true');
    expect(sellButton()).toHaveAttribute('aria-checked', 'false');
  });

  it('marks SELL as checked when the value is SELL', () => {
    renderToggle('SELL');
    expect(sellButton()).toHaveAttribute('aria-checked', 'true');
    expect(buyButton()).toHaveAttribute('aria-checked', 'false');
  });

  it('is a radiogroup labelled by the given label id', () => {
    renderToggle('BUY');
    const group = screen.getByRole('radiogroup');

    expect(group).toHaveAttribute('aria-labelledby', 'trade-type-label');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('calls onChange with SELL exactly once when SELL is clicked', () => {
    const onChange = jest.fn();
    renderToggle('BUY', onChange);

    fireEvent.click(sellButton());

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('SELL');
  });

  it('uses a roving tabindex so only the selected button is tabbable', () => {
    renderToggle('SELL');
    expect(sellButton()).toHaveAttribute('tabindex', '0');
    expect(buyButton()).toHaveAttribute('tabindex', '-1');
  });

  it('selects the next option on ArrowRight', () => {
    const onChange = jest.fn();
    renderToggle('BUY', onChange);

    fireEvent.keyDown(buyButton(), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith('SELL');
  });

  it('wraps from BUY to SELL on ArrowLeft', () => {
    const onChange = jest.fn();
    renderToggle('BUY', onChange);

    fireEvent.keyDown(buyButton(), { key: 'ArrowLeft' });

    expect(onChange).toHaveBeenCalledWith('SELL');
  });

  it('selects the first and last option with Home and End', () => {
    const onChange = jest.fn();
    renderToggle('SELL', onChange);

    fireEvent.keyDown(sellButton(), { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('BUY');

    onChange.mockClear();
    fireEvent.keyDown(sellButton(), { key: 'End' });
    expect(onChange).not.toHaveBeenCalled();
  });
});