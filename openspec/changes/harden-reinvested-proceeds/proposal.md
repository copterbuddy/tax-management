# Proposal

## Why

The `reinvested-proceeds` change (commit `10f3f4d`) made offshore-reinvested proceeds stop reading as unreturned cash, but review of that commit found four defects. Two of them defeat the feature the user actually touches: the mark-reinvested dialog can refuse the very amount it prefilled (float cents), and a rejected record closes the dialog with no visible message, so the user cannot tell whether the amount was saved. A third silently discards every remittance and reinvested record if the trade list is ever imported, and a fourth left the locale files with mixed indentation.

The same review turned up a wider instance of the same defect in the remittance paths themselves. `tradeSlice` wraps four call sites in handlers that only write to the console — three `catch { /* skip invalid remittances */ }` blocks during gain recomputation (lines 118, 138, 145) and the `addRemittance` reducer's `catch (e) { console.error('Failed to add remittance:', e); }` (line 230) — and `dividendSlice.ts` repeats the pattern at line 102. The user sees the form close as if the record were saved, and nothing is stored. Under Thai law a capital gain is taxable only when remitted, so a dropped remittance is not a cosmetic loss: it removes taxable income from the year's total and the app reports a confidently wrong number. That is the exact mechanism that hid ฿4,409.51 of taxable gain until the `MONEY_TOLERANCE_USD` fix, and that fix closed only one cause of rejection.

Every item here is small, local, and provably wrong today. Fixing them now, while the feature is fresh and its tests are green, is cheaper than discovering them through user data later.

## What Changes

- **Cent-exact validation in the mark-reinvested dialog.** The balance is rounded to whole cents for display and prefilling, but validated against the raw float. When the raw balance carries binary noise (`0.30000000000000004`), the prefilled `0.30` exceeds it and submission is refused with a number the user never typed. Both sides of the comparison become whole cents, so the prefilled amount always validates and one cent above it still fails.
- **A refused record is reported, not thrown away.** `setReinvestedAmount` swallows the engine's exception with `console.error`, so a rejected amount closes the dialog and does nothing. The slice gains a transient `ledgerError` slot holding a code rather than a formatted message, set on failure without touching gains, cleared by the next successful record or by an explicit dismiss, and the Trades tab renders it as a dismissible banner above the outstanding list.
- **Import preserves remittance and reinvested history.** `importTrades` calls `recomputeGains(state.trades, [])`, discarding every remittance and every recorded reinvested amount for sales that still exist in the imported list. It must pass the current gains instead, so only records belonging to vanished sales are dropped. `clearAllTrades` keeps wiping everything — that is its purpose.
- **A record an import can no longer support is kept and flagged, never dropped.** Supplying the gains is necessary but not sufficient: `recomputeGains` re-attaches records inside `try`/`catch`, so an imported trade that shrinks a sale's proceeds below what was already remitted loses that remittance silently. Instead of refusing the import or discarding the record, an import retains every remittance for a sale it still contains and marks as unresolved (`unapplied`) the records the shrunken sale can no longer support, judged one record at a time in application order, excluding them from every tax-year total while they stay on screen for repair. That supersedes an earlier plan to refuse such an import whole: a refusal would block a legitimate edit and leave the user nothing to correct, whereas a flagged record is visible, editable, and already excluded from the tax figure.
- **A rejected remittance is never silent.** The three recompute handlers and the `addRemittance` reducer stop swallowing the engine's rejection. `addRemittance` reports the reason to its caller so the form can stay open with the entered values, and gain recomputation keeps a stored remittance that has become unapplicable as an unresolved record instead of dropping it, so the year total cannot quietly shrink.
- **One rule set for capital-gain remittances.** A pure `fifoEngine.validateRemittance(gain, remittance)` returning `{ valid, message }` — shaped like the existing `dividendEngine.validateRemittance` — becomes the single definition used by the form pre-flight, the reducer, and recomputation, so the money tolerance lives in one place. `RemitForm` stops re-deriving `amount > effectiveRemaining`; today it has no tolerance while the engine does, so a slip-exact `6,636.27` against a computed `6,636.2699…` is refused before the engine ever sees it.
- **Dividend remittances get the same treatment.** `dividendSlice.addDividendRemittance` and `DividendRemitForm` report a rejection and stay open, so both remittance paths behave identically.
- **Locale files return to a single indentation style.** The keys added by the last change are indented four spaces inside files that otherwise use two. Indentation is normalised in both languages; no key is renamed, reordered, or retranslated.
- No tax math, FIFO matching, dividend handling, or FX bounds change. `reinvestedUSD` and `unapplied` stay optional, no storage key or schema version changes, and no user data is read, migrated, or backfilled.

