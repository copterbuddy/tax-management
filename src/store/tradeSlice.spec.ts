/**
 * tradeSlice — Unit Tests
 * Tests Redux reducers with mocked localStorage.
 */

import { configureStore } from '@reduxjs/toolkit';
import tradeReducer, {
  addTrade,
  updateTrade,
  deleteTrade,
  addRemittance,
  setRemittanceDocRef,
  updateRemittance,
  deleteRemittance,
  importTrades,
  setReinvestedAmount,
  clearLedgerError,
  setSelectedTaxYear,
  setDisplayTaxYear,
  clearAllTrades,
} from './tradeSlice';
import type { RealizedGainResult, TradeTransaction } from '../types/trade';
import type { TradeState } from './tradeSlice';

// ─── localStorage mock ───────────────────────────────────────────────────

const localStorageMock = (() => {
  // Use a persistent object so closure-based mocks keep working after clear()
  const store: Record<string, string> = {};
  function getItem(key: string) { return store[key] ?? null; }
  function setItem(key: string, value: string) { store[key] = value; }
  function removeItem(key: string) { delete store[key]; }
  function clear() { Object.keys(store).forEach(k => delete store[k]); }

  return {
    getItem: jest.fn(getItem),
    setItem: jest.fn(setItem),
    removeItem: jest.fn(removeItem),
    clear: jest.fn(clear),
    getStore: () => store,
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// ─── Helpers ───────────────────────────────────────────────────────────

type TradeOverride = Partial<Omit<TradeTransaction, 'id'>> & { id?: string };

function makeTrade(overrides: TradeOverride = {}): TradeTransaction {
  return {
    id: overrides.id ?? `t_${Math.random().toString(36).slice(2)}`,
    date: overrides.date ?? '2026-01-15',
    symbol: overrides.symbol ?? 'AAPL',
    type: overrides.type ?? 'BUY',
    provider: overrides.provider ?? 'Dime',
    quantity: overrides.quantity ?? 10,
    priceUSD: overrides.priceUSD ?? 150,
    commissionUSD: overrides.commissionUSD ?? 1,
    exchangeFeeUSD: overrides.exchangeFeeUSD ?? 0,
    tafFeeUSD: overrides.tafFeeUSD ?? 0,
    commissionRebateUSD: overrides.commissionRebateUSD ?? 0,
    vatUSD: overrides.vatUSD ?? 0,
    ...overrides,
  } as TradeTransaction;
}

function createTestStore() {
  return configureStore({
    reducer: { trade: tradeReducer },
  }) as any;
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('tradeSlice', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
  });

  describe('addTrade', () => {
    it('adds a BUY trade and persists to localStorage', () => {
      const store = createTestStore();
      const trade = makeTrade({ id: 'b1', date: '2026-01-01', type: 'BUY', quantity: 10, priceUSD: 150 });

      store.dispatch(addTrade(trade));

      expect(store.getState().trade.trades).toHaveLength(1);
      expect(store.getState().trade.trades[0].id).toBe('b1');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tax_tracker_trades',
        expect.any(String)
      );
    });

    it('computes remainingLots after BUY', () => {
      const store = createTestStore();
      const trade = makeTrade({ id: 'b1', type: 'BUY', quantity: 10 });

      store.dispatch(addTrade(trade));

      expect(store.getState().trade.remainingLots).toHaveLength(1);
      expect(store.getState().trade.remainingLots[0].remainingQuantity).toBe(10);
    });

    it('computes gains after SELL', () => {
      const store = createTestStore();
      const buy = makeTrade({ id: 'b1', date: '2026-01-01', type: 'BUY', quantity: 10, priceUSD: 150 });
      const sell = makeTrade({ id: 's1', date: '2026-01-15', type: 'SELL', quantity: 5, priceUSD: 200 });

      store.dispatch(addTrade(buy));
      store.dispatch(addTrade(sell));

      expect(store.getState().trade.gains).toHaveLength(1);
      expect(store.getState().trade.gains[0].sellTradeId).toBe('s1');
    });

    it('sets taxSummaries for the trade year', () => {
      const store = createTestStore();
      const trade = makeTrade({ date: '2026-03-01' });

      store.dispatch(addTrade(trade));

      expect(store.getState().trade.taxSummaries[2026]).toBeDefined();
    });
  });

  describe('updateTrade', () => {
    it('updates existing trade', () => {
      const store = createTestStore();
      const buy = makeTrade({ id: 'b1', quantity: 10 });
      store.dispatch(addTrade(buy));

      const updated = makeTrade({ id: 'b1', quantity: 20 });
      store.dispatch(updateTrade(updated));

      expect(store.getState().trade.trades[0].quantity).toBe(20);
    });

    it('recomputes gains after update', () => {
      const store = createTestStore();
      const buy = makeTrade({ id: 'b1', date: '2026-01-01', type: 'BUY', quantity: 10, priceUSD: 150 });
      const sell = makeTrade({ id: 's1', date: '2026-01-15', type: 'SELL', quantity: 5, priceUSD: 200 });
      store.dispatch(addTrade(buy));
      store.dispatch(addTrade(sell));

      const originalGain = store.getState().trade.gains[0].gainUSD;

      // Update buy price → gain changes
      const updatedBuy = makeTrade({ id: 'b1', quantity: 10, priceUSD: 100 });
      store.dispatch(updateTrade(updatedBuy));

      expect(store.getState().trade.gains[0].gainUSD).not.toBe(originalGain);
    });
  });

  describe('deleteTrade', () => {
    it('removes trade by id', () => {
      const store = createTestStore();
      const buy = makeTrade({ id: 'b1' });
      store.dispatch(addTrade(buy));
      expect(store.getState().trade.trades).toHaveLength(1);

      store.dispatch(deleteTrade('b1'));
      expect(store.getState().trade.trades).toHaveLength(0);
    });

    it('recomputes gains — deleted buy reclaims lot', () => {
      const store = createTestStore();
      const buy = makeTrade({ id: 'b1', type: 'BUY', quantity: 10 });
      const sell = makeTrade({ id: 's1', type: 'SELL', quantity: 5 });
      store.dispatch(addTrade(buy));
      store.dispatch(addTrade(sell));
      expect(store.getState().trade.gains).toHaveLength(1);

      store.dispatch(deleteTrade('s1'));
      expect(store.getState().trade.gains).toHaveLength(0);
      // Remaining lots should go back to original
      expect(store.getState().trade.remainingLots[0].remainingQuantity).toBe(10);
    });
  });

  describe('setSelectedTaxYear', () => {
    it('updates selectedTaxYear', () => {
      const store = createTestStore();
      store.dispatch(setSelectedTaxYear(2025));
      expect(store.getState().trade.selectedTaxYear).toBe(2025);
    });
  });

  describe('setDisplayTaxYear', () => {
    it('updates displayTaxYear', () => {
      const store = createTestStore();
      store.dispatch(setDisplayTaxYear(2024));
      expect(store.getState().trade.displayTaxYear).toBe(2024);
    });
  });

  describe('clearAllTrades', () => {
    it('clears all trades, gains, lots, summaries', () => {
      const store = createTestStore();
      store.dispatch(addTrade(makeTrade()));
      store.dispatch(addTrade(makeTrade({ type: 'SELL', quantity: 5, priceUSD: 200 })));
      expect(store.getState().trade.trades).toHaveLength(2);

      store.dispatch(clearAllTrades());

      expect(store.getState().trade.trades).toHaveLength(0);
      expect(store.getState().trade.gains).toHaveLength(0);
      expect(store.getState().trade.remainingLots).toHaveLength(0);
      expect(store.getState().trade.taxSummaries).toEqual({});
    });
  });

  describe('Migration — old trades without provider', () => {
    it('migrates trade without provider to Dime', () => {
      // Directly test the migration logic
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (!migrated.provider) migrated.provider = 'Dime';

      expect(migrated.provider).toBe('Dime');
    });

    it('strips assetType and fxRateTHB from migrated trades', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0, assetType: 'FOREIGN_STOCK', fxRateTHB: 35 } as any;
      const migrated = { ...rawTrade };
      if ('assetType' in migrated) delete migrated.assetType;
      if ('fxRateTHB' in migrated) delete migrated.fxRateTHB;

      expect((migrated as any).assetType).toBeUndefined();
      expect((migrated as any).fxRateTHB).toBeUndefined();
      expect(migrated.provider).toBe('Dime');
    });
  });

  describe('Migration — new fee fields for old trades', () => {
    it('migrates trade without exchangeFeeUSD to 0', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (migrated.exchangeFeeUSD === undefined) migrated.exchangeFeeUSD = 0;
      if (migrated.tafFeeUSD === undefined) migrated.tafFeeUSD = 0;

      expect(migrated.exchangeFeeUSD).toBe(0);
      expect(migrated.tafFeeUSD).toBe(0);
    });

    it('does NOT overwrite existing exchangeFeeUSD value', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0, exchangeFeeUSD: 0.5 } as any;
      const migrated = { ...rawTrade };
      if (migrated.exchangeFeeUSD === undefined) migrated.exchangeFeeUSD = 0;

      expect(migrated.exchangeFeeUSD).toBe(0.5);
    });

    it('migrates trade without tafFeeUSD to 0', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (migrated.tafFeeUSD === undefined) migrated.tafFeeUSD = 0;

      expect(migrated.tafFeeUSD).toBe(0);
    });

    it('handles old trade with neither new fee field', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (migrated.exchangeFeeUSD === undefined) migrated.exchangeFeeUSD = 0;
      if (migrated.tafFeeUSD === undefined) migrated.tafFeeUSD = 0;

      expect(migrated.exchangeFeeUSD).toBe(0);
      expect(migrated.tafFeeUSD).toBe(0);
      expect(migrated.provider).toBe('Dime');
    });

    it('migrates trade without commissionRebateUSD to 0', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (migrated.commissionRebateUSD === undefined) migrated.commissionRebateUSD = 0;

      expect(migrated.commissionRebateUSD).toBe(0);
    });

    it('does NOT overwrite existing commissionRebateUSD value', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0, commissionRebateUSD: 2 } as any;
      const migrated = { ...rawTrade };
      if (migrated.commissionRebateUSD === undefined) migrated.commissionRebateUSD = 0;

      expect(migrated.commissionRebateUSD).toBe(2);
    });

    it('migrates trade without vatUSD to 0', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0 } as any;
      const migrated = { ...rawTrade };
      if (migrated.vatUSD === undefined) migrated.vatUSD = 0;

      expect(migrated.vatUSD).toBe(0);
    });

    it('does NOT overwrite existing vatUSD value', () => {
      const rawTrade = { id: 'old1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 0, vatUSD: 0.15 } as any;
      const migrated = { ...rawTrade };
      if (migrated.vatUSD === undefined) migrated.vatUSD = 0;

      expect(migrated.vatUSD).toBe(0.15);
    });
  });

  describe('Validation — corrupted localStorage', () => {
    it('invalid JSON → falls back to empty array', () => {
      localStorageMock.getStore()['tax_tracker_trades'] = '{ broken json';
      localStorageMock.getStore()['tax_tracker_gains'] = 'also broken';

      const store = createTestStore();

      expect(store.getState().trade.trades).toEqual([]);
      expect(store.getState().trade.gains).toEqual([]);
    });
  });

  describe('Hydration — grossAmountUSD is optional and never defaulted', () => {
    // initialState is built once at import time, so re-import the slice to
    // exercise the real loadTrades → migrateTrade path against seeded storage.
    function hydrate(rawTrades: unknown[]): TradeState {
      localStorageMock.getStore()['tax_tracker_trades'] = JSON.stringify(rawTrades);
      let state: TradeState | undefined;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const isolated = require('./tradeSlice');
        state = isolated.default(undefined, { type: '@@INIT' });
      });
      return state as TradeState;
    }

    it('keeps grossAmountUSD undefined for a legacy trade that never had it', () => {
      const legacy = { ...makeTrade({ id: 'legacy1' }) } as Record<string, unknown>;
      delete legacy.grossAmountUSD;

      const { trades } = hydrate([legacy]);

      expect(trades).toHaveLength(1);
      expect('grossAmountUSD' in trades[0]).toBe(false);
    });

    it('preserves grossAmountUSD across hydration', () => {
      const { trades } = hydrate([makeTrade({ id: 'g1', grossAmountUSD: 6647.13 })]);

      expect(trades[0].grossAmountUSD).toBe(6647.13);
    });
  });
});
// ─── Reinvested proceeds ────────────────────────────────────────────────

