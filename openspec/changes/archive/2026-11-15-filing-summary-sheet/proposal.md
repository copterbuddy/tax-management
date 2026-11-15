# Proposal

## Why

Year-end filing means reading two tabs and adding them by hand: the dividend figures live in the Dividend tab, the capital-gain assessable figure in the Trades tab, and nothing states whether the year is even ready to file. Every hand addition is a chance to copy the wrong number — the gross/net dividend mix-up showed how easily that happens.

## What Changes

- One action in the header, `สรุปเพื่อยื่น {year}`, opens a single sheet holding the year's filing figures: dividend gross and its withholding credit, capital-gain assessable income, and the total assessable income.
- The same sheet lists what blocks filing — no remittance recorded for the year, or remittances flagged unresolved — and says so plainly when nothing blocks it.
- A single **Download CSV** action exports those figures (UTF-8 with BOM so Excel reads Thai correctly).
- The sheet is read-only: it changes no record and no total.

## Capabilities

### New Capabilities

- `filing-summary`: the year-end view — which figures it reports, how it decides the year is ready, and what the exported file contains.

## Impact

- `src/engine/filingSummary.ts` (new) — pure builders for the figures, the blocking issues, and the CSV text.
- `src/components/FilingSummarySheet.tsx` (new) — the sheet; presentational, props in, callbacks out.
- `src/components/Dashboard.tsx` — one header button, one piece of open/closed state, and the dividend summary for the selected tax year.
- `src/i18n/locales/{en,th}/common.json` — sheet labels, issue messages, and the export action.
- Tests: `filingSummary.spec.ts`, `FilingSummarySheet.spec.tsx`, plus a Dashboard case for opening it.
