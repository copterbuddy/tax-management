# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: Six-card KPI grids use a balanced 3-column desktop layout

When a tab displays 6 KPI summary cards (such as `DividendTab`), its KPI grid SHALL use `.kpi-grid-3` so desktop viewports render two balanced rows of 3 cards rather than an unbalanced 4 + 2 layout.

#### Scenario: Dividend tab KPI grid uses balanced 3-column class

- **WHEN** `DividendTab` renders its 6 summary cards
- **THEN** the card grid carries both `kpi-grid` and `kpi-grid-3` classes

### Requirement: Trade table supports quick search, type filtering, stacked cells, and expandable row details

`TradeTable` SHALL reduce horizontal column density by stacking `Symbol` with `Provider` and `Quantity` with `Unit Price`, and SHALL reveal itemized fee breakdown (Commission, VAT, Exchange fee, TAF fee, Rebate, Total fees), slip gross amount, and notes in an expandable detail row when a trade row is clicked. Clicking action buttons inside a row SHALL NOT toggle expansion. `TradeTable` SHALL also provide a search input (symbol or notes) and `All / BUY / SELL` type filter alongside the provider filter, resetting cleanly when the tax year changes.

#### Scenario: Clicking a trade row expands itemized fee and note details

- **WHEN** a user clicks a trade row in `TradeTable`
- **THEN** an expandable detail row appears directly beneath it showing itemized fees, gross amount / fallback note, and trade notes
- **AND** clicking the row again collapses the detail row

#### Scenario: Quick search and type filter narrow displayed trades

- **WHEN** a user types a symbol in the search input or selects `BUY` or `SELL` in the type filter
- **THEN** only matching trades for the selected year are rendered
- **AND** all existing totals and engine-backed figures remain accurate

### Requirement: Dividend table consolidates withholding rate and amount into one stacked cell

`DividendTab` SHALL display `WHT (USD)` and `WHT%` together in a single stacked table cell so both values remain immediately visible while reducing horizontal column crowding.

#### Scenario: Dividend row shows both WHT amount and rate in one cell

- **WHEN** `DividendTab` renders a dividend record
- **THEN** its WHT cell displays both the USD withholding amount and the withholding percentage