describe('tradeSlice — reinvested proceeds', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
  });

  function seedSale() {
    const store = createTestStore();
    store.dispatch(addTrade(makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 })));
    store.dispatch(addTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 200 })));
    const gain = () => store.getState().trade.gains.find((g: RealizedGainResult) => g.sellTradeId === 's1');
    return { store, gain };
  }

  it('keeps a recorded amount across addTrade and updateTrade', () => {
    const { store, gain } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));

    store.dispatch(addTrade(makeTrade({ id: 'b2', date: '2026-03-01', type: 'BUY', quantity: 1, priceUSD: 10 })));
    expect(gain().reinvestedUSD).toBeCloseTo(100, 2);

    store.dispatch(updateTrade(makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150, commissionUSD: 2 })));
    expect(gain().reinvestedUSD).toBeCloseTo(100, 2);
  });

  it('keeps a recorded amount across deleteRemittance', () => {
    const { store, gain } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));
    store.dispatch(addRemittance({ id: 'r1', sellTradeId: 's1', amountUSD: 50, remitDate: '2026-03-09', fxRateTHB: 32 }));
    expect(gain().totalRemittedUSD).toBeCloseTo(50, 2);

    store.dispatch(deleteRemittance({ id: 'r1', sellTradeId: 's1' }));

    expect(gain().totalRemittedUSD).toBe(0);
    expect(gain().reinvestedUSD).toBeCloseTo(100, 2);
  });

  it('restores a recorded amount when the slice loads from storage', () => {
    const trades = [
      makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 }),
      makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 200 }),
    ];
    localStorageMock.getStore()['tax_tracker_trades'] = JSON.stringify(trades);
    localStorageMock.getStore()['tax_tracker_gains'] = JSON.stringify([
      {
        sellTradeId: 's1', sellDate: '2026-02-13', symbol: 'AAPL', provider: 'Dime', sellQuantity: 5,
        sellRevenueUSD: 999, buyCostBasisUSD: 751, gainUSD: 248, gainPercent: 0.2482, matchedLots: [],
        totalRemittedUSD: 0, remainingProceedsUSD: 899, remittances: [], taxableGainTHB: 0,
        reinvestedUSD: 100,
      },
    ]);

    let state: TradeState | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const isolated = require('./tradeSlice');
      state = isolated.default(undefined, { type: '@@INIT' });
    });

    const gain = (state as TradeState).gains.find(g => g.sellTradeId === 's1');
    expect(gain?.reinvestedUSD).toBeCloseTo(100, 2);
    expect(gain?.remainingProceedsUSD).toBeCloseTo((gain as RealizedGainResult).sellRevenueUSD - 100, 2);
  });

  it('lowers the year outstanding figure by the recorded amount', () => {
    const { store, gain } = seedSale();
    const revenue = gain().sellRevenueUSD;
    expect(store.getState().trade.taxSummaries[2026].unremittedUSD).toBeCloseTo(revenue, 2);

    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));

    expect(store.getState().trade.taxSummaries[2026].unremittedUSD).toBeCloseTo(revenue - 100, 2);
    expect(store.getState().trade.taxSummaries[2026].totalReinvestedUSD).toBeCloseTo(100, 2);
  });

  it('leaves state untouched when the amount exceeds the balance', () => {
    const { store, gain } = seedSale();
    const revenue = gain().sellRevenueUSD;
    const gainsBefore = JSON.stringify(store.getState().trade.gains);
    const summariesBefore = JSON.stringify(store.getState().trade.taxSummaries);
      const remainingBefore = JSON.stringify(store.getState().trade.remainingLots);

    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: revenue + 10 }));

    expect(JSON.stringify(store.getState().trade.gains)).toBe(gainsBefore);
    expect(JSON.stringify(store.getState().trade.taxSummaries)).toBe(summariesBefore);
      expect(JSON.stringify(store.getState().trade.remainingLots)).toBe(remainingBefore);
    expect(gain().reinvestedUSD).toBeUndefined();
  });

    it('reports a refused record through ledgerError', () => {
      const { store, gain } = seedSale();
      const revenue = gain().sellRevenueUSD;

      store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: revenue + 10 }));

      expect(store.getState().trade.ledgerError).toEqual({ code: 'reinvestedExceedsBalance' });
      expect(gain().remainingProceedsUSD).toBeCloseTo(revenue, 2);
      expect(store.getState().trade.taxSummaries[2026].outstandingRows).toHaveLength(1);
    });

    it('keeps the refusal visible across unrelated dispatches', () => {
      const { store, gain } = seedSale();
      store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: gain().sellRevenueUSD + 10 }));

      store.dispatch(addTrade(makeTrade({ id: 'b2', date: '2026-03-01', type: 'BUY', quantity: 1, priceUSD: 10 })));
      store.dispatch(setSelectedTaxYear(2026));
      store.dispatch(setDisplayTaxYear(2026));

      expect(store.getState().trade.ledgerError).toEqual({ code: 'reinvestedExceedsBalance' });
    });

    it('clears the refusal on the next successful record', () => {
      const { store, gain } = seedSale();
      store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: gain().sellRevenueUSD + 10 }));
      expect(store.getState().trade.ledgerError).not.toBeNull();

      store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));

      expect(store.getState().trade.ledgerError).toBeNull();
      expect(gain().reinvestedUSD).toBeCloseTo(100, 2);
    });

    it('clears the refusal on dismissal', () => {
      const { store, gain } = seedSale();
      store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: gain().sellRevenueUSD + 10 }));

      store.dispatch(clearLedgerError());

      expect(store.getState().trade.ledgerError).toBeNull();
    });

  it('drops the amount with a deleted sale and clears its outstanding row', () => {
    const { store } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));
    expect(store.getState().trade.taxSummaries[2026].outstandingRows).toHaveLength(1);

    store.dispatch(deleteTrade('s1'));

    expect(store.getState().trade.gains).toHaveLength(0);
    expect(store.getState().trade.taxSummaries[2026].outstandingRows).toHaveLength(0);
  });

  it('keeps the tax year of a sale while dropping the year of a flagged remittance', () => {
    const tradesFor = (sellPriceUSD: number, extraTrades: TradeTransaction[] = []) => [
      makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 }),
      makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: sellPriceUSD }),
      ...extraTrades,
    ];
    const gainWith = (unapplied?: boolean) => [{
      sellTradeId: 's1', sellDate: '2026-02-13', symbol: 'AAPL', provider: 'Dime', sellQuantity: 5,
      sellRevenueUSD: 999, buyCostBasisUSD: 751, gainUSD: 248, gainPercent: 0.2482, matchedLots: [],
      totalRemittedUSD: 0, remainingProceedsUSD: 999, taxableGainTHB: 0,
      remittances: [{
        id: 'r1', sellTradeId: 's1', amountUSD: 5000, remitDate: '2027-01-10', fxRateTHB: 32, unapplied,
      }],
    }];
    const yearsFromTrades = (trades: TradeTransaction[], gains: ReturnType<typeof gainWith>) => {
      localStorageMock.clear();
      localStorageMock.getStore()['tax_tracker_trades'] = JSON.stringify(trades);
      localStorageMock.getStore()['tax_tracker_gains'] = JSON.stringify(gains);
      let state: TradeState | undefined;
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const isolated = require('./tradeSlice');
        state = isolated.default(undefined, { type: '@@INIT' });
      });
      return Object.keys((state as TradeState).taxSummaries).map(Number);
    };

    // Integer-like keys come back ascending, so this is set membership, not order.
    // 5000 against revenue 999 cannot be supported, so the flag holds and 2027 has no applied record.
    expect(yearsFromTrades(tradesFor(200), gainWith(true))).toEqual([2026]);

    // A corrected sale that can afford the record re-applies it, so 2027 returns.
    expect(yearsFromTrades(tradesFor(1200), gainWith(true))).toEqual([2026, 2027]);

    const buyIn2027 = [makeTrade({ id: 'b2', date: '2027-01-05', type: 'BUY', quantity: 1, priceUSD: 10 })];
    expect(yearsFromTrades(tradesFor(200, buyIn2027), gainWith(true))).toEqual([2026, 2027]);
  });

  it('preserves reinvested amounts on import', () => {
    const { store } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 100 }));

    store.dispatch(importTrades([
      makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 }),
      makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 200 }),
    ]));

    const gain = store.getState().trade.gains.find((g: RealizedGainResult) => g.sellTradeId === 's1');
      expect(gain?.reinvestedUSD).toBeCloseTo(100, 2);
      expect(store.getState().trade.taxSummaries[2026].unremittedUSD).toBeCloseTo(gain!.sellRevenueUSD - 100, 2);
  });
});

    describe('tradeSlice — remittance integrity', () => {
      beforeEach(() => {
        localStorageMock.clear();
        localStorageMock.getItem.mockClear();
      });

      function seedSale(revenue: { quantity: number; priceUSD: number } = { quantity: 5, priceUSD: 200 }) {
        const store = createTestStore();
        store.dispatch(addTrade(makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 })));
        store.dispatch(addTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', ...revenue })));
        const gain = () => store.getState().trade.gains.find((g: RealizedGainResult) => g.sellTradeId === 's1');
        const remit = (id: string, amountUSD: number) => store.dispatch(addRemittance({
          id, sellTradeId: 's1', amountUSD, remitDate: '2026-03-09', fxRateTHB: 32,
        }));
        return { store, gain, remit };
      }

      it('keeps a remittance the shrunken sale can no longer support, flagged and uncounted', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 400);
        expect(gain().totalRemittedUSD).toBeCloseTo(400, 2);

        store.dispatch(updateTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 50 })));

        const shrunk = gain();
        expect(shrunk.sellRevenueUSD).toBeLessThan(400);
        expect(shrunk.remittances).toHaveLength(1);
        expect(shrunk.remittances[0]).toMatchObject({ id: 'r1', amountUSD: 400, remitDate: '2026-03-09', unapplied: true });
        expect(shrunk.totalRemittedUSD).toBe(0);
        expect(shrunk.remainingProceedsUSD).toBeCloseTo(shrunk.sellRevenueUSD, 2);
        expect(store.getState().trade.taxSummaries[2026].totalRemittedUSD).toBe(0);
        expect(store.getState().trade.taxSummaries[2026].totalRemittanceCount).toBe(0);
      });

      it('keeps a remittance that still fits applied when the sale shrinks but covers it', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 100);
        const before = store.getState().trade.taxSummaries[2026].totalRemittedUSD;

        store.dispatch(updateTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 150 })));

        expect(gain().remittances[0].unapplied).toBeUndefined();
        expect(gain().totalRemittedUSD).toBeCloseTo(100, 2);
        expect(store.getState().trade.taxSummaries[2026].totalRemittedUSD).toBeCloseTo(before, 2);
      });

      it('splits in order: the record that still fits stays applied and the next one is flagged', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 75);
        remit('r2', 75);

        // Shrink the sale to exactly 100 of proceeds.
        store.dispatch(updateTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 20.2 })));
        const shrunk = gain();
        expect(shrunk.sellRevenueUSD).toBeCloseTo(100, 0);

        const [first, second] = shrunk.remittances;
        expect(first.unapplied).toBeUndefined();
        expect(second.unapplied).toBe(true);
        expect(shrunk.totalRemittedUSD).toBeCloseTo(75, 2);
      });

      it('flags both records when each one alone exceeds the shrunken proceeds', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 120);
        remit('r2', 120);

        store.dispatch(updateTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 20.2 })));

        const shrunk = gain();
        expect(shrunk.remittances).toHaveLength(2);
        expect(shrunk.remittances.every((r: RealizedGainResult['remittances'][number]) => r.unapplied === true)).toBe(true);
        expect(shrunk.totalRemittedUSD).toBe(0);
      });

      it('flags a record raised beyond the remaining proceeds and keeps the record on delete', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 100);
        const revenue = gain().sellRevenueUSD;

        store.dispatch(updateRemittance({ id: 'r1', sellTradeId: 's1', amountUSD: revenue + 100, remitDate: '2026-03-09', fxRateTHB: 32 }));

        expect(gain().remittances).toHaveLength(1);
        expect(gain().remittances[0]).toMatchObject({ id: 'r1', amountUSD: revenue + 100, unapplied: true });
        expect(gain().totalRemittedUSD).toBe(0);

        store.dispatch(deleteRemittance({ id: 'r1', sellTradeId: 's1' }));

        expect(gain().remittances).toHaveLength(0);
        expect(gain().totalRemittedUSD).toBe(0);
        expect(gain().remittances.some((r: RealizedGainResult['remittances'][number]) => r.unapplied)).toBe(false);
      });

      it('leaves the ledger byte-identical when a new remittance is rejected', () => {
        const { store, gain, remit } = seedSale();
        remit('r1', 100);
        const gainsBefore = JSON.stringify(store.getState().trade.gains);
        const summariesBefore = JSON.stringify(store.getState().trade.taxSummaries);
        const persistedBefore = localStorageMock.getStore()['tax_tracker_gains'];
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        store.dispatch(addRemittance({
          id: 'r2', sellTradeId: 's1', amountUSD: gain().sellRevenueUSD, remitDate: '2026-04-09', fxRateTHB: 32,
        }));

        expect(JSON.stringify(store.getState().trade.gains)).toBe(gainsBefore);
        expect(JSON.stringify(store.getState().trade.taxSummaries)).toBe(summariesBefore);
        expect(localStorageMock.getStore()['tax_tracker_gains']).toBe(persistedBefore);
        expect(errorSpy).toHaveBeenCalledWith('Rejected remittance:', expect.any(String));
        errorSpy.mockRestore();
      });
    });

