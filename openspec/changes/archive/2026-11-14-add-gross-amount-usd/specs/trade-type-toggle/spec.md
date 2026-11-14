# Spec Delta

## MODIFIED Requirements

### Requirement: Changing the trade type clears all entered values except the date

When the user selects a type different from the current one, every entered value SHALL be reset — symbol, provider, quantity, price, slip gross amount, commission, VAT, exchange fee, TAF, rebate, and notes — and any form-level error SHALL be cleared. The trade date SHALL be preserved.

#### Scenario: Switching from BUY to SELL clears the form

- **WHEN** the user has entered values in a BUY form and selects SELL
- **THEN** symbol, quantity, price, slip gross amount, fees, rebate, and notes are empty
- **AND** provider is back to its default value
- **AND** any previously displayed form-level error is gone

#### Scenario: Switching from SELL to BUY clears the form

- **WHEN** the user has selected a held position in a SELL form and selects BUY
- **THEN** symbol is empty and the symbol field returns to a free-text input
- **AND** provider is back to its default value and is enabled

#### Scenario: The date survives a type change

- **WHEN** the user changes the trade type after choosing a date
- **THEN** the chosen date is unchanged

#### Scenario: A slip gross amount does not survive a type change

- **WHEN** the user has entered a slip gross amount of 6647.13 in a SELL form and selects BUY
- **THEN** the slip gross amount field is empty
- **AND** the newly selected BUY does not inherit 6647.13 as its recorded notional