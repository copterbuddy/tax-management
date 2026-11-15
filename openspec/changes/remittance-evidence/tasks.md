# Tasks

## 1. Field and persistence

- [ ] 1.1 Add `docRef?: string` to `RemittanceRecord` and `DividendRemittance`, and declare it in both zod schemas with an http/https-only check.
- [ ] 1.2 Schema tests: a record with a valid link round-trips; `javascript:` and a bare path are rejected; a record without the field stays without it.

## 2. Store

- [ ] 2.1 `tradeSlice`: `setRemittanceDocRef({ id, sellTradeId, docRef })` sets or clears the link, persists gains, and leaves totals untouched.
- [ ] 2.2 `dividendSlice`: `setDividendRemittanceDocRef({ dividendId, remittanceId, docRef })`, same contract.
- [ ] 2.3 Store tests for both: setting a link changes no amount or total; clearing removes the field; an unknown id is a no-op.

## 3. UI

- [ ] 3.1 Add `src/components/DocRefDialog.tsx`: current value, save (validated), remove, cancel; reuses the modal styles.
- [ ] 3.2 In `RemittanceLog`, add one paperclip action per row: filled + opens the link when set, outlined + opens the dialog when empty; wire the store action.
- [ ] 3.3 In `DividendTab`'s remittance history rows, the same affordance and dialog.
- [ ] 3.4 i18n keys in both languages for the dialog and both states.

## 4. Verification

- [ ] 4.1 `npm test` and `npm run lint` pass; build stays red for the pre-existing reason.
- [ ] 4.2 Browser check: attach a link to the 07/04 remittance, reload, confirm it persists and opens; remove it and confirm the icon empties.
- [ ] 4.3 `openspec validate remittance-evidence --strict`, then archive.
