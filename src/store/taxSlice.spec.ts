/**
 * taxSlice — Unit Tests
 * Tests Thai progressive tax calculation.
 */

import { configureStore } from '@reduxjs/toolkit';
import taxReducer, {
  setAnnualIncome,
  setDeductions,
  calculateTax,
  saveCalculation,
  deleteHistoryItem,
  clearHistory,
} from './taxSlice';
import type { TaxState } from './taxSlice';

type TestStore = ReturnType<typeof configureStore<{ tax: TaxState }>>;

describe('Thai Tax Calculator', () => {
  let store: TestStore;

  beforeEach(() => {
    store = configureStore({ reducer: { tax: taxReducer } });
  });

  // Helper: create a store with 0 deductions for income tax tests
  function createZeroDeductionStore(): TestStore {
    const s = configureStore({ reducer: { tax: taxReducer } });
    s.dispatch(setDeductions(0));
    return s;
  }

  // ─── Tax bracket calculations ──────────────────────────────────────────

  describe('calculateTax', () => {
    it('0 income → 0 tax (exempt bracket)', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(0));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(0);
    });

    it('100,000 baht → 0 tax (under 150k exempt)', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(100_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(0);
    });

    it('150,000 baht → 0 tax (exactly at exempt threshold)', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(150_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(0);
    });

    it('300,000 baht → 7,500 tax (150k×5%)', () => {
      // 150k×0% + 150k×5% = 7,500
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(300_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(7_500);
    });

    it('500,000 baht → 27,500 tax', () => {
      // 150k×0% + 150k×5% + 200k×10% = 0 + 7,500 + 20,000 = 27,500
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(500_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(27_500);
    });

    it('1,000,000 baht → 115,000 tax', () => {
      // 150k×0% + 150k×5% + 200k×10% + 250k×15% + 250k×20% = 0+7,500+20,000+37,500+50,000
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(1_000_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(115_000);
    });

    it('negative income → 0 tax', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(-50_000));
      s.dispatch(calculateTax());
      expect(s.getState().tax.calculatedTax).toBe(0);
    });

    it('effectiveTaxRate calculated correctly', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(500_000));
      s.dispatch(calculateTax());
      // Tax = 27,500, income = 500,000 → rate = 5.5%
      expect(s.getState().tax.effectiveTaxRate).toBeCloseTo(5.5);
    });

    it('effectiveTaxRate = 0 when income is 0', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(0));
      s.dispatch(calculateTax());
      expect(s.getState().tax.effectiveTaxRate).toBe(0);
    });
  });

  // ─── setDeductions ────────────────────────────────────────────────────

  describe('setDeductions', () => {
    it('default deduction is 160,000 (60k + 100k)', () => {
      expect(store.getState().tax.deductions).toBe(160_000);
    });

    it('can set custom deduction', () => {
      store.dispatch(setDeductions(200_000));
      expect(store.getState().tax.deductions).toBe(200_000);
    });

    it('negative deduction clamped to 0', () => {
      store.dispatch(setDeductions(-50_000));
      expect(store.getState().tax.deductions).toBe(0);
    });
  });

  // ─── setAnnualIncome ───────────────────────────────────────────────────

  describe('setAnnualIncome', () => {
    it('stores income', () => {
      store.dispatch(setAnnualIncome(500_000));
      expect(store.getState().tax.annualIncome).toBe(500_000);
    });

    it('negative income clamped to 0', () => {
      store.dispatch(setAnnualIncome(-100_000));
      expect(store.getState().tax.annualIncome).toBe(0);
    });
  });

  // ─── History ────────────────────────────────────────────────────────────

  describe('saveCalculation', () => {
    it('adds entry to history', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(500_000));
      s.dispatch(calculateTax());
      s.dispatch(saveCalculation());

      const history = s.getState().tax.history;
      expect(history).toHaveLength(1);
      expect(history[0].annualIncome).toBe(500_000);
      expect(history[0].calculatedTax).toBe(27_500);
    });

    it('prepends (newest first)', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(300_000));
      s.dispatch(calculateTax());
      s.dispatch(saveCalculation());
      s.dispatch(setAnnualIncome(500_000));
      s.dispatch(calculateTax());
      s.dispatch(saveCalculation());

      const history = s.getState().tax.history;
      expect(history).toHaveLength(2);
      expect(history[0].annualIncome).toBe(500_000); // newest first
      expect(history[1].annualIncome).toBe(300_000);
    });
  });

  describe('deleteHistoryItem', () => {
    it('removes item by id', () => {
      const s = createZeroDeductionStore();
      s.dispatch(setAnnualIncome(500_000));
      s.dispatch(calculateTax());
      s.dispatch(saveCalculation());

      const id = s.getState().tax.history[0].id;
      s.dispatch(deleteHistoryItem(id));

      expect(s.getState().tax.history).toHaveLength(0);
    });
  });

  describe('clearHistory', () => {
    it('clears all history', () => {
      store.dispatch(setAnnualIncome(500_000));
      store.dispatch(calculateTax());
      store.dispatch(saveCalculation());
      store.dispatch(clearHistory());

      expect(store.getState().tax.history).toHaveLength(0);
    });
  });
});