describe('tradeSlice — import safety', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
  });

  const buy = (priceUSD = 150) =>
    makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD });
  const sell = (priceUSD = 200) =>
    makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD });

  function seedSale(priceUSD = 200, buyPriceUSD = 150) {
    const store = createTestStore();
    store.dispatch(addTrade(buy(buyPriceUSD)));
    store.dispatch(addTrade(sell(priceUSD)));
    const gain = () => store.getState().trade.gains.find((g: RealizedGainResult) => g.sellTradeId === 's1');
    const remit = (id: string, amountUSD: number, remitDate = '2026-03-09') => store.dispatch(addRemittance({
      id, sellTradeId: 's1', amountUSD, remitDate, fxRateTHB: 32,
    }));
    return { store, gain, remit };
  }

  const summary = (store: any, year = 2026) => store.getState().trade.taxSummaries[year];
  const provider = (store: any, name = 'Dime') =>
    summary(store).providerBreakdown.find((p: { provider: string }) => p.provider === name);

  it('preserves every remittance and reinvested amount when the imported list is identical', () => {
    const { store, gain, remit } = seedSale();
    remit('r1', 100);
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 50 }));
    const before = gain().remittances.map((r: RealizedGainResult['remittances'][number]) => ({ ...r }));

    store.dispatch(importTrades([buy(), sell()]));

    expect(gain().remittances).toEqual(before);
    expect(gain().reinvestedUSD).toBeCloseTo(50, 2);
    expect(gain().totalRemittedUSD).toBeCloseTo(100, 2);
    expect(summary(store).totalRemittedUSD).toBeCloseTo(100, 2);
  });

  it('drops only the records of a sale the imported list no longer contains', () => {
    const store = createTestStore();
    store.dispatch(addTrade(buy()));
    store.dispatch(addTrade(sell()));
    store.dispatch(addTrade(makeTrade({ id: 's2', date: '2026-05-01', type: 'SELL', quantity: 4, priceUSD: 210 })));
    store.dispatch(addRemittance({ id: 'r1', sellTradeId: 's1', amountUSD: 100, remitDate: '2026-03-09', fxRateTHB: 32 }));
    store.dispatch(addRemittance({ id: 'r2', sellTradeId: 's2', amountUSD: 60, remitDate: '2026-06-09', fxRateTHB: 32 }));
    expect(store.getState().trade.gains).toHaveLength(2);

    store.dispatch(importTrades([buy(), sell()]));

    const gains = store.getState().trade.gains;
    expect(gains).toHaveLength(1);
    expect(gains[0].sellTradeId).toBe('s1');
    expect(gains[0].remittances.map((r: { id: string }) => r.id)).toEqual(['r1']);
    expect(summary(store).totalRemittedUSD).toBeCloseTo(100, 2);
  });

  it('leaves every tax-year figure unchanged on a no-op import', () => {
    const { store, remit } = seedSale();
    remit('r1', 100);
    remit('r2', 50, '2026-04-09');
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: 25 }));
    const before = JSON.stringify(store.getState().trade.taxSummaries);

    store.dispatch(importTrades([buy(), sell()]));

    expect(JSON.stringify(store.getState().trade.taxSummaries)).toBe(before);
    const totals = summary(store);
    expect(totals.totalRemittedUSD).toBeCloseTo(
      totals.providerBreakdown.reduce((t: number, p: { totalRemittedUSD: number }) => t + p.totalRemittedUSD, 0), 6);
    expect(totals.taxableGainTHB).toBeCloseTo(
      totals.providerBreakdown.reduce((t: number, p: { taxableGainTHB: number }) => t + p.taxableGainTHB, 0), 6);
  });

  it('still empties gains and summaries when everything is cleared', () => {
    const { store, remit } = seedSale();
    remit('r1', 100);

    store.dispatch(clearAllTrades());

    expect(store.getState().trade.trades).toEqual([]);
    expect(store.getState().trade.gains).toEqual([]);
    expect(store.getState().trade.taxSummaries).toEqual({});
  });

  it('imports a shrunken sale keeping both records, applying the first and flagging the second', () => {
    // A cheap basis keeps the shrunken sale profitable, so the taxable figure is
    // a real number rather than a clamped zero.
    const { store, gain, remit } = seedSale(200, 2);
    remit('r1', 75, '2026-03-09');
    remit('r2', 75, '2026-04-09');

    store.dispatch(importTrades([buy(2), sell(20.2)]));

    const shrunk = gain();
    expect(shrunk.sellRevenueUSD).toBeCloseTo(100, 0);
    expect(shrunk.remittances.map((r: RealizedGainResult['remittances'][number]) =>
      ({ id: r.id, amountUSD: r.amountUSD, remitDate: r.remitDate }))).toEqual([
      { id: 'r1', amountUSD: 75, remitDate: '2026-03-09' },
      { id: 'r2', amountUSD: 75, remitDate: '2026-04-09' },
    ]);
    expect(shrunk.remittances[0].unapplied).not.toBe(true);
    expect(shrunk.remittances[1].unapplied).toBe(true);
    expect(shrunk.totalRemittedUSD).toBeCloseTo(75, 2);
    expect(shrunk.remainingProceedsUSD).toBeCloseTo(shrunk.sellRevenueUSD - 75, 2);

    const totals = summary(store);
    expect(store.getState().trade.trades).toHaveLength(2);
    expect(totals.totalRemittedUSD).toBeCloseTo(75, 2);
    expect(totals.totalRemittanceCount).toBe(1);
    expect(provider(store).totalRemittedUSD).toBeCloseTo(75, 2);
    expect(provider(store).sellCount).toBe(1);
    // Only the applied 75 contributes the gain portion: the flagged second one
    // would nearly double this figure.
    expect(shrunk.gainPercent).toBeGreaterThan(0);
    expect(totals.taxableGainTHB).toBeCloseTo(75 * shrunk.gainPercent * 32, 2);
  });

  it('flags both records when each one alone exceeds the shrunken proceeds and counts neither', () => {
    const { store, gain, remit } = seedSale();
    remit('r1', 120, '2026-03-09');
    remit('r2', 120, '2026-04-09');

    store.dispatch(importTrades([buy(), sell(20.2)]));

    const shrunk = gain();
    expect(shrunk.remittances).toHaveLength(2);
    expect(shrunk.remittances.every((r: RealizedGainResult['remittances'][number]) => r.unapplied === true)).toBe(true);
    expect(shrunk.remittances.map((r: RealizedGainResult['remittances'][number]) => r.remitDate))
      .toEqual(['2026-03-09', '2026-04-09']);
    expect(shrunk.totalRemittedUSD).toBe(0);
    expect(shrunk.remainingProceedsUSD).toBeCloseTo(shrunk.sellRevenueUSD, 2);

    const totals = summary(store);
    expect(totals.totalRemittedUSD).toBe(0);
    expect(totals.totalRemittanceCount).toBe(0);
    expect(totals.taxableGainTHB).toBe(0);
    expect(provider(store)?.totalRemittedUSD ?? 0).toBe(0);
  });

  it('flags nothing when the shrunken sale still covers its remittance', () => {
    const { store, gain, remit } = seedSale(200, 2);
    remit('r1', 40);

    store.dispatch(importTrades([buy(2), sell(20.2)]));

    const shrunk = gain();
    expect(shrunk.remittances).toHaveLength(1);
    expect(shrunk.remittances[0].unapplied).toBeUndefined();
    expect(shrunk.totalRemittedUSD).toBeCloseTo(40, 2);
    const totals = summary(store);
    expect(totals.totalRemittanceCount).toBe(1);
    expect(totals.taxableGainTHB).toBeCloseTo(40 * shrunk.gainPercent * 32, 2);
  });

  it('clears a stale reinvested refusal when an import is applied', () => {
    const { store, gain } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: gain().sellRevenueUSD + 10 }));
    expect(store.getState().trade.ledgerError).toEqual({ code: 'reinvestedExceedsBalance' });

    store.dispatch(importTrades([buy(), sell(210)]));

    expect(store.getState().trade.ledgerError).toBeNull();
    expect(store.getState().trade.trades[1].priceUSD).toBe(210);
    expect(gain().sellRevenueUSD).toBeCloseTo(1049, 0);
    expect(summary(store).outstandingRows).toHaveLength(1);
  });

  it('clears the refusal when all trades are cleared as well', () => {
    const { store, gain } = seedSale();
    store.dispatch(setReinvestedAmount({ sellTradeId: 's1', amountUSD: gain().sellRevenueUSD + 10 }));
    expect(store.getState().trade.ledgerError).not.toBeNull();

    store.dispatch(clearAllTrades());

    expect(store.getState().trade.ledgerError).toBeNull();
  });
});

