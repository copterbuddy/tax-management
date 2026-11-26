# remittance-log Specification

## Purpose

Defines the Remittances tab (`RemittanceLog.tsx`) and capital-gain remittance form (`RemitForm.tsx`): listing all capital-gain remittances by remittance year, computing THB values live, excluding unresolved records from totals, and supporting add, edit, and delete workflows.

## Requirements

### Requirement: RemittanceLog displays all capital-gain remittances filtered by remittance year

`RemittanceLog` SHALL flatten remittances across all `RealizedGainResult` entries, filter them by the selected `remitDate` year, sort them newest-first by `remitDate`, and display date, symbol, provider, USD amount, live-computed THB amount (`amountUSD * fxRateTHB`), FX rate, gain percentage, live-computed taxable THB (`amountUSD * gainPercent * fxRateTHB`), notes, document attachment action, and edit/delete actions.

#### Scenario: Remittances are filtered by remitDate year and sorted descending

- **WHEN** gains contain remittances dated `2025-12-01` and `2026-02-14` and the user selects `2026`
- **THEN** only the `2026-02-14` remittance appears in the table

### Requirement: THB remittance figures are derived live rather than stored

`RemittanceRecord` SHALL store USD amount, date, and `fxRateTHB` without persisting `amountTHB` or `taxableTHB`, so displayed THB amounts are always recomputed from the current gain percentage and FX rate.

#### Scenario: Live THB figures reflect current gainPercent and fxRateTHB

- **WHEN** a remittance of `$1,000` at `35.00` THB/USD belongs to a sale with `gainPercent = 0.5`
- **THEN** `RemittanceLog` displays `฿35,000.00` remitted and `฿17,500.00` taxable THB

### Requirement: Unapplied remittances appear in the log but are excluded from totals

Remittances flagged `unapplied: true` SHALL remain visible in `RemittanceLog` with an unresolved badge and reason, SHALL render `—` in the taxable column, and SHALL be excluded from the footer sums (`totalRemitted`, `totalRemittedTHB`, `totalTaxable`).

#### Scenario: Footer sums ignore unapplied rows

- **WHEN** the selected year has one applied remittance (`$100`, `฿3,500` THB, `฿1,750` taxable) and one `unapplied` remittance (`$50`)
- **THEN** both rows render in the table body
- **AND** the footer totals sum only the applied `$100` row

### Requirement: RemitForm previews THB impact and supports full-remaining shortcut

`RemitForm` SHALL list sales with positive `remainingProceedsUSD` (plus the target sale when editing an existing remittance), offer a shortcut button to fill `remainingProceedsUSD`, and display a live breakdown of remitted USD, gain portion USD, cost portion USD, and taxable THB whenever positive USD amount and FX rate are entered.

#### Scenario: Editing a remittance includes its parent sale and adds back its prior amount

- **WHEN** a fully remitted sale (`remainingProceedsUSD = 0`) has an existing remittance of `$500` opened for editing
- **THEN** that sale remains selectable in `RemitForm`
- **AND** the effective remaining limit allows up to `remainingProceedsUSD + 500`

### Requirement: Deleting a remittance recomputes gains and year summaries

Confirming deletion of a remittance in `Dashboard` SHALL dispatch `deleteRemittance`, which replays remaining remittances for that sale and recomputes `gains` and `taxSummaries`.

#### Scenario: Deleting a remittance restores remaining proceeds on the sale

- **WHEN** a user deletes one remittance from a sale
- **THEN** `remainingProceedsUSD` on that sale increases and the year's `TaxSummary` updates accordingly
