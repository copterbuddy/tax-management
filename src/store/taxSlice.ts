import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_household';

export interface TaxCalculation {
  id: string;
  timestamp: string;
  annualIncome: number;
  deductions: number;
  filingStatus: FilingStatus;
  calculatedTax: number;
  effectiveTaxRate: number;
}

export interface TaxState {
  annualIncome: number;
  deductions: number;
  filingStatus: FilingStatus;
  calculatedTax: number;
  effectiveTaxRate: number;
  history: TaxCalculation[];
}

const initialState: TaxState = {
  annualIncome: 75000,
  deductions: 13850, // Default 2023 single standard deduction
  filingStatus: 'single',
  calculatedTax: 0,
  effectiveTaxRate: 0,
  history: [],
};

// Simplified US Progressive Income Tax Bracket Calculation (2024 brackets for demo)
const calculateUSTax = (taxableIncome: number, status: FilingStatus): number => {
  if (taxableIncome <= 0) return 0;

  // Brackets configurations for different statuses
  const brackets: Record<FilingStatus, { rate: number; threshold: number }[]> = {
    single: [
      { rate: 0.10, threshold: 11600 },
      { rate: 0.12, threshold: 47150 },
      { rate: 0.22, threshold: 100525 },
      { rate: 0.24, threshold: 191950 },
      { rate: 0.32, threshold: 243725 },
      { rate: 0.35, threshold: 609350 },
      { rate: 0.37, threshold: Infinity },
    ],
    married_joint: [
      { rate: 0.10, threshold: 23200 },
      { rate: 0.12, threshold: 94300 },
      { rate: 0.22, threshold: 201050 },
      { rate: 0.24, threshold: 383900 },
      { rate: 0.32, threshold: 487450 },
      { rate: 0.35, threshold: 731200 },
      { rate: 0.37, threshold: Infinity },
    ],
    married_separate: [
      { rate: 0.10, threshold: 11600 },
      { rate: 0.12, threshold: 47150 },
      { rate: 0.22, threshold: 100525 },
      { rate: 0.24, threshold: 191950 },
      { rate: 0.32, threshold: 243725 },
      { rate: 0.35, threshold: 365600 },
      { rate: 0.37, threshold: Infinity },
    ],
    head_household: [
      { rate: 0.10, threshold: 16550 },
      { rate: 0.12, threshold: 63100 },
      { rate: 0.22, threshold: 100500 },
      { rate: 0.24, threshold: 191950 },
      { rate: 0.32, threshold: 243700 },
      { rate: 0.35, threshold: 609350 },
      { rate: 0.37, threshold: Infinity },
    ],
  };

  const activeBrackets = brackets[status];
  let tax = 0;
  let previousThreshold = 0;

  for (const bracket of activeBrackets) {
    if (taxableIncome > bracket.threshold) {
      tax += (bracket.threshold - previousThreshold) * bracket.rate;
      previousThreshold = bracket.threshold;
    } else {
      tax += (taxableIncome - previousThreshold) * bracket.rate;
      break;
    }
  }

  return Math.round(tax * 100) / 100;
};

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
    setFilingStatus: (state, action: PayloadAction<FilingStatus>) => {
      state.filingStatus = action.payload;
      // Automatically adjust standard deduction based on selected status (2024 rules)
      if (action.payload === 'single') state.deductions = 14600;
      else if (action.payload === 'married_joint') state.deductions = 29200;
      else if (action.payload === 'married_separate') state.deductions = 14600;
      else if (action.payload === 'head_household') state.deductions = 21900;
    },
    calculateTax: (state) => {
      const taxableIncome = Math.max(0, state.annualIncome - state.deductions);
      const calculated = calculateUSTax(taxableIncome, state.filingStatus);
      state.calculatedTax = calculated;
      state.effectiveTaxRate = state.annualIncome > 0 ? Math.round((calculated / state.annualIncome) * 10000) / 100 : 0;
    },
    saveCalculation: (state) => {
      const activeCalculation: TaxCalculation = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        annualIncome: state.annualIncome,
        deductions: state.deductions,
        filingStatus: state.filingStatus,
        calculatedTax: state.calculatedTax,
        effectiveTaxRate: state.effectiveTaxRate,
      };
      state.history = [activeCalculation, ...state.history];
    },
    deleteHistoryItem: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    clearHistory: (state) => {
      state.history = [];
    }
  },
});

export const {
  setAnnualIncome,
  setDeductions,
  setFilingStatus,
  calculateTax,
  saveCalculation,
  deleteHistoryItem,
  clearHistory,
} = taxSlice.actions;

export default taxSlice.reducer;
