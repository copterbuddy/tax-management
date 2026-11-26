# dividend-tracker Specification

## Purpose

Manages foreign dividend records and their remittance tracking on the Dividends tab: recording dividends against symbols held in BUY trades, applying country default withholding rates with user override, preventing edits or deletions once remitted, and managing dividend remittance history.

## Requirements

### Requirement: DividendTab displays KPI summary, year filter, and expandable remittance history

When dividend records exist, `DividendTab` SHALL display a dividend-year selector, the six dividend KPI cards, and the dividend list (table on desktop, cards on mobile) with expandable remittance history per record and document-attachment actions on each remittance. When no dividend records exist, it SHALL render an empty state with an action to add a dividend.

#### Scenario: Empty state shown when no dividend records exist

- **WHEN** the dividend record list is empty
- **THEN** `DividendTab` renders the empty-state prompt and an add-dividend button

#### Scenario: Expanding a record reveals its remittance history

- **WHEN** the user expands a dividend record that has recorded remittances
- **THEN** the remittance rows for that dividend are displayed with remittance date, USD amount, remittance FX rate, reportable THB, WHT credit THB, document link action, and delete action

### Requirement: DividendForm links to BUY symbols and applies country default WHT

`DividendForm` SHALL let the user select a stock symbol from symbols present in `BUY` trades (`getAvailableSymbols`), select a country (`US`, `UK`, `SG`, `OTHER`), auto-fill the default WHT rate from `COUNTRY_WHT_INFO` (`US` 15%, `UK` 0%, `SG` 0%, `OTHER` 0%) while allowing overrides from 0 to 100%, and compute immutable THB snapshots (`grossAmountTHB`, `whtAmountTHB`, `netAmountTHB`) at `dividendFxRate`.

#### Scenario: Selecting a country sets its default WHT rate and allows override

- **WHEN** the user selects `US` in `DividendForm`
- **THEN** `whtRate` defaults to `15`
- **AND** the user can override it to `30` when no W-8BEN applies

#### Scenario: Saving computes THB snapshots from dividend-date FX

- **WHEN** a dividend of `grossAmountUSD: 100`, `whtRate: 15`, `dividendFxRate: 34` is saved
- **THEN** `whtAmountUSD` is `15`, `netAmountUSD` is `85`, `grossAmountTHB` is `3400`, `whtAmountTHB` is `510`, and `netAmountTHB` is `2890`

### Requirement: Remittance status reflects remaining balance and allows partial remittances

Each dividend record SHALL track `totalRemittedUSD` and `remainingToRemitUSD` so the UI displays remitted, partially remitted, or unremitted status and allows recording multiple partial remittances until `remainingToRemitUSD` reaches zero.

#### Scenario: Partial remittance updates status and remaining balance

- **WHEN** a dividend with `netAmountUSD: 85` has a remittance of `50` recorded
- **THEN** `totalRemittedUSD` becomes `50`, `remainingToRemitUSD` becomes `35`, and the record status is partial

### Requirement: Dividends with recorded remittances cannot be edited or deleted directly

Attempting to edit or delete a dividend record that already has one or more remittances (`remittances.length > 0`) SHALL be blocked with an alert instructing the user to remove the remittances first. Deleting a remittance SHALL restore `remainingToRemitUSD` and allow editing or deleting the dividend once no remittances remain.

#### Scenario: Edit and delete are blocked while remittances exist

- **WHEN** the user clicks edit or delete on a dividend record with `remittances.length > 0`
- **THEN** an alert is shown and the edit form or delete confirmation dialog does not open

#### Scenario: Deleting the last remittance unblocks the dividend

- **WHEN** all remittances on a dividend record are deleted
- **THEN** `remainingToRemitUSD` returns to `netAmountUSD`
- **AND** the dividend record can be edited or deleted
