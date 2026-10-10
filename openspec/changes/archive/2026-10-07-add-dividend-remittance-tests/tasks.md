# Tasks

## 1. Test fixtures and harness
- [x] 1.1 Create a `makeDividend()` fixture factory in `src/engine/dividendEngine.spec.ts` with literal (non-generated) ids and overridable defaults — gross USD 1,000, wht 15%, net USD 850, dividend-date FX 30 — and verify the file loads by running `npx jest src/engine/dividendEngine.spec.ts` (expected: suite runs, no tests yet, no import error)
- [x] 1.2 Add a `beforeEach` that clears `localStorage` in `src/store/dividendSlice.spec.ts`, following the pattern in `src/store/taxSlice.spec.ts` — verify by running `npx jest src/store/dividendSlice.spec.ts` (expected: suite runs, no tests yet)

## 2. Engine tests — THB snapshot and WHT credit
- [x] 2.1 Test `calculateDividendTHB` — gross/wht/net THB at the dividend-date rate, plus the 0% WHT boundary — and verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: those cases pass)
- [x] 2.2 Test `calculateWhtCredit` — proportional credit for a partial remit (USD 500 of net USD 850 at FX 31 → ฿2,735.29 via `toBeCloseTo(x, 2)`), the completing remit (USD 350 at FX 32 → ฿1,976.47), full-remit equals whole withheld amount, 0% WHT yields 0, and 0 remitted yields 0 — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: all cases pass)
- [x] 2.3 Add the **differential-FX invariant test**: two dividend records identical except for `dividendFxRate` must yield WHT credit based only on `remitFxRate` — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: passes)

## 3. Engine tests — remittance validation and application
- [x] 3.1 Test `validateRemittance` — rejects 0, rejects negative, rejects an amount above `remainingToRemitUSD` with the remaining balance named in the message, accepts the exact remaining balance — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: all cases pass)
- [x] 3.2 Test `applyDividendRemittance` — appends the remittance, updates `totalRemittedUSD` and `remainingToRemitUSD`, does not mutate the input record, and throws on an over-balance amount — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: all cases pass)
- [x] 3.3 Test the two-step partial flow end to end through the engine — USD 500 then USD 350 of net USD 850 leaves remaining USD 0 and credits totalling ฿4,711.76 — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: passes)

## 4. Engine tests — summary, symbols, years
- [x] 4.1 Test `computeDividendSummary` — single-year full remittance; partial remittance split across 2026/2027 attributed per year; a dividend with no remittance in the selected year excluded; proportional gross/WHT attribution for the split case (2026 = 58.82%) — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: all cases pass)
- [x] 4.2 Add a comment on the summary tests asserting **current** behaviour for `totalUnremittedUSD` (sums all records, not year-scoped) and `recordCount`/`remittedCount`, explicitly noting these are known year-scoping issues deferred out of this change — verify the comment is present and the tests pin the current output
- [x] 4.3 Test `getAvailableSymbols` (unique BUY symbols sorted, SELL excluded) and `getDividendYears` (remittance years descending, dividend-date year included for unremitted records, unparseable dates skipped) — verify with `npx jest src/engine/dividendEngine.spec.ts` (expected: all cases pass)

## 5. Fix the reportable-income FX source
- [x] 5.1 Change `src/components/DividendRemitForm.tsx:48` so `reportableIncomeTHB` derives from `remitFxRate` (equivalently, reuse the existing `remitTHB`), never `dividend.dividendFxRate` — verify `npm run lint` is clean and grep the file to confirm no remaining `dividendFxRate` reference in the remittance path
- [x] 5.2 Add a slice-level test that dispatches a remittance carrying `reportableIncomeTHB === remitTHB === amountUSD × remitFxRate` while `dividendFxRate` differs, and assert the stored value is unchanged by the dividend-date rate — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: passes)

## 6. Slice tests — CRUD and persistence
- [x] 6.1 Test `addDividend`, `updateDividend`, `deleteDividend` — state and `availableYears` update, deleted record gone, and each persists to `localStorage` under the dividend storage key — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: all cases pass)
- [x] 6.2 Test `addDividendRemittance` — totals recomputed, `displayYear` repointed when the current year disappears, and an over-balance remittance leaves state unchanged (the reducer catches the thrown error) — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: all cases pass)
- [x] 6.3 Test `removeDividendRemittance` — totals recomputed from the remaining remittances only, and the record's balance is restored — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: all cases pass)
- [x] 6.4 Test `setDividendDisplayYear`, `importDividends`, `clearAllDividends` — year selection, wholesale replacement, and wipe-to-empty with storage cleared — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: all cases pass)

## 7. Full-suite verification
- [x] 7.1 Run `npm test` and verify the whole suite is green with the two new spec files included and the pre-existing 116 tests still passing — expected: 0 failed suites, test count strictly greater than 116
- [x] 7.2 Run `npm run lint` and verify 0 errors — expected: clean
- [x] 7.3 Confirm `npm run build` fails only with the pre-existing jest-types error in `tsconfig.app.json` and that no new error mentions the dividend spec files — verify by reading the full build output, not just the exit code

## 8. Follow-up change (agreed 2026-10-05, not started)
- [x] 8.1 Open a separate OpenSpec change to repair stored dividend remittances where `reportableIncomeTHB !== remitTHB`, copying `remitTHB` (always correct) over the wrong field — this is recorded as agreed scope, deliberately not actioned by this change (change `repair-dividend-remittance-data` created 2026-10-07, verified, archived at `openspec/changes/archive/2026-10-07-repair-dividend-remittance-data`)