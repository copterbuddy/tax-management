# dividend-import-safety Specification

## Purpose
What replacing the dividend list may do to the remittance history stored inside each dividend record, so an import can never silently erase money the user already recorded as returned to Thailand.

## Requirements

### Requirement: Importing a dividend list preserves remittances of records that still exist

Replacing the dividend records SHALL keep every remittance already stored against a record the imported list still contains, adding any remittance the imported record carries and keeping any it omits. Totals SHALL be recomputed from the union so total remitted and the unremitted balance stay consistent.

#### Scenario: A file without remittances keeps the stored ones

- **WHEN** a stored dividend has one remittance and the imported record with the same id carries none
- **THEN** the record still has that remittance afterwards, with its amount, date and FX rate unchanged
- **AND** its total remitted and unremitted balance are unchanged

#### Scenario: A file with a new remittance adds it

- **WHEN** an imported record carries a remittance the stored record does not have
- **THEN** both remittances are present afterwards
- **AND** the totals are recomputed from both

#### Scenario: A shared remittance is not duplicated

- **WHEN** the imported record carries a remittance with the same id as a stored one
- **THEN** exactly one copy remains, and it is the imported version

### Requirement: Records absent from the import are dropped

A dividend record that is not present in the imported list SHALL be removed together with its remittances.

#### Scenario: A vanished dividend takes its history with it

- **WHEN** the imported list no longer contains a dividend that had a remittance
- **THEN** no record for that dividend remains
- **AND** no other record's remittances change

### Requirement: An identical import changes nothing

Importing the list that is already loaded SHALL leave every record, remittance, and annual summary figure identical.

#### Scenario: Re-importing the loaded list is a no-op

- **WHEN** the current dividend list is imported unchanged
- **THEN** every record keeps its remittances
- **AND** each year's summary is unchanged, figure for figure
