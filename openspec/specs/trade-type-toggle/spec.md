# Spec: Trade Type Toggle

## Purpose

The trade form's trade-type control: where it sits in the form, how it is presented and themed as a two-button segmented control, how it is exposed to keyboard and assistive-technology users, and what happens to the rest of the form when the user changes it.

## Requirements

### Requirement: Trade type is the first field in the trade form

The trade-type control SHALL be the first element inside the trade form, positioned above the trade date and spanning the full width of the form, so that the choice that governs every other field is made before any of them.

#### Scenario: Add-form opens with trade type first

- **WHEN** the user opens the add-trade form
- **THEN** the trade-type control is the first field rendered, above the date field
- **AND** it occupies the full width of the form rather than sharing a row with another field

#### Scenario: Type control stays first and full width on narrow screens

- **WHEN** the form is rendered in the narrow single-column layout
- **THEN** the trade-type control remains the first field and full width
- **AND** the date and symbol fields stack below it

### Requirement: Trade type is presented as a two-button segmented control

The trade type SHALL be selected with two side-by-side buttons — BUY on the left, SELL on the right — inside a shared container. The native `<select>` dropdown SHALL NOT be used.

#### Scenario: Both options are visible at once

- **WHEN** the trade form is displayed
- **THEN** two buttons labelled with the localized BUY and SELL labels are visible simultaneously
- **AND** no dropdown, popup, or expanded list is required to discover either option

### Requirement: The selected type is colour-coded and the other stays neutral

The selected BUY button SHALL use a green tint and the selected SELL button SHALL use a red tint, including background, border, and text. The unselected button SHALL remain transparent with a neutral border and muted text.

#### Scenario: BUY is selected

- **WHEN** the trade type is BUY
- **THEN** the BUY button shows the green selected treatment with bold text
- **AND** the SELL button shows the transparent neutral treatment

#### Scenario: SELL is selected

- **WHEN** the trade type is SELL
- **THEN** the SELL button shows the red selected treatment with bold text
- **AND** the BUY button shows the transparent neutral treatment

### Requirement: Selected-type colours keep readable contrast in both themes

Selected-state text colour SHALL meet WCAG AA contrast (at least 4.5:1) against its own selected background in both the light and the dark theme. The treatment SHALL be a tint rather than a solid saturated fill, because the dark-theme green is a light pastel that cannot carry white text.

#### Scenario: Light theme

- **WHEN** the light theme is active
- **THEN** selected BUY and selected SELL text are each at least 4.5:1 against their backgrounds

#### Scenario: Dark theme

- **WHEN** the dark theme is active, whether set explicitly or through the OS preference
- **THEN** selected BUY and selected SELL text are each at least 4.5:1 against their backgrounds

### Requirement: The type control exposes single-selection semantics

The two buttons SHALL be exposed as a single-choice group: a wrapper with `role="radiogroup"` that is labelled by the visible "trade type" label, and two children with `role="radio"` and `aria-checked` reflecting the current type. Keyboard users SHALL be able to move the selection with the arrow keys, `Home`, and `End`, and activate with `Space` or `Enter`.

#### Scenario: Assistive technology announces the group and selection

- **WHEN** a screen reader reaches the trade-type control
- **THEN** it announces the group by its visible label and reports which of the two options is checked

#### Scenario: Keyboard changes the selection

- **WHEN** focus is on the selected type button and the user presses an arrow key, `Home`, or `End`
- **THEN** the selection moves to the corresponding option and focus follows it
- **AND** the newly selected button is the only one in the tab order

#### Scenario: Focus is visible

- **WHEN** the type button is focused by keyboard
- **THEN** a visible focus ring in the theme's colour for that type is shown

### Requirement: Changing the trade type clears all entered values except the date

When the user selects a type different from the current one, every entered value SHALL be reset — symbol, provider, quantity, price, commission, VAT, exchange fee, TAF, rebate, and notes — and any form-level error SHALL be cleared. The trade date SHALL be preserved.

#### Scenario: Switching from BUY to SELL clears the form

- **WHEN** the user has entered values in a BUY form and selects SELL
- **THEN** symbol, quantity, price, fees, rebate, and notes are empty
- **AND** provider is back to its default value
- **AND** any previously displayed form-level error is gone

#### Scenario: Switching from SELL to BUY clears the form

- **WHEN** the user has selected a held position in a SELL form and selects BUY
- **THEN** symbol is empty and the symbol field returns to a free-text input
- **AND** provider is back to its default value and is enabled

#### Scenario: The date survives a type change

- **WHEN** the user changes the trade type after choosing a date
- **THEN** the chosen date is unchanged

### Requirement: Re-selecting the active type leaves the form untouched

Selecting the type that is already active SHALL be a no-op: no field is cleared and no error is touched.

#### Scenario: Clicking the already-selected button

- **WHEN** BUY is the active type and the user clicks BUY again
- **THEN** the values already entered in the form remain exactly as they were

### Requirement: Trade type can be changed while editing an existing trade

The trade-type control SHALL be interactive when editing an existing trade; it SHALL NOT be disabled. A type change made during an edit is subject to the same clearing behavior and the same validation guards as an add, and is only committed when the user saves.

#### Scenario: Type buttons are enabled during an edit

- **WHEN** the user opens an existing trade for editing
- **THEN** both trade-type buttons are interactive and the current type is selected

#### Scenario: Abandoning an edit change

- **WHEN** the user changes the type during an edit and then cancels the dialog
- **THEN** the stored trade keeps its original type and values

### Requirement: A type change that breaks lot availability is blocked

A type change SHALL be rejected with a form-level error, leaving the stored data untouched, when the resulting trade set has a SELL that FIFO cannot satisfy. This applies when saving a type change on an existing trade.

#### Scenario: Type change invalidates a later SELL

- **WHEN** the user changes a trade's type such that some SELL no longer has enough lots to match
- **THEN** the form shows an error explaining the conflict and nothing is saved
- **AND** the originally stored trade is unchanged

### Requirement: A SELL with recorded remittances cannot be converted to BUY

A SELL trade that has remittance records SHALL NOT be convertible to BUY, because the remittances belong to the gain produced by that SELL and would be discarded. The attempt SHALL be blocked with an explanatory message rather than silently losing data.

#### Scenario: Blocked conversion with remittances present

- **WHEN** the user opens a SELL trade that has at least one remittance recorded and selects BUY
- **THEN** the conversion is refused with a message telling the user to remove the remittances first
- **AND** the trade remains a SELL

#### Scenario: Conversion allowed when no remittances exist

- **WHEN** the user opens a SELL trade with no remittance records and selects BUY
- **THEN** the change is allowed, and other applicable guards still apply