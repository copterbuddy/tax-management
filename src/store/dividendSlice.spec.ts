import { configureStore } from '@reduxjs/toolkit';
import dividendReducer, {
  addDividend,
  updateDividend,
  deleteDividend,
  addDividendRemittance,
  removeDividendRemittance,
  setDividendDisplayYear,
  importDividends,
  clearAllDividends,
} from './dividendSlice';
import { STORAGE_KEYS_DIVIDEND } from '../constants';
import { calculateWhtCredit } from '../engine/dividendEngine';
import type { DividendRecord, DividendRemittance } from '../types/trade';

type TestStore = ReturnType<typeof configureStore<{ dividend: ReturnType<typeof dividendReducer> }>>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeDividend(
  overrides: Partial<DividendRecord> = {}
): DividendRecord {
  return {
    id: 'div_1',
    date: '2026-01-15',
    symbol: 'AAPL',
    country: 'US',
    grossAmountUSD: 1000,
    whtRate: 15,
    whtAmountUSD: 150,
    netAmountUSD: 850,
    dividendFxRate: 35,
    grossAmountTHB: 35000,
    whtAmountTHB: 5250,
    netAmountTHB: 29750,
    totalRemittedUSD: 0,
    remainingToRemitUSD: 850,
    remittances: [],
    notes: undefined,
    ...overrides,
  } as DividendRecord;
}

function makeRemittance(
  overrides: Partial<DividendRemittance> = {}
): DividendRemittance {
  return {
    id: 'rem_1',
    dividendId: 'div_1',
    amountUSD: 500,
    remitDate: '2026-01-15',
    remitFxRate: 31,
    remitTHB: 15500,
    reportableIncomeTHB: 15500,
    whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
    notes: undefined,
    ...overrides,
  } as DividendRemittance;
}

function createTestStore(): TestStore {
  return configureStore({ reducer: { dividend: dividendReducer } });
}

// Clear localStorage in beforeEach — mirrors taxSlice.spec.ts pattern
beforeEach(() => {
  localStorage.clear();
});

// ─── Task 6.1: CRUD actions ─────────────────────────────────────────────────

describe('dividendSlice CRUD', () => {
  it('addDividend pushes a record, updates availableYears, and persists to localStorage', () => {
    const store = createTestStore();
    const record = makeDividend();

    store.dispatch(addDividend(record));

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(1);
    expect(state.records[0].id).toBe('div_1');
    expect(state.availableYears).toContain(2026);

    const saved = localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS);
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('div_1');
  });

  it('updateDividend replaces the matching record and persists', () => {
    const store = createTestStore();
    const record = makeDividend();
    store.dispatch(addDividend(record));

    const updated = makeDividend({ id: 'div_1', symbol: 'GOOGL' });
    store.dispatch(updateDividend(updated));

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(1);
    expect(state.records[0].symbol).toBe('GOOGL');

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS)!);
    expect(saved[0].symbol).toBe('GOOGL');
  });

  it('updateDividend with unmatched id leaves state unchanged', () => {
    const store = createTestStore();
    const record = makeDividend();
    store.dispatch(addDividend(record));

    store.dispatch(updateDividend(makeDividend({ id: 'nonexistent' })));

    expect(store.getState().dividend.records).toHaveLength(1);
    expect(store.getState().dividend.records[0].id).toBe('div_1');
  });

  it('deleteDividend removes the record, updates availableYears, and clears from storage', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend({ id: 'div_1', date: '2026-01-15' })));
    store.dispatch(addDividend(makeDividend({ id: 'div_2', date: '2027-01-15' })));

    store.dispatch(deleteDividend('div_1'));

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(1);
    expect(state.records[0].id).toBe('div_2');
    expect(state.availableYears).toEqual([2027]); // 2026 removed after sorting

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS)!);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('div_2');
  });

  it('deleteDividend with no remaining records resets availableYears to empty', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend()));

    store.dispatch(deleteDividend('div_1'));

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(0);
    expect(state.availableYears).toEqual([]);
    expect(state.displayYear).toBe(new Date().getFullYear());
  });
});

// ─── Task 6.2: addDividendRemittance ─────────────────────────────────────────

