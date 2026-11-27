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

### Requirement: Guard messages use non-blocking in-app toast notifications instead of browser alerts

When `Dashboard` blocks an edit or delete action (such as editing a SELL trade or dividend that still has remittances, or a FIFO conflict backstop), it SHALL display a non-blocking, dismissible in-app toast notification (`role="alert"`) rather than calling `window.alert()`.

#### Scenario: Editing a remitted SELL trade shows a non-blocking toast

- **WHEN** the user clicks Edit on a SELL trade that has remittances
- **THEN** the trade form does not open
- **AND** a dismissible `.toast-banner` with `role="alert"` displays the guard message without invoking `window.alert()`

### Requirement: TradeForm groups secondary fee/slip fields into a collapsible section and shows a live total summary

`TradeForm` SHALL separate primary trade inputs (type, date, symbol, provider, quantity, unit price) from secondary inputs (slip gross amount, commission, VAT, exchange fee, TAF fee, rebate, notes) using a native `<details className="form-collapsible">` section whose `<summary>` displays the live net fee total. All inputs SHALL remain mounted in the DOM for form state and accessibility. When positive quantity and unit price (or slip gross amount) are entered, `TradeForm` SHALL render a live summary bar showing subtotal, net fees, and estimated net cost (BUY) or net proceeds (SELL).

#### Scenario: TradeForm displays live cost/proceeds summary while typing

- **WHEN** the user enters quantity `10`, unit price `185.5`, and commission `1.5` for a BUY trade
- **THEN** the live summary bar displays the subtotal `$1855.00`, net fees `$1.50`, and estimated net cost `$1856.50`

#### Scenario: Collapsible secondary section stays mounted and summarizes net fees

- **WHEN** `TradeForm` renders
- **THEN** fee, slip gross, and notes inputs live inside `.form-collapsible`
- **AND** the summary header reflects the live net fees total

### Requirement: Data-entry modals dismiss on Escape

`TradeForm`, `RemitForm`, and `DividendForm` SHALL listen for the `Escape` key while open and invoke their cancel/close callback.

#### Scenario: Pressing Escape closes TradeForm

- **WHEN** `TradeForm` is open and the user presses `Escape`
- **THEN** `onCancel` is invoked

### Requirement: All modal dialogs share consistent padded body containers, close button styling, and Escape dismissal

`FilingSummarySheet`, `DocRefDialog`, `MarkReinvestedDialog`, and `DividendRemitForm` SHALL wrap their body content in a padded modal container (`.trade-form` or `.modal-body`), use `.btn-close` for the header close button, dismiss when `Escape` is pressed, and dismiss when clicking the backdrop overlay.

#### Scenario: FilingSummarySheet and DocRefDialog dismiss on Escape and backdrop click

- **WHEN** `FilingSummarySheet` or `DocRefDialog` is open and the user presses `Escape` or clicks the overlay backdrop
- **THEN** `onClose` is invoked

#### Scenario: DividendRemitForm and MarkReinvestedDialog dismiss on Escape

- **WHEN** `DividendRemitForm` or `MarkReinvestedDialog` is open and the user presses `Escape`
- **THEN** its close/cancel callback is invoked

### Requirement: Tooltip trigger uses a monochrome SVG info icon

`Tooltip` SHALL render `IconInfo` (`<svg aria-hidden="true">`) as its default trigger icon when no custom `children` are supplied.

#### Scenario: Default Tooltip renders an SVG icon

- **WHEN** `Tooltip` renders without custom children
- **THEN** its trigger button contains an `<svg aria-hidden="true">` element

### Requirement: RemittanceLog stacks related columns, stays visible on mobile, and supports quick filtering

`RemittanceLog` SHALL stack `Symbol` with `Provider` and `Amount (THB)` with its `@ FX` rate to reduce horizontal crowding while preserving all figures and footer totals. Its table SHALL carry `.remit-log-table` so it remains visible inside `.table-wrapper` on mobile viewports (`max-width: 639px`). Its toolbar SHALL provide a search input (symbol or notes) and a provider filter alongside the record button.

#### Scenario: Filtering RemittanceLog by search or provider narrows rows and recalculates visible footer totals

- **WHEN** a user filters `RemittanceLog` by symbol search or provider
- **THEN** only matching remittance rows are shown and footer totals reflect the visible counted rows

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

### Requirement: Users can toggle between Comfortable and Compact display density

The dashboard header SHALL provide a density toggle button that switches between `comfortable` (default) and `compact` display density, sets `data-density` on `document.documentElement`, and persists the preference in `localStorage` (`tax_tracker_density`) without hiding any data fields.

#### Scenario: Toggling density updates document attribute and persists preference

- **WHEN** the user clicks the density toggle button in the header
- **THEN** `document.documentElement.getAttribute('data-density')` switches between `comfortable` and `compact`
- **AND** the choice is saved in `localStorage` under `tax_tracker_density`

### Requirement: Animations respect prefers-reduced-motion and main content uses a semantic landmark

`src/index.css` SHALL include a `@media (prefers-reduced-motion: reduce)` rule disabling non-essential transitions and animations, and `Dashboard` SHALL wrap its active tab content in a `<main>` landmark.

#### Scenario: Dashboard renders tab content inside main landmark

- **WHEN** `Dashboard` renders
- **THEN** the active tab panel is contained within a `<main>` element
