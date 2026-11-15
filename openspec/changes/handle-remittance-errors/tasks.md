# Tasks

## 1. One shared rule set in the engine

- [ ] 1.1 Extract the three rejection predicates currently inlined in `applyRemittance` (`src/engine/fifoEngine.ts` L215–245) into small named helpers that consume the existing private `MONEY_TOLERANCE_USD`, and add `export function validateRemittance(gain: RealizedGainResult, remittance: RemittanceRecord): ValidationResult` returning `{ valid: boolean; message?: string }` shaped like `dividendEngine.validateRemittance`. Re-express `applyRemittance` in terms of the same helpers so the tolerance constant is referenced in one place. Verify `src/engine/fifoEngine.spec.ts` still passes unchanged and that `validateRemittance` returns `valid: true` for an amount exactly equal to `remainingProceedsUSD`.
- [ ] 1.2 Add `validateRemittance` cases to `src/engine/fifoEngine.spec.ts`: amount zero and negative → invalid; amount = remaining + `0.004` → valid (inside tolerance); amount = remaining + `0.006` → invalid (outside); `sellTradeId` mismatch → invalid; and a case proving `valid: true` and `applyRemittance` succeeding agree for the same input. Verify the suite passes.

## 2. The storage path stops discarding remittances

- [ ] 2.1 Add `unapplied?: boolean` to `RemittanceRecord` in `src/types/trade.ts` **and** to `remittanceRecordSchema` in `src/validation/schemas.ts`. Verify with a new case in `src/validation/schemas.spec.ts` that a gains array containing a record with `unapplied: true` round-trips through `gainsArraySchema.parse` with the flag intact (zod strips unknown keys, so a missing schema entry would silently delete the flag on load).
- [ ] 2.2 Rewrite `recomputeGains` (`src/store/tradeSlice.ts` L108–124) so a remittance rejected by `validateRemittance` is retained in `resolved.remittances` with `unapplied: true` instead of being skipped by `catch`. Applied records must be marked `unapplied: false`/left undefined. Verify with a new case in `src/store/tradeSlice.spec.ts` under a fresh `describe('remittance integrity')`: add a BUY and a SELL, add a remittance that fits, then `updateTrade` the SELL so its proceeds drop below the remitted amount — assert the remittance is still present, carries `unapplied: true`, and is excluded from `totalRemittedUSD` and `taxSummaries[year]`.
- [ ] 2.3 Apply the same mark-and-retain logic to both branches of `recomputeGainsWithModifiedRemittances` (L126–152), which serve `updateRemittance` and `deleteRemittance`. Verify with slice cases: (a) `updateRemittance` raising an amount beyond the remaining proceeds leaves the record present and flagged, and (b) `deleteRemittance` on a flagged record removes it and clears the flag state.
- [ ] 2.4 Replace `addRemittance`'s `catch { console.error }` (L230) with an explicit `validateRemittance` check before `applyRemittance`; on rejection leave state untouched and log the reason. Verify with a slice case asserting a rejected `addRemittance` dispatch leaves `gains`, `taxSummaries` and the persisted `tax_tracker_gains` entry byte-identical.

## 3. The form pre-flights and stays open on rejection

- [ ] 3.1 In `src/components/RemitForm.tsx`, replace the `amount > effectiveRemaining` guard in `onFormSubmit` with a call to `validateRemittance(selectedGain, draft)`, mapping `(invalid, exceeds remaining)` onto the existing `remittance:remitExceeds` key and the remaining reasons onto new keys. Return without invoking `onSubmit` when invalid. Verify with a new `src/components/RemitForm.spec.tsx` (no spec exists for this component yet): an over-remaining submission renders the message, does not call the `onSubmit` prop, and leaves the entered amount in the input.
- [ ] 3.2 Add a `RemitForm.spec.tsx` case proving the tolerance agreement: with `remainingProceedsUSD = 6636.2699999999995`, submitting `6636.27` calls `onSubmit` (the form no longer refuses a slip-exact figure). Verify the case fails against the pre-change guard.
- [ ] 3.3 Make `Dashboard.handleAddRemittance` and `handleUpdateRemittance` report whether the dispatch applied, and have `RemitForm` close only on success instead of the current unconditional `setShowRemitForm(false)`. Add the new rejection messages to `src/i18n/locales/en/remittance.json` and `src/i18n/locales/th/remittance.json` (both locales, via `t('remittance:…')`, no hardcoded English). Verify with a `src/components/Dashboard.spec.tsx` case that the form stays mounted after a rejected submission and closes after an accepted one, and that `en` and `th` share the same key set.

## 4. Unresolved remittances are visible and excluded from totals

- [ ] 4.1 In `src/components/RemittanceLog.tsx`, keep `unapplied` records in `allRemittances` (so the user can see, edit or delete them) but exclude them from `totalRemitted`, `totalRemittedTHB` and `totalTaxable` in the footer, and render a marker plus the rejection reason on flagged rows. Add the marker and reason strings to `src/i18n/locales/en/remittance.json` and `src/i18n/locales/th/remittance.json`. Verify with a new `src/components/RemittanceLog.spec.tsx`: a gain whose remittance is flagged renders the marker and reason, and the footer total omits that amount while still counting the applied ones.
- [ ] 4.2 Keep the flagged record editable and deletable from the same row (the existing ✏️/🗑️ handlers must still receive it), and confirm `editRemit` on a flagged record lets the user reduce the amount until it re-applies. Verify with a `RemittanceLog.spec.tsx` case that the flagged row's edit handler fires with the record unchanged.

## 5. The dividend path behaves identically

- [ ] 5.1 In `src/store/dividendSlice.ts`, replace the `catch { console.error('Failed to add dividend remittance:', e) }` (L102–104) with a `validateRemittance` pre-check that reports the reason and leaves state untouched. Verify with a new case in `src/store/dividendSlice.spec.ts` asserting a rejected dividend remittance is not stored and the dividend's `totalRemittedUSD`/`remainingToRemitUSD` are unchanged.
- [ ] 5.2 Pre-flight the same check in `src/components/DividendRemitForm.tsx` so the form shows the reason and stays open, and make `Dashboard.handleAddDividendRemittance` close it only on success. Reuse the shared message keys where the reason matches. Verify with `src/components/DividendRemitForm.spec.tsx` that a rejected submission renders the message and does not call the submit prop.

## 6. Integration checks

- [ ] 6.1 Run `npm test` and confirm all suites pass, including the pre-existing `tradeSlice`, `fifoEngine`, `schemas` and `Dashboard` suites (no test elsewhere should observe a dropped remittance as expected behaviour).
- [ ] 6.2 Run `npm run lint` and confirm no new warnings. Do not attempt to fix the pre-existing `npm run build` failure (`tsconfig.app.json` missing jest types, `dividendSlice.ts` `TS6133`); record that the build was already red if it is reported.
- [ ] 6.3 Run `graphify update .` so `graphify-out/` reflects the new engine export and the changed slice functions.

## Workflow follow-up

- Archive the change once implementation and review are complete.