## Capabilities

### New Capabilities

- `trade-import-safety`: what importing a trade list may and may not do to records that FIFO cannot derive — the remittances and reinvested amounts attached to sales. Owns the survival rule, the drop-only-vanished-sales rule, the keep-and-flag rule for a record an import can no longer support, and the no-op-import identity so a future importer UI cannot silently destroy history.
- `remittance-integrity`: the invariant that a remittance is either applied and counted, or rejected and reported — never dropped in silence — covering both capital-gain and dividend remittances, the single rule set that decides acceptance, and how a stored remittance that has become unapplicable is surfaced, repaired, and excluded from totals.

### Modified Capabilities

- `reinvested-proceeds`: adds the requirement that the dialog accepts any amount up to the balance it displays, and the requirement that a refused record is surfaced to the user instead of vanishing. Both refine behaviour the capability already states; the amount still may not exceed the balance (there is one limit, not a second one), the summary still clamps per gain, and tax still ignores the field.

## Impact

- `src/components/MarkReinvestedDialog.tsx` — validation compares cents against the displayed balance.
- `src/store/tradeSlice.ts` — `ledgerError` in `TradeState`, set in the `setReinvestedAmount` catch, cleared on success, by `clearAllTrades`, and by a successful `importTrades`; new `clearLedgerError` action; `importTrades` passes `state.gains` to `recomputeGains`; the three recompute `catch` blocks and the `addRemittance` reducer stop discarding a rejected remittance.
- `src/store/dividendSlice.ts` — `addDividendRemittance` reports its rejection instead of logging it.
- `src/engine/fifoEngine.ts` — new exported `validateRemittance` shared by the form, the reducers, and recomputation; `applyRemittance` re-expressed on the same predicates so `MONEY_TOLERANCE_USD` is referenced once; `computeTaxSummary` filters `unapplied === true` records out of `yearRemittances` at the source so flagged amounts leave every year figure rather than only the row that displays them. No arithmetic change.
- `src/engine/dividendEngine.ts` — `validateRemittance` reused rather than duplicated.
- `src/types/trade.ts` — `RemittanceRecord.unapplied?: boolean`.
- `src/validation/schemas.ts` — `remittanceRecordSchema` gains `unapplied`, without which zod strips the flag on load and the record silently re-applies.
- `src/components/Dashboard.tsx` — reads `ledgerError`, passes it and the dismiss handler down; the reinvested dialog still closes on submit; the remittance handlers report whether the dispatch applied so the form closes only on success.
- `src/components/TradesTab.tsx` — dismissible error banner above the outstanding list, the only tab that renders it.
- `src/components/{RemitForm,DividendRemitForm}.tsx` — pre-flight through the shared validator and stay open on rejection.
- `src/components/RemittanceLog.tsx` — flagged rows render their reason and are excluded from the footer totals while staying editable and deletable.
- `src/i18n/locales/{en,th}/common.json` — the banner message and the dismiss label, plus indentation normalisation.
- `src/i18n/locales/{en,th}/remittance.json`, `dividend.json` — new rejection and unresolved strings.
- Tests: `MarkReinvestedDialog.spec.tsx`, `tradeSlice.spec.ts`, `fifoEngine.spec.ts`, `schemas.spec.ts`, `Dashboard.spec.tsx`, `TradesTab.spec.tsx`, `RemitForm.spec.tsx`, `RemittanceLog.spec.tsx`, `DividendRemitForm.spec.tsx`, `dividendSlice.spec.ts`.

**Spec-base prerequisite (must pass before this change is archived).** `reinvested-proceeds` is archived at `openspec/changes/archive/2026-11-15-reinvested-proceeds`, but archiving by itself does not write main specs. This change's delta is written against requirements that must exist in `openspec/specs/`, so verify the base first — `openspec/specs/reinvested-proceeds/spec.md` with 9 requirements and `openspec/specs/tax-year-summary/spec.md` with 6, plus the delta merged into `openspec/specs/dashboard-tab-layout/spec.md`. As of this revision that check passes; on any checkout where it does not, repair the base before archiving this change:

```bash
mv openspec/changes/archive/2026-11-15-reinvested-proceeds openspec/changes/reinvested-proceeds
openspec archive reinvested-proceeds --yes
openspec validate --all --strict
```

Archiving this change against a missing or partial base would create `openspec/specs/reinvested-proceeds/spec.md` from nothing but the two requirements added here, over a placeholder Purpose, and the parent's nine requirements would be lost. Defect 4 is formatting only and deliberately carries no requirement: it changes no observable behaviour.