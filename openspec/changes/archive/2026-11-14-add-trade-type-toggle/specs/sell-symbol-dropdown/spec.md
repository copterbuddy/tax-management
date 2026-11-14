# Spec Delta

## MODIFIED Requirements

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