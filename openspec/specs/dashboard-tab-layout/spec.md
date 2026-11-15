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
SHALL NOT render while the Dividend or Remittances tab is active. The breakdown SHALL show one card
per provider that has a remittance dated in the selected tax year, and no card for a provider that
has none.

#### Scenario: Dividend tab shows no capital-gain cards

- **WHEN** the Dividend tab is active
- **THEN** no capital-gain summary card and no per-provider breakdown card is present in the rendered output

#### Scenario: Trades tab shows the full capital-gain summary

- **WHEN** the Trades tab is active
- **THEN** the four capital-gain summary cards and one card per provider with a remittance in the selected year are
  present

#### Scenario: A provider with no remittances in the year has no card

- **WHEN** the Trades tab is active and a provider has no remittance dated in the selected tax year
- **THEN** no card for that provider is rendered, and no card shows that provider at zero

#### Scenario: Remittances tab shows no capital-gain cards

- **WHEN** the Remittances tab is active
- **THEN** no capital-gain summary card is present in the rendered output

### Requirement: The not-yet-remitted card reports proceeds not yet returned to Thailand

The capital-gain "not yet remitted" card SHALL display the engine-provided outstanding-proceeds figure
for the selected tax year. Its title, subtitle and tooltip SHALL describe sale proceeds that have not
been returned to Thailand.

#### Scenario: Card shows the engine figure

- **WHEN** the Trades tab renders for a tax year whose outstanding proceeds are 0
- **THEN** the card displays `$0.00` rather than a figure derived from revenue minus remittances

#### Scenario: Card title names the population

- **WHEN** the card is displayed
- **THEN** its title states that the figure covers this year's sales not yet returned to Thailand, in the active
  language, so the year selector reads as a tax year for the other cards and as a sell year for this one

#### Scenario: Card follows the selected year

- **WHEN** the user selects a different tax year
- **THEN** the card displays that year's outstanding-proceeds figure

#### Scenario: Copy does not claim the money is held as cash

- **WHEN** the card's title, subtitle and tooltip are inspected in either language
- **THEN** they describe proceeds not yet returned to Thailand
- **AND** none of them states or implies that the money is sitting in an offshore cash account

### Requirement: Tab summaries are computed outside the components

A figure shown on a tab's summary card SHALL come from the calculation engine. A component SHALL NOT
derive a summary total by combining other summary fields.

#### Scenario: No arithmetic in the card

- **WHEN** a summary card's value is traced back to its source
- **THEN** it reads a single field of the tab's summary and performs no subtraction or addition of its own

### Requirement: Outstanding proceeds are resolved from the Trades tab

The list of gains that still hold unreturned proceeds, and the actions that resolve them, SHALL sit on
the Trades tab, next to the capital-gain summary cards they explain.

#### Scenario: List accompanies the cards

- **WHEN** the Trades tab renders and at least one gain has an outstanding balance
- **THEN** the list appears on that tab and its rows' actions update the same figures the cards show

### Requirement: The realised-gain card describes this year's sales only

The net gain/loss card SHALL read the engine-provided realized gain of every sale dated in the selected
tax year. Its title and tooltip SHALL state that the figure covers the year's sales regardless of
remittance status, that each sale counts at its full figure rather than pro rata, and that the tax
figure comes from remittances on the other cards, so the cards do not sum to it.

#### Scenario: A profitable sale that was never remitted moves the card

- **WHEN** the selected year contains a profitable sale with no remittance
- **THEN** the card's figure includes that sale's gain

#### Scenario: The card states its own basis

- **WHEN** the card's title and tooltip are inspected in either language
- **THEN** they say the figure covers this year's sales and does not depend on whether they were remitted

#### Scenario: The card does not imply the cards sum to the tax figure

- **WHEN** the card's tooltip is inspected in either language
- **THEN** it states that the tax figure is computed from remittances and therefore differs from the sum of the
  sale figures

