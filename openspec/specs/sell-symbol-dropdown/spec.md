# Spec: Sell Trade Symbol Dropdown

## Capability

When recording a SELL trade, the Symbol field renders as a dropdown showing only stocks currently held (with provider and available quantity) so users cannot enter symbols they do not own or sell more shares than held.

Reference BA spec (preserved in docs/ archive): `docs/specs/sell-symbol-dropdown.md`

## ADDED Requirements

### Requirement: Conditional Symbol field rendering based on trade type

- **Given** the TradeForm is open and `type === 'SELL'`
- **When** the user changes Trade Type to SELL
- **Then** the Symbol field renders as a `<select>` dropdown instead of a text `<input>`
- **And** switching back to BUY returns it to a text `<input>` immediately

### Requirement: Dropdown options derived from remainingLots

- **Given** `remainingLots` contains user positions
- **When** SELL dropdown renders
- **Then** options are derived by filtering `remainingQuantity > 0`, grouping by (`symbol`, `provider`), summing quantity per pair, and sorting alphabetically
- **And** each `<option>` displays `SYMBOL @ Provider — X shares available`

### Requirement: Auto-fill provider on symbol selection

- **When** user selects an option from the SELL dropdown
- **Then** both `symbol` and `provider` fields are set from the selected option
- **And** the Provider dropdown becomes disabled (grayed out) when `type === 'SELL'`

### Requirement: Type toggle resets dependent fields

- **When** user switches type from SELL to BUY
- **Then** symbol resets to empty; provider resets to default and becomes enabled
- **When** user switches from BUY to SELL
- **Then** symbol resets to empty; provider resets to default and disabled
