import '@testing-library/jest-dom';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
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
    { id: 't5', date: '2026-01-20', symbol: 'NVDA', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 200, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0.1 },
    // SELL with no remittances — used to prove the edit guard only blocks remitted sells
    { id: 't6', date: '2026-06-15', symbol: 'NVDA', type: 'SELL', provider: 'Dime', quantity: 3, priceUSD: 300, commissionUSD: 1, exchangeFeeUSD: 0.5, tafFeeUSD: 0.02, commissionRebateUSD: 0, vatUSD: 0.1 },
];

const GAINS = [
  { sellTradeId: 't2', sellDate: '2026-03-10', symbol: 'AAPL', provider: 'Dime', sellQuantity: 10, sellRevenueUSD: 2498.5, buyCostBasisUSD: 1801.5, gainUSD: 697, gainPercent: 0.2789, matchedLots: [], totalRemittedUSD: 1500, remainingProceedsUSD: 998.5, remittances: [{ id: 'r1', sellTradeId: 't2', amountUSD: 1500, remitDate: '2026-05-20', fxRateTHB: 34.5 }], taxableGainTHB: 418.35 },
  { sellTradeId: 't4', sellDate: '2026-04-01', symbol: 'MSFT', provider: 'Liberator', sellQuantity: 5, sellRevenueUSD: 2398.5, buyCostBasisUSD: 2001.5, gainUSD: 397, gainPercent: 0.1655, matchedLots: [], totalRemittedUSD: 1000, remainingProceedsUSD: 1398.5, remittances: [{ id: 'r2', sellTradeId: 't4', amountUSD: 1000, remitDate: '2025-12-01', fxRateTHB: 34.0 }], taxableGainTHB: 165.5 },
    { sellTradeId: 't6', sellDate: '2026-06-15', symbol: 'NVDA', provider: 'Dime', sellQuantity: 3, sellRevenueUSD: 898.5, buyCostBasisUSD: 601.5, gainUSD: 297, gainPercent: 0.4938, matchedLots: [], totalRemittedUSD: 0, remainingProceedsUSD: 898.5, remittances: [], taxableGainTHB: 178.2 },
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
    expect(firstCard.closest('.kpi-grid')).not.toBeNull();
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
    // No capital-gain summary: the trades year selector and provider row are absent.
    expect(container.querySelector('#year-select')).toBeNull();
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-card')).toHaveLength(6);
  });

  it('shows no capital-gain card or provider row on the Remittances tab', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 2);
    expect(container.querySelector('#year-select')).toBeNull();
    expect(container.querySelector('.kpi-provider-row')).toBeNull();
    expect(container.querySelectorAll('.kpi-card')).toHaveLength(0);
  });
});

// ─── Requirement: Editing cannot break lot matching for later trades ───────

function editButtonsByRow(container: HTMLElement) {
  return Array.from(container.querySelectorAll('tbody tr')).map(row => ({
    row,
    button: row.querySelector('.btn-edit') as HTMLButtonElement,
  }));
}

function clickEditForDate(container: HTMLElement, date: string) {
  const match = editButtonsByRow(container).find(({ row }) => row.textContent?.includes(date));
  expect(match).toBeDefined();
  fireEvent.click(match!.button);
}

describe('edit-mode type safety guards', () => {
  it('refuses to open a SELL trade that still has remittances', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = await renderDashboard();

    clickEditForDate(container, '2026-03-10');

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('form.trade-form')).toBeNull();
    alertSpy.mockRestore();
  });

  it('opens a SELL trade that has no remittances', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = await renderDashboard();

    clickEditForDate(container, '2026-06-15');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(container.querySelector('form.trade-form')).not.toBeNull();
    alertSpy.mockRestore();
  });

  it('blocks an edit that would leave a later SELL without enough lots', async () => {
    const { container } = await renderDashboard();

    clickEditForDate(container, '2026-01-15');
    const quantity = container.querySelector('#trade-quantity') as HTMLInputElement;
    expect(quantity).not.toBeNull();
    fireEvent.change(quantity, { target: { value: '1' } });
    fireEvent.click(container.querySelector('form.trade-form button[type="submit"]') as HTMLButtonElement);

    await waitFor(() => {
      expect(container.querySelector('.validation-error')).not.toBeNull();
    });
        expect(container.querySelector('.validation-error')!.textContent).toBe(
          i18next.t('trade:fifoLotsConflict'),
        );
    expect(container.querySelector('form.trade-form')).not.toBeNull();
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
    expect(container.querySelector('#dividend-year-select')).not.toBeNull();
  });

  it('shows no tax-year selector on the Remittances tab, only the remittance year control', async () => {
    const { container } = await renderDashboard();
    clickTab(container, 2);
    expect(container.querySelector('#year-select')).toBeNull();
    expect(container.querySelector('#remit-year-select')).not.toBeNull();
    expect(container.querySelectorAll('select')).toHaveLength(1);
  });
});

