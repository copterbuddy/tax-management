# Tasks

## 1. Remove Tax Estimate UI, Styles, and i18n

- [x] 1.1 Remove `<details className="filing-estimate">`, `otherIncome`/`deductions`/`estimate`/`money`, and `estimateThaiTax`/`THAI_TAX` imports from `src/components/FilingSummarySheet.tsx`.
- [x] 1.2 Remove the `FilingSummarySheet — tax estimate` test block from `src/components/FilingSummarySheet.spec.tsx`.
- [x] 1.3 Remove `.filing-estimate` and `.estimate-*` rules from `src/index.css`.
- [x] 1.4 Remove `filingEstimate` and `estimate*` keys (`estimateOtherIncome`, `estimateDeductions`, `estimateNetIncome`, `estimateTax`, `estimateCredit`, `estimatePayable`, `estimateOverpaid`, `estimateMarginal`, `estimateHint`) from `src/i18n/locales/th/common.json` and `src/i18n/locales/en/common.json`.

## 2. Remove Tax Calculation Engine, Store, and Constants

- [x] 2.1 Delete `src/engine/taxEstimate.ts` and `src/engine/taxEstimate.spec.ts`.
- [x] 2.2 Delete `src/engine/taxBrackets.ts` and `src/engine/taxBrackets.spec.ts`.
- [x] 2.3 Delete `src/store/taxSlice.ts` and `src/store/taxSlice.spec.ts`, and remove `tax: taxReducer` from `src/store/index.ts`.
- [x] 2.4 Remove `THAI_TAX` from `src/constants.ts`.

## 3. Update Project Rules and Verify

- [x] 3.1 Update `openspec/config.yaml`: add progressive personal income tax calculation (tax brackets, deductions/allowances, net tax payable/refundable) to `Scope Boundaries` as out of scope, and remove stale `taxSlice.ts` / `tax_tracker_calculations` references.
- [ ] 3.2 Run `npm test` and `npm run lint` to confirm all remaining suites pass with zero lint errors.
- [x] 3.3 Run `openspec validate remove-tax-calculation --strict` before syncing/archiving.
