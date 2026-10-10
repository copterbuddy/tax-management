# Tasks

## 1. Identify affected records
- [x] 1.1 Write a scan script or test that reads `localStorage.getItem('tax_tracker_dividends')`, parses the JSON, and lists all records where any remittance has `reportableIncomeTHB !== remitTHB` — verify the scan runs without error — expected: list of affected dividend IDs and remittance counts
- [x] 1.2 Document the count of affected records and the total THB discrepancy — expected: documented in a short report (can be a comment in a test or a separate markdown file)

## 2. Repair stored remittances
- [x] 2.1 Implement a one-time migration script/function that copies `remitTHB` to `reportableIncomeTHB` for each remittance where they differ — verify the migration function exists and is importable — expected: function exports `repairRemittanceData` or similar
- [x] 2.2 Run the migration against the current localStorage data and verify no errors — expected: migration completes, 0 exceptions
- [x] 2.3 Verify the repair by re-scanning stored data — `reportableIncomeTHB === remitTHB` for all remittances — expected: 0 mismatches

## 3. Regression guard
- [x] 3.1 Add a slice-level test that dispatches `addDividendRemittance` with `remitTHB === amountUSD × remitFxRate` and asserts the stored `reportableIncomeTHB` is correct even when `dividendFxRate` differs — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: passes)
- [x] 3.2 Add a test that simulates loading old corrupted data (wrong `reportableIncomeTHB`) and asserts the repair function fixes it — verify with `npx jest src/store/dividendSlice.spec.ts` (expected: passes)

## 4. Full-suite verification
- [x] 4.1 Run `npm test` and verify the whole suite is green with the new repair tests included — expected: 0 failed suites, test count strictly greater than 164
- [x] 4.2 Run `npm run lint` and verify 0 errors — expected: clean
- [x] 4.3 Confirm `npm run build` fails only with the pre-existing jest-types error in `tsconfig.app.json` and that no new error mentions the repair spec files — verify by reading the full build output, not just the exit code

## 5. Archive this change
- [ ] 5.1 After verification, archive the change using `openspec archive` or mark as complete in the change file — expected: change marked complete