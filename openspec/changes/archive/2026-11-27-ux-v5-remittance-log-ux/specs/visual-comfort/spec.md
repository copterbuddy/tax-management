# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: RemittanceLog stacks related columns, stays visible on mobile, and supports quick filtering

`RemittanceLog` SHALL stack `Symbol` with `Provider` and `Amount (THB)` with its `@ FX` rate to reduce horizontal crowding while preserving all figures and footer totals. Its table SHALL carry `.remit-log-table` so it remains visible inside `.table-wrapper` on mobile viewports (`max-width: 639px`). Its toolbar SHALL provide a search input (symbol or notes) and a provider filter alongside the record button.

#### Scenario: Filtering RemittanceLog by search or provider narrows rows and recalculates visible footer totals

- **WHEN** a user filters `RemittanceLog` by symbol search or provider
- **THEN** only matching remittance rows are shown and footer totals reflect the visible counted rows
