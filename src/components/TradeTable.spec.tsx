import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { TradeTable } from './TradeTable';
import { calculateBuyCostUSD, calculateSellRevenueUSD } from '../engine/fifoEngine';
import type { TradeTransaction } from '../types/trade';

function makeTrade(overrides: Partial<TradeTransaction>): TradeTransaction {
  return {
    id: 'trade-1',
    date: '2026-05-18',
    symbol: 'ALLW',
    type: 'SELL',
    provider: 'Dime',
    quantity: 224,
    priceUSD: 29.67,
    commissionUSD: 9.97,
    exchangeFeeUSD: 0.14,
    tafFeeUSD: 0.05,
    commissionRebateUSD: 0,
    vatUSD: 0.7,
    ...overrides,
  };
}

function renderTable(trades: TradeTransaction[]) {
  return render(
    <TradeTable
      trades={trades}
      gains={[]}
      selectedYear={2026}
      onEdit={() => {}}
      onDelete={() => {}}
      onAddNew={() => {}}
    />,
  );
}

function desktopTotals(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.trade-table tbody tr:not(.trade-detail-row)')).map(
    row => row.querySelector('.col-total')!.textContent!.trim(),
  );
}

function mobileTotals(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.trade-card')).map(card => {
    const rows = Array.from(card.querySelectorAll('.trade-card-row'));
    const totalRow = rows.find(row => row.querySelector('.card-label')?.textContent === 'Total (USD)')!;
    return totalRow.querySelector('.card-value')!.textContent!.trim();
  });
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

describe('TradeTable totals match the engine', () => {
  it('shows a BUY total equal to the cost FIFO uses for that lot', () => {
    const trade = makeTrade({
      id: 'buy-1',
      type: 'BUY',
      quantity: 173,
      priceUSD: 29.15,
      commissionUSD: 0,
      exchangeFeeUSD: 0,
      tafFeeUSD: 0,
      vatUSD: 0,
      grossAmountUSD: 5042.93,
    });
    const { container } = renderTable([trade]);

    expect(desktopTotals(container)).toEqual([`$${calculateBuyCostUSD(trade).toFixed(2)}`]);
    expect(desktopTotals(container)).toEqual(['$5042.93']);
  });

  it('shows a SELL total equal to the revenue used for the gain, in both layouts', () => {
    const trade = makeTrade({ id: 'sell-1', grossAmountUSD: 6647.13 });
    const { container } = renderTable([trade]);

    const expected = `$${calculateSellRevenueUSD(trade).toFixed(2)}`;
    expect(desktopTotals(container)).toEqual([expected]);
    expect(mobileTotals(container)).toEqual([expected]);
    expect(expected).toBe('$6636.27');
  });

  it('includes VAT, TAF, and the rebate in the mobile fee figure', () => {
    const trade = makeTrade({ id: 'sell-2', grossAmountUSD: 6647.13 });
    const { container } = renderTable([trade]);
    const card = container.querySelector('.trade-card')!;
    const feeRow = Array.from(card.querySelectorAll('.trade-card-row')).find(
      row => row.querySelector('.card-label')?.textContent === 'Total Fees (USD)',
    )!;

    // 9.97 + 0.14 + 0.05 + 0.70 − 0
    expect(feeRow.querySelector('.card-value')).toHaveTextContent('$10.86');
  });
});

