# Design

## Context

`TaxSummary` already carries the capital-gain figures for the selected year (`taxableGainTHB`, `totalRemittedUSD`, `totalRemittanceCount`). Dividends are summarised separately by `computeDividendSummary(records, year)`, which returns `totalGrossEquivalentTHB` and `totalWhtCreditTHB`. Neither knows about the other, and the Dashboard already holds both.

## Decisions

### D1 — Figures are built in the engine, not in the component

`buildFilingFigures(gainSummary, dividendSummary)` returns a plain object of THB amounts and the total. The sheet renders it. This keeps the arithmetic testable without rendering and leaves the component with one job.

### D2 — The sheet reads the tax year the user has selected

The year comes from `selectedTaxYear`, and the dividend summary is computed for that same year with `computeDividendSummary`. A year selector inside the sheet would create a second source of truth for "which year am I filing"; the header already states it.

### D3 — Issues are codes resolved to text in the view

`findFilingIssues(gains, year)` returns codes (`noData`, `unapplied`) with a count. The component maps them through `t()`, so language switching works and the engine stays free of i18n.

### D4 — CSV is text built in the engine

`buildFilingCsv(year, figures)` produces the file content: a header row, one row per figure, tab-separated? No — commas, with the figures quoted, and a UTF-8 BOM prefix so Excel opens Thai labels correctly. Building the string in a pure function makes the export testable without touching the DOM.

### D5 — Read-only, and no new storage

The sheet writes nothing. Nothing about it needs persisting, so there is no new key and no migration.

## Risks / Trade-offs

- **Two "years" still exist in the app** (tax year and dividend display year). The sheet takes the tax year for both, which is the filing year; the Dividend tab keeps its own filter. Stated in the subtitle so the mismatch is not silent.
- **The checklist is deliberately short.** Evidence and reconciliation checks arrive with their own features; inventing placeholder checks now would train the user to ignore the list.