// ─── Requirement: Outstanding proceeds are workable from the list ──────────
// The seeded 2026 book has three SELL gains whose proceeds are not fully back:
// t2 (998.38 outstanding), t4 (1398.38) and t6 (898.38) — $3,295.14 in total.

function kpiValue(container: HTMLElement, titleKey: string): string {
  const title = i18next.t(titleKey);
  const card = Array.from(container.querySelectorAll('.kpi-card'))
    .find(c => c.querySelector('.kpi-title')?.textContent?.includes(title));
  expect(card).toBeDefined();
  return card!.querySelector('.kpi-value')!.textContent!;
}

function outstandingRow(container: HTMLElement, symbol: string): HTMLElement {
  const row = Array.from(container.querySelectorAll('.outstanding-row'))
    .find(r => r.textContent?.includes(symbol));
  expect(row).toBeDefined();
  return row as HTMLElement;
}

function outstandingSymbols(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.outstanding-row')).map(
    r => r.querySelector('.outstanding-identity strong')!.textContent!,
  );
}

async function submitAmount(container: HTMLElement, amount: number) {
  const input = container.querySelector('#mark-reinvested-amount') as HTMLInputElement;
  expect(input).not.toBeNull();
  fireEvent.change(input, { target: { value: String(amount) } });
  fireEvent.click(container.querySelector('form.trade-form .btn-primary') as HTMLButtonElement);
  await waitFor(() => {
    expect(container.querySelector('#mark-reinvested-amount')).toBeNull();
  });
}

