# Proposal

## Why

`data_test/tax_tracker_gains.json` carries a `note` on the 7-share ALLW sale explaining that its 204.75 proceeds were spent on 0.5 SPGI rather than remitted. `realizedGainSchema` does not declare `note`, and zod strips undeclared keys, so the note is deleted the moment gains are loaded — and the next `saveGains` writes it out of existence. This is the same silent-loss class the reinvested-proceeds work removed for every other record: the numbers are re-derivable from trades, the user's reason for them is not.

## What Changes

- `RealizedGainResult` gains an optional `note?: string`; `realizedGainSchema` declares it so a load → save cycle no longer destroys it.
- Both recompute paths carry the note forward for a sale that still exists, keyed by `sellTradeId`, exactly as they already carry `remittances` and `reinvestedUSD`. Fresh FIFO cannot invent a note, so losing it on every edit would make the field useless.
- A note disappears only with its sale, because a gain with no sale cannot be matched to anything.
- No UI change: the field is entered through the data import path today, and a note editor is a separate concern.
- Housekeeping in the same change: the mis-indented comment block in `MarkReinvestedDialog` is re-indented. No behaviour changes.

## Capabilities

### New Capabilities

- `gain-notes`: an optional free-text note attached to a realized gain, how it survives load, save, recompute and import, and the guarantee that it never influences a tax figure.

### Modified Capabilities

None. No existing capability states anything about a gain's descriptive fields.

## Impact

- `src/types/trade.ts` — `RealizedGainResult.note?: string`.
- `src/validation/schemas.ts` — `realizedGainSchema.note`.
- `src/store/tradeSlice.ts` — `recomputeGains` and `recomputeGainsWithModifiedRemittances` merge the note from the existing gain.
- `src/components/MarkReinvestedDialog.tsx` — comment indentation only.
- Tests: `src/validation/schemas.spec.ts`, `src/store/tradeSlice.spec.ts`.
- No storage-key change, no migration: records without a note parse exactly as before.