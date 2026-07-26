// ─── Thai Personal Income Tax Calculator ──────────────────────────────────
// Progressive tax brackets per Thai Revenue Code (ประมวลรัษฎากร) 2024.
// Single filing only — Thailand does not use joint/separate household filing.

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { THAI_TAX } from '../constants';

// ─── Thai Tax Brackets (2024) ─────────────────────────────────────────────

interface TaxBracket {
  rate: number;
  threshold: number; // Upper bound of this bracket (บาท)
}

const THAI_BRACKETS: TaxBracket[] = [
  { rate: 0.00, threshold: 150_000 },   // 0 – 150,000: Exempt
  { rate: 0.05, threshold: 300_000 },   // 150,001 – 300,000: 5%
  { rate: 0.10, threshold: 500_000 },   // 300,001 – 500,000: 10%
  { rate: 0.15, threshold: 750_000 },   // 500,001 – 750,000: 15%
  { rate: 0.20, threshold: 1_000_000 }, // 750,001 – 1,000,000: 20%
  { rate: 0.25, threshold: 2_000_000 }, // 1,000,001 – 2,000,000: 25%
  { rate: 0.30, threshold: 5_000_000 }, // 2,000,001 – 5,000,000: 30%
  { rate: 0.35, threshold: Infinity },  // 5,000,001+: 35%
];

// ─── Calculation ───────────────────────────────────────────────────────────

/**
 * Calculate Thai progressive income tax.
 * @param taxableIncome — annual income minus deductions (บาท)
 * @returns tax amount in THB
 */
function calculateThaiTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousThreshold = 0;

  for (const bracket of THAI_BRACKETS) {
    if (taxableIncome > bracket.threshold) {
      tax += (bracket.threshold - previousThreshold) * bracket.rate;
      previousThreshold = bracket.threshold;
    } else {
      tax += (taxableIncome - previousThreshold) * bracket.rate;
      break;
    }
  }

  return Math.round(tax * 100) / 100;
}

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
