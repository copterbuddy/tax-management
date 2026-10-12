import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { TradesTab } from './TradesTab';
import type { TaxSummary, TradeTransaction } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const summary: TaxSummary = {
  taxYear: 2026,
  totalRevenueUSD: 4897,
  totalCostBasisUSD: 3803,
  netGainUSD: 1094,
  totalRemittedUSD: 1500,
  taxableGainUSD: 418.34,
  taxableGainTHB: 14432.7,
  excludedLossesUSD: 0,
  totalTransactions: 4,
  totalBuyCount: 2,
  totalSellCount: 2,
  totalRemittanceCount: 1,
  providerBreakdown: [
    { provider: 'Dime', taxableGainTHB: 14432.7, totalRemittedUSD: 1500, netGainUSD: 696.78, sellCount: 1 },
    { provider: 'Liberator', taxableGainTHB: 0, totalRemittedUSD: 0, netGainUSD: 397, sellCount: 1 },
    { provider: 'FinansiaSyrus', taxableGainTHB: 0, totalRemittedUSD: 0, netGainUSD: 0, sellCount: 0 },
  ],
};

const trades: TradeTransaction[] = [];

function renderTab() {
  return render(
    <TradesTab
      trades={trades}
      gains={[]}
      summary={summary}
      selectedYear={2026}
      availableYears={[2026, 2025]}
      lastUpdated="2026-04-01"
      onYearChange={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
      onAddNew={() => {}}
    />,
  );
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('th'); });
});

// ─── Capital-gain summary belongs to this tab ───────────────────────────────

describe('TradesTab capital-gain summary', () => {
  it('renders the four capital-gain KPI cards', () => {
    const { container } = renderTab();
    const grid = container.querySelector('.kpi-grid:not(.kpi-provider-row)')!;
    expect(grid.querySelectorAll('.kpi-card')).toHaveLength(4);
  });

  it('renders one card per provider in the breakdown row', () => {
    const { container } = renderTab();
    const row = container.querySelector('.kpi-provider-row')!;
    expect(row.querySelectorAll('.kpi-card')).toHaveLength(3);
    expect(row.textContent).toContain('Dime');
    expect(row.textContent).toContain('Liberator');
    expect(row.textContent).toContain('FinansiaSyrus');
  });

  it('renders no provider row when the summary has no breakdown', () => {
    const { container } = render(
      <TradesTab
        trades={trades}
        gains={[]}
        summary={undefined}
        selectedYear={2026}
        availableYears={[2026]}
        lastUpdated={null}
        onYearChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onAddNew={() => {}}
      />,
    );
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-grid .kpi-card')).toHaveLength(4);
  });
});

// ─── Tax-year control ───────────────────────────────────────────────────────

describe('TradesTab tax-year control', () => {
  it('labels the year selector "ปีภาษี" in Thai', () => {
    renderTab();
    expect(screen.getByLabelText('ปีภาษี:')).toBeInTheDocument();
  });

  it('labels the year selector "Tax Year" in English', async () => {
    await act(async () => { await i18next.changeLanguage('en'); });
    renderTab();
    expect(screen.getByLabelText('Tax Year:')).toBeInTheDocument();
  });

  it('shows the data-freshness indicator when a last-updated date exists', () => {
    const { container } = renderTab();
    expect(container.querySelector('.data-freshness')).not.toBeNull();
  });

  it('hides the data-freshness indicator when there is no last-updated date', () => {
    const { container } = render(
      <TradesTab
        trades={trades}
        gains={[]}
        summary={summary}
        selectedYear={2026}
        availableYears={[2026]}
        lastUpdated={null}
        onYearChange={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        onAddNew={() => {}}
      />,
    );
    expect(container.querySelector('.data-freshness')).toBeNull();
  });
});
