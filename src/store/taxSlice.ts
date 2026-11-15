// ─── Thai Personal Income Tax Calculator ──────────────────────────────────
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { THAI_TAX } from '../constants';
import { calculateThaiTax } from '../engine/taxBrackets';

// ─── State ─────────────────────────────────────────────────────────────────

export interface TaxCalculation {
  id: string;
  timestamp: string;
  annualIncome: number;
  deductions: number;
  calculatedTax: number;
  effectiveTaxRate: number;
}

export interface TaxState {
  annualIncome: number;
  deductions: number;
  calculatedTax: number;
  effectiveTaxRate: number;
  history: TaxCalculation[];
}

const initialState: TaxState = {
  annualIncome: 0,
  deductions: THAI_TAX.DEFAULT_DEDUCTION,
  calculatedTax: 0,
  effectiveTaxRate: 0,
  history: [],
};

// ─── Slice ─────────────────────────────────────────────────────────────────

export const taxSlice = createSlice({
  name: 'tax',
  initialState,
  reducers: {
    setAnnualIncome: (state, action: PayloadAction<number>) => {
      state.annualIncome = Math.max(0, action.payload);
    },

    setDeductions: (state, action: PayloadAction<number>) => {
      state.deductions = Math.max(0, action.payload);
    },

    calculateTax: (state) => {
      const taxableIncome = Math.max(0, state.annualIncome - state.deductions);
      const calculated = calculateThaiTax(taxableIncome);
      state.calculatedTax = calculated;
      state.effectiveTaxRate = state.annualIncome > 0
        ? Math.round((calculated / state.annualIncome) * 10000) / 100
        : 0;
    },

    saveCalculation: (state) => {
      const calc: TaxCalculation = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        annualIncome: state.annualIncome,
        deductions: state.deductions,
        calculatedTax: state.calculatedTax,
        effectiveTaxRate: state.effectiveTaxRate,
      };
      state.history = [calc, ...state.history];
    },

    deleteHistoryItem: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },

    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const {
  setAnnualIncome,
  setDeductions,
  calculateTax,
  saveCalculation,
  deleteHistoryItem,
  clearHistory,
} = taxSlice.actions;

export default taxSlice.reducer;
