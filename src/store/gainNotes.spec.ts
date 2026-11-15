/**
 * Gain notes — a note the user writes about a sale must survive load, recompute
 * and import, and must never move a tax figure.
 *
 * The trade slice builds its initial state once, at module load (`initialState =
 * buildInitialState()`), so storage has to be seeded before the module is
 * required. Each test therefore resets the module registry, seeds storage, and
 * requires a fresh slice — which is also why this lives in its own file.
 */

import { configureStore } from '@reduxjs/toolkit';
import type { RealizedGainResult, TradeTransaction } from '../types/trade';

const storage: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v; },
    removeItem: (k: string) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
  },
});

const BUY: TradeTransaction = {
  id: 'b1', date: '2026-01-02', symbol: 'AAPL', type: 'BUY', provider: 'Dime',
  quantity: 10, priceUSD: 150, commissionUSD: 0, exchangeFeeUSD: 0,
  tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0,
};

const SELL: TradeTransaction = {
  id: 's1', date: '2026-02-13', symbol: 'AAPL', type: 'SELL', provider: 'Dime',
  quantity: 5, priceUSD: 200, commissionUSD: 0, exchangeFeeUSD: 0,
  tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0,
};

function gain(note?: string): RealizedGainResult {
  const base: RealizedGainResult = {
    sellTradeId: 's1', sellDate: '2026-02-13', symbol: 'AAPL', provider: 'Dime',
    sellQuantity: 5, sellRevenueUSD: 1000, buyCostBasisUSD: 750, gainUSD: 250,
    gainPercent: 0.25, matchedLots: [], totalRemittedUSD: 0,
    remainingProceedsUSD: 1000, remittances: [], taxableGainTHB: 0,
  };
  return note === undefined ? base : { ...base, note };
}

function storeWith(notes: string | undefined) {
  delete storage['tax_tracker_trades'];
  delete storage['tax_tracker_gains'];
  storage['tax_tracker_trades'] = JSON.stringify([BUY, SELL]);
  storage['tax_tracker_gains'] = JSON.stringify([gain(notes)]);

  jest.resetModules();
  const slice = require('./tradeSlice') as typeof import('./tradeSlice');
  const store: any = configureStore({ reducer: { trade: slice.default } });
  return { store, slice };
}

const noteOf = (store: any) => store.getState().trade.gains[0]?.note;

describe('gain notes', () => {
  it('loads a stored note', () => {
    const { store } = storeWith('เงิน 204.75 ถูกใช้ซื้อ SPGI');
    expect(noteOf(store)).toBe('เงิน 204.75 ถูกใช้ซื้อ SPGI');
  });

  it('keeps the note when an unrelated trade is edited', () => {
    const { store, slice } = storeWith('note A');
    store.dispatch(slice.updateTrade({ ...BUY, priceUSD: 155 }));
    expect(noteOf(store)).toBe('note A');
  });

  it('keeps the note when a remittance is added and deleted', () => {
    const { store, slice } = storeWith('note B');
    store.dispatch(slice.addRemittance({ id: 'r1', sellTradeId: 's1', amountUSD: 100, remitDate: '2026-03-09', fxRateTHB: 32 }));
    expect(noteOf(store)).toBe('note B');
    store.dispatch(slice.deleteRemittance({ id: 'r1', sellTradeId: 's1' }));
    expect(noteOf(store)).toBe('note B');
  });

  it('keeps the note across an identical import', () => {
    const { store, slice } = storeWith('note C');
    store.dispatch(slice.importTrades(store.getState().trade.trades));
    expect(noteOf(store)).toBe('note C');
  });

  it('drops the note with its sale', () => {
    const { store, slice } = storeWith('note D');
    store.dispatch(slice.deleteTrade('s1'));
    expect(store.getState().trade.gains.find((g: RealizedGainResult) => g.sellTradeId === 's1')).toBeUndefined();
  });

  it('changes no tax figure', () => {
    const without = storeWith(undefined).store.getState().trade.taxSummaries[2026];
    const withNote = storeWith('อธิบายผล').store.getState().trade.taxSummaries[2026];
    expect(withNote).toEqual(without);
  });
});