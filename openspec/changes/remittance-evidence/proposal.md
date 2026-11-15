# Proposal

## Why

A remittance is the moment tax becomes due, so it is also the moment an auditor will ask for evidence: the bank slip, the broker confirmation, the WHT certificate. Those documents exist today only as folders in OneDrive and screenshots on a phone — nothing in the app connects a recorded remittance to its proof, so reconstructing the paper trail means re-reading dates and amounts by hand.

## What Changes

- A remittance — capital gain or dividend — accepts an optional **document link** (http/https URL).
- The link survives a load and save cycle, an import, and every recompute, exactly like the other recorded facts on a remittance.
- Each remittance row gains one affordance: a paperclip that opens a small dialog to paste, change or remove the link, and that opens the document in a new tab when one is attached. The icon states whether evidence exists.
- A link that is not an http/https URL is refused before it is stored.

## Capabilities

### New Capabilities

- `remittance-evidence`: what a document link is attached to, how it survives storage and import, how the row exposes it, and what it refuses to store.

## Impact

- `src/types/trade.ts` — `RemittanceRecord.docRef?` and `DividendRemittance.docRef?`.
- `src/validation/schemas.ts` — both remittance schemas declare and validate the field.
- `src/store/tradeSlice.ts` / `dividendSlice.ts` — one action each to set or clear the link on a record.
- `src/components/DocRefDialog.tsx` (new), `RemittanceLog.tsx`, `DividendTab.tsx` — the affordance and the dialog.
- `src/i18n/locales/{en,th}/remittance.json` — dialog labels and the attached/empty states.
- Tests: schema round-trip, both store actions, dialog validation, and row rendering with and without a link.
