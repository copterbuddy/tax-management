# Tasks

## 1. Dialog accepts any amount up to the balance it displays

- [ ] 1.1 In `MarkReinvestedDialog.tsx`, replace the `.max(row.availableBalanceUSD, …)` cap with a cent-grid comparison against the displayed `balance` — `min(0)` kept, plus `refine(toCents(value) <= balance)` carrying the existing `markReinvestedExceeds` message — and keep the input free of a native `max` attribute so jsdom submit does not short-circuit the translated error; verify `npm run lint` exits 0 and `npx jest MarkReinvestedDialog` still passes its six existing tests.
- [ ] 1.2 Add a `MarkReinvestedDialog` test with a row whose `availableBalanceUSD` is `0.30000000000000004`: submitting the prefilled `0.30` succeeds and calls `onSubmit` with `0.3`, and `0.31` is refused with the message containing `0.30`; verify `npx jest MarkReinvestedDialog` passes.
- [ ] 1.3 Add a second case asserting an amount exactly equal to a two-decimal balance (`146.43`) is accepted, and one just above (`146.44`) shows the balance as `146.43`; verify `npx jest MarkReinvestedDialog` passes and the group introduces no new console error.

## 2. A refused reinvested record is visible

- [ ] 2.1 Add `reinvestError: 'reinvestedExceedsBalance' | null` to `TradeState` and initialise it to `null` in `buildInitialState`; verify `npx tsc -p tsconfig.app.json --noEmit` reports no new error beyond the pre-existing ones and `npx jest tradeSlice` still passes.
- [ ] 2.2 Set `reinvestError` in the `catch` of `setReinvestedAmount` without touching `gains`, `remainingLots`, or `taxSummaries`, clear it to `null` on the success path, and add a `clearReinvestError` action; remove the `console.error`; verify `npx jest tradeSlice` passes.
- [ ] 2.3 Add slice tests asserting a dispatch that exceeds the limit leaves `gains`, `remainingProceedsUSD`, `outstandingRows`, and `taxSummaries` byte-identical (deep-equality against snapshots taken before the dispatch) while `reinvestError` reads `'reinvestedExceedsBalance'`, and that the next valid dispatch clears it to `null`; verify `npx jest tradeSlice` passes.
- [ ] 2.4 Add `reinvestError` and `onDismissReinvestError` to `TradesTabProps` and render a dismissible banner above the outstanding list whenever `reinvestError` is set, independent of whether rows exist, wired to `t('common:reinvestErrorExceedsBalance')` and a dismiss control labelled `t('common:dismiss')`; verify `npx tsc -p tsconfig.app.json --noEmit` reports no new error.
- [ ] 2.5 Add the `reinvestErrorExceedsBalance` and `dismiss` keys to both `en/common.json` and `th/common.json` (two-space indentation), and confirm no `t()` call introduced in 2.4 lacks a key in either file.
- [ ] 2.6 Pass `reinvestError` and a `clearReinvestError` dispatcher from `Dashboard.tsx` into `TradesTab` while keeping `handleSubmitReinvested` closing the dialog; verify `npx jest Dashboard TradesTab` passes.
- [ ] 2.7 Add component tests proving the banner appears in both languages, disappears on dismiss without changing any figure, and is absent after a successful record; verify `npx jest TradesTab Dashboard` passes.

## 3. Import preserves remittance and reinvested history

- [ ] 3.1 Change `importTrades` to call `recomputeGains(state.trades, state.gains)` and remove the comment rationalising the wipe; leave `clearAllTrades` untouched; verify `npx jest tradeSlice` passes.
- [ ] 3.2 Add slice tests: importing an identical list preserves every remittance and `reinvestedUSD` (counts, amounts, dates unchanged); importing a list missing one sale drops only that sale's records; a no-op import leaves each year's `taxSummaries` figure-for-figure unchanged; `clearAllTrades` still empties gains and summaries; verify `npx jest tradeSlice` passes.
- [ ] 3.3 Confirm the sale-year and remittance-year aggregates still reconcile after an identical import by asserting the card totals equal the provider totals in the same test; verify `npx jest tradeSlice` passes with no new console output.

## 4. Locale JSON formatting normalised

- [ ] 4.1 Re-indent the 14 drifted four-space lines in `src/i18n/locales/th/common.json` to two spaces, changing neither keys, values, nor order; verify `node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/th/common.json','utf8'))"` succeeds and a `git diff --ignore-all-space` for the file is empty.
- [ ] 4.2 Apply the same normalisation to the 14 drifted lines in `src/i18n/locales/en/common.json`; verify it parses and `git diff --ignore-all-space` for it is empty.
- [ ] 4.3 Verify en and th key sets are identical by comparing `Object.keys` recursively for both files and asserting equality, and run `npx jest` plus `npm run lint` for the whole suite as this group's final check.

## Workflow follow-up

- Archive `reinvested-proceeds` before this change, because `openspec/specs/reinvested-proceeds/spec.md` does not exist yet and this delta's ADDED requirements must merge on top of it.
- After archiving, run `openspec validate --strict` on this change.
- `npm run build` stays red for the pre-existing spec-types reason and is not part of this change.