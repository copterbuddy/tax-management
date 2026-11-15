# Proposal

## Why

Figures filed with a return can change afterwards: a trade is corrected, a remittance is added, an import overwrites a record. Nothing in the app records what was actually filed, so a later edit silently rewrites the numbers the user already declared — and there is no way to answer "did this year change since I filed it?".

## What Changes

- The filing sheet can **lock** the selected year: the figures shown at that moment are stored with a timestamp.
- While a year is locked, the sheet shows the filed figures beside the current ones and names any field that has moved since.
- Unlocking removes the snapshot; nothing is deleted from the ledger.
- The snapshot lives in its own storage key, so it survives reloads and is independent of the gains/dividends records.

## Capabilities

### New Capabilities

- `filing-year-lock`: what a lock stores, how the sheet reports a difference between filed and current figures, and how a lock is removed.

## Impact

- `src/store/filingSlice.ts` (new) — `locks` state, `lockYear` / `unlockYear`, its own persistence key.
- `src/store/index.ts` — register the slice.
- `src/engine/filingSummary.ts` — `changedFilingFields` comparing two figure sets.
- `src/components/FilingSummarySheet.tsx` — locked state, the timestamp, the changed-field warning, lock/unlock actions.
- `src/i18n/locales/{en,th}/common.json` — the new labels.
