# Spec Delta

## ADDED Requirements

### Requirement: DividendRemitForm submit button state reflects form validity

The dividend remittance form (DividendRemitForm) SHALL enable its submit button only when all required fields contain valid values (amount > 0, FX rate > 0, date selected), and SHALL disable it otherwise.

#### Scenario: Submit enabled when all fields are valid

- **WHEN** DividendRemitForm is open with amountUSD = 100, remitFxRate = 35.0, and remitDate = '2026-10-10'
- **THEN** the submit button SHALL be clickable (no `disabled` attribute)
- **THEN** clicking it SHALL call `onRemit` with the remittance data

#### Scenario: Submit disabled when amount is missing or invalid

- **WHEN** DividendRemitForm is open with amountUSD = 0, remitFxRate = 35.0, and remitDate = '2026-10-10'
- **THEN** the submit button SHALL be disabled

#### Scenario: Submit disabled when FX rate is missing or invalid

- **WHEN** DividendRemitForm is open with amountUSD = 100, remitFxRate = 0, and remitDate = '2026-10-10'
- **THEN** the submit button SHALL be disabled

#### Scenario: Submit disabled when date is missing

- **WHEN** DividendRemitForm is open with amountUSD = 100, remitFxRate = 35.0, and remitDate = ''
- **THEN** the submit button SHALL be disabled