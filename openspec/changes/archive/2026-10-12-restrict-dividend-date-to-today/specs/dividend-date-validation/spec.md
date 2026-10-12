# Spec: dividend-date-validation

## Capability

Enforce that the dividend "Date Received" field cannot exceed the current date.

## Requirements

## ADDED Requirements

### Requirement: DividendForm date input max attribute set to today

The DividendForm date input SHALL render with a `max` attribute equal to today's date in `YYYY-MM-DD` format, so the browser's native date picker blocks selection of future dates.

#### Scenario: date input renders with max attribute

- **WHEN** the DividendForm is rendered with `open={true}`
- **THEN** the date input's `max` attribute SHALL equal today's date
- **AND** the input SHALL NOT accept future dates via the picker

### Requirement: Future date submission is rejected with validation error

When the user saves a dividend form with a date that exceeds today, the form SHALL display a validation error and SHALL NOT submit.

#### Scenario: future date is rejected

- **WHEN** the DividendForm has date set to tomorrow
- **AND** the user clicks Save
- **THEN** an error banner SHALL display the date-future validation message
- **AND** `onClose` SHALL NOT be called

### Requirement: Today's and past dates are accepted

When the user saves a dividend form with a date equal to today or earlier, the form SHALL accept the date and proceed to `onSave`.

#### Scenario: today's date is accepted

- **WHEN** the DividendForm has date set to today
- **AND** the user clicks Save
- **THEN** no future-date validation error SHALL appear
- **AND** `onSave` SHALL be called with the record

#### Scenario: past date is accepted

- **WHEN** the DividendForm has date set to yesterday
- **AND** the user clicks Save
- **THEN** no future-date validation error SHALL appear
- **AND** `onSave` SHALL be called with the record

### Requirement: Date-future error message localized

When a date-future validation error is displayed, the message SHALL respect the current UI locale (Thai or English).

#### Scenario: error message in Thai

- **WHEN** the UI language is Thai
- **AND** a future date is submitted
- **THEN** the error banner SHALL display "วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้"

#### Scenario: error message in English

- **WHEN** the UI language is English
- **AND** a future date is submitted
- **THEN** the error banner SHALL display "Date received cannot be later than today"
