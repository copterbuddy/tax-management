import '@testing-library/jest-dom';
import { render, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import i18next from '../i18n/index';

// ─── Seed data ──────────────────────────────────────────────────────────────
// Written to localStorage before the store module is first imported, because
// the trade slice builds its initial state (and taxSummaries) on import.

const TRADES = [
  { id: 't1', date: '2026-01-15', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 180, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0.1 },
  { id: 't2', date: '2026-03-10', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 10, priceUSD: 250, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0.02, commissionRebateUSD: 0, vatUSD: 0.1 },
  { id: 't3', date: '2026-02-01', symbol: 'MSFT', type: 'BUY', provider: 'Liberator', quantity: 5, priceUSD: 400, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0.1 },
  { id: 't4', date: '2026-04-01', symbol: 'MSFT', type: 'SELL', provider: 'Liberator', quantity: 5, priceUSD: 480, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0.02, commissionRebateUSD: 0, vatUSD: 0.1 },
];

const GAINS = [
  { sellTradeId: 't2', sellDate: '2026-03-10', symbol: 'AAPL', provider: 'Dime', sellQuantity: 10, sellRevenueUSD: 2498.5, buyCostBasisUSD: 1801.5, gainUSD: 697, gainPercent: 0.2789, matchedLots: [], totalRemittedUSD: 1500, remainingProceedsUSD: 998.5, remittances: [{ id: 'r1', sellTradeId: 't2', amountUSD: 1500, remitDate: '2026-05-20', fxRateTHB: 34.5 }], taxableGainTHB: 418.35 },
  { sellTradeId: 't4', sellDate: '2026-04-01', symbol: 'MSFT', provider: 'Liberator', sellQuantity: 5, sellRevenueUSD: 2398.5, buyCostBasisUSD: 2001.5, gainUSD: 397, gainPercent: 0.1655, matchedLots: [], totalRemittedUSD: 1000, remainingProceedsUSD: 1398.5, remittances: [{ id: 'r2', sellTradeId: 't4', amountUSD: 1000, remitDate: '2025-12-01', fxRateTHB: 34.0 }], taxableGainTHB: 165.5 },
];

const DIVIDENDS = [
  { id: 'd1', date: '2026-02-20', symbol: 'AAPL', country: 'US', grossAmountUSD: 120, whtRate: 15, whtAmountUSD: 18, netAmountUSD: 102, dividendFxRate: 34.2, grossAmountTHB: 4104, whtAmountTHB: 615.6, netAmountTHB: 3488.4, totalRemittedUSD: 102, remainingToRemitUSD: 0, remittances: [{ id: 'dr1', dividendId: 'd1', amountUSD: 102, remitDate: '2026-03-15', remitFxRate: 34.4, remitTHB: 3508.8, reportableIncomeTHB: 3508.8, whtCreditTHB: 619.2 }] },
  { id: 'd2', date: '2026-04-10', symbol: 'MSFT', country: 'US', grossAmountUSD: 80, whtRate: 15, whtAmountUSD: 12, netAmountUSD: 68, dividendFxRate: 34.6, grossAmountTHB: 2768, whtAmountTHB: 415.2, netAmountTHB: 2352.8, totalRemittedUSD: 40, remainingToRemitUSD: 28, remittances: [{ id: 'dr2', dividendId: 'd2', amountUSD: 40, remitDate: '2026-05-02', remitFxRate: 34.5, remitTHB: 1380, reportableIncomeTHB: 1380, whtCreditTHB: 243.5 }] },
  { id: 'd3', date: '2026-06-01', symbol: 'NVDA', country: 'US', grossAmountUSD: 25, whtRate: 15, whtAmountUSD: 3.75, netAmountUSD: 21.25, dividendFxRate: 34.8, grossAmountTHB: 870, whtAmountTHB: 130.5, netAmountTHB: 739.5, totalRemittedUSD: 0, remainingToRemitUSD: 21.25, remittances: [] },
];

function seedStorage() {
  localStorage.setItem('tax_tracker_trades', JSON.stringify(TRADES));
  localStorage.setItem('tax_tracker_gains', JSON.stringify(GAINS));
  localStorage.setItem('tax_tracker_dividends', JSON.stringify(DIVIDENDS));
  localStorage.setItem('lang', 'th');
}

/**
 * Seeds localStorage, then loads the store module — dynamic imports so the
 * slice initial state is built from the seeded data rather than from the
 * empty localStorage present at module-import time.
 */
async function renderDashboard() {
  seedStorage();
  const { store } = await import('../store');
  const { ThemeProvider } = await import('../context/ThemeContext');
  const { Dashboard } = await import('./Dashboard');

  return render(
    <ThemeProvider>
      <Provider store={store}>
        <Dashboard />
      </Provider>
    </ThemeProvider>,
  );
}

function clickTab(container: HTMLElement, index: number) {
  fireEvent.click(container.querySelectorAll('.tab-btn')[index]);
}

/** True when `a` comes before `b` in document order. */
function precedes(a: Element, b: Element) {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('th'); });
});

