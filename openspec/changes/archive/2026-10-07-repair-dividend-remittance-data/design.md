# repair-dividend-remittance-data

## Context
After deploying the fix for the reportable-income FX bug (dividend.dividendFxRate → remitFxRate), we discovered that existing stored data with wrong `reportableIncomeTHB` values remains incorrect. The user decided on 2026-10-05 to do this as a separate follow-up change.

## What Changes
- **Repair stored dividend remittances** where `reportableIncomeTHB !== remitTHB` by copying the correct value (`remitTHB`) over the wrong field.
- No changes to engine logic, tests, or UI — this is purely a data migration.
- Creates a new OpenSpec change that can be run after the tests are verified.

## Decisions
- **Copy operation only** - no recomputation, since `remitTHB` was always calculated correctly.
- **No schema changes** - this is a data-only migration.
- **One-time migration** - repairs existing corrupted data but doesn't prevent future correct data.

## Files Created
- `src/store/repairRemittanceData.spec.ts` - tests for the repair function
- Updated `src/store/dividendSlice.ts` - added `repairRemittanceData` action

## Files Modified
- None - this is a data migration only, no source code changes except adding the repair action.

## Migration Plan
1. Create a new OpenSpec change with proper proposal and tasks
2. The change will be implemented after the current change's tests are verified
3. The repair will copy `remitTHB` to `reportableIncomeTHB` for affected records only
4. No data migration for records that are already correct

## Impact
- Fixes historical tax reporting errors for remittances that were saved with incorrect `reportableIncomeTHB`.
- Does not affect future entries (those will use the correct formula after the fix).
- Does not change any code paths, only rewrites existing stored values.

## Verification
- Test scan that finds mismatched records
- Repair function that copies correct values
- Verification that repair fixes all mismatches
- All existing tests still pass

## Risks / Trade-offs
- **None** - this is purely a data migration with no code changes.
- **Rollback** - straightforward: no changes to storage after repair.

## Open Questions
- None. The scope is clearly defined and limited to data migration.