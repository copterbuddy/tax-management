import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TradeTransaction, RealizedGainResult, FifoLot, TaxSummary, ProviderType } from '../types/trade';
import { computeAllRealizedGains, computeTaxSummary } from '../engine/fifoEngine';

const STORAGE_KEY = 'tax_tracker_trades';

export interface TradeState {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  remainingLots: FifoLot[];
  selectedTaxYear: number;
  taxSummaries: Record<number, TaxSummary>;
}

// SRP: Migration logic isolated from loading logic.
// When new required fields are added to TradeTransaction, add migration steps here.
function migrateTrade(trade: TradeTransaction): TradeTransaction {
  // Migrate: trades created before Provider feature → default to 'Dime'
  if (!trade.provider) {
    return { ...trade, provider: 'Dime' as ProviderType };
  }
  return trade;
}

function loadTrades(): TradeTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const raw = JSON.parse(data) as TradeTransaction[];
      return raw.map(migrateTrade);
    }
  } catch (e) {
    console.error('Failed to load trades from localStorage:', e);
  }
  return [];
}

function saveTrades(trades: TradeTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save trades to localStorage:', e);
  }
}

function getAvailableYears(trades: TradeTransaction[]): number[] {
  const years = new Set<number>();
  for (const t of trades) {
    const year = parseInt(t.date.substring(0, 4), 10);
    if (!isNaN(year)) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

function buildInitialState(): TradeState {
  const trades = loadTrades();
  const { gains, remainingLots } = computeAllRealizedGains(trades);
  const years = getAvailableYears(trades);
  const currentYear = new Date().getFullYear();
  const selectedTaxYear = years.includes(currentYear) ? currentYear : (years[0] || currentYear);

  const taxSummaries: Record<number, TaxSummary> = {};
  for (const year of years) {
    taxSummaries[year] = computeTaxSummary(trades, year);
  }

  return {
    trades,
    gains,
    remainingLots,
    selectedTaxYear,
    taxSummaries,
  };
}

function recomputeState(trades: TradeTransaction[], selectedYear?: number): Partial<TradeState> {
  const { gains, remainingLots } = computeAllRealizedGains(trades);
  const years = getAvailableYears(trades);

  let selectedTaxYear: number;
  if (selectedYear !== undefined && years.includes(selectedYear)) {
    selectedTaxYear = selectedYear;
  } else {
    const currentYear = new Date().getFullYear();
    selectedTaxYear = years.includes(currentYear) ? currentYear : (years[0] || currentYear);
  }

  const taxSummaries: Record<number, TaxSummary> = {};
  for (const year of years) {
    taxSummaries[year] = computeTaxSummary(trades, year);
  }

  return { gains, remainingLots, selectedTaxYear, taxSummaries };
}

const initialState: TradeState = buildInitialState();

export const tradeSlice = createSlice({
  name: 'trade',
  initialState,
  reducers: {
    addTrade: (state, action: PayloadAction<TradeTransaction>) => {
      state.trades.push(action.payload);
      saveTrades(state.trades);
      const recomputed = recomputeState(state.trades, state.selectedTaxYear);
      Object.assign(state, recomputed);
    },

    updateTrade: (state, action: PayloadAction<TradeTransaction>) => {
      const index = state.trades.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.trades[index] = action.payload;
        saveTrades(state.trades);
        const recomputed = recomputeState(state.trades, state.selectedTaxYear);
        Object.assign(state, recomputed);
      }
    },

    deleteTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(t => t.id !== action.payload);
      saveTrades(state.trades);
      const recomputed = recomputeState(state.trades, state.selectedTaxYear);
      Object.assign(state, recomputed);
    },

    importTrades: (state, action: PayloadAction<TradeTransaction[]>) => {
      state.trades = action.payload;
      saveTrades(state.trades);
      const recomputed = recomputeState(state.trades, state.selectedTaxYear);
      Object.assign(state, recomputed);
    },

    clearAllTrades: (state) => {
      state.trades = [];
      saveTrades(state.trades);
      const recomputed = recomputeState(state.trades, state.selectedTaxYear);
      Object.assign(state, recomputed);
    },

    setSelectedTaxYear: (state, action: PayloadAction<number>) => {
      state.selectedTaxYear = action.payload;
      const recomputed = recomputeState(state.trades, action.payload);
      Object.assign(state, recomputed);
    },
  },
});

export const {
  addTrade,
  updateTrade,
  deleteTrade,
  importTrades,
  clearAllTrades,
  setSelectedTaxYear,
} = tradeSlice.actions;

export default tradeSlice.reducer;