# Tasks

## 1. Engine

- [x] 1.1 Add `src/engine/filingSummary.ts` with `buildFilingFigures(gainSummary, dividendSummary)`, `findFilingIssues(gains, year)`, and `buildFilingCsv(year, figures)`.
- [x] 1.2 Unit tests: figures sum gross dividend + credit + capital gain; a year with no remittances yields `noData`; a flagged remittance yields `unapplied` with a count; the CSV starts with a BOM, has a header row and one row per figure, and quotes labels containing commas.

## 2. Sheet

- [x] 2.1 Add `src/components/FilingSummarySheet.tsx`: header with the year, three figure rows, the issue list (or a ready line), and two actions (Download CSV, Close). Props only; no store access.
- [x] 2.2 Component tests: figures render; an issue renders in Thai and English; clicking Download calls the export callback; Close calls the close callback.
- [x] 2.3 Add a `สรุปเพื่อยื่น {year}` button to the Dashboard header and the sheet's open state; wire the dividend summary for the selected tax year and the CSV download (Blob + object URL, revoked after click).

## 3. i18n

- [x] 3.1 Add the sheet's keys to both locales: title, subtitle, three figure labels, the credit line, both issue messages, the ready line, and the export/close actions.

## 4. Verification

- [x] 4.1 `npm test` and `npm run lint` pass; `npm run build` stays red for the pre-existing reason.
- [x] 4.2 In the browser with `data_test`: the sheet shows ฿15.94 dividend, ฿2.39 credit, ฿10,958.25 gain, total ฿10,974.19; a year with no data shows the no-data issue; the CSV downloads and opens with readable Thai.
- [x] 4.3 `openspec validate filing-summary-sheet --strict`, then archive.
