import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TradeTransaction, RealizedGainResult, FifoLot, TaxSummary, RemittanceRecord, ProviderType } from '../types/trade';
import { computeAllRealizedGains, computeTaxSummary, applyRemittance } from '../engine/fifoEngine';

const STORAGE_KEY = 'tax_tracker_trades';
const STORAGE_KEY_GAINS = 'tax_tracker_gains';

// ─── Migration ───────────────────────────────────────────────────────────

function migrateTrade(trade: TradeTransaction): TradeTransaction {
  const migrated = { ...trade };
  if (!migrated.provider) {
    migrated.provider = 'Dime' as ProviderType;
  }
  if ('assetType' in migrated) {
    delete (migrated as any).assetType;
  }
  // Strip fxRateTHB from old trades (now unused)
  if ('fxRateTHB' in migrated) {
    delete (migrated as any).fxRateTHB;
  }
  return migrated;
}

function filterCrypto(trades: TradeTransaction[]): TradeTransaction[] {
  return trades.filter(t => (t as any).assetType !== 'CRYPTO');
}

function loadTrades(): TradeTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return filterCrypto((JSON.parse(data) as TradeTransaction[]).map(migrateTrade));
    }
  } catch (e) { console.error('Failed to load trades:', e); }
  return [];
}

function loadGains(): RealizedGainResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_GAINS);
    if (data) return JSON.parse(data) as RealizedGainResult[];
  } catch (e) { console.error('Failed to load gains:', e); }
  return [];
}

function saveTrades(trades: TradeTransaction[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }
  catch (e) { console.error('Failed to save trades:', e); }
}

function saveGains(gains: RealizedGainResult[]): void {
  try { localStorage.setItem(STORAGE_KEY_GAINS, JSON.stringify(gains)); }
  catch (e) { console.error('Failed to save gains:', e); }
}

// ─── State ───────────────────────────────────────────────────────────────

export interface TradeState {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  remainingLots: FifoLot[];
  selectedTaxYear: number;
  taxSummaries: Record<number, TaxSummary>;
  displayTaxYear: number; // Which year's remittances to show
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function getAvailableYears(trades: TradeTransaction[], gains: RealizedGainResult[]): number[] {
  const years = new Set<number>();
  for (const t of trades) {
    const year = parseInt(t.date.substring(0, 4), 10);
    if (!isNaN(year)) years.add(year);
  }
  // Also include remittance years
  for (const g of gains) {
    for (const r of g.remittances) {
      const year = parseInt(r.remitDate.substring(0, 4), 10);
      if (!isNaN(year)) years.add(year);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

function recomputeGains(trades: TradeTransaction[], existingGains: RealizedGainResult[]): RealizedGainResult[] {
  const { gains: freshGains } = computeAllRealizedGains(trades);

  // Merge remittance history from existing gains
  const oldGainMap = new Map<string, RealizedGainResult>();
  for (const g of existingGains) oldGainMap.set(g.sellTradeId, g);

  return freshGains.map(fg => {
    const old = oldGainMap.get(fg.sellTradeId);
    if (old && old.remittances.length > 0) {
      // Re-apply remittances to the fresh gain result
      let result = { ...fg };
      for (const r of old.remittances) {
        try { result = applyRemittance(result, r); }
        catch { /* skip invalid remittances (e.g. trade was edited) */ }
      }
      return result;
    }
    return fg;
  });
}

function recomputeSummaries(
  trades: TradeTransaction[],
  gains: RealizedGainResult[],
): Record<number, TaxSummary> {
  const years = getAvailableYears(trades, gains);
  const summaries: Record<number, TaxSummary> = {};
  for (const year of years) {
    summaries[year] = computeTaxSummary(trades, year, gains);
  }
  return summaries;
}

function buildInitialState(): TradeState {
  const trades = loadTrades();
  const existingGains = loadGains();
  const gains = recomputeGains(trades, existingGains);
  const remainingLots = computeAllRealizedGains(trades).remainingLots;
  const years = getAvailableYears(trades, gains);
  const currentYear = new Date().getFullYear();
  const selectedTaxYear = years.includes(currentYear) ? currentYear : (years[0] || currentYear);

  return {
    trades,
    gains,
    remainingLots,
    selectedTaxYear, // For trade table filtering (sell year)
    displayTaxYear: selectedTaxYear,
    taxSummaries: recomputeSummaries(trades, gains),
  };
}

// ─── Slice ───────────────────────────────────────────────────────────────

const initialState: TradeState = buildInitialState();

export const tradeSlice = createSlice({
  name: 'trade',
  initialState,
  reducers: {
    addTrade: (state, action: PayloadAction<TradeTransaction>) => {
      state.trades.push(action.payload);
      saveTrades(state.trades);
      state.gains = recomputeGains(state.trades, state.gains);
      state.remainingLots = computeAllRealizedGains(state.trades).remainingLots;
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    updateTrade: (state, action: PayloadAction<TradeTransaction>) => {
      const index = state.trades.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.trades[index] = action.payload;
        saveTrades(state.trades);
        state.gains = recomputeGains(state.trades, state.gains);
        state.remainingLots = computeAllRealizedGains(state.trades).remainingLots;
        state.taxSummaries = recomputeSummaries(state.trades, state.gains);
        saveGains(state.gains);
      }
    },

    deleteTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(t => t.id !== action.payload);
      saveTrades(state.trades);
      state.gains = recomputeGains(state.trades, state.gains);
      state.remainingLots = computeAllRealizedGains(state.trades).remainingLots;
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    addRemittance: (state, action: PayloadAction<RemittanceRecord>) => {
      const gainIndex = state.gains.findIndex(g => g.sellTradeId === action.payload.sellTradeId);
      if (gainIndex === -1) return;

      try {
        state.gains[gainIndex] = applyRemittance(state.gains[gainIndex], action.payload);
        state.taxSummaries = recomputeSummaries(state.trades, state.gains);
        saveGains(state.gains);
      } catch (e) {
        console.error('Failed to add remittance:', e);
      }
    },

    importTrades: (state, action: PayloadAction<TradeTransaction[]>) => {
      state.trades = action.payload;
      saveTrades(state.trades);
      state.gains = recomputeGains(state.trades, []);
      state.remainingLots = computeAllRealizedGains(state.trades).remainingLots;
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    clearAllTrades: (state) => {
      state.trades = [];
      saveTrades(state.trades);
      state.gains = [];
      state.remainingLots = [];
      state.taxSummaries = {};
      saveGains([]);
    },

    setSelectedTaxYear: (state, action: PayloadAction<number>) => {
      state.selectedTaxYear = action.payload;
    },

    setDisplayTaxYear: (state, action: PayloadAction<number>) => {
      state.displayTaxYear = action.payload;
    },
  },
});

export const {
  addTrade,
  updateTrade,
  deleteTrade,
  addRemittance,
  importTrades,
  clearAllTrades,
  setSelectedTaxYear,
  setDisplayTaxYear,
} = tradeSlice.actions;

export default tradeSlice.reducer;
