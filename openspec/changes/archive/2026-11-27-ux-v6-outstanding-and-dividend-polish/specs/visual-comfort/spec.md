# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: Outstanding proceeds panel is collapsible with a header summary badge

On `TradesTab`, `.outstanding-proceeds` SHALL render as a collapsible `<details>` container (open by default) whose summary header shows the heading plus a count and total outstanding USD badge, allowing users to fold it away while reviewing the trade table without losing immediate access to its actions.

#### Scenario: Outstanding proceeds displays count badge and can be toggled

- **WHEN** `TradesTab` renders with outstanding rows
- **THEN** `.outstanding-proceeds` is a `<details>` element with `open` set by default and displays the row count badge in its summary

### Requirement: DividendTab supports quick search and remittance-status filtering

`DividendTab` SHALL provide a search input (symbol or notes) and status filter pills (`All`, `Remitted`, `Partial`, `Not remitted`) in its table toolbar, resetting when the displayed dividend year changes.

#### Scenario: Filtering DividendTab by status isolates unremitted records

- **WHEN** a user clicks the `Not remitted` status filter pill in `DividendTab`
- **THEN** only dividend records with zero remittances are shown in the table

### Requirement: Empty states use monochrome SVG icon badges

Empty-state views in `TradeTable`, `DividendTab`, and `RemittanceLog` SHALL render monochrome SVG icons inside `.empty-icon-badge` containers rather than oversized raw emojis.

#### Scenario: Empty state renders an SVG icon

- **WHEN** `TradeTable`, `DividendTab`, or `RemittanceLog` renders its empty state
- **THEN** `.empty-icon-badge svg[aria-hidden="true"]` is present
