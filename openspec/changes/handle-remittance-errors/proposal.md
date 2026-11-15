# Proposal

## Why

A remittance that the engine rejects disappears without a trace. `tradeSlice.ts` wraps four call sites in error handling that only writes to the console: three `catch { /* skip invalid remittances */ }` blocks during gain recomputation (lines 118, 138, 145) and the `addRemittance` reducer's `catch (e) { console.error('Failed to add remittance:', e); }` (line 230). `dividendSlice.ts` has the same defect for dividend remittances (line 102).

The user sees the remittance form close as if the record were saved, and nothing is recorded. Under Thai law a capital gain is taxable only when remitted, so the dropped remittance is not a cosmetic loss — it removes taxable income from the year's total and the app reports a confidently wrong number. This is the exact mechanism that hid ฿4,409.51 of taxable gain until the `MONEY_TOLERANCE_USD` fix, and the tolerance fix only closed one cause of rejection; every other cause is still silent.

## What Changes

- A rejected remittance is never silent. The user is shown a translated message naming the trade and the reason the engine gave, and the remittance is not stored.
- `addRemittance` no longer swallows the engine error: the dispatch either applies the remittance or leaves state untouched **and** reports the rejection to the caller so the form can stay open with the entered values.
- Gain recomputation after a trade is added, edited, or deleted no longer drops a stored remittance that has become unapplicable. The affected trade and remittance are reported as unresolved in the tax-year view until the data is corrected, so the year total cannot quietly shrink.
- A single pure engine validator for capital-gain remittances (mirroring `dividendEngine.validateRemittance`) becomes the one rule set used by the form pre-flight and the reducer, so the two cannot disagree and the money tolerance lives in one place.
- `RemitForm`'s amount guard stops re-deriving `amount > effectiveRemaining` and calls that validator instead. Today the form has no tolerance and the engine does, so a slip-exact figure such as 6,636.27 against a computed 6,636.2699… is refused by the form before the engine ever sees it.
- Dividend remittance rejection gets the same treatment, so both remittance paths behave identically.
- **No tax rule changes.** This change alters only what happens to a remittance that cannot be applied; the arithmetic for an applied one is untouched.

## Capabilities

### New Capabilities

- `remittance-integrity`: the invariant that a remittance is either applied and counted, or rejected and reported — never dropped in silence — covering both capital-gain and dividend remittances, the rule set that decides acceptance, and how an unapplicable stored remittance is surfaced.

### Modified Capabilities

None. No existing capability's requirements cover remittance rejection, so nothing needs to change in `trade-gross-amount`, `dividend-tax-calculation`, or the others.

## Impact

- `src/store/tradeSlice.ts` — the three recompute `catch` blocks and the `addRemittance` reducer.
- `src/store/dividendSlice.ts` — the `addDividendRemittance` reducer's `catch`.
- `src/engine/fifoEngine.ts` — new exported validator; `MONEY_TOLERANCE_USD` consumed through it.
- `src/engine/dividendEngine.ts` — `validateRemittance` reused rather than duplicated.
- `src/components/RemitForm.tsx`, `src/components/DividendRemitForm.tsx` — pre-flight uses the shared validator; submission surfaces rejection instead of closing.
- `src/components/Dashboard.tsx` — handlers propagate rejection; warning surfaced for unresolved stored remittances.
- `src/store/tradeSlice.spec.ts`, `src/engine/fifoEngine.spec.ts`, component specs — new coverage; there are currently no tests for any remittance reducer.
- `src/i18n/locales/{en,th}/remittance.json`, `dividend.json` — new rejection and unresolved messages.
- No storage-key, schema-shape, or migration change; existing localStorage data keeps loading.