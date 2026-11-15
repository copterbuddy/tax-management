// ─── Filing locks ─────────────────────────────────────────────────────────
// A frozen snapshot of the figures that were filed for a tax year, so a later
// edit cannot silently rewrite a declaration. Advisory: it never blocks edits.

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { FilingFigures } from '../engine/filingSummary';
import { STORAGE_KEYS_YEAR_LOCKS } from '../constants';

export interface YearLock {
  lockedAt: string;
  figures: FilingFigures;
}

export interface FilingState {
  locks: Record<number, YearLock>;
}

function loadLocks(): Record<number, YearLock> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_YEAR_LOCKS.LOCKS);
    return raw ? (JSON.parse(raw) as Record<number, YearLock>) : {};
  } catch {
    return {};
  }
}

function saveLocks(locks: Record<number, YearLock>): void {
  try {
    localStorage.setItem(STORAGE_KEYS_YEAR_LOCKS.LOCKS, JSON.stringify(locks));
  } catch {
    /* storage full or unavailable — the lock stays in memory for this session */
  }
}

const initialState: FilingState = { locks: loadLocks() };

export const filingSlice = createSlice({
  name: 'filing',
  initialState,
  reducers: {
    lockYear: (state, action: PayloadAction<{ year: number; figures: FilingFigures }>) => {
      state.locks[action.payload.year] = {
        lockedAt: new Date().toISOString(),
        figures: action.payload.figures,
      };
      saveLocks(state.locks);
    },
    unlockYear: (state, action: PayloadAction<number>) => {
      delete state.locks[action.payload];
      saveLocks(state.locks);
    },
  },
});

export const { lockYear, unlockYear } = filingSlice.actions;
export default filingSlice.reducer;
