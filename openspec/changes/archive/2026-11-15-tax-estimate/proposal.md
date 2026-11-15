# Proposal

## Why

The sheet reports the income that must be declared, but a return is filed against a whole life: salary, other income, allowances, and the credit already withheld. Today the app stops at "here is your income" — the user still has to open a calculator and a bracket table to answer "how much will I owe?".

## What Changes

- The filing sheet gains a collapsed **estimate** section: other assessable income and total deductions are the only inputs; everything else comes from the sheet.
- It reports net income after deductions, the tax from the progressive brackets, the dividend withholding credit already counted, and the amount still payable (or overpaid).
- The bracket table moves to one shared engine module so the estimate and the existing calculator cannot disagree.

## Capabilities

### New Capabilities

- `tax-estimate`: how the estimate is derived from the filed figures plus two inputs, which brackets apply, and what the section shows.

## Impact

- `src/engine/taxBrackets.ts` (new) — brackets and `calculateThaiTax`, moved out of the slice.
- `src/store/taxSlice.ts` — imports them instead of owning a private copy.
- `src/engine/taxEstimate.ts` (new) — `estimateThaiTax`.
- `src/components/FilingSummarySheet.tsx` — the collapsed section and its inputs.
- `src/i18n/locales/{en,th}/common.json` — labels.
- Tests: bracket boundaries, the estimate, and the section's rendering.
