# Spec Delta

## Purpose

What the capital-gain summary card claims to be: assessable income, named as such, with the caveats the number cannot show.

## ADDED Requirements

### Requirement: The capital-gain card names assessable income, not tax payable

The first capital-gain summary card SHALL be titled as assessable income, in both languages, and SHALL NOT be titled as tax. Its tooltip SHALL state that the figure is assessable income before the 150,000 baht exemption, before other income and before progressive rates — that it is not the tax payable — and SHALL state how the figure is computed: the gain portion of each remittance converted at the remittance-date rate, matched by FIFO lots, with exchange-rate differences not treated as income.

#### Scenario: The card is titled as income in Thai

- **WHEN** the Trades tab renders in Thai
- **THEN** the card title reads "เงินได้ที่ต้องยื่น (ประมาณการ)"
- **AND** the title does not contain the word "ภาษี"

#### Scenario: The card is titled as income in English

- **WHEN** the Trades tab renders in English
- **THEN** the card title reads "Assessable Income (est.)"
- **AND** it does not claim to be tax payable

#### Scenario: The tooltip carries the three caveats

- **WHEN** the card's tooltip is read
- **THEN** it states that the figure is before the 150,000 baht exemption and other income
- **AND** it states that the figure is not the tax payable
- **AND** it states the computation: gain portion of each remittance at the remittance-date rate, FIFO lots, exchange-rate differences not treated as income

#### Scenario: Retitling changes no figure

- **WHEN** the card is retitled
- **THEN** the value it displays is unchanged from the computed assessable gain for the selected year