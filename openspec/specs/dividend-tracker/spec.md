# Spec: Dividend Tracking

## Capability

Foreign dividend tracking — recording dividend payments with WHT tracking, THB snapshot at dividend date FX, remittance-based income, and annual summary by remittance year.

Reference BA spec (preserved in docs/ archive): `docs/specs/dividend-tracker.md`

## ADDED Requirements

### Requirement: DividendTab renders with table, KPI, and year filter

- **Given** user has dividend records and opens the Dividend tab
- **When** Dashboard renders the tab between Trade Log and Remittance Log
- **Then** it shows KPI cards (total gross, WHT, remitted, reportable, credit, remaining), a year filter, and a table with columns: Date, Symbol, Country, Gross (USD), WHT%, WHT (USD), Net (USD), Remitted (USD), Remaining (USD), Reportable (THB), WHT Credit (THB)
- **And** responsive layout switches to cards on mobile

#### Scenario: Empty state shown when no records

- **WHEN** dividends array is empty
- **THEN** display message "ยังไม่มีบันทึกเงินปันผล" + CTA button to add dividend
- **AND** KPI cards show zero

### Requirement: DividendForm creates record with THB snapshot at dividend FX

- **Given** user opens form and enters date, symbol, country, gross USD, WHT rate, FX rate
- **When** form is saved
- **Then** record saved with `dividendFxRate` and THB snapshot fields computed (`grossAmountTHB`, `whtAmountTHB`, `netAmountTHB`) at dividend date FX
- **And** these THB values are immutable (reference only, not tax base)

### Requirement: Dividend record links to BUY symbol and validates country WHT

- **Given** user selects a symbol that exists in BUY trades
- **When** country selected (US/UK/SG/OTHER)
- **Then** WHT rate auto-filled from `COUNTRY_WHT_INFO`; user may override 0-100%
- **And** symbol validated against available BUY positions

### Requirement: Remittance creates reportable income at remittance FX

- **Given** dividend has `remainingToRemitUSD > 0`
- **When** user records remittance with amount, remit date, remit FX rate
- **Then** `reportableIncomeTHB = remittedUSD × remitFxRate`
- **And** `whtCreditTHB = (remittedUSD / netAmountUSD) × whtAmountUSD × remitFxRate`
- **And** `totalRemittedUSD` and `remainingToRemitUSD` updated; remittance appended

### Requirement: Partial remittance allowed with validation

- **Given** `remainingToRemitUSD = 350` after partial remits
- **When** user tries remitting $500
- **Then** validation error: amount exceeds remaining
- **And** multiple remittances permitted until `remainingToRemitUSD = 0`

### Requirement: Annual summary groups by remittance year

- **When** computing annual summary for a tax year
- **Then** group by `remitDate` year; calculate totals: gross, WHT, net, remitted, reportable (THB), WHT credit (THB), unremitted
- **And** status reflects remittance state (remitted/partial/not remitted)

### Requirement: Edit/delete blocked when remittance exists

- **Given** dividend has `remittances.length > 0`
- **When** user tries edit or delete
- **Then** blocked with message requiring deletion of remittances first

### Requirement: WHT default 15% for US (with W-8BEN override to 30%)

- **Given** country US selected
- **Then** default `whtRate = 15`
- **And** user can override to 30% if W-8BEN missing