// ─── Evidence link on a remittance ─────────────────────────────────────────

describe('tradeSlice — remittance document link', () => {
  function seeded() {
    const store = createTestStore();
    store.dispatch(addTrade(makeTrade({ id: 'b1', date: '2026-01-02', type: 'BUY', quantity: 10, priceUSD: 150 })));
    store.dispatch(addTrade(makeTrade({ id: 's1', date: '2026-02-13', type: 'SELL', quantity: 5, priceUSD: 200 })));
    store.dispatch(addRemittance({ id: 'r1', sellTradeId: 's1', amountUSD: 100, remitDate: '2026-03-09', fxRateTHB: 32 }));
    return store;
  }

  it('attaches a link without touching any amount', () => {
    const store = seeded();
    const before = store.getState().trade.taxSummaries[2026];

    store.dispatch(setRemittanceDocRef({ sellTradeId: 's1', remittanceId: 'r1', docRef: 'https://example.com/slip.pdf' }));

    const remittance = store.getState().trade.gains[0].remittances[0];
    expect(remittance.docRef).toBe('https://example.com/slip.pdf');
    expect(store.getState().trade.taxSummaries[2026]).toEqual(before);
    expect(JSON.parse(localStorageMock.getStore()['tax_tracker_gains'])[0].remittances[0].docRef)
      .toBe('https://example.com/slip.pdf');
  });

  it('clears the link when none is given', () => {
    const store = seeded();
    store.dispatch(setRemittanceDocRef({ sellTradeId: 's1', remittanceId: 'r1', docRef: 'https://example.com/slip.pdf' }));
    store.dispatch(setRemittanceDocRef({ sellTradeId: 's1', remittanceId: 'r1' }));

    expect(store.getState().trade.gains[0].remittances[0].docRef).toBeUndefined();
  });

  it('ignores an unknown remittance', () => {
    const store = seeded();
    const before = JSON.stringify(store.getState().trade.gains);
    store.dispatch(setRemittanceDocRef({ sellTradeId: 's1', remittanceId: 'nope', docRef: 'https://example.com/x' }));
    expect(JSON.stringify(store.getState().trade.gains)).toBe(before);
  });
});
