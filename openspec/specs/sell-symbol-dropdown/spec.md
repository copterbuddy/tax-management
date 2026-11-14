# Spec: Sell Trade Symbol Dropdown

## Purpose

When recording a SELL trade, the Symbol field renders as a dropdown showing only stocks currently held (with provider and available quantity) so users cannot enter symbols they do not own or sell more shares than held.

Reference BA spec (preserved in docs/ archive): `docs/specs/sell-symbol-dropdown.md`

## Requirements

### Requirement: Conditional Symbol field rendering based on trade type

The Symbol field SHALL render as a `<select>` dropdown when the trade type is SELL, and as a text `<input>` when the trade type is BUY.

#### Scenario: Symbol field renders as a dropdown for SELL

- **WHEN** the TradeForm is open and the user changes the trade type to SELL
- **THEN** the Symbol field renders as a `<select>` dropdown instead of a text `<input>`

#### Scenario: Symbol field returns to text input for BUY

- **WHEN** the user switches the trade type back to BUY
- **THEN** the Symbol field returns to a text `<input>` immediately

### Requirement: Dropdown options derived from remainingLots

When the SELL dropdown renders, its options SHALL be derived from `remainingLots`.

#### Scenario: Options are built from held positions

- **WHEN** `remainingLots` contains the user's positions and the SELL dropdown renders
- **THEN** options are derived by filtering `remainingQuantity > 0`, grouping by (`symbol`, `provider`), summing quantity per pair, and sorting alphabetically
- **AND** each `<option>` displays `SYMBOL @ Provider — X shares available`

### Requirement: Auto-fill provider on symbol selection

Selecting an option from the SELL dropdown SHALL set both the `symbol` and `provider` fields from that option.

#### Scenario: Symbol selection fills provider

- **WHEN** the user selects an option from the SELL dropdown
- **THEN** both the `symbol` and `provider` fields are set from the selected option
- **AND** the Provider dropdown becomes disabled (grayed out) when the trade type is SELL

### Requirement: Type toggle resets dependent fields

Changing the trade type SHALL reset every value the form holds, because the two types do not share a
valid field set (BUY takes a free-text symbol and lot-consuming economics; SELL takes a held-position
symbol and lot-producing economics). Only the trade date SHALL survive. Re-selecting the active type
MUST be a no-op.

#### Scenario: Switching from SELL to BUY

- **WHEN** user switches type from SELL to BUY
- **THEN** symbol resets to empty and becomes a free-text input
- **AND** provider resets to its default value and becomes enabled
- **AND** quantity, price, commission, VAT, exchange fee, TAF, rebate, and notes are cleared
- **AND** any form-level error is cleared

#### Scenario: Switching from BUY to SELL

- **WHEN** user switches from BUY to SELL
- **THEN** symbol resets to empty and becomes the held-position dropdown
- **AND** provider resets to its default value and becomes disabled
- **AND** quantity, price, commission, VAT, exchange fee, TAF, rebate, and notes are cleared
- **AND** any form-level error is cleared

#### Scenario: Date is preserved across a type change

- **WHEN** user changes the trade type after choosing a trade date
- **THEN** the chosen date is kept

#### Scenario: Re-selecting the active type

- **WHEN** user selects the trade type that is already active
- **THEN** no field is reset and no error is cleared
