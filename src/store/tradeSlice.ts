import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TradeTransaction, RealizedGainResult, FifoLot, TaxSummary, RemittanceRecord, LedgerError } from '../types/trade';
import { computeAllRealizedGains, computeTaxSummary, applyRemittance, applyReinvestedAmount, validateRemittance } from '../engine/fifoEngine';
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
  /**
   * Why the last ledger write was refused, for the user to see. Transient —
   * never persisted, cleared by the next successful write or on dismissal.
   */
  ledgerError: LedgerError | null;
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
      // A flagged record is not money that arrived, so it must not add a year
      // of its own; the Remittances tab lists it under every record it keeps.
      if (r.unapplied === true) continue;
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
    // Reinvested amounts and notes are user-recorded facts about the sale that
    // FIFO cannot derive, so they survive every recompute (design D2).
    const result = withReinvestedAmount(withNote({ ...fg }, old?.note), old?.reinvestedUSD);
    return replayRemittances(result, old?.remittances ?? []);
  });
}

/**
 * Rebuild a sale's remittance history in order. A record the sale can no
 * longer support is kept and flagged `unapplied` instead of being dropped, so
 * the user sees the conflict and the audit trail survives a shrinking trade
 * (spec: trade-import-safety). Each record is judged against the balance the
 * earlier applied records left, so one that still fits stays applied.
 */
function replayRemittances(
  gain: RealizedGainResult,
  records: RemittanceRecord[]
): RealizedGainResult {
  let result = gain;
  for (const record of records) {
    const applied = withoutUnappliedFlag(record);
    if (validateRemittance(result, applied).valid) {
      result = applyRemittance(result, applied);
    } else {
      result = { ...result, remittances: [...result.remittances, { ...applied, unapplied: true }] };
    }
  }
  return result;
}

/** A record that is applied again must not carry the stale flag. */
function withoutUnappliedFlag(record: RemittanceRecord): RemittanceRecord {
  if (record.unapplied === undefined) return record;
  const applied = { ...record };
  delete applied.unapplied;
  return applied;
}

/** Carry a user-written note across a recompute; FIFO cannot derive it. */
function withNote(gain: RealizedGainResult, note: string | undefined): RealizedGainResult {
  if (!note) return gain;
  return { ...gain, note };
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
  const oldGainMap = new Map<string, RealizedGainResult>();
  for (const g of existingGains) oldGainMap.set(g.sellTradeId, g);

  return freshGains.map(fg => {
    const old = oldGainMap.get(fg.sellTradeId);
    const records = fg.sellTradeId === sellTradeId ? newRemittances : old?.remittances ?? [];
    const result = withReinvestedAmount(withNote({ ...fg }, old?.note), old?.reinvestedUSD);
    return replayRemittances(result, records);
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
    ledgerError: null,
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

      const check = validateRemittance(state.gains[gainIndex], action.payload);
      if (!check.valid) {
        // Leave the ledger untouched and keep the reason for diagnostics; the
        // form shows the same message to the user before dispatching.
        console.error('Rejected remittance:', check.message);
        return;
      }

      state.gains[gainIndex] = applyRemittance(state.gains[gainIndex], action.payload);
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
    },

    setReinvestedAmount: (state, action: PayloadAction<{ sellTradeId: string; amountUSD: number }>) => {
      const gainIndex = state.gains.findIndex(g => g.sellTradeId === action.payload.sellTradeId);
      if (gainIndex === -1) return;

      try {
        state.gains[gainIndex] = applyReinvestedAmount(state.gains[gainIndex], action.payload.amountUSD);
        state.ledgerError = null;
        state.taxSummaries = recomputeSummaries(state.trades, state.gains);
        saveGains(state.gains);
      } catch {
        // The engine refused the amount (the balance moved under the dialog),
        // so nothing was written. Report it instead of closing silently.
        state.ledgerError = { code: 'reinvestedExceedsBalance' };
      }
    },

    clearLedgerError: (state) => {
      state.ledgerError = null;
    },

    setRemittanceDocRef: (state, action: PayloadAction<{ sellTradeId: string; remittanceId: string; docRef?: string }>) => {
      const gain = state.gains.find(g => g.sellTradeId === action.payload.sellTradeId);
      const remittance = gain?.remittances.find(r => r.id === action.payload.remittanceId);
      if (!gain || !remittance) return;

      if (action.payload.docRef) remittance.docRef = action.payload.docRef;
      else delete remittance.docRef;

      saveGains(state.gains);
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
      // Records belong to the sale, not to the list it arrived in: replaying the
      // existing gains keeps every remittance and reinvested amount for sales the
      // import still contains, and drops records only for sales that are gone.
      state.gains = recomputeGains(state.trades, state.gains);
      state.remainingLots = computeAllRealizedGains(state.trades).remainingLots;
      state.taxSummaries = recomputeSummaries(state.trades, state.gains);
      saveGains(state.gains);
      state.ledgerError = null;
    },

    clearAllTrades: (state) => {
      state.trades = [];
      saveTrades(state.trades);
      state.gains = [];
      state.remainingLots = [];
      state.taxSummaries = {};
      saveGains([]);
      state.ledgerError = null;
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
  setRemittanceDocRef,
  setReinvestedAmount,
  clearLedgerError,
  updateRemittance,
  deleteRemittance,
  importTrades,
  clearAllTrades,
  setSelectedTaxYear,
  setDisplayTaxYear,
} = tradeSlice.actions;

export default tradeSlice.reducer;
