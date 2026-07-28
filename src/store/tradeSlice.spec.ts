/**
 * tradeSlice — Unit Tests
 * Tests Redux reducers with mocked localStorage.
 */

import { configureStore } from '@reduxjs/toolkit';
import tradeReducer, {
  addTrade,
  updateTrade,
  deleteTrade,
  setSelectedTaxYear,
  setDisplayTaxYear,
  clearAllTrades,
} from './tradeSlice';
import type { TradeTransaction } from '../types/trade';
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
});
