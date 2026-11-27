# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: Guard messages use non-blocking in-app toast notifications instead of browser alerts

When `Dashboard` blocks an edit or delete action (such as editing a SELL trade or dividend that still has remittances, or a FIFO conflict backstop), it SHALL display a non-blocking, dismissible in-app toast notification (`role="alert"`) rather than calling `window.alert()`.

#### Scenario: Editing a remitted SELL trade shows a non-blocking toast

- **WHEN** the user clicks Edit on a SELL trade that has remittances
- **THEN** the trade form does not open
- **AND** a dismissible `.toast-banner` with `role="alert"` displays the guard message without invoking `window.alert()`

### Requirement: TradeForm groups secondary fee/slip fields into a collapsible section and shows a live total summary

`TradeForm` SHALL separate primary trade inputs (type, date, symbol, provider, quantity, unit price) from secondary inputs (slip gross amount, commission, VAT, exchange fee, TAF fee, rebate, notes) using a native `<details className="form-collapsible">` section whose `<summary>` displays the live net fee total. All inputs SHALL remain mounted in the DOM for form state and accessibility. When positive quantity and unit price (or slip gross amount) are entered, `TradeForm` SHALL render a live summary bar showing subtotal, net fees, and estimated net cost (BUY) or net proceeds (SELL).

#### Scenario: TradeForm displays live cost/proceeds summary while typing

- **WHEN** the user enters quantity `10`, unit price `185.5`, and commission `1.5` for a BUY trade
- **THEN** the live summary bar displays the subtotal `$1855.00`, net fees `$1.50`, and estimated net cost `$1856.50`

#### Scenario: Collapsible secondary section stays mounted and summarizes net fees

- **WHEN** `TradeForm` renders
- **THEN** fee, slip gross, and notes inputs live inside `.form-collapsible`
- **AND** the summary header reflects the live net fees total

### Requirement: Data-entry modals dismiss on Escape

`TradeForm`, `RemitForm`, and `DividendForm` SHALL listen for the `Escape` key while open and invoke their cancel/close callback.

#### Scenario: Pressing Escape closes TradeForm

- **WHEN** `TradeForm` is open and the user presses `Escape`
- **THEN** `onCancel` is invoked