describe('outstanding proceeds list', () => {
  // The store module is a singleton, so a reinvested amount recorded by one test
  // survives into the next; clear it before each test of this block.
  beforeEach(async () => {
    const { store } = await import('../store');
    const { setReinvestedAmount } = await import('../store/tradeSlice');
    await act(async () => {
      store.dispatch(setReinvestedAmount({ sellTradeId: 't6', amountUSD: 0 }));
    });
  });

  it('lists every gain of the year whose proceeds have not fully returned', async () => {
    const { container } = await renderDashboard();

    expect(kpiValue(container, 'common:kpiNotRemitted')).toBe('$3,295.14');
    expect(outstandingSymbols(container).sort()).toEqual(['AAPL', 'MSFT', 'NVDA']);
    expect(outstandingRow(container, 'NVDA').textContent).toContain('898.38');

    for (const row of Array.from(container.querySelectorAll('.outstanding-row'))) {
      expect(row.querySelectorAll('.outstanding-actions button')).toHaveLength(2);
    }
  });

  it('opens the remit form with the row it was clicked from preselected', async () => {
    const { container } = await renderDashboard();

    fireEvent.click(outstandingRow(container, 'NVDA').querySelectorAll('button')[0]);

    const select = await waitFor(() => {
      const el = container.querySelector('#remit-trade') as HTMLSelectElement;
      expect(el).not.toBeNull();
      return el;
    });
    expect(select.value).toBe('t6');
  });

  it('removes a sale from the list once its full balance is reinvested', async () => {
    const { container } = await renderDashboard();

    fireEvent.click(outstandingRow(container, 'NVDA').querySelectorAll('button')[1]);
    await submitAmount(container, 898.38);

    expect(kpiValue(container, 'common:kpiNotRemitted')).toBe('$2,396.76');
    expect(outstandingSymbols(container).sort()).toEqual(['AAPL', 'MSFT']);
  });

  it('keeps the remaining balance in the list when only part is reinvested', async () => {
    const { container } = await renderDashboard();

    fireEvent.click(outstandingRow(container, 'NVDA').querySelectorAll('button')[1]);
    await submitAmount(container, 400);

    expect(kpiValue(container, 'common:kpiNotRemitted')).toBe('$2,895.14');
    expect(outstandingRow(container, 'NVDA').textContent).toContain('498.38');
  });

  it('changes nothing when the dialog is cancelled', async () => {
    const { container } = await renderDashboard();

    fireEvent.click(outstandingRow(container, 'NVDA').querySelectorAll('button')[1]);
    fireEvent.click(container.querySelector('.trade-form-modal .btn-secondary') as HTMLButtonElement);

    await waitFor(() => {
      expect(container.querySelector('#mark-reinvested-amount')).toBeNull();
    });
    expect(kpiValue(container, 'common:kpiNotRemitted')).toBe('$3,295.14');
    expect(outstandingSymbols(container)).toHaveLength(3);
  });
});

    // ─── Requirement: A refused reinvested record is reported to the user ──────

    describe('refused reinvested record is reported inline', () => {
      // The store module is a singleton, so a refusal raised by one test outlives it.
      beforeEach(async () => {
        const { store } = await import('../store');
        const { setReinvestedAmount, clearLedgerError } = await import('../store/tradeSlice');
        await act(async () => {
          store.dispatch(setReinvestedAmount({ sellTradeId: 't6', amountUSD: 0 }));
          store.dispatch(clearLedgerError());
        });
      });

      async function refuseRecording() {
        const { store } = await import('../store');
        const { setReinvestedAmount } = await import('../store/tradeSlice');
        await act(async () => {
          // NVDA t6 has 898.38 left, so this is refused
          store.dispatch(setReinvestedAmount({ sellTradeId: 't6', amountUSD: 5000 }));
        });
      }

      it('shows the refusal message on the Trades tab only', async () => {
        const { container } = await renderDashboard();
        await refuseRecording();

        expect(container.querySelector('.ledger-error')!.textContent).toContain(
          i18next.t('common:ledgerErrorReinvestedExceedsBalance'),
        );

        clickTab(container, 1);
        expect(container.querySelector('.ledger-error')).toBeNull();
        clickTab(container, 2);
        expect(container.querySelector('.ledger-error')).toBeNull();
      });

      it('reports the refusal in English as well', async () => {
        const { container } = await renderDashboard();
        await refuseRecording();
        await act(async () => { await i18next.changeLanguage('en'); });

        expect(container.querySelector('.ledger-error')!.textContent).toContain(
          i18next.t('common:ledgerErrorReinvestedExceedsBalance'),
        );
      });

      it('clears the message on dismissal without changing any figure', async () => {
        const { container } = await renderDashboard();
        await refuseRecording();
        const before = kpiValue(container, 'common:kpiNotRemitted');

        fireEvent.click(container.querySelector('.ledger-error button')!);

        expect(container.querySelector('.ledger-error')).toBeNull();
        expect(kpiValue(container, 'common:kpiNotRemitted')).toBe(before);
        expect(outstandingSymbols(container)).toHaveLength(3);
      });

      it('leaves no message once a record is accepted', async () => {
        const { container } = await renderDashboard();
        await refuseRecording();
        expect(container.querySelector('.ledger-error')).not.toBeNull();

        fireEvent.click(outstandingRow(container, 'NVDA').querySelectorAll('button')[1]);
        await submitAmount(container, 400);

        expect(container.querySelector('.ledger-error')).toBeNull();
        expect(outstandingRow(container, 'NVDA').textContent).toContain('498.38');
      });
    });

            // ─── Requirement: A remittance is validated before it is recorded ──────────

            describe('remit form submission outcome', () => {
              // The store module is a singleton, so drop anything an earlier test added.
              beforeEach(async () => {
                const { store } = await import('../store');
                const { deleteRemittance, clearLedgerError, setReinvestedAmount } = await import('../store/tradeSlice');
                await act(async () => {
                  store.dispatch(clearLedgerError());
                  // An earlier test left a reinvested amount recorded for NVDA t6.
                  store.dispatch(setReinvestedAmount({ sellTradeId: 't6', amountUSD: 0 }));
                  const gain = store.getState().trade.gains.find(g => g.sellTradeId === 't6')!;
                  for (const r of gain.remittances) {
                    store.dispatch(deleteRemittance({ id: r.id, sellTradeId: 't6' }));
                  }
                });
              });

              async function openRemitFor(container: HTMLElement, symbol: string) {
                fireEvent.click(outstandingRow(container, symbol).querySelectorAll('button')[0]);
                await waitFor(() => {
                  expect(container.querySelector('#remit-trade')).not.toBeNull();
                });
              }

              function fillRemittance(container: HTMLElement, amount: number) {
                fireEvent.change(container.querySelector('#remit-amount')!, { target: { value: String(amount) } });
                fireEvent.change(container.querySelector('#remit-fx')!, { target: { value: '34.5' } });
              }

              function submitRemittance(container: HTMLElement) {
                fireEvent.click(container.querySelector('.form-actions .btn-primary') as HTMLButtonElement);
              }

              it('keeps the form open and records nothing when the amount exceeds the balance', async () => {
                const { container } = await renderDashboard();
                await openRemitFor(container, 'NVDA');

                fillRemittance(container, 5000);
                submitRemittance(container);

                await waitFor(() => {
                  expect(container.querySelector('.error-msg')).not.toBeNull();
                });
                expect(container.querySelector('.error-msg')!.textContent).toContain('898.38');
                expect(container.querySelector('#remit-amount')).not.toBeNull();

                const { store } = await import('../store');
                expect(
                  store.getState().trade.gains.find(g => g.sellTradeId === 't6')!.remittances,
                ).toHaveLength(0);
              });

              it('closes the form and records the remittance when the amount fits', async () => {
                const { container } = await renderDashboard();
                await openRemitFor(container, 'NVDA');

                fillRemittance(container, 100);
                submitRemittance(container);

                await waitFor(() => {
                  expect(container.querySelector('#remit-amount')).toBeNull();
                });

                const { store } = await import('../store');
                const gain = store.getState().trade.gains.find(g => g.sellTradeId === 't6')!;
                expect(gain.remittances).toHaveLength(1);
                expect(gain.remittances[0].amountUSD).toBe(100);
              });
            });
