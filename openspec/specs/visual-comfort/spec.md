# visual-comfort Specification

## Purpose

Defines visual comfort, contrast, typography, iconography, and CSS integrity requirements so dense financial tax data remains readable without eye strain while preserving all figures and details.

## Requirements

### Requirement: Typography loads Thai-friendly sans and tabular monospace fonts

The HTML entry point SHALL load `Sarabun` for Thai/English prose and `JetBrains Mono` for numeric/tabular values so typography matches the design system tokens.

#### Scenario: Font stylesheet links are present in index.html

- **WHEN** `index.html` is inspected
- **THEN** it includes stylesheet links loading `Sarabun` and `JetBrains Mono`

### Requirement: Tertiary text maintains comfortable contrast in both themes

The stylesheet SHALL define `--color-text-tertiary` with AA-readable contrast against `--color-surface` in both light (`#64748b` or darker) and dark (`#94a3b8` or lighter) themes, so table headers and KPI subtitles are legible without squinting.

#### Scenario: Tertiary text tokens meet readability targets

- **WHEN** `src/index.css` custom properties are inspected
- **THEN** `:root` sets `--color-text-tertiary` to `#64748b`
- **AND** dark theme sets `--color-text-tertiary` to `#94a3b8`

### Requirement: KPI variants maintain calm hierarchy without noisy full-card gradients

State-signalling KPI variants (`positive`, `negative`, `highlight`, `warning`) SHALL each have a distinct stylesheet rule in `src/index.css`. Non-hero state variants (`positive`, `negative`, `warning`) SHALL use clean surface backgrounds with subtle accent borders rather than competing full-card gradients, while `highlight` MAY use a soft tinted surface.

#### Scenario: Every state variant has a visible rule in CSS

- **WHEN** `src/index.css` is inspected
- **THEN** `.kpi-card.kpi-positive`, `.kpi-card.kpi-negative`, `.kpi-card.kpi-highlight`, and `.kpi-card.kpi-warning` each have explicit rules

### Requirement: UI chrome uses consistent monochrome SVG icons

Navigation tabs, theme toggle, KPI icons, and table action buttons SHALL render crisp monochrome SVG icons (`aria-hidden="true"`) from `src/components/Icons.tsx` instead of multi-colored emoji characters, while preserving accessible `title` / `aria-label` attributes on interactive controls.

#### Scenario: Tabs and table actions render SVG icons

- **WHEN** `TabNav`, `TradesTab`, `TradeTable`, `DividendTab`, and `RemittanceLog` render
- **THEN** their navigation and action buttons contain `<svg>` elements with `aria-hidden="true"`

### Requirement: Remittance progress label is not clipped by the progress bar track

In `TradeTable`, the remittance progress text (`$remitted / $total`) SHALL be rendered outside the 6px `.remit-progress` bar track so it is fully visible and never clipped by `overflow: hidden`.

#### Scenario: Remittance amount text sits outside the bar track

- **WHEN** `TradeTable` renders a SELL row with a realized gain
- **THEN** `.remit-text` is a sibling of `.remit-progress` inside `.remit-progress-wrap`, not a child of `.remit-progress`

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
