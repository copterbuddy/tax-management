# Tasks

## 1. Shared brackets

- [x] 1.1 Create `src/engine/taxBrackets.ts` with `THAI_BRACKETS` and `calculateThaiTax`, moved verbatim from `taxSlice`.
- [x] 1.2 Point `taxSlice` at the module and delete its private copy; existing slice tests must pass unchanged.
- [x] 1.3 Tests at each boundary: 0, 150,000, 300,000, 500,000, 750,000, 1,000,000, 2,000,000, 5,000,000 and above.

## 2. Estimate

- [x] 2.1 `src/engine/taxEstimate.ts`: `estimateThaiTax({ assessableTHB, otherIncomeTHB, deductionsTHB, creditTHB })` returning net income, tax, credit, payable or overpaid, and the marginal rate.
- [x] 2.2 Tests: deductions below income; deductions above income (net floors at 0); credit above tax (reports overpaid); marginal rate at each band edge.

## 3. Section

- [x] 3.1 `FilingSummarySheet`: a collapsed "ประมาณการภาษี" section with the two inputs and four result lines, computed on change.
- [x] 3.2 i18n keys in both languages, including the hint that only dividend withholding is counted.
- [x] 3.3 Component tests: collapsed by default; entering 500,000 of other income raises the tax; a credit larger than the tax shows the overpaid line.

## 4. Verification

- [x] 4.1 `npm test`, `npm run lint` pass.
- [x] 4.2 Browser: open the sheet, expand the estimate, enter 300,000 other income and 60,000 deductions, confirm the bracket result by hand.
- [x] 4.3 `openspec validate tax-estimate --strict`, then archive.
