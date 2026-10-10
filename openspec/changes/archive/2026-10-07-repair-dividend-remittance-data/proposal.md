# repair-dividend-remittance-data

## Why
The dividend module has a bug where `reportableIncomeTHB` is computed using `dividend.dividendFxRate` (FX rate on dividend receipt date) instead of `remitFxRate` (FX rate on remittance date). This creates incorrect taxable income figures that are persisted to localStorage, causing discrepancies in tax reporting.

## What Changes
- **Repair stored dividend remittances** where `reportableIncomeTHB !== remitTHB` by copying the correct value (`remitTHB`) over the wrong field.
- This is a **data migration** that rewrites stored tax figures to match the correct calculation: `reportableIncomeTHB = remitTHB = amountUSD × remitFxRate`.
- No changes to engine logic, tests, or UI - this is purely a data migration.

## Decisions
- **Defer data migration** to a separate change after testing is complete (per Decision 4 in design.md).
- **Copy operation only** - no recomputation, since `remitTHB` was always calculated correctly.
- **No schema changes** - this is a data-only migration.

## Impact
- Fixes historical tax reporting errors for remittances that were saved with incorrect `reportableIncomeTHB`.
- Does not affect future entries (those will use the correct formula after the fix).
- Does not change any code paths, only rewrites existing stored values.

## Migration Plan
1. Create a new OpenSpec change with proper proposal and tasks
2. The change will be implemented after the current change's tests are verified
3. The repair will copy `remitTHB` to `reportableIncomeTHB` for affected records only
4. No data migration for records that are already correct

## Open Questions
- None. The scope is clearly defined in Decision 4 of the design.md.