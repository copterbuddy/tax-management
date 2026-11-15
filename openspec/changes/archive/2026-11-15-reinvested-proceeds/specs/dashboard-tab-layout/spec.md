# Spec Delta

## ADDED Requirements

### Requirement: The not-yet-remitted card reports proceeds not yet returned to Thailand

The capital-gain "not yet remitted" card SHALL display the engine-provided outstanding-proceeds figure for the
selected tax year. Its title, subtitle and tooltip SHALL describe sale proceeds that have not been returned to
Thailand.

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

A figure shown on a tab's summary card SHALL come from the calculation engine. A component SHALL NOT derive a
summary total by combining other summary fields.

#### Scenario: No arithmetic in the card

- **WHEN** a summary card's value is traced back to its source
- **THEN** it reads a single field of the tab's summary and performs no subtraction or addition of its own

### Requirement: Outstanding proceeds are resolved from the Trades tab

The list of gains that still hold unreturned proceeds, and the actions that resolve them, SHALL sit on the Trades
tab, next to the capital-gain summary cards they explain.

#### Scenario: List accompanies the cards

- **WHEN** the Trades tab renders and at least one gain has an outstanding balance
- **THEN** the list appears on that tab and its rows' actions update the same figures the cards show

### Requirement: The realised-gain card describes this year's sales only

The net gain/loss card SHALL read the engine-provided realized gain of every sale dated in the selected tax year.
Its title and tooltip SHALL state that the figure covers the year's sales regardless of remittance status, that
each sale counts at its full figure rather than pro rata, and that the tax figure comes from remittances on the
other cards, so the cards do not sum to it.

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

The total-remitted card SHALL read the engine-provided total of every remittance dated in the selected tax year,
whatever year the sale it belongs to was made in. Its subtitle SHALL report the number of distinct sales those
remittances belong to, and its title and tooltip SHALL state that it counts money remitted during that year.

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

Every provider card SHALL read its figures from one engine-provided provider entry, and its labels SHALL state
that the remitted, taxable and gain figures are those of the remittances dated in the selected tax year. A gain
represented by those remittances SHALL NOT be labelled as a net gain of the sale year.

#### Scenario: Provider labels name the remittance population

- **WHEN** a provider card renders
- **THEN** its remitted label and its gain label both describe the remittances dated in the selected year

#### Scenario: The gain label is not a sale-year net gain

- **WHEN** a provider card's labels are inspected in either language
- **THEN** no label presents the figure as the provider's net gain or profit on its sales

## MODIFIED Requirements

### Requirement: Capital-gain summary belongs to the Trades tab

The four capital-gain summary cards (estimated tax payable, total remitted, net gain/loss, not yet remitted) and
the per-provider breakdown row SHALL render only while the Trades tab is active. They SHALL NOT render while the
Dividend or Remittances tab is active. The breakdown SHALL show one card per provider that has a remittance dated
in the selected tax year, and no card for a provider that has none.

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