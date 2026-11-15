import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TradeTransaction, RealizedGainResult, FifoLot, TaxSummary, RemittanceRecord } from '../types/trade';
import { computeAllRealizedGains, computeTaxSummary, applyRemittance, applyReinvestedAmount } from '../engine/fifoEngine';
import { STORAGE_KEYS } from '../constants';
import { tradeArraySchema, gainsArraySchema, safeParse } from '../validation/schemas';

// ─── Migration ───────────────────────────────────────────────────────────

function migrateTrade(trade: TradeTransaction): TradeTransaction {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrated: any = { ...trade };
  if (!migrated.provider) {
    migrated.provider = 'Dime';
  }
  if ('assetType' in migrated) {
    delete migrated.assetType;
  }
  if ('fxRateTHB' in migrated) {
    delete migrated.fxRateTHB;
  }
  // Set defaults for new fee fields (old trades without these fields)
  if (migrated.exchangeFeeUSD === undefined) {
    migrated.exchangeFeeUSD = 0;
  }
  if (migrated.tafFeeUSD === undefined) {
    migrated.tafFeeUSD = 0;
  }
  if (migrated.commissionRebateUSD === undefined) {
    migrated.commissionRebateUSD = 0;
  }
  if (migrated.vatUSD === undefined) {
    migrated.vatUSD = 0;
  }
  return migrated as TradeTransaction;
}

function filterCrypto(trades: TradeTransaction[]): TradeTransaction[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return trades.filter(t => (t as any).assetType !== 'CRYPTO');
}

// ─── Persistence ──────────────────────────────────────────────────────────

function loadTrades(): TradeTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRADES);
    if (data) {
      const parsed = JSON.parse(data);
      const validated = safeParse(tradeArraySchema, parsed, [] as TradeTransaction[]);
      return filterCrypto(validated.map(t => migrateTrade(t as TradeTransaction)));
    }
  } catch (e) { console.error('Failed to load trades:', e); }
  return [];
}

function loadGains(): RealizedGainResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GAINS);
    if (data) {
      const parsed = JSON.parse(data);
      return safeParse(gainsArraySchema, parsed, [] as RealizedGainResult[]);
    }
  } catch (e) { console.error('Failed to load gains:', e); }
  return [];
}

function saveTrades(trades: TradeTransaction[]): void {
  try { localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades)); }
  catch (e) { console.error('Failed to save trades:', e); }
}

function saveGains(gains: RealizedGainResult[]): void {
  try { localStorage.setItem(STORAGE_KEYS.GAINS, JSON.stringify(gains)); }
  catch (e) { console.error('Failed to save gains:', e); }
}

// ─── State ───────────────────────────────────────────────────────────────

export interface TradeState {
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  remainingLots: FifoLot[];
  selectedTaxYear: number;
  taxSummaries: Record<number, TaxSummary>;
  displayTaxYear: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function getAvailableYears(trades: TradeTransaction[], gains: RealizedGainResult[]): number[] {
  const years = new Set<number>();
  for (const t of trades) {
    const year = parseInt(t.date.substring(0, 4), 10);
    if (!isNaN(year)) years.add(year);
  }
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

  const oldGainMap = new Map<string, RealizedGainResult>();
  for (const g of existingGains) oldGainMap.set(g.sellTradeId, g);

  return freshGains.map(fg => {
    const old = oldGainMap.get(fg.sellTradeId);
    // A reinvested amount is a user-recorded fact about the sale that FIFO
    // cannot derive, so it survives every recompute (design D5).
    let result = withReinvestedAmount({ ...fg }, old?.reinvestedUSD);
    for (const r of old?.remittances ?? []) {
      try { result = applyRemittance(result, r); }
      catch { /* skip invalid remittances */ }
    }
    return result;
  });
}

/**
 * Re-apply a previously recorded reinvested amount. A stale amount that no
 * longer fits the sale is dropped rather than allowed to throw here.
 */
function withReinvestedAmount(
  gain: RealizedGainResult,
  reinvestedUSD: number | undefined
): RealizedGainResult {
  if (reinvestedUSD === undefined || reinvestedUSD <= 0) return gain;
  try { return applyReinvestedAmount(gain, reinvestedUSD); }
  catch { return gain; }
}

function recomputeGainsWithModifiedRemittances(
  trades: TradeTransaction[],
  existingGains: RealizedGainResult[],
  sellTradeId: string,
  newRemittances: RemittanceRecord[]
): RealizedGainResult[] {
  const { gains: freshGains } = computeAllRealizedGains(trades);
  return freshGains.map(fg => {
    if (fg.sellTradeId === sellTradeId) {
      let result = withReinvestedAmount({ ...fg }, existingGains.find(g => g.sellTradeId === sellTradeId)?.reinvestedUSD);
      for (const r of newRemittances) {
        try { result = applyRemittance(result, r); }
        catch { /* skip invalid remittances */ }
      }
      return result;
    }
    const otherGain = existingGains.find(g => g.sellTradeId === fg.sellTradeId);
    let result = withReinvestedAmount({ ...fg }, otherGain?.reinvestedUSD);
    for (const r of otherGain?.remittances ?? []) {
      try { result = applyRemittance(result, r); }
      catch { /* skip invalid remittances */ }
    }
    return result;
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
    selectedTaxYear,
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

    setReinvestedAmount: (state, action: PayloadAction<{ sellTradeId: string; amountUSD: number }>) => {
      const gainIndex = state.gains.findIndex(g => g.sellTradeId === action.payload.sellTradeId);
      if (gainIndex === -1) return;

      try {
        state.gains[gainIndex] = applyReinvestedAmount(state.gains[gainIndex], action.payload.amountUSD);
        state.taxSummaries = recomputeSummaries(state.trades, state.gains);
        saveGains(state.gains);
      } catch (e) {
        console.error('Failed to record reinvested amount:', e);
      }
    },

    updateRemittance: (state, action: PayloadAction<RemittanceRecord>) => {
      const gain = state.gains.find(g =>
        g.remittances.some(r => r.id === action.payload.id)
      );
      if (!gain) return;

      const updatedRemittances = gain.remittances.map(r =>
        r.id === action.payload.id ? action.payload : r
      );

      state.gains = recomputeGainsWithModifiedRemittances(
        state.trades, state.gains, gain.sellTradeId, updatedRemittances
      );
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    deleteRemittance: (state, action: PayloadAction<{ id: string; sellTradeId: string }>) => {
      const gain = state.gains.find(g => g.sellTradeId === action.payload.sellTradeId);
      if (!gain) return;

      const filteredRemittances = gain.remittances.filter(r => r.id !== action.payload.id);

      state.gains = recomputeGainsWithModifiedRemittances(
        state.trades, state.gains, gain.sellTradeId, filteredRemittances
      );
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    importTrades: (state, action: PayloadAction<TradeTransaction[]>) => {
      state.trades = action.payload;
      saveTrades(state.trades);
      // Import replaces the gains wholesale, so no reinvested amount survives:
      // an imported trade list carries no such record, and inventing one would
      // attach a user decision to a sale the user just replaced.
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
  setReinvestedAmount,
  updateRemittance,
  deleteRemittance,
  importTrades,
  clearAllTrades,
  setSelectedTaxYear,
  setDisplayTaxYear,
} = tradeSlice.actions;

export default tradeSlice.reducer;
