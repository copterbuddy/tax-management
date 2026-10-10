# dividend-remit-submit-state Specification

## Purpose
Defines when the dividend remittance submit button is enabled or disabled, so a user with all required fields filled can always submit the remittance.

## Requirements

### Requirement: Submit enabled when amount and FX rate are valid positive numbers

The remittance submit button SHALL be enabled only when the amount is a positive number greater than zero AND the FX rate is a positive number greater than zero.

#### Scenario: Submit enabled with valid amount and FX rate

- **WHEN** the remittance form has amountUSD = 100 and remitFxRate = 35.0
- **THEN** the submit button SHALL NOT have the `disabled` attribute
- **THEN** clicking the submit button SHALL invoke the submit handler

#### Scenario: Submit disabled when amount is zero

- **WHEN** the remittance form has amountUSD = 0 and remitFxRate = 35.0
- **THEN** the submit button SHALL have the `disabled` attribute

#### Scenario: Submit disabled when FX rate is zero

- **WHEN** the remittance form has amountUSD = 100 and remitFxRate = 0
- **THEN** the submit button SHALL have the `disabled` attribute

#### Scenario: Submit disabled when amount is negative

- **WHEN** the remittance form has amountUSD = -50 and remitFxRate = 35.0
- **THEN** the submit button SHALL have the `disabled` attribute

#### Scenario: Submit disabled when FX rate is negative

- **WHEN** the remittance form has amountUSD = 100 and remitFxRate = -1.5
- **THEN** the submit button SHALL have the `disabled` attribute

#### Scenario: Submit disabled when amount is empty string

- **WHEN** the remittance form has amountUSD = '' (empty) and remitFxRate = 35.0
- **THEN** the submit button SHALL have the `disabled` attribute

### Requirement: Submit disabled when remittance date is missing

The remittance submit button SHALL be disabled when no remittance date has been selected.

#### Scenario: Submit disabled without a date

- **WHEN** the remittance form has amountUSD = 100, remitFxRate = 35.0, and remitDate = ''
- **THEN** the submit button SHALL have the `disabled` attribute

#### Scenario: Submit enabled with a date selected

- **WHEN** the remittance form has amountUSD = 100, remitFxRate = 35.0, and remitDate = '2026-10-10'
- **THEN** the submit button SHALL NOT have the `disabled` attribute
