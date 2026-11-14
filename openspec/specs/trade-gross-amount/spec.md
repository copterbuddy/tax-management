# Spec: Trade Gross Amount

## Purpose

The slip-authoritative USD notional of a trade: how a trade records the gross amount printed on the broker contract note, when that amount takes precedence over the amount derived from quantity and unit price, when the derivation falls back to that product, and how the interface distinguishes a slip-backed figure from a derived one.

## Requirements

### Requirement: A trade records an optional slip gross amount

A trade SHALL accept an optional gross amount in USD representing the pre-fee notional printed on the broker contract note. The field SHALL be optional; a trade without it SHALL be valid and complete.

#### Scenario: A trade saved without a slip gross amount is valid

- **WHEN** a BUY or SELL is submitted with quantity, unit price, and fees but no slip gross amount
- **THEN** the trade is accepted and stored
- **AND** no validation error references the slip gross amount

#### Scenario: A trade saved with a slip gross amount keeps it

- **WHEN** a trade is submitted with a slip gross amount of 6647.13
- **THEN** the stored trade reports a slip gross amount of 6647.13

### Requirement: An absent slip gross amount is not treated as zero

A trade that has no recorded slip gross amount SHALL be distinguished from a trade whose slip gross amount is exactly zero. The field SHALL NOT be defaulted to zero when it is missing.

#### Scenario: A trade with no recorded amount is treated as absent

- **WHEN** a trade is loaded from storage and has no slip gross amount
- **THEN** the system treats the amount as absent and derives the notional instead
- **AND** it does not treat the notional as zero

#### Scenario: A trade whose recorded amount is zero is not treated as absent

- **WHEN** a stored trade carries a slip gross amount of 0
- **THEN** the system treats the amount as present with the value 0
- **AND** it does not fall back to the derived notional

### Requirement: The slip gross amount is the authoritative notional

When a trade has a recorded slip gross amount, the system SHALL use it — not `quantity × priceUSD` — as the trade's notional when computing a BUY's cost or a SELL's revenue. Fees, taxes, and rebates SHALL continue to be applied on top of that notional in their existing directions.

#### Scenario: BUY cost uses the recorded gross amount

- **WHEN** a BUY has quantity 43, unit price 28.61, and a slip gross amount of 1230.22, with fees totalling 0.10
- **THEN** its cost is 1230.32
- **AND** the derived product 1230.23 is not used

#### Scenario: SELL revenue uses the recorded gross amount

- **WHEN** a SELL has quantity 224, unit price 29.67, and a slip gross amount of 6647.13, with fees totalling 10.86
- **THEN** its revenue is 6636.27

#### Scenario: A SELL revenue backed by the recorded amount covers the full remitted amount

- **WHEN** a SELL has a recorded slip gross amount of 6647.13 and fees of 10.86, and 6636.27 was remitted against it
- **THEN** the remittance is accepted
- **AND** the gain from that SELL contributes to the tax year of the remittance

### Requirement: A trade without a slip gross amount derives its notional

When a trade has no recorded slip gross amount, the system SHALL compute its notional as `quantity × priceUSD`, exactly as before the field existed. Stored trades that predate the field SHALL continue to produce the same cost, revenue, gains, and tax totals.

#### Scenario: A legacy trade keeps its previous figures

- **WHEN** a stored trade with quantity 173 and unit price 29.15 has no slip gross amount
- **THEN** its notional is 5042.95
- **AND** its cost, revenue, and gain match the values produced before the field existed

### Requirement: A stored slip gross amount survives a load and save cycle

The slip gross amount SHALL be retained when trades are read from storage, modified, and written back. It SHALL NOT be dropped during validation or persistence.

#### Scenario: The amount is intact after an unrelated edit and save

- **WHEN** a stored trade carrying a slip gross amount of 6647.13 is edited only in its notes and saved
- **THEN** the reloaded trade still reports a slip gross amount of 6647.13

#### Scenario: The amount is intact after an unrelated trade is added

- **WHEN** a new trade is added while existing trades carry slip gross amounts
- **THEN** every existing trade still reports its original slip gross amount

### Requirement: A mismatch between the recorded and derived amounts is reported without blocking

When a trade's slip gross amount differs from `quantity × priceUSD` by more than half a cent per share plus one cent, the system SHALL surface a round-off warning identifying both figures, and SHALL still save the trade using the recorded amount. A difference within that tolerance SHALL NOT be reported.

#### Scenario: A one-cent price rounding difference is not reported

- **WHEN** a SELL of 224 shares at 29.67 records a slip gross amount of 6647.13, differing from the product by 1.05
- **THEN** no round-off warning is shown
- **AND** the trade saves with the recorded amount

#### Scenario: A material difference is reported

- **WHEN** a BUY of 173 shares at 29.15 records a slip gross amount of 5103.50, differing from the product 5042.95 by 60.55
- **THEN** a round-off warning naming 5042.95 and 5103.50 is shown
- **AND** the trade is still saved with the recorded amount of 5103.50

### Requirement: The interface distinguishes a derived figure from a slip-backed one

A displayed USD notional or total SHALL be shown in the standard text colour when it comes from a recorded slip gross amount, and in the warning colour with an accessible explanation when it comes from the `quantity × priceUSD` derivation because no slip gross amount was recorded. The warning colour SHALL indicate a missing optional field, not an invalid or unsaved trade.

#### Scenario: A derived total is highlighted

- **WHEN** a trade with no recorded slip gross amount is shown in the trade list
- **THEN** its total USD is rendered in the warning colour
- **AND** the explanation text states that the total was calculated from quantity and unit price

#### Scenario: A slip-backed total is not highlighted

- **WHEN** a trade with a recorded slip gross amount is shown in the trade list
- **THEN** its total USD is rendered in the standard text colour
- **AND** no fallback explanation is attached

#### Scenario: The explanation is available to assistive technology

- **WHEN** a fallback-derived total is focused or hovered
- **THEN** its explanation is exposed as the accessible name or description of the value

### Requirement: The trade list total matches the amount used for tax

The USD total shown for a trade in the trade list SHALL equal the cost or revenue the gain calculation uses for that same trade, so a displayed total can never disagree with the taxable figure.

#### Scenario: Buy total equals buy cost

- **WHEN** a BUY with fees is displayed
- **THEN** its displayed total USD equals the cost used by FIFO for that lot

#### Scenario: Sell total equals sell revenue

- **WHEN** a SELL with commission, exchange fee, TAF, VAT, and rebate is displayed
- **THEN** its displayed total USD equals the revenue used to compute that SELL's gain