// ─── Requirement: Tab navigation precedes all tab content ───────────────────

describe('tab navigation placement', () => {
  it('renders the tab nav before every KPI card', async () => {
    const { container } = await renderDashboard();
    const nav = container.querySelector('.tab-nav')!;
    const cards = Array.from(container.querySelectorAll('.kpi-card'));
    expect(nav).not.toBeNull();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(precedes(nav, card)).toBe(true);
    }
  });

  it('renders the tab nav before the year filter and the trade table', async () => {
    const { container } = await renderDashboard();
    const nav = container.querySelector('.tab-nav')!;
    expect(precedes(nav, container.querySelector('.year-filter')!)).toBe(true);
    expect(precedes(nav, container.querySelector('table')!)).toBe(true);
  });

  it('keeps the tab nav before the first dividend card after switching tabs', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 1);
    const nav = container.querySelector('.tab-nav')!;
    const firstCard = container.querySelector('.kpi-card')!;
    expect(precedes(nav, firstCard)).toBe(true);
    expect(firstCard.closest('.kpi-dividend-grid')).not.toBeNull();
  });
});

// ─── Requirement: Capital-gain summary belongs to the Trades tab ────────────

describe('tab-scoped capital-gain summary', () => {
  it('shows the capital-gain cards and provider row on the Trades tab', async () => {
    const { container } = await renderDashboard();
    expect(container.querySelector('.trades-tab')).not.toBeNull();
    expect(container.querySelector('.kpi-provider-row')).not.toBeNull();
    expect(container.querySelectorAll('.trades-tab .kpi-grid:not(.kpi-provider-row) .kpi-card')).toHaveLength(4);
  });

  it('shows no capital-gain card or provider row on the Dividend tab', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 1);
    expect(container.querySelector('.trades-tab')).toBeNull();
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-card')).toHaveLength(6);
  });

  it('shows no capital-gain card or provider row on the Remittances tab', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 2);
    expect(container.querySelector('.trades-tab')).toBeNull();
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-card')).toHaveLength(0);
  });
});

// ─── Requirement: The tax-year control is shown only where it applies ───────

describe('tab-scoped year controls', () => {
  it('shows the tax-year selector on the Trades tab', async () => {
    const { container } = await renderDashboard();
    expect(container.querySelector('#year-select')).not.toBeNull();
    // the trade table's own provider filter is not a year control
    expect(container.querySelectorAll('.year-filter select')).toHaveLength(1);
  });

  it('shows no tax-year selector on the Dividend tab, only the dividend year control', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 1);
    expect(container.querySelector('#year-select')).toBeNull();
    expect(container.querySelector('#remit-year-select')).toBeNull();
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(container.querySelector('.table-header select')).not.toBeNull();
  });

  it('shows no tax-year selector on the Remittances tab, only the remittance year control', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 2);
    expect(container.querySelector('#year-select')).toBeNull();
    expect(container.querySelector('#remit-year-select')).not.toBeNull();
    expect(container.querySelectorAll('select')).toHaveLength(1);
  });
});
