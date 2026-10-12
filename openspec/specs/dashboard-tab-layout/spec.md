# dashboard-tab-layout Specification

## Purpose
Defines how the dashboard is divided into tabs: where the tab navigation sits, which summary numbers
each tab shows, which year control each tab exposes and how it is labelled, and what a tab tells the
user when it has no rows for the selected period.

## Requirements

### Requirement: Tab navigation precedes all tab content

The dashboard SHALL render its tab navigation above all tab-specific content, directly below the page
header. No summary card, year control, or table belonging to a tab SHALL be rendered above the tab
navigation.

#### Scenario: Tab nav is the first content element after the header

- **WHEN** the dashboard renders
- **THEN** the tab navigation appears before any summary card, year selector, or table in document order

#### Scenario: Switching tabs does not require scrolling past another tab's summary

- **WHEN** the user switches from the Trades tab to the Dividend tab
- **THEN** the first dividend summary card follows the tab navigation with no capital-gain card or
  per-provider card in between

### Requirement: Capital-gain summary belongs to the Trades tab

The four capital-gain summary cards (estimated tax payable, total remitted, net gain/loss, not yet
remitted) and the per-provider breakdown row SHALL render only while the Trades tab is active. They
SHALL NOT render while the Dividend or Remittances tab is active.

#### Scenario: Dividend tab shows no capital-gain cards

- **WHEN** the Dividend tab is active
- **THEN** no capital-gain summary card and no per-provider breakdown card is present in the rendered output

#### Scenario: Trades tab shows the full capital-gain summary

- **WHEN** the Trades tab is active
- **THEN** the four capital-gain summary cards and one card per provider are present

#### Scenario: Remittances tab shows no capital-gain cards

- **WHEN** the Remittances tab is active
- **THEN** no capital-gain summary card is present in the rendered output

### Requirement: The tax-year control is shown only where it applies

The tax-year selector SHALL render only while the Trades tab is active. A tab whose content is not
filtered by the tax-year selection SHALL NOT display that selector.

#### Scenario: Dividend tab exposes one year control, for dividends

- **WHEN** the Dividend tab is active
- **THEN** the dashboard exposes no tax-year selector, and exactly one year selector, which filters dividends

#### Scenario: Remittances tab exposes one year control, for remittances

- **WHEN** the Remittances tab is active
- **THEN** the only year selector present is the remittance-year selector belonging to that tab

### Requirement: Every year control is labelled with the period it filters

Each year selector SHALL be accompanied by a visible label naming the period it filters, resolved
through translation keys in the active language. Two year selectors with different meanings SHALL NOT
be distinguishable only by their position on the page.

#### Scenario: Dividend year control is labelled

- **WHEN** the Dividend tab is active
- **THEN** its year selector carries a visible label reading "ปีปันผล" in Thai and "Dividend Year" in English

#### Scenario: Trades tax-year control is labelled

- **WHEN** the Trades tab is active
- **THEN** its year selector carries a visible label reading "ปีภาษี" in Thai and "Tax Year" in English

### Requirement: A tab's empty state points at the control that filters that tab

When a tab has no rows for the selected period, the guidance it shows SHALL reference a control that
is present on that tab and that changes which rows are shown. It SHALL NOT reference a control
belonging to another tab.

#### Scenario: Dividend tab empty state references the dividend year control

- **WHEN** the Dividend tab has no records for the selected dividend year
- **THEN** the guidance refers to the dividend year control on that tab, and does not refer to a
  tax-year control elsewhere on the page

### Requirement: Summary cards use only defined visual variants

Every summary card SHALL be rendered with one of the visual variants the card component defines. A
variant the component does not define SHALL NOT be requested. Every variant that signals a state —
positive, negative, highlight and warning — SHALL have a corresponding rule in the stylesheet, so
that requesting it always produces a visible treatment. Variants that mean "no special treatment" are
not required to carry a rule of their own.

#### Scenario: Unremitted dividend card is marked as a warning

- **WHEN** the total unremitted dividend amount is greater than zero
- **THEN** the unremitted dividend card carries the warning variant and is visually distinguished
  from a default card

#### Scenario: No undefined variant is requested

- **WHEN** any dashboard tab renders
- **THEN** every summary card's requested variant is one the card component defines

#### Scenario: State-signalling variants are styled

- **WHEN** the stylesheet is inspected
- **THEN** the positive, negative, highlight and warning variants each have a rule

### Requirement: Expanding one dividend's remittance history does not disturb other rows

Each dividend record SHALL be rendered as a single stable list entry, together with its remittance
history when that history is expanded, so that expanding or collapsing one record leaves every other
row's identity and content unchanged.

#### Scenario: Expanding one row keeps the others stable

- **WHEN** the user expands the remittance history of one dividend record
- **THEN** that record's row and its history render as one entry, and every other row is unchanged and
  still listed exactly once

#### Scenario: Rendering several records produces no list-identity warning

- **WHEN** the Dividend tab renders more than one dividend record
- **THEN** the application emits no missing-key or duplicate-key warning
