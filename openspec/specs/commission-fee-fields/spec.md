# commission-fee-fields Specification

## Purpose

Defines itemized trade fee and rebate fields (`commissionUSD`, `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, `vatUSD`) across the trade schema, FIFO cost and revenue formulas, form inputs, trade table display, and legacy data migration.

## Requirements

### Requirement: Trade records store itemized fee and rebate fields

Every `TradeTransaction` SHALL carry `commissionUSD`, `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, and `vatUSD` as non-negative numbers. When reading stored trades from `localStorage`, missing `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, or `vatUSD` fields SHALL default to `0`.

#### Scenario: Stored trade with all fee fields loads intact

- **WHEN** a stored trade has `commissionUSD: 1.5`, `exchangeFeeUSD: 0.25`, `tafFeeUSD: 0.1`, `commissionRebateUSD: 0.5`, and `vatUSD: 0.11`
- **THEN** all five values are preserved after schema validation

#### Scenario: Stored trade missing optional fee fields defaults them to zero

- **WHEN** a legacy stored trade provides `commissionUSD: 1.5` and omits `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, and `vatUSD`
- **THEN** schema parsing and `migrateTrade` supply `0` for each missing fee field without overwriting `commissionUSD`

### Requirement: FIFO cost and revenue include all fees and rebates

`calculateBuyCostUSD` SHALL add `commissionUSD`, `exchangeFeeUSD`, and `vatUSD` to the trade notional and subtract `commissionRebateUSD`. `calculateSellRevenueUSD` SHALL subtract `commissionUSD`, `exchangeFeeUSD`, `tafFeeUSD`, and `vatUSD` from the trade notional and add `commissionRebateUSD`.

#### Scenario: BUY cost includes fees and subtracts rebate

- **WHEN** a BUY trade has notional 1,000, `commissionUSD: 2`, `exchangeFeeUSD: 0.5`, `vatUSD: 0.18`, and `commissionRebateUSD: 0.4`
- **THEN** `calculateBuyCostUSD` returns `1002.28`

#### Scenario: SELL revenue deducts fees including TAF and adds rebate

- **WHEN** a SELL trade has notional 1,000, `commissionUSD: 2`, `exchangeFeeUSD: 0.5`, `tafFeeUSD: 0.1`, `vatUSD: 0.18`, and `commissionRebateUSD: 0.4`
- **THEN** `calculateSellRevenueUSD` returns `997.62`

### Requirement: TradeForm shows conditional TAF fee and rejects rebate above total fees

`TradeForm` SHALL show `commissionUSD`, `vatUSD`, `exchangeFeeUSD`, and `commissionRebateUSD` inputs for both BUY and SELL, and SHALL show the `tafFeeUSD` input only when `SELL` is selected. Submitting a trade whose `commissionRebateUSD` exceeds `commissionUSD + exchangeFeeUSD + tafFeeUSD + vatUSD` SHALL be rejected with a field error on `commissionRebateUSD`.

#### Scenario: TAF fee input toggles with trade type

- **WHEN** the user switches `TradeForm` from `BUY` to `SELL`
- **THEN** the `tafFeeUSD` input becomes visible
- **AND** switching back to `BUY` hides the `tafFeeUSD` input

#### Scenario: Rebate exceeding total fees is rejected

- **WHEN** total fees (`commissionUSD + exchangeFeeUSD + tafFeeUSD + vatUSD`) equal 2.00 and `commissionRebateUSD` is 3.00
- **THEN** `TradeForm` sets a validation error on `commissionRebateUSD` and does not submit

### Requirement: TradeTable displays aggregated fees and net trade total

`TradeTable` SHALL display a Total Fees column equal to `commissionUSD + exchangeFeeUSD + tafFeeUSD + vatUSD - commissionRebateUSD` in both desktop table rows and mobile cards, and SHALL display the trade total matching `calculateBuyCostUSD` for BUY or `calculateSellRevenueUSD` for SELL.

#### Scenario: Desktop and mobile views report net total fees

- **WHEN** a SELL trade has `commissionUSD: 2`, `exchangeFeeUSD: 0.5`, `tafFeeUSD: 0.1`, `vatUSD: 0.14`, and `commissionRebateUSD: 0.24`
- **THEN** the Total Fees value displayed is `$2.50`
- **AND** the displayed trade total matches `calculateSellRevenueUSD`

### Requirement: Localized labels exist for all fee fields

Both Thai and English `trade` locale bundles SHALL provide translation keys for commission, VAT, exchange fee, TAF fee, rebate, and total fees column labels.

#### Scenario: Fee labels resolve in Thai and English

- **WHEN** `TradeForm` and `TradeTable` render in Thai or English
- **THEN** all fee input labels and the total fees column resolve to localized strings rather than raw translation keys
