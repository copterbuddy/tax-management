# Spec Delta

## Purpose

Governs what replacing the trade list may do to the records FIFO cannot derive — the remittances and reinvested amounts recorded against a sale — so that importing trades can never silently destroy history for sales that still exist.

## ADDED Requirements

### Requirement: Importing a trade list preserves records for sales that still exist

Replacing the trade list SHALL keep every remittance and every recorded reinvested amount that belongs to a sale present in the imported list, and SHALL recompute each such sale's gain from the imported trade data.

#### Scenario: An identical import preserves every record

- **WHEN** the current trade list is imported unchanged
- **THEN** every sale keeps its remittances and its recorded reinvested amount, and each sale's gain, total remitted, and remaining balance are unchanged

#### Scenario: Remittance history survives the import

- **WHEN** a sale carried two remittances before the import and survives it
- **THEN** that sale still shows two remittances, with the same amounts and dates

#### Scenario: A partial import keeps the surviving sale's records

- **WHEN** the imported list contains every sale except one
- **THEN** each surviving sale keeps its remittances and reinvested amount

### Requirement: Records for sales absent from the imported list are dropped

The import SHALL remove the records of a sale only when that sale is no longer present in the imported list, because a gain with no sale cannot be matched to any proceeds.

#### Scenario: Records of a vanished sale are dropped

- **WHEN** the imported list no longer contains a sale that had a remittance
- **THEN** no gain for that sale remains, and no other sale's records change

#### Scenario: A sale that reappears later starts empty

- **WHEN** a sale was dropped by an earlier import and is imported again with the same identity
- **THEN** the sale's gain exists with no remittances and no reinvested amount

### Requirement: A no-op import changes no summary

Importing the list that is already loaded SHALL leave every tax year summary identical, including the remitted total, the taxable gain, and the outstanding balance.

#### Scenario: Summaries survive an identical import

- **WHEN** the loaded list is imported again
- **THEN** each tax year summary is unchanged, figure for figure

#### Scenario: Outstanding proceeds stay where they were

- **WHEN** a sale with an outstanding balance is imported again with its recorded reinvested amount
- **THEN** that sale still appears in its year's outstanding list with the same remaining balance

### Requirement: Clearing all trades still removes every record

Wiping the trade list SHALL continue to remove all gains, remittances, and reinvested amounts, because the user asked for a clean slate rather than a replacement of the trade set.

#### Scenario: Clear removes gains and summaries

- **WHEN** the user clears all trades
- **THEN** no gains, remittances, reinvested amounts, or year summaries remain