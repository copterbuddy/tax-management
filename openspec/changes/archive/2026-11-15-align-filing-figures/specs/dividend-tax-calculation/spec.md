# Spec Delta

## Purpose

What a filer copies off the dividend card: the gross dividend of the remitted slice is the amount a return asks for, reported beside the THB actually received.

## MODIFIED Requirements

### Requirement: Reportable dividend income uses the remittance-date exchange rate

The system SHALL convert a remittance's dividend income at the exchange rate in effect on the **remittance date**, never at the dividend-payment-date rate. It SHALL report two figures for the selected year: the **gross dividend** of the remitted slice — the amount a Thai return asks for — and the **THB actually received**, which is the gross amount less the withholding credit. The gross figure SHALL be the one presented as the amount to declare.

#### Scenario: Full remittance where both exchange rates differ

- **WHEN** a dividend of USD 1,000 gross is received with 15% withheld tax leaving USD 850 net, recorded at an exchange rate of 30 THB per USD
- **AND** the full USD 850 is later remitted into Thailand at an exchange rate of 31 THB per USD
- **THEN** the received amount of that remittance is 26,350 THB
- **AND** the gross dividend of the same remittance is 31,000 THB
- **AND** neither figure is 25,500 THB

#### Scenario: Reported income is independent of the dividend-date exchange rate

- **WHEN** two dividend records have identical gross, withholding, net and remittance amounts
  and identical remittance-date exchange rates, but different dividend-date exchange rates
- **THEN** both records produce the same received amount and the same gross dividend

#### Scenario: Reported income equals actual received amount

- **WHEN** a remittance of USD 500 is recorded at an exchange rate of 31 THB per USD
- **THEN** the received amount is 15,500 THB

#### Scenario: Gross exceeds the received amount by the withholding credit

- **WHEN** a remittance reports 13.548745 THB received and a withholding credit of 2.390955 THB
- **THEN** its gross dividend is 15.9397 THB
- **AND** the difference equals the withholding credit

#### Scenario: Both figures are labelled by basis

- **WHEN** the dividend summary renders
- **THEN** the gross dividend is presented as the amount to declare
- **AND** the received amount is presented separately, labelled as net of withholding
- **AND** neither figure is labelled simply "income"