### Requirement: The remitted card counts remittances dated in the tax year

The total-remitted card SHALL read the engine-provided total of every remittance dated in the selected
tax year, whatever year the sale it belongs to was made in. Its subtitle SHALL report the number of
distinct sales those remittances belong to, and its title and tooltip SHALL state that it counts money
remitted during that year.

#### Scenario: A remittance against an earlier year's sale is included

- **WHEN** the selected year contains a remittance belonging to a sale made in an earlier year
- **THEN** the card's figure includes it

#### Scenario: The subtitle counts the sales behind the remittances

- **WHEN** the year's remittances belong to three sales
- **THEN** the subtitle reports three, and not the number of sales dated in the year

#### Scenario: The card states its own basis

- **WHEN** the card's title and tooltip are inspected in either language
- **THEN** they say the figure counts remittances dated in the selected tax year, not lifetime remittances

### Requirement: A provider card states the population of each figure

Every provider card SHALL read its figures from one engine-provided provider entry, and its labels
SHALL state that the remitted, taxable and gain figures are those of the remittances dated in the
selected tax year. A gain represented by those remittances SHALL NOT be labelled as a net gain of the
sale year.

#### Scenario: Provider labels name the remittance population

- **WHEN** a provider card renders
- **THEN** its remitted label and its gain label both describe the remittances dated in the selected year

#### Scenario: The gain label is not a sale-year net gain

- **WHEN** a provider card's labels are inspected in either language
- **THEN** no label presents the figure as the provider's net gain or profit on its sales

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

### Requirement: The capital-gain card names assessable income, not tax payable

The first capital-gain summary card SHALL be titled as assessable income, in both languages, and SHALL NOT be titled as tax. Its tooltip SHALL state that the figure is assessable income before the 150,000 baht exemption, before other income and before progressive rates — that it is not the tax payable — and SHALL state how the figure is computed: the gain portion of each remittance converted at the remittance-date rate, matched by FIFO lots, with exchange-rate differences not treated as income.

#### Scenario: The card is titled as income in Thai

- **WHEN** the Trades tab renders in Thai
- **THEN** the card title reads "เงินได้ที่ต้องยื่น (ประมาณการ)"
- **AND** the title does not contain the word "ภาษี"

#### Scenario: The card is titled as income in English

- **WHEN** the Trades tab renders in English
- **THEN** the card title reads "Assessable Income (est.)"
- **AND** it does not claim to be tax payable

#### Scenario: The tooltip carries the three caveats

- **WHEN** the card's tooltip is read
- **THEN** it states that the figure is before the 150,000 baht exemption and other income
- **AND** it states that the figure is not the tax payable
- **AND** it states the computation: gain portion of each remittance at the remittance-date rate, FIFO lots, exchange-rate differences not treated as income

#### Scenario: Retitling changes no figure

- **WHEN** the card is retitled
- **THEN** the value it displays is unchanged from the computed assessable gain for the selected year

### Requirement: The active tab is addressable in the URL

The dashboard SHALL read the active tab from the URL fragment on load and SHALL write the fragment when the user switches tabs, using a history replacement rather than a new history entry. An empty or unrecognised fragment SHALL open the Trades tab.

#### Scenario: Reload restores the tab

- **WHEN** the app is loaded with the fragment `#dividends`
- **THEN** the Dividend tab is active
- **AND** the Trades tab content is not rendered

#### Scenario: Switching tabs updates the fragment

- **WHEN** the user selects the Remittances tab
- **THEN** the fragment becomes `#remittances`
- **AND** no page reload occurs

#### Scenario: An unknown fragment falls back to Trades

- **WHEN** the app is loaded with no fragment, or with a fragment that names no tab
- **THEN** the Trades tab is active

#### Scenario: Back and forward move between tabs

- **WHEN** the user navigates back to a previous fragment
- **THEN** the tab that fragment names becomes active
