// ─── Dividend Slice ──────────────────────────────────────────────────────────
// Redux Toolkit slice for dividend CRUD + remittance + localStorage persistence.
// Separate from trade/gains — stored under its own localStorage key.

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DividendRecord, DividendRemittance } from '../types/trade';
import {
  applyDividendRemittance,
  computeDividendSummary,
  getDividendYears,
} from '../engine/dividendEngine';
import { STORAGE_KEYS_DIVIDEND } from '../constants';
import { dividendArraySchema, safeParse } from '../validation/schemas';

// ─── Persistence ──────────────────────────────────────────────────────────

function loadDividends(): DividendRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS);
    if (data) {
      const parsed = JSON.parse(data);
      return safeParse(dividendArraySchema, parsed, [] as DividendRecord[]);
    }
  } catch (e) { console.error('Failed to load dividends:', e); }
  return [];
}

function saveDividends(dividends: DividendRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS_DIVIDEND.DIVIDENDS, JSON.stringify(dividends));
  } catch (e) { console.error('Failed to save dividends:', e); }
}

// ─── State ──────────────────────────────────────────────────────────────────

export interface DividendState {
  records: DividendRecord[];
  displayYear: number;
  availableYears: number[];
}

function buildInitialState(): DividendState {
  const records = loadDividends();
  const availableYears = getDividendYears(records);
  const currentYear = new Date().getFullYear();
  const displayYear = availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear);

  return {
    records,
    displayYear,
    availableYears,
  };
}

const initialState: DividendState = buildInitialState();

// ─── Slice ──────────────────────────────────────────────────────────────────

export const dividendSlice = createSlice({
  name: 'dividend',
  initialState,
  reducers: {
    addDividend: (state, action: PayloadAction<DividendRecord>) => {
      state.records.push(action.payload);
      state.availableYears = getDividendYears(state.records);
      if (!state.availableYears.includes(state.displayYear)) {
        state.displayYear = state.availableYears[0] || new Date().getFullYear();
      }
      saveDividends(state.records);
    },

    updateDividend: (state, action: PayloadAction<DividendRecord>) => {
      const index = state.records.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.records[index] = action.payload;
        state.availableYears = getDividendYears(state.records);
        saveDividends(state.records);
      }
    },

    deleteDividend: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(r => r.id !== action.payload);
      state.availableYears = getDividendYears(state.records);
      if (state.availableYears.length > 0 && !state.availableYears.includes(state.displayYear)) {
        state.displayYear = state.availableYears[0];
      }
      saveDividends(state.records);
    },

    addDividendRemittance: (state, action: PayloadAction<DividendRemittance>) => {
      const index = state.records.findIndex(r => r.id === action.payload.dividendId);
      if (index === -1) return;

      try {
        state.records[index] = applyDividendRemittance(state.records[index], action.payload);
        state.availableYears = getDividendYears(state.records);
        if (!state.availableYears.includes(state.displayYear)) {
          state.displayYear = state.availableYears[0] || new Date().getFullYear();
        }
        saveDividends(state.records);
      } catch (e) {
        console.error('Failed to add dividend remittance:', e);
      }
    },

    removeDividendRemittance: (
      state,
      action: PayloadAction<{ dividendId: string; remittanceId: string }>,
    ) => {
      const index = state.records.findIndex(r => r.id === action.payload.dividendId);
      if (index === -1) return;

      const record = state.records[index];
      const filteredRemits = record.remittances.filter(r => r.id !== action.payload.remittanceId);
      const totalRemittedUSD = filteredRemits.reduce((sum, r) => sum + r.amountUSD, 0);

      state.records[index] = {
        ...record,
        totalRemittedUSD,
        remainingToRemitUSD: record.netAmountUSD - totalRemittedUSD,
        remittances: filteredRemits,
      };
      state.availableYears = getDividendYears(state.records);
      saveDividends(state.records);
    },

    repairRemittanceData: (state) => {
      let repaired = false;
      state.records.forEach((record) => {
        record.remittances.forEach((remit) => {
          if (remit.reportableIncomeTHB !== remit.remitTHB) {
            remit.reportableIncomeTHB = remit.remitTHB;
            repaired = true;
          }
        });
      });
      if (repaired) saveDividends(state.records);
    },

    setDividendDisplayYear: (state, action: PayloadAction<number>) => {
      state.displayYear = action.payload;
    },

    importDividends: (state, action: PayloadAction<DividendRecord[]>) => {
      state.records = action.payload;
      state.availableYears = getDividendYears(state.records);
      if (state.availableYears.length > 0 && !state.availableYears.includes(state.displayYear)) {
        state.displayYear = state.availableYears[0];
      }
      saveDividends(state.records);
    },

    clearAllDividends: (state) => {
      state.records = [];
      state.availableYears = [];
      state.displayYear = new Date().getFullYear();
      saveDividends([]);
    },
  },
});

export const {
  addDividend,
  updateDividend,
  deleteDividend,
  addDividendRemittance,
  removeDividendRemittance,
  setDividendDisplayYear,
  importDividends,
  clearAllDividends,
  repairRemittanceData,
} = dividendSlice.actions;

export default dividendSlice.reducer;