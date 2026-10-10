# dividend-tax-calculation Specification

## Purpose
Defines how foreign dividend income is converted into the taxable Thai-baht figure and the
withholding-tax credit a taxpayer may claim, so the numbers a user copies into their annual
tax return are correct and demonstrably so.

## Requirements

### Requirement: Reportable dividend income uses the remittance-date exchange rate

The system SHALL compute the reportable dividend income of a remittance as the remitted USD
amount multiplied by the exchange rate in effect on the **remittance date**. It SHALL NOT use
the exchange rate from the dividend payment date for this figure, regardless of how far the
two dates or rates differ.

The reportable income SHALL equal the actual THB amount received for that remittance.

#### Scenario: Full remittance where both exchange rates differ

- **WHEN** a dividend of USD 1,000 gross is received with 15% withheld tax leaving USD 850 net,
  recorded at an exchange rate of 30 THB per USD
- **AND** the full USD 850 is later remitted into Thailand at an exchange rate of 31 THB per USD
- **THEN** the reportable income of that remittance is 26,350 THB
- **AND** it is not 25,500 THB

#### Scenario: Reported income is independent of the dividend-date exchange rate

- **WHEN** two dividend records have identical gross, withholding, net and remittance amounts
  and identical remittance-date exchange rates, but different dividend-date exchange rates
- **THEN** both records produce the same reportable income

#### Scenario: Reported income equals actual received amount

- **WHEN** a remittance of USD 500 is recorded at an exchange rate of 31 THB per USD
- **THEN** the reportable income and the actual THB received are both 15,500 THB

### Requirement: Withholding-tax credit is proportional to the fraction remitted

The system SHALL compute the foreign withholding-tax credit for a remittance as the
withheld USD amount multiplied by the ratio of remitted USD to net USD, multiplied by the
exchange rate in effect on the remittance date. A remittance that covers the entire net
amount SHALL yield the full withheld amount converted at the remittance-date rate.

#### Scenario: Partial remittance takes a proportional slice

- **WHEN** a dividend has USD 1,000 gross, USD 150 withheld and USD 850 net
- **AND** USD 500 of the net amount is remitted at an exchange rate of 31 THB per USD
- **THEN** the withholding-tax credit for that remittance is 2,735.29 THB

#### Scenario: Final partial remittance completes the credit

- **WHEN** the remaining USD 350 of that same net amount is remitted at an exchange rate of 32 THB per USD
- **THEN** the withholding-tax credit for that remittance is 1,976.47 THB
- **AND** the two credits together equal 4,711.76 THB

#### Scenario: Zero withholding yields zero credit

- **WHEN** a dividend carries no withholding tax because the source country does not levy it
- **THEN** every remittance of that dividend yields a credit of 0 THB

#### Scenario: Credit is zero before any remittance

- **WHEN** a dividend has been recorded but not yet remitted
- **THEN** its reportable income is 0 THB and its withholding-tax credit is 0 THB

### Requirement: A remittance may not exceed the unremitted balance

The system SHALL reject a remittance whose USD amount exceeds the net dividend amount still
awaiting remittance, and SHALL reject a non-positive amount. A rejected remittance SHALL NOT
alter the stored dividend.

#### Scenario: Amount above the remaining balance is rejected

- **WHEN** USD 850 net has USD 500 remitted and USD 350 remains
- **AND** a remittance of USD 500 is attempted
- **THEN** the system rejects it with a message naming the remaining balance

#### Scenario: Zero or negative amount is rejected

- **WHEN** a remittance of 0 or a negative USD amount is attempted
- **THEN** the system rejects it

#### Scenario: A successful remittance updates the balance

- **WHEN** a valid remittance of USD 350 is recorded against that dividend
- **THEN** total remitted becomes USD 850 and the unremitted balance becomes USD 0

### Requirement: Tax year is the year the money was remitted

The system SHALL attribute a dividend to the tax year containing its remittance date, not
the year of the dividend payment date. A dividend contributes to an annual summary only if
at least one remittance for it falls in that year.

#### Scenario: Remittance in a later year than the dividend

- **WHEN** a dividend paid in March 2026 is remitted in February 2027
- **THEN** it contributes to the 2027 summary and not to the 2026 summary

#### Scenario: Partial remittance split across two years

- **WHEN** a dividend is partly remitted in 2026 and the rest in 2027
- **THEN** each year's summary contains only the reportable income and credit of the
  remittances that occurred in that year
- **AND** the two years' amounts together account for the full remitted amount

#### Scenario: Dividend with no remittance in the selected year

- **WHEN** a selected tax year contains no remittance for a given dividend
- **THEN** that dividend is excluded from the summary totals for that year

### Requirement: Annual dividend totals report gross, withholding and remitted amounts consistently

For a selected tax year the system SHALL report the gross dividend income, the withheld tax,
and the net remitted amounts as the portions attributable to that year's remittances. Where
a dividend is remitted in part across several years, the gross and withheld amounts
attributed to a year SHALL be scaled by that year's fraction of the net amount.

#### Scenario: Attribution across a split remittance

- **WHEN** USD 500 of a USD 850 net dividend is remitted in 2026 and USD 350 in 2027
- **AND** the dividend was USD 1,000 gross with USD 150 withheld
- **THEN** the 2026 summary attributes 58.82% of the gross and withheld amounts
- **AND** the 2027 summary attributes the remaining 41.18%

### Requirement: Dividend calculation behaviour is covered by automated tests

The system SHALL have automated tests covering every exported dividend calculation function
and every dividend state action, including the remittance-date exchange rate rule stated
above. The tests SHALL fail if the reportable income of a remittance is computed from any
exchange rate other than the remittance-date rate.

#### Scenario: A wrong exchange rate source fails the suite

- **WHEN** the reportable income of a remittance is changed to use the dividend-date exchange rate
- **THEN** at least one automated test fails

#### Scenario: Every exported calculation is exercised

- **WHEN** the dividend test suite runs
- **THEN** each exported dividend calculation function has at least one passing case
  covering its normal result and its boundary condition

### Requirement: Dividend state transitions are covered by automated tests

The system SHALL have automated tests covering creation, update and deletion of dividend
records, recording and removing a remittance, year selection, bulk import, and clearing all
data, each asserting the resulting state and the persisted result.

#### Scenario: Removing a remittance restores the unremitted balance

- **WHEN** a remittance is removed from a dividend that still has another remittance
- **THEN** total remitted and the unremitted balance are recomputed from the remaining
  remittances only

#### Scenario: Deleting a dividend persists to storage

- **WHEN** a dividend record is deleted
- **THEN** the deletion is reflected in stored data as well as in state

#### Scenario: A dividend with a remittance cannot be silently overwritten

- **WHEN** an update would change the amounts of a dividend that already has a remittance
- **THEN** the resulting state remains internally consistent, with the unremitted balance
  still derivable from the net amount and the remittances recorded
