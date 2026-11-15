# Spec Delta

## ADDED Requirements

### Requirement: The mark-reinvested dialog accepts any amount up to the balance it displays

The dialog SHALL validate the entered amount in whole cents against the same balance it displays and prefills, so the prefilled amount always submits, and an amount one cent above the displayed balance is refused with that balance in the message.

#### Scenario: A balance carrying float noise still submits its prefilled amount

- **WHEN** the outstanding balance is `0.30000000000000004`, displayed and prefilled as `0.30`, and the user submits without editing
- **THEN** the amount is accepted and recorded as `0.30`

#### Scenario: One cent above the displayed balance is refused

- **WHEN** the displayed balance is `0.30` and the user enters `0.31`
- **THEN** the form refuses to submit and the message names the balance as `0.30`

#### Scenario: A typed amount equal to the displayed balance is accepted

- **WHEN** the displayed balance is `146.43` and the user types `146.43`
- **THEN** the amount is accepted and recorded

#### Scenario: Refusal uses the amount the user can see

- **WHEN** any amount is refused
- **THEN** the message shows the displayed balance, never a longer unrounded figure

### Requirement: A refused reinvested record is reported to the user

When a reinvested amount cannot be recorded, the system SHALL leave every stored figure untouched and SHALL show a dismissible message on the Trades tab, in the active language, until the user dismisses it or a later record succeeds.

#### Scenario: A refused record changes nothing

- **WHEN** a submitted amount exceeds the sale's available balance at the moment it is applied
- **THEN** the sale's gain, its remaining balance, the outstanding list, and every tax year summary are unchanged

#### Scenario: The refusal is visible on the Trades tab

- **WHEN** a submitted amount is refused
- **THEN** a message appears on the Trades tab near the outstanding list, and the dialog closes

#### Scenario: The user can dismiss the message

- **WHEN** the message is showing and the user dismisses it
- **THEN** the message disappears and no stored figure changes

#### Scenario: A later successful record clears the message

- **WHEN** the message is showing and a subsequent amount is recorded successfully
- **THEN** the message disappears without a separate dismissal

#### Scenario: The message speaks the interface language

- **WHEN** the interface language is Thai
- **THEN** the message and its dismiss control appear in Thai, and in English when the language is English

#### Scenario: The refusal is not a blocking alert

- **WHEN** a submitted amount is refused
- **THEN** the message is inline, with no blocking browser alert and no auto-dismissing notification

#### Scenario: A stale message does not survive a reload

- **WHEN** the app is reloaded after a refusal
- **THEN** no refusal message is shown until another refusal occurs