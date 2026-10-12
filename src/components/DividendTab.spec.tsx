import '@testing-library/jest-dom';
import { render, screen, act, fireEvent } from '@testing-library/react';
import i18next from '../i18n/index';
import { DividendTab } from './DividendTab';
import type { DividendRecord } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function record(over: Partial<DividendRecord> = {}): DividendRecord {
  return {
    id: 'd1',
    date: '2026-02-20',
    symbol: 'AAPL',
    country: 'US',
    grossAmountUSD: 120,
    whtRate: 15,
    whtAmountUSD: 18,
    netAmountUSD: 102,
    dividendFxRate: 34.2,
    grossAmountTHB: 4104,
    whtAmountTHB: 615.6,
    netAmountTHB: 3488.4,
    totalRemittedUSD: 102,
    remainingToRemitUSD: 0,
    remittances: [
      { id: 'dr1', dividendId: 'd1', amountUSD: 102, remitDate: '2026-03-15', remitFxRate: 34.4, remitTHB: 3508.8, reportableIncomeTHB: 3508.8, whtCreditTHB: 619.2 },
    ],
    ...over,
  };
}

const SUMMARY = {
  totalGrossUSD: 200,
  totalWhtUSD: 30,
  totalRemittedUSD: 142,
  totalReportableIncomeTHB: 4888.8,
  totalWhtCreditTHB: 862.7,
  totalUnremittedUSD: 49.25,
  recordCount: 2,
  remittedCount: 2,
};

const baseProps = {
  displayYear: 2026,
  summary: SUMMARY,
  onAdd: () => {},
  onEdit: () => {},
  onDelete: () => {},
  onRemit: () => {},
  onYearChange: () => {},
  availableYears: [2026, 2025],
  onDeleteRemittance: () => {},
};

function renderTab(dividends: DividendRecord[], over: Partial<typeof baseProps> = {}) {
  return render(<DividendTab dividends={dividends} {...baseProps} {...over} />);
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('th'); });
});

// React reports a missing-key problem once per message for the whole module
// registry, so the spy has to be installed before any render in this file.
const consoleErrors: string[] = [];
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => { consoleErrors.push(String(args[0])); };
});
afterAll(() => {
  console.error = originalConsoleError;
});

// ─── Requirement: Every year control is labelled ────────────────────────────

describe('DividendTab year control label', () => {
  it('labels the year selector "ปีปันผล" in Thai', () => {
    renderTab([record()]);
    expect(screen.getByLabelText('ปีปันผล:')).toBeInTheDocument();
  });

  it('labels the year selector "Dividend Year" in English', async () => {
    await act(async () => { await i18next.changeLanguage('en'); });
    renderTab([record()]);
    expect(screen.getByLabelText('Dividend Year:')).toBeInTheDocument();
  });

  it('labels the year selector in the empty state as well', () => {
    renderTab([record()], { displayYear: 2025 });
    expect(screen.getByLabelText('ปีปันผล:')).toBeInTheDocument();
  });
});

// ─── Requirement: empty state points at this tab's own control ──────────────

describe('DividendTab empty state guidance', () => {
  it('refers to the dividend year control, not the tax-year filter', () => {
    const { container } = renderTab([record()], { displayYear: 2025 });
    const hint = container.querySelector('.empty-state-desc')!;
    expect(hint.textContent).toContain('ปีปันผล');
    expect(hint.textContent).not.toContain('ปีภาษี');
  });
});

// ─── Requirement: Summary cards use only defined variants ───────────────────

describe('DividendTab KPI variants', () => {
  it('marks the unremitted card as a warning when there is unremitted income', () => {
    const { container } = renderTab([record()]);
    const cards = Array.from(container.querySelectorAll('.kpi-dividend-grid .kpi-card'));
    const unremitted = cards[cards.length - 1];
    expect(unremitted.classList.contains('kpi-warning')).toBe(true);
  });

  it('does not mark the unremitted card as a warning when nothing is unremitted', () => {
    const { container } = renderTab([record()], { summary: { ...SUMMARY, totalUnremittedUSD: 0 } });
    const cards = Array.from(container.querySelectorAll('.kpi-dividend-grid .kpi-card'));
    const unremitted = cards[cards.length - 1];
    expect(unremitted.classList.contains('kpi-warning')).toBe(false);
  });
});

// ─── Requirement: expanding one row does not disturb other rows ─────────────

describe('DividendTab list identity', () => {
  it('renders every record exactly once and emits no key warning', () => {
    const { container } = renderTab([
      record({ id: 'd1' }),
      record({ id: 'd2', symbol: 'MSFT' }),
      record({ id: 'd3', symbol: 'NVDA' }),
    ]);

    const rows = container.querySelectorAll('tbody tr.trade-row');
    expect(rows).toHaveLength(3);
    expect(container.querySelectorAll('.symbol-text')).toHaveLength(3);

    // Captured since beforeAll — React only reports this message once per run.
    const keyWarnings = consoleErrors.filter(msg => msg.includes('unique "key"') || msg.includes('unique key'));
    expect(keyWarnings).toEqual([]);
  });

  it('expands one record without changing the other rows', () => {
    const { container } = renderTab([record({ id: 'd1' }), record({ id: 'd2', symbol: 'MSFT' })]);
    const before = Array.from(container.querySelectorAll('.symbol-text')).map(el => el.textContent);

    fireEvent.click(container.querySelectorAll('tbody tr.trade-row')[0]);

    const after = Array.from(container.querySelectorAll('tbody tr.trade-row .symbol-text')).map(el => el.textContent);
    expect(after).toEqual(before);
    expect(container.querySelectorAll('.remittance-history-row')).toHaveLength(1);
  });
});
