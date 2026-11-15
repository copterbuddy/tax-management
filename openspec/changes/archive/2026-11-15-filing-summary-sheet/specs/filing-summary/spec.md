# Spec Delta

## Purpose

The year-end view a filer opens before filling a return: the figures to copy, whether the year is ready, and a file to hand to an accountant.

## ADDED Requirements

### Requirement: One action opens the year's filing summary

The dashboard SHALL expose a single action, labelled with the selected tax year, that opens a sheet naming that year. The sheet SHALL be dismissible and SHALL NOT require navigation to another tab.

#### Scenario: The action names the year

- **WHEN** the selected tax year is 2026
- **THEN** the action reads as the filing summary for 2026
- **AND** activating it opens a sheet whose title names 2026

#### Scenario: The sheet closes without changing anything

- **WHEN** the user closes the sheet
- **THEN** it disappears
- **AND** no trade, remittance, dividend, or summary figure changes

### Requirement: The summary reports the figures a return asks for

The sheet SHALL report, for the selected year: the gross dividend income, the withholding credit on it, the capital-gain assessable income, and the total assessable income of the two. Every figure SHALL be stated in THB and SHALL equal the values the app already computes for that year.

#### Scenario: Figures match the year's computed values

- **WHEN** the 2026 book reports 15.94 THB of gross dividends, 2.39 THB of credit and 10,958.25 THB of capital-gain income
- **THEN** the sheet shows those three values
- **AND** the total assessable income is shown as 10,974.19 THB

#### Scenario: A year with no figures still opens

- **WHEN** the selected year has no remittances at all
- **THEN** the sheet opens with zero figures rather than failing

### Requirement: The sheet states whether the year is ready to file

The sheet SHALL list what blocks filing, in the active language: that no remittance exists for the year, and how many of the year's remittances are flagged unresolved. When nothing blocks it, the sheet SHALL say the year is ready instead of showing an empty list.

#### Scenario: A year without remittances is reported

- **WHEN** the selected year has no remittances
- **THEN** the sheet reports that there is nothing remitted for that year

#### Scenario: Unresolved remittances are counted

- **WHEN** two of the year's remittances are flagged unresolved
- **THEN** the sheet reports that two remittances need attention

#### Scenario: A clean year says it is ready

- **WHEN** the year has remittances and none are flagged
- **THEN** the sheet states that the year is ready to file
- **AND** it does not render an empty issue list

### Requirement: The figures export to a spreadsheet file

The sheet SHALL offer one export action that produces a CSV containing the year, each figure, and its label. The file SHALL begin with a UTF-8 byte-order mark so spreadsheet software reads Thai labels correctly, and SHALL contain one row per figure with the label and the amount in separate columns.

#### Scenario: Export contains every figure once

- **WHEN** the user exports the 2026 summary
- **THEN** the file contains the year, the gross dividend, the credit, the capital gain and the total
- **AND** each appears exactly once

#### Scenario: Thai labels survive a spreadsheet import

- **WHEN** the exported file is opened in a spreadsheet application
- **THEN** the Thai labels are readable and not mojibake
