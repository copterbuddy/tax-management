# Spec Delta

## Purpose

The dividend remittance balance rule and the annual summary: what a remittance may not exceed, how the message and the accepted limit stay the same number, and how the summary exposes the gross income a filer declaring gross needs.

## MODIFIED Requirements

### Requirement: A remittance may not exceed the unremitted balance

The system SHALL reject a remittance whose USD amount exceeds the net dividend amount still awaiting remittance by more than half a cent, and SHALL reject a non-positive amount. A rejected remittance SHALL NOT alter the stored dividend. The rejection message SHALL quote the remaining balance rounded to whole cents, and an amount equal to that quoted figure SHALL be accepted. The recorded remaining balance SHALL never be negative.

#### Scenario: Amount above the remaining balance is rejected

- **WHEN** USD 850 net has USD 500 remitted and USD 350 remains
- **AND** a remittance of USD 500 is attempted
- **THEN** the system rejects it with a message naming the remaining balance

#### Scenario: The balance the interface shows is accepted

- **WHEN** a remittance leaves USD 0.19649999999999998 unremitted, displayed as USD 0.20
- **AND** the user submits USD 0.20
- **THEN** the remittance is accepted and the recorded balance becomes USD 0

#### Scenario: The exact remainder is accepted

- **WHEN** that same dividend is submitted with USD 0.1965
- **THEN** the remittance is accepted
- **AND** the recorded balance is exactly USD 0, never a negative number

#### Scenario: Zero or negative amount is rejected

- **WHEN** a remittance of 0 or a negative USD amount is attempted
- **THEN** the system rejects it

#### Scenario: A successful remittance updates the balance

- **WHEN** a valid remittance of USD 350 is recorded against a dividend with USD 500 already remitted
- **THEN** total remitted becomes USD 850 and the unremitted balance becomes USD 0

## ADDED Requirements

### Requirement: The annual summary reports the gross equivalent of the remitted slice

For a selected tax year the system SHALL report the gross dividend income represented by that year's remittances, computed as the sum of the reportable income and the withholding-tax credit of those remittances. The reportable income itself SHALL keep its existing meaning — the THB actually received — and neither figure SHALL replace the other.

#### Scenario: Gross equivalent includes the withheld credit

- **WHEN** a remittance reports 7.1566 THB of income and 1.2629 THB of WHT credit
- **THEN** the summary reports a gross equivalent of 8.4195 THB
- **AND** the reportable income remains 7.1566 THB

#### Scenario: A dividend without withholding has equal figures

- **WHEN** a remittance carries no withholding tax
- **THEN** its gross equivalent equals its reportable income

#### Scenario: Only the selected year's remittances count

- **WHEN** a dividend is partly remitted in 2026 and the rest in 2027
- **THEN** each year's summary reports the gross equivalent of its own remittances only
- **AND** the two years together equal the full gross dividend

### Requirement: The interface shows both filing bases

The dividend tab SHALL display the gross equivalent beside the reportable income for the selected year, labelled so that neither figure can be mistaken for the other, with an explanation that the reportable figure is the THB received and the gross figure adds the withheld credit.

#### Scenario: Both figures are visible for a year with remittances

- **WHEN** the selected year contains at least one remittance
- **THEN** the tab shows the reportable income and the gross equivalent as separate figures

#### Scenario: The labels state which basis each figure is

- **WHEN** the two figures are rendered
- **THEN** each carries a label or tooltip naming its basis, and neither is labelled simply "income"