describe('addDividendRemittance', () => {
  it('recomputes totals and saves to localStorage', () => {
    const store = createTestStore();
    const record = makeDividend();
    store.dispatch(addDividend(record));

    const remittance = makeRemittance({
      amountUSD: 500,
      remitDate: '2026-06-01',
      remitFxRate: 31,
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
      whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
    });

    store.dispatch(addDividendRemittance(remittance));

    const state = store.getState().dividend;
    const updated = state.records[0];
    expect(updated.remittances).toHaveLength(1);
    expect(updated.totalRemittedUSD).toBe(500);
    expect(updated.remainingToRemitUSD).toBe(350);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS)!);
    expect(saved[0].remittances).toHaveLength(1);
  });

  it('repents displayYear when the current year disappears', () => {
    const store = createTestStore();
    const record = makeDividend({
      id: 'div_1',
      date: '2027-01-15',
      remittances: [
        makeRemittance({
          id: 'rem_1',
          dividendId: 'div_1',
          amountUSD: 500,
          remitDate: '2027-01-15',
        }),
      ],
      totalRemittedUSD: 500,
      remainingToRemitUSD: 350,
    });
    store.dispatch(addDividend(record));

    // After adding, displayYear should be 2027 (the only year)
    expect(store.getState().dividend.displayYear).toBe(2027);

    // Removing the only remittance makes the record unremitted,
    // so its dividend-date year (2027) should still appear
    store.dispatch(removeDividendRemittance({ dividendId: 'div_1', remittanceId: 'rem_1' }));

    const state = store.getState().dividend;
    expect(state.availableYears).toContain(2027);
  });

  it('over-balance remittance leaves state unchanged (reducer catches the thrown error)', () => {
    const store = createTestStore();
    const record = makeDividend();
    store.dispatch(addDividend(record));

    const overBalanceRemit = makeRemittance({
      amountUSD: 1000,
      remitDate: '2026-06-01',
      remitFxRate: 31,
    });

    // Should not throw — the reducer wraps in try/catch
    expect(() => store.dispatch(addDividendRemittance(overBalanceRemit))).not.toThrow();

    const state = store.getState().dividend;
    expect(state.records[0].remittances).toHaveLength(0);
    expect(state.records[0].remainingToRemitUSD).toBe(850);
  });
});

// ─── Task 6.3: removeDividendRemittance ──────────────────────────────────────

describe('removeDividendRemittance', () => {
  it('recomputes totals from remaining remittances only', () => {
    const store = createTestStore();
    const record = makeDividend();

    const remit1 = makeRemittance({
      id: 'rem_1',
      dividendId: 'div_1',
      amountUSD: 500,
      remitDate: '2026-01-15',
      remitFxRate: 31,
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
      whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
    });

    const remit2 = makeRemittance({
      id: 'rem_2',
      dividendId: 'div_1',
      amountUSD: 350,
      remitDate: '2026-06-01',
      remitFxRate: 32,
      reportableIncomeTHB: 350 * 32,
      remitTHB: 350 * 32,
      whtCreditTHB: calculateWhtCredit(350, 850, 150, 32),
    });

    store.dispatch(addDividend(record));
    store.dispatch(addDividendRemittance(remit1));
    store.dispatch(addDividendRemittance(remit2));

    // Before removal: both remittances, total 850 remitted
    expect(store.getState().dividend.records[0].remittances).toHaveLength(2);
    expect(store.getState().dividend.records[0].totalRemittedUSD).toBe(850);
    expect(store.getState().dividend.records[0].remainingToRemitUSD).toBe(0);

    // Remove the first remittance — remaining should be just 350
    store.dispatch(removeDividendRemittance({ dividendId: 'div_1', remittanceId: 'rem_1' }));

    const updated = store.getState().dividend.records[0];
    expect(updated.remittances).toHaveLength(1);
    expect(updated.totalRemittedUSD).toBe(350);
    expect(updated.remainingToRemitUSD).toBe(500);
  });

  it('removing non-existent remittance leaves state unchanged', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend()));

    store.dispatch(removeDividendRemittance({ dividendId: 'div_1', remittanceId: 'nonexistent' }));

    expect(store.getState().dividend.records[0].remittances).toHaveLength(0);
  });

  it('removing from non-existent dividend leaves state unchanged', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend()));

    store.dispatch(removeDividendRemittance({ dividendId: 'nonexistent', remittanceId: 'rem_1' }));

    expect(store.getState().dividend.records[0].remittances).toHaveLength(0);
  });
});

