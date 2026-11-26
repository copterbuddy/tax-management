# Proposal

## Why

The application's purpose is to calculate **assessable income and withholding tax credit** to declare on a Thai personal income tax return (PND 90) — not to calculate the user's final progressive personal income tax liability. Including a progressive tax calculator (`tax-estimate` in the filing summary sheet plus unused `taxSlice` / `taxBrackets`) blurs the product boundary and implies tax-liability advice that is out of scope.

## What Changes

- **BREAKING**: Remove the "Tax estimate" (`ประมาณการภาษี`) collapsible section from `FilingSummarySheet`, along with its inputs (`otherIncome`, `deductions`), computed lines, styles, i18n keys, and component tests.
- Remove all progressive personal income tax calculation modules and state: `src/engine/taxEstimate.ts` (+ `.spec.ts`), `src/engine/taxBrackets.ts` (+ `.spec.ts`), `src/store/taxSlice.ts` (+ `.spec.ts`), `tax: taxReducer` from `src/store/index.ts`, and `THAI_TAX` constants from `src/constants.ts`.
- Retire the `tax-estimate` capability and update `engineering-standards` to remove `taxBrackets.ts` and `taxEstimate.ts` from the engine module list.
- Document in `openspec/config.yaml` under `Scope Boundaries` that progressive personal income tax calculation (brackets, deductions/allowances, net tax payable or refundable) is out of scope, and remove stale `taxSlice.ts` / `tax_tracker_calculations` references from `openspec/config.yaml`.

## Capabilities

### New Capabilities
<!-- None — this change removes an out-of-scope capability. -->

### Modified Capabilities
- `tax-estimate`: Retire all progressive tax estimate requirements from the filing summary sheet.
- `engineering-standards`: Remove `taxBrackets.ts` and `taxEstimate.ts` from the list of pure engine modules under `src/engine/`.

## Impact

- **UI**: `src/components/FilingSummarySheet.tsx`, `src/components/FilingSummarySheet.spec.tsx`, `src/index.css`, `src/i18n/locales/th/common.json`, `src/i18n/locales/en/common.json`
- **Engine & Store**: `src/engine/taxEstimate.ts`, `src/engine/taxEstimate.spec.ts`, `src/engine/taxBrackets.ts`, `src/engine/taxBrackets.spec.ts`, `src/store/taxSlice.ts`, `src/store/taxSlice.spec.ts`, `src/store/index.ts`, `src/constants.ts`
- **OpenSpec & Config**: `openspec/specs/tax-estimate/spec.md`, `openspec/specs/engineering-standards/spec.md`, `openspec/config.yaml`
- **Unaffected**: `fifoEngine.ts`, `dividendEngine.ts`, `filingSummary.ts`, `tradeSlice.ts`, `dividendSlice.ts`, `filingSlice.ts`, and the 4 assessable-income figures / CSV export / year-lock features in `FilingSummarySheet`.
