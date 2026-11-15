# Proposal

## Why

Three defects in the dividend remittance path, found by reviewing the engine against the real 2026 book (SPGI: 0.49 gross, 15% WHT, 0.4165 net):

1. **The balance cannot be entered exactly.** `validateRemittance` rejects anything above `remainingToRemitUSD` with no tolerance. After a partial remittance the true remainder is a repeating decimal — for the SPGI dividend a 0.22 remittance leaves `0.19649999999999998` — so typing `0.1965`, or the `0.20` the rejection message itself quotes, is refused. Only the "remit all" button can finish the job. The capital-gain side already carries a half-cent tolerance; the dividend side never got one.
2. **The gross figure is never shown.** The summary reports the net-based reportable income (the spec requires exactly that), but a filer who declares dividends gross must add the withheld credit back by hand. For the same SPGI remittance the app shows ฿7.16 payable income while the gross slice is ฿8.42 — the difference is the credit, ฿1.26. A hand calculation at filing time is how values drift.
3. **An import erases remittance history.** `importDividends` replaces the record array wholesale. A dividends file that carries no `remittances` (the shape `data_test` had before this change) silently deletes every recorded remittance; the trades side was hardened against exactly this, the dividend side was not.

## What Changes

- Dividend remittances accept the balance they display: a shared half-cent tolerance, a rejection message that quotes the balance rounded to cents, and a remaining balance clamped at zero.
- The annual summary gains a gross-equivalent figure — reportable income plus the WHT credit, both already computed — so the tab can show "ยอดเต็ม" beside "รายได้ที่ต้องยื่น". No formula changes: reportable income and credit stay as the spec defines them.
- `importDividends` merges by record id and keeps every remittance the stored record already had, adding any the file brings and never dropping one for a record that still exists. Records absent from the import are dropped, as before.
- No change to the tax maths, the tax-year attribution, or the storage schema.

## Capabilities

### New Capabilities

- `dividend-import-safety`: what replacing the dividend list may do to the remittance history stored inside each record.

### Modified Capabilities

- `dividend-tax-calculation`: the balance rule gains a rounding tolerance and a message that matches it; the annual summary reports the gross equivalent of the remitted slice.

## Impact

- `src/constants.ts` — `MONEY_TOLERANCE_USD` moves here so both engines share one value.
- `src/engine/fifoEngine.ts` — imports the shared constant instead of defining it.
- `src/engine/dividendEngine.ts` — tolerance in `validateRemittance`, clamp in `applyDividendRemittance`, `totalGrossEquivalentTHB` in `computeDividendSummary`.
- `src/types/trade.ts` — `DividendSummary.totalGrossEquivalentTHB`.
- `src/store/dividendSlice.ts` — `importDividends` merges remittances by id.
- `src/components/DividendTab.tsx` and `{en,th}/dividend.json` — the gross figure beside the reportable one.
- Tests: `dividendEngine.spec.ts`, `dividendSlice.spec.ts`, `DividendTab.spec.tsx`.
- No storage-key, schema-shape, or migration change.