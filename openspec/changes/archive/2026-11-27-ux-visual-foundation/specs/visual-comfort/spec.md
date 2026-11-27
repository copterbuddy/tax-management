# visual-comfort Delta Specification

## Purpose

Defines visual comfort, contrast, typography, iconography, and CSS integrity requirements so dense financial tax data remains readable without eye strain while preserving all figures and details.

## ADDED Requirements

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
