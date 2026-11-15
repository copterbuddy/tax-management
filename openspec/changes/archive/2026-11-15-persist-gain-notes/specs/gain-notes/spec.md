# Spec Delta

## Purpose

An optional free-text note a user attaches to a realized gain — why the proceeds went where they did, why a figure looks unusual — and the guarantees that it survives every recompute and import while never touching a tax figure.

## ADDED Requirements

### Requirement: A realized gain can carry an optional note

A realized gain SHALL accept an optional free-text note. A gain without a note SHALL be valid and complete. A note SHALL be stored with its gain and SHALL survive being read back and written again.

#### Scenario: A gain without a note is valid

- **WHEN** a gain is loaded or computed and carries no note
- **THEN** the gain is valid and no validation error mentions a note

#### Scenario: A stored note survives a load and save cycle

- **WHEN** a stored gain carrying note "เงิน 204.75 ถูกใช้ซื้อ SPGI" is loaded, re-saved, and loaded again
- **THEN** the note is still present and unchanged

### Requirement: The note survives recompute and import for a sale that still exists

Recomputing gains from trades SHALL carry a sale's note forward, keyed by the sale's identity, exactly as it carries remittances and a recorded reinvested amount. Importing a trade list SHALL likewise keep the note of every sale the imported list still contains.

#### Scenario: Editing an unrelated trade keeps the note

- **WHEN** a gain carries a note and a different trade is edited
- **THEN** the gain still carries the same note

#### Scenario: Changing a sale's remittance keeps the note

- **WHEN** a gain carrying a note has a remittance added, edited, or deleted
- **THEN** the note is still present afterwards

#### Scenario: Importing the same list keeps the note

- **WHEN** the loaded trade list is imported again
- **THEN** every gain keeps its note

### Requirement: A note disappears only with its sale

When a sale no longer exists — deleted, or absent from an imported list — its gain and therefore its note SHALL be removed. No note SHALL be transferred to another sale.

#### Scenario: Deleting the sale removes the note

- **WHEN** a sell trade carrying a note is deleted
- **THEN** no gain for that sale remains and no note appears on any other gain

### Requirement: A note never changes a tax figure

A note SHALL NOT participate in any computation of proceeds, cost basis, gain, remittance totals, outstanding proceeds, or taxable gain. Adding or removing a note SHALL leave every tax-year figure identical.

#### Scenario: Adding a note changes no figure

- **WHEN** a note is added to a gain
- **THEN** that year's taxable gain, remitted total, outstanding balance and provider rows are unchanged