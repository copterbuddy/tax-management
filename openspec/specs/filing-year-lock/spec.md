# filing-year-lock Specification

## Purpose
The record of what was filed: a frozen snapshot per tax year, the comparison against today's figures, and how a lock is removed.

## Requirements

### Requirement: A year can be locked with the figures that were filed

Locking a tax year SHALL store the four filing figures of that moment — gross dividend, withholding credit, capital-gain income and their total — together with a timestamp. The snapshot SHALL survive a reload and SHALL NOT change when the underlying records change.

#### Scenario: Locking stores the figures

- **WHEN** the user locks tax year 2026 while the sheet shows 15.94, 2.39, 10,958.25 and 10,974.19
- **THEN** the stored snapshot holds those four values and a timestamp

#### Scenario: The snapshot does not follow later edits

- **WHEN** a remittance is edited after the year was locked
- **THEN** the stored snapshot still holds the figures from the moment of locking

### Requirement: The sheet reports whether the year moved since filing

While a year is locked, the sheet SHALL show when it was locked and SHALL list every figure that differs from the snapshot by more than a cent. When every figure matches, the sheet SHALL state that the year still matches what was filed.

#### Scenario: A changed figure is named

- **WHEN** the locked snapshot holds 10,958.25 of capital-gain income and the current figure is 11,000.00
- **THEN** the sheet reports that the capital-gain figure changed

#### Scenario: An unchanged year says it matches

- **WHEN** every current figure equals the snapshot
- **THEN** the sheet states that the year still matches what was filed

### Requirement: A lock can be removed

Unlocking SHALL delete the snapshot for that year and leave every other record untouched.

#### Scenario: Unlocking removes the snapshot

- **WHEN** the user unlocks a year
- **THEN** no snapshot remains for it
- **AND** the sheet returns to offering a lock action

#### Scenario: Unlocking changes no ledger record

- **WHEN** a year is unlocked
- **THEN** trades, remittances, dividends and their totals are unchanged
