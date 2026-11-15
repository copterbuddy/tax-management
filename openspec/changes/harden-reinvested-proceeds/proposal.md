# Proposal

## Why

The `reinvested-proceeds` change (commit `10f3f4d`) made offshore-reinvested proceeds stop reading as unreturned cash, but review of that commit found four defects. Two of them defeat the feature the user actually touches: the mark-reinvested dialog can refuse the very amount it prefilled (float cents), and a rejected record closes the dialog with no visible message, so the user cannot tell whether the amount was saved. A third silently discards every remittance and reinvested record if the trade list is ever imported, and a fourth left the locale files with mixed indentation.

All four are small, local, and provably wrong today. Fixing them now, while the feature is fresh and its tests are green, is cheaper than discovering them through user data later.

## What Changes

- **Cent-exact validation in the mark-reinvested dialog.** The balance is rounded to whole cents for display and prefilling, but validated against the raw float. When the raw balance carries binary noise (`0.30000000000000004`), the prefilled `0.30` exceeds it and submission is refused with a number the user never typed. Both sides of the comparison become whole cents, so the prefilled amount always validates and one cent above it still fails.
- **A failed reinvested record becomes visible.** `setReinvestedAmount` currently swallows the engine's exception with `console.error`, so a rejected amount closes the dialog and does nothing. The slice gains a transient `reinvestError` slot, set on failure without touching gains, cleared by the next successful record or by an explicit dismiss, and the Trades tab renders it as a dismissible banner above the outstanding list.
- **Import preserves remittance and reinvested history.** `importTrades` calls `recomputeGains(state.trades, [])`, discarding every remittance and every recorded reinvested amount for sales that still exist in the imported list. It must pass the current gains instead, so only records belonging to vanished sales are dropped. `clearAllTrades` keeps wiping everything — that is its purpose.
- **Locale files return to a single indentation style.** The keys added by the last change are indented four spaces inside files that otherwise use two. Indentation is normalised in both languages; no key is renamed, reordered, or retranslated.
- No tax math, FIFO matching, dividend handling, or FX bounds change. `reinvestedUSD` stays optional, no storage key or schema version changes, and no user data is read, migrated, or backfilled.

## Capabilities

### New Capabilities

- `trade-import-safety`: what importing a trade list may and may not do to records that FIFO cannot derive — the remittances and reinvested amounts attached to sales. Owns the survival rule, the drop-only-vanished-sales rule, and the no-op-import identity so a future importer UI cannot silently destroy history.

### Modified Capabilities

- `reinvested-proceeds`: adds the requirement that the dialog accepts any amount up to the balance it displays, and the requirement that a refused record is surfaced to the user instead of vanishing. Existing requirements keep their text — the amount still may not exceed the balance, the summary still clamps per gain, and tax still ignores the field.

## Impact

- `src/components/MarkReinvestedDialog.tsx` — validation compares cents against the displayed balance.
- `src/store/tradeSlice.ts` — `reinvestError` in `TradeState`, set in the `setReinvestedAmount` catch, cleared on success; new `clearReinvestError` action; `importTrades` passes `state.gains` to `recomputeGains`.
- `src/components/Dashboard.tsx` — reads `reinvestError`, passes it and the dismiss handler down; the dialog still closes on submit.
- `src/components/TradesTab.tsx` — dismissible error banner above the outstanding list.
- `src/i18n/locales/{en,th}/common.json` — banner message + dismiss label (both languages), plus indentation normalisation.
- `src/engine/fifoEngine.ts` — unchanged behaviour; only the exception path is observed more closely.
- Tests: `MarkReinvestedDialog.spec.tsx`, `tradeSlice.spec.ts`, `Dashboard.spec.tsx`.

**Ordering note:** `openspec/changes/reinvested-proceeds/` is not archived yet, so `openspec/specs/reinvested-proceeds/spec.md` does not exist. This change's delta is written against the requirements that live in that change directory and merges cleanly only if `reinvested-proceeds` is archived first. Defect 4 is formatting only and deliberately carries no requirement: it changes no observable behaviour.