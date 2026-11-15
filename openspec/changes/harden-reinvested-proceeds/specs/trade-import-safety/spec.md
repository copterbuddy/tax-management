# Spec Delta

## Purpose

Governs what replacing the trade list may do to the records FIFO cannot derive — the remittances and reinvested amounts recorded against a sale — so that importing trades can never silently destroy history, whether by dropping the records of a sale that still exists or by quietly discarding a remittance that no longer fits its sale. A record that no longer fits is kept and appears unresolved rather than deleted; how that unresolved state is displayed, corrected, and excluded from totals belongs to `remittance-integrity`.

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

### Requirement: An import that leaves a recorded remittance unsupported keeps it and flags it

An imported trade list SHALL keep every remittance recorded against a sale it still contains, including a remittance the sale's new proceeds can no longer support. That record SHALL be retained and marked unresolved (unapplied) — never dropped and never silently re-applied — while the import is still applied to every sale. Flagging SHALL leave the record's amount, date, FX rate and notes intact.

#### Scenario: A shrunken sale keeps its remittances and flags only what no longer fits

- **WHEN** a sale carrying two remittances of 75 each is imported with a revenue of 100
- **THEN** both remittances are still present with their original amounts and dates, the first remains applied and counted, the second is marked unresolved and excluded from the year totals, and the imported revenue is applied

#### Scenario: The flagged record is not silently dropped or re-applied

- **WHEN** an import leaves a remittance unable to fit its sale
- **THEN** the record survives the import for a later correction, and its amount is not counted as remitted while it is flagged

#### Scenario: An import that fits flags nothing

- **WHEN** every surviving sale's new proceeds still cover its recorded remittances
- **THEN** the import is applied, each surviving sale keeps its records, and no record is marked unresolved

#### Scenario: The unresolved record stays visible

- **WHEN** a flagged remittance belongs to the selected year
- **THEN** it is shown in the remittance list as unresolved rather than omitted, as `remittance-integrity` requires

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