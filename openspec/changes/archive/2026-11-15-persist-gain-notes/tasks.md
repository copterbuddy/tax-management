# Tasks

## 1. Data model and persistence

- [x] 1.1 Add `note?: string` to `RealizedGainResult` in `src/types/trade.ts`, beside `reinvestedUSD`, commented as a user-written explanation that never feeds a computation.
- [x] 1.2 Declare `note: z.string().optional()` in `realizedGainSchema` (`src/validation/schemas.ts`). No `max()`: `loadGains` validates the array as one unit and its fallback is an empty list, so a rejected note would discard every gain.
- [x] 1.3 Add a schemas test that a gains array carrying a Thai note round-trips through `gainsArraySchema.parse` with the note intact, and one proving a gain without a note stays without one (no empty-string default).

## 2. Preservation across recompute and import

- [x] 2.1 In `recomputeGains` (`src/store/tradeSlice.ts`), merge the note from the existing gain keyed by `sellTradeId`, next to `reinvestedUSD`. Use a conditional spread so `exactOptionalPropertyTypes` is satisfied and an absent note stays absent.
- [x] 2.2 Apply the same merge in `recomputeGainsWithModifiedRemittances`, which serves `updateRemittance`, `deleteRemittance`, and the edited sale itself.
- [x] 2.3 Add slice tests: editing an unrelated trade keeps the note; adding, editing and deleting a remittance keeps it; importing the identical list keeps it; deleting the sale (or importing a list without it) removes it and leaves no note on any other gain.
- [x] 2.4 Add a slice test that the 2026 `taxSummaries` are identical before and after attaching a note, so the field cannot leak into a figure.

## 3. Housekeeping

- [x] 3.1 Re-indent the comment block above the schema in `src/components/MarkReinvestedDialog.tsx` (currently 4 spaces where the file uses 2). No code change; verify the file's diff is whitespace-only on those lines.

## 4. Verification

- [x] 4.1 Run `npm test` and `npm run lint`; both must pass. `npm run build` stays red for the pre-existing spec-types reason and is not part of this change.
- [x] 4.2 Confirm the note from `data_test/tax_tracker_gains.json` survives a real load → save → load through the store (a throwaway test is acceptable, deleted afterwards), and that the 2026 figures remain ฿10,958.25 taxable / $15,881.86 remitted / $0.00 outstanding.
- [x] 4.3 Run `openspec validate persist-gain-notes --strict`, then archive the change so `gain-notes` lands in `openspec/specs/`.