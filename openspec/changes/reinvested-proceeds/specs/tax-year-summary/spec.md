## Purpose

Defines what each figure of the per-year trade summary covers: which trades supply the base realized gains,
which population of sales or of remittances each figure counts, how the per-provider rows are derived from
that same population, and what the summary omits when a provider has nothing in the selected year.

## ADDED Requirements

### Requirement: The year summary is computed from the complete trade history

`computeTaxSummary` SHALL derive its base realized gains from every trade in the book, and SHALL NOT compute
FIFO over the subset of trades dated in the requested year. When the caller already holds realized-gain
results, those results SHALL be used as the base instead of being recomputed.

#### Scenario: A sale of shares bought in an earlier year is summarised

- **WHEN** a trade dated in the selected tax year sold shares that were bought in an earlier year
- **THEN** the year's summary is produced, and no `Insufficient lots` error is raised

#### Scenario: Caller-supplied gains are the base

- **WHEN** the caller passes existing realized-gain results
- **THEN** the summary counts the remittances and reinvested amounts held on those results

### Requirement: Sale-year figures cover every sale dated in the selected year

The summary figures that describe sales — total proceeds, total cost basis, net realized gain, buy count,
sell count, total reinvested and outstanding proceeds — SHALL be computed over every gain whose `sellDate`
falls in the selected tax year, whether or not any part of it has been remitted.

#### Scenario: A profitable sale with no remittance still counts

- **WHEN** a gain dated in the selected year has no remittances at all
- **THEN** it contributes to the year's total proceeds, total cost basis and net realized gain

#### Scenario: A sale from another year is excluded

- **WHEN** a gain's `sellDate` falls in a different tax year
- **THEN** it contributes to none of the year's sale figures

### Requirement: Remittance-year figures cover every remittance dated in the selected year

The figures that describe money received — total remitted USD, taxable gain in USD, taxable gain in THB,
remittance count, distinct-sale count and excluded losses — SHALL be computed over every remittance whose
`remitDate` falls in the selected tax year, whatever year the sale it belongs to was made in. No such figure
SHALL use a gain's lifetime remitted total.

#### Scenario: A remittance against an earlier year's sale is counted in the year it arrived

- **WHEN** a sale dated 2025 is remitted in 2026
- **THEN** that remittance contributes to the 2026 remitted total and the 2026 taxable gain, and contributes
  nothing to the 2025 figures

#### Scenario: A sale remitted across two years counts each year once

- **WHEN** one gain is remitted partly in year N and partly in year N+1
- **THEN** year N counts only the remittances dated in N, and year N+1 counts only the remittances dated in N+1

#### Scenario: Excluded losses are taken from the year's remittances

- **WHEN** the selected year contains a remittance against a loss-making gain
- **THEN** the excluded-loss figure is the sum of `max(0, −(amountUSD × gainPercent))` over the remittances
  dated in that year

### Requirement: Provider rows are derived from the same remittance set

Each per-provider row SHALL be computed from the remittances counted in the selected year, grouped by the
provider of the sale those remittances belong to. For every year, the sum of the rows' remitted and taxable
figures SHALL equal the corresponding summary totals.

#### Scenario: Provider rows sum to the card totals

- **WHEN** the selected year has remittances from more than one provider
- **THEN** the sum of the providers' remitted amounts equals the year's total remitted, and the sum of their
  taxable gains in THB equals the year's taxable gain in THB

#### Scenario: The equality survives a cross-year remittance

- **WHEN** a remittance belongs to a sale made in an earlier year
- **THEN** that remittance appears in exactly one provider row, under the provider of that earlier sale, and the
  sums still equal the card totals

### Requirement: A provider with no remittances in the year is not reported

The summary SHALL contain a provider row only for a provider with at least one remittance dated in the selected
year. A provider with no such remittance SHALL be omitted rather than reported with zero figures.

#### Scenario: Provider without remittances is absent

- **WHEN** a provider has no remittance dated in the selected year
- **THEN** the summary carries no row for that provider

#### Scenario: Provider with remittances is reported

- **WHEN** a provider has at least one remittance dated in the selected year
- **THEN** its row reports that provider's own remitted, taxable and sale-count figures

### Requirement: Provider gain figures are named for the population they measure

The provider row SHALL expose its gain as `gainInRemittancesUSD` — the gain represented by the remittances
counted in that year — derived from the same remittances as the row's remitted and taxable figures. It SHALL
NOT be named after a net gain of the sale year.

#### Scenario: The provider gain follows the year's remittances

- **WHEN** a provider's row is computed for a year
- **THEN** its `gainInRemittancesUSD` equals the sum of `amountUSD × gainPercent` over that provider's
  remittances dated in the year