import { STORAGE_KEYS_YEAR_LOCKS } from '../constants';
import type { FilingFigures } from '../engine/filingSummary';
import reducer, { lockYear, unlockYear } from './filingSlice';

const figures: FilingFigures = {
  year: 2026,
  dividendGrossTHB: 15.9397,
  dividendCreditTHB: 2.3909,
  capitalGainTHB: 10958.25,
  totalAssessableTHB: 10974.19,
  remittedUSD: 15881.86,
};

const stored = (): Record<string, { lockedAt: string; figures: FilingFigures }> =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS_YEAR_LOCKS.LOCKS) ?? '{}');

beforeEach(() => {
  localStorage.clear();
});

describe('filingSlice', () => {
  it('locks a year with its figures and a timestamp', () => {
    const state = reducer(undefined, lockYear({ year: 2026, figures }));

    expect(state.locks[2026].figures).toEqual(figures);
    expect(state.locks[2026].lockedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stored()['2026'].figures.capitalGainTHB).toBeCloseTo(10958.25, 2);
  });

  it('keeps the latest snapshot when locking twice', () => {
    let state = reducer(undefined, lockYear({ year: 2026, figures }));
    state = reducer(state, lockYear({ year: 2026, figures: { ...figures, capitalGainTHB: 11000 } }));

    expect(state.locks[2026].figures.capitalGainTHB).toBe(11000);
    expect(Object.keys(state.locks)).toEqual(['2026']);
  });

  it('drops the snapshot on unlock', () => {
    let state = reducer(undefined, lockYear({ year: 2026, figures }));
    state = reducer(state, unlockYear(2026));

    expect(state.locks[2026]).toBeUndefined();
    expect(stored()).toEqual({});
  });

  it('reads the snapshot back on a fresh start', () => {
    reducer(undefined, lockYear({ year: 2026, figures }));

    jest.isolateModules(() => {
      const fresh = require('./filingSlice') as typeof import('./filingSlice');
      const state = fresh.default(undefined, { type: '@@INIT' });
      expect(state.locks[2026].figures.totalAssessableTHB).toBeCloseTo(10974.19, 2);
    });
  });
});
