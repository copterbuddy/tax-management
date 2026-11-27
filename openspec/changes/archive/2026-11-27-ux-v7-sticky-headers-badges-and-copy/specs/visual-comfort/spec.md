# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: Status badges render as calm, legible tinted pills

`src/index.css` SHALL define explicit pill styles for `.badge`, `.badge-success`, `.badge-warning`, and `.badge-neutral` so remittance statuses on `DividendTab` are visually scannable at a glance.

#### Scenario: Stylesheet defines all badge variants

- **WHEN** `src/index.css` is inspected
- **THEN** `.badge`, `.badge-success`, `.badge-warning`, and `.badge-neutral` each have explicit rules

### Requirement: Table headers stay sticky and highlight the active sort column

`.trade-table thead th` SHALL use `position: sticky; top: 0` with an opaque header background, and `TradeTable` SHALL mark the currently sorted column header with `.is-sorted` and `aria-sort` (`ascending` or `descending`).

#### Scenario: Active sort header exposes aria-sort and .is-sorted

- **WHEN** `TradeTable` renders or a sortable column header is clicked
- **THEN** the active sort header carries `.is-sorted` and `aria-sort="ascending"` or `aria-sort="descending"`

### Requirement: FilingSummarySheet supports one-click copy of PND 90 figures

`FilingSummarySheet` SHALL provide a Copy button that copies a readable summary of the year's assessable figures to the clipboard and temporarily displays a copied confirmation state.

#### Scenario: Clicking Copy writes the filing summary to clipboard and shows confirmation

- **WHEN** the user clicks the Copy button in `FilingSummarySheet`
- **THEN** `navigator.clipboard.writeText` is called with the year and formatted figures
- **AND** the button updates its label to the copied confirmation state