describe('TradeTable fallback highlight', () => {
  it('marks a trade with no slip gross amount and explains the derivation', () => {
    const { container } = renderTable([makeTrade({ id: 'no-gross' })]);

    const span = container.querySelector('.trade-table tbody .value-fallback')!;
    expect(span).toHaveTextContent('$6635.22');
    expect(span).toHaveAttribute('title', 'Calculated from 224 × $29.67 — no contract-note gross amount recorded for this trade.');
    expect(container.querySelector('.trade-card .value-fallback')).toHaveTextContent('$6635.22');
  });

  it('leaves a slip-backed trade in the standard colour with no explanation', () => {
    const { container } = renderTable([makeTrade({ id: 'with-gross', grossAmountUSD: 6647.13 })]);

    expect(container.querySelector('.value-fallback')).toBeNull();
    expect(container.querySelector('.trade-table tbody span[title]')).toBeNull();
    expect(desktopTotals(container)).toEqual(['$6636.27']);
  });

  it('adds no focusable element to the row', () => {
    const { container } = renderTable([makeTrade({ id: 'no-gross' })]);
    const row = container.querySelector('.trade-table tbody tr')!;

    expect(row.querySelectorAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(2);
  });
});

describe('TradeTable visual foundation', () => {
  it('renders remittance progress label outside the progress bar track so it is not clipped', () => {
    const sell = makeTrade({ id: 'sell-remit', type: 'SELL' });
    const { container } = render(
      <TradeTable
        trades={[sell]}
        gains={[
          {
            sellTradeId: 'sell-remit',
            sellDate: '2026-05-18',
            symbol: 'ALLW',
            provider: 'Dime',
            sellQuantity: 224,
            sellRevenueUSD: 6636.27,
            buyCostBasisUSD: 5000,
            gainUSD: 1636.27,
            gainPercent: 0.2465,
            matchedLots: [],
            totalRemittedUSD: 3000,
            remainingProceedsUSD: 3636.27,
            remittances: [],
            taxableGainTHB: 0,
          },
        ]}
        selectedYear={2026}
        onEdit={() => {}}
        onDelete={() => {}}
        onAddNew={() => {}}
      />,
    );

    const wrap = container.querySelector('.trade-table .remit-progress-wrap')!;
    expect(wrap).not.toBeNull();
    const barTrack = wrap.querySelector('.remit-progress')!;
    const label = wrap.querySelector('.remit-text')!;
    expect(barTrack.contains(label)).toBe(false);
    expect(label).toHaveTextContent('$3000 / $6636');
  });

  it('renders monochrome SVG icons for edit and delete actions', () => {
    const { container } = renderTable([makeTrade({ id: 'svg-1' })]);
    const actionSvgs = container.querySelectorAll('.trade-table .actions-cell button svg[aria-hidden="true"]');
    expect(actionSvgs).toHaveLength(2);
  });
});

describe('TradeTable progressive disclosure and quick filters', () => {
  it('expands itemized fee breakdown and notes when clicking a row, and collapses on second click', () => {
    const trade = makeTrade({
      id: 'exp-1',
      grossAmountUSD: 6647.13,
      notes: 'Dime slip #42',
    });
    const { container } = renderTable([trade]);

    expect(container.querySelector('.trade-detail-row')).toBeNull();

    const row = container.querySelector('.trade-table tbody tr')!;
    fireEvent.click(row);

    const detail = container.querySelector('.trade-detail-row')!;
    expect(detail).not.toBeNull();
    expect(detail.textContent).toContain('$6647.13');
    expect(detail.textContent).toContain('$9.97');
    expect(detail.textContent).toContain('$10.86');
    expect(detail.textContent).toContain('Dime slip #42');

    fireEvent.click(row);
    expect(container.querySelector('.trade-detail-row')).toBeNull();
  });

  it('filters trades by search query and trade type pills', () => {
    const t1 = makeTrade({ id: 'b1', type: 'BUY', symbol: 'AAPL', notes: 'core holding' });
    const t2 = makeTrade({ id: 's1', type: 'SELL', symbol: 'NVDA', notes: 'trim' });
    const { container } = renderTable([t1, t2]);

    expect(container.querySelectorAll('.trade-table tbody tr')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(container.querySelectorAll('.trade-table tbody tr')).toHaveLength(1);
    expect(container.querySelector('.trade-table tbody')!.textContent).toContain('AAPL');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    fireEvent.change(screen.getByPlaceholderText('Search symbol or notes...'), { target: { value: 'nvda' } });
    expect(container.querySelectorAll('.trade-table tbody tr')).toHaveLength(1);
    expect(container.querySelector('.trade-table tbody')!.textContent).toContain('NVDA');
  });

  it('marks the active sort column with .is-sorted and aria-sort', () => {
    const { container } = renderTable([makeTrade({ id: 's1' })]);
    const headers = container.querySelectorAll('.trade-table thead th.sortable');
    expect(headers[0]).toHaveClass('is-sorted');
    expect(headers[0]).toHaveAttribute('aria-sort', 'ascending');
    expect(headers[1]).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(headers[1]);
    expect(headers[1]).toHaveClass('is-sorted');
    expect(headers[1]).toHaveAttribute('aria-sort', 'ascending');
    expect(headers[0]).not.toHaveClass('is-sorted');
  });
});