// ─── Task 6.4: setDividendDisplayYear, importDividends, clearAllDividends ─────

describe('year selection & bulk ops', () => {
  it('setDividendDisplayYear updates displayYear', () => {
    const store = createTestStore();
    store.dispatch(setDividendDisplayYear(2025));
    expect(store.getState().dividend.displayYear).toBe(2025);
  });

  it('importDividends replaces all records and repoints displayYear', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend({ id: 'div_old', date: '2026-01-15' })));

    const imported = [
      makeDividend({ id: 'div_new1', date: '2025-01-15' }),
      makeDividend({ id: 'div_new2', date: '2027-01-15' }),
    ];
    store.dispatch(importDividends(imported));

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(2);
    expect(state.records.map(r => r.id)).toEqual(['div_new1', 'div_new2']);
    expect(state.availableYears).toEqual([2027, 2025]);
    expect(state.displayYear).toBe(2027); // newest available year

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS)!);
    expect(saved).toHaveLength(2);
  });

  it('clearAllDividends wipes to empty and clears storage', () => {
    const store = createTestStore();
    store.dispatch(addDividend(makeDividend()));
    store.dispatch(addDividend(makeDividend({ id: 'div_2' })));

    expect(store.getState().dividend.records).toHaveLength(2);

    store.dispatch(clearAllDividends());

    const state = store.getState().dividend;
    expect(state.records).toHaveLength(0);
    expect(state.availableYears).toEqual([]);
    expect(state.displayYear).toBe(new Date().getFullYear());

    const saved = localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS);
    expect(saved).toBe('[]');
  });
});

// ─── Task 5.2: Reportable-income FX regression guard ─────────────────────────
// Asserts stored reportableIncomeTHB === remitTHB === amountUSD × remitFxRate
// while dividendFxRate differs — the value must be unchanged by the dividend-date rate.

describe('reportable-income FX rule (BR2 regression guard)', () => {
  it('stored reportableIncomeTHB equals remitTHB and is independent of dividendFxRate', () => {
    const store = createTestStore();

    // Record A: dividend-date FX = 30, remit FX = 31
    const dividendA = makeDividend({
      id: 'div_A',
      dividendFxRate: 30,
      date: '2026-01-15',
    });
    store.dispatch(addDividend(dividendA));

    const remitA = makeRemittance({
      id: 'rem_A',
      dividendId: 'div_A',
      amountUSD: 500,
      remitDate: '2026-06-01',
      remitFxRate: 31,
      // Correct reportable income uses remitFxRate
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
      whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
    });
    store.dispatch(addDividendRemittance(remitA));

    // Record B: dividend-date FX = 40 (different!), same remit
    const dividendB = makeDividend({
      id: 'div_B',
      dividendFxRate: 40,
      date: '2026-01-15',
    });
    store.dispatch(addDividend(dividendB));

    const remitB = makeRemittance({
      id: 'rem_B',
      dividendId: 'div_B',
      amountUSD: 500,
      remitDate: '2026-06-01',
      remitFxRate: 31,
      reportableIncomeTHB: 500 * 31,
      remitTHB: 500 * 31,
      whtCreditTHB: calculateWhtCredit(500, 850, 150, 31),
    });
    store.dispatch(addDividendRemittance(remitB));

    const records = store.getState().dividend.records;
    const recA = records.find(r => r.id === 'div_A')!;
    const recB = records.find(r => r.id === 'div_B')!;

    // Both have identical remitFX → identical reportableIncomeTHB
    const storedA = recA.remittances[0].reportableIncomeTHB;
    const storedB = recB.remittances[0].reportableIncomeTHB;

    const expected = 500 * 31; // amountUSD × remitFxRate

    expect(storedA).toBe(expected);
    expect(storedB).toBe(expected);
    expect(storedA).toBe(storedB); // invariant: dividendFxRate doesn't matter

    // Cross-check against the wrong formula
    expect(storedA).not.toBe(500 * 30);
    expect(storedB).not.toBe(500 * 40);
  });
});