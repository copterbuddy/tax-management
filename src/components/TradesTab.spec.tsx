import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { TradesTab } from './TradesTab';
import type { OutstandingProceedsRow, TaxSummary, TradeTransaction } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const outstandingRow: OutstandingProceedsRow = {
  sellTradeId: 'sell_allw',
  sellDate: '2026-02-13',
  symbol: 'ALLW',
  provider: 'Dime',
  sellRevenueUSD: 204.75,
  totalRemittedUSD: 58.32,
  reinvestedUSD: 0,
  availableBalanceUSD: 146.43,
};

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
  remittedSellCount: 1,
  totalReinvestedUSD: 0,
  unremittedUSD: 146.43,
  outstandingRows: [outstandingRow],
  providerBreakdown: [
    { provider: 'Dime', taxableGainTHB: 14432.7, totalRemittedUSD: 1500, taxableGainUSD: 696.78, gainInRemittancesUSD: 696.78, sellCount: 1 },
  ],
};

const trades: TradeTransaction[] = [];

function renderTab(overrides: Partial<Parameters<typeof TradesTab>[0]> = {}) {
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
      onRemitGain={() => {}}
      onMarkReinvested={() => {}}
            ledgerError={null}
            onDismissLedgerError={() => {}}
      {...overrides}
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
    expect(row.querySelectorAll('.kpi-card')).toHaveLength(1);
    expect(row.textContent).toContain('Dime');
  });

  it('renders no provider card for a provider missing from the breakdown', () => {
    const { container } = renderTab();
    expect(container.querySelector('.kpi-provider-row')!.textContent).not.toContain('Liberator');
  });

  it('renders no provider row when the summary has no breakdown', () => {
    const { container } = renderTab({ summary: undefined, lastUpdated: null });
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-grid .kpi-card')).toHaveLength(4);
  });
});

// ─── Not-yet-returned card ──────────────────────────────────────────────────

describe('TradesTab not-yet-returned card', () => {
  function notReturnedCard(container: HTMLElement): Element {
    return container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')[3];
  }

  it('renders the summary figure verbatim without recomputing it', () => {
    const { container } = renderTab({ summary: { ...summary, unremittedUSD: 123.45 } });
    expect(notReturnedCard(container).textContent).toContain('$123.45');
  });

  it('shows $0.00 when nothing is outstanding', () => {
    const { container } = renderTab({ summary: { ...summary, unremittedUSD: 0 } });
    expect(notReturnedCard(container).textContent).toContain('$0.00');
  });

  it('describes proceeds not yet returned rather than cash sitting in an account', () => {
    const { container } = renderTab();
    const text = notReturnedCard(container).textContent ?? '';
    expect(text).toContain('ยังไม่กลับไทย');
    expect(text).not.toMatch(/บัญชี|คงเหลือใน|account/i);
  });
});

// ─── Outstanding proceeds list ──────────────────────────────────────────────

describe('TradesTab outstanding proceeds list', () => {
  it('lists each gain with an outstanding balance and the year in the heading', () => {
    const { container } = renderTab();
    const section = container.querySelector('details.outstanding-proceeds')!;
    expect(section).not.toBeNull();
    expect(section.hasAttribute('open')).toBe(true);
    expect(section.querySelector('h3')!.textContent).toContain('2026');
    expect(section.querySelector('.outstanding-count-badge')!.textContent).toContain('1 · $146.43');
    expect(section.textContent).toContain('ALLW');
    expect(section.textContent).toContain('146.43');
  });

  it('hides the list when nothing is outstanding', () => {
    const { container } = renderTab({ summary: { ...summary, unremittedUSD: 0, outstandingRows: [] } });
    expect(container.querySelector('.outstanding-proceeds')).toBeNull();
  });

  it('emits the sell trade id when remitting a row', async () => {
    const onRemitGain = jest.fn();
    const { container } = renderTab({ onRemitGain });
    const buttons = container.querySelectorAll('.outstanding-actions .btn');
    fireEvent.click(buttons[0] as HTMLElement);
    expect(onRemitGain).toHaveBeenCalledWith('sell_allw');
  });

  it('emits the whole row when marking a row reinvested', async () => {
    const onMarkReinvested = jest.fn();
    const { container } = renderTab({ onMarkReinvested });
    const buttons = container.querySelectorAll('.outstanding-actions .btn');
    fireEvent.click(buttons[1] as HTMLElement);
    expect(onMarkReinvested).toHaveBeenCalledWith(outstandingRow);
  });
});

// ─── Remitted card ──────────────────────────────────────────────────────────

describe('TradesTab remitted card', () => {
  it('counts the remitted sales rather than the year sales', () => {
    const { container } = renderTab({
      summary: { ...summary, remittedSellCount: 3, totalSellCount: 9 },
    });
    const card = container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')[1];
    expect(card.textContent).toContain('3');
    expect(card.textContent).not.toMatch(/\b9\b/);
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
    const { container } = renderTab({ lastUpdated: null });
    expect(container.querySelector('.data-freshness')).toBeNull();
  });
});

  // ─── Refused ledger write ───────────────────────────────────────────────────

  describe('TradesTab ledger error banner', () => {
    const refusal = { code: 'reinvestedExceedsBalance' } as const;

    it('renders the refusal message in Thai with a dismiss control', () => {
      const onDismissLedgerError = jest.fn();
      const { container } = renderTab({ ledgerError: refusal, onDismissLedgerError });
      const banner = container.querySelector('.ledger-error')!;
      expect(banner).not.toBeNull();
      expect(banner.textContent).toContain(i18next.t('common:ledgerErrorReinvestedExceedsBalance'));

      fireEvent.click(banner.querySelector('button')!);
      expect(onDismissLedgerError).toHaveBeenCalledTimes(1);
    });

    it('renders the refusal message in English after the language switch', async () => {
      await act(async () => { await i18next.changeLanguage('en'); });
      const { container } = renderTab({ ledgerError: refusal });
      expect(container.querySelector('.ledger-error')!.textContent).toContain(
        i18next.t('common:ledgerErrorReinvestedExceedsBalance'),
      );
    });

    it('leaves every figure untouched while the banner is shown', () => {
      const { container } = renderTab({ ledgerError: refusal });
      expect(container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')).toHaveLength(4);
      expect(container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')[3].textContent).toContain('146.43');
      expect(container.querySelector('.outstanding-proceeds')!.textContent).toContain('146.43');
    });

    it('shows the banner even when no row is outstanding', () => {
      const { container } = renderTab({
        ledgerError: refusal,
        summary: { ...summary, unremittedUSD: 0, outstandingRows: [] },
      });
      expect(container.querySelector('.outstanding-proceeds')).toBeNull();
      expect(container.querySelector('.ledger-error')).not.toBeNull();
    });

    it('renders no banner without a refusal', () => {
      const { container } = renderTab();
      expect(container.querySelector('.ledger-error')).toBeNull();
    });
  });

// ─── The card names assessable income, not tax ─────────────────────────────

describe('TradesTab — assessable-income wording', () => {
  it('titles the first card as income and never as tax', () => {
    const { container } = renderTab();
    const card = container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')[0] as HTMLElement;
    const title = card.querySelector('.kpi-title')?.textContent ?? '';

    expect(title).toContain('เงินได้ที่ต้องยื่น');
    expect(title).not.toContain('ภาษี');
  });

  it('explains the exemption and the method in the tooltip', () => {
    const { container } = renderTab();
    const card = container.querySelectorAll('.kpi-grid:not(.kpi-provider-row) .kpi-card')[0] as HTMLElement;
    fireEvent.click(card.querySelector('.tooltip-trigger') as HTMLElement);
    const tip = card.querySelector('.tooltip-content')?.textContent ?? '';

    expect(tip).toContain('150,000');
    expect(tip).toContain('FIFO');
    expect(tip).toContain('ไม่ใช่ภาษีที่ต้องจ่าย');
  });
});
