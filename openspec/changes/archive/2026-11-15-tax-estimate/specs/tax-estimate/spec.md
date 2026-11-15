# Spec Delta

## Purpose

A what-if estimate of the year's personal income tax, derived from the filing figures plus the two things the ledger cannot know.

## ADDED Requirements

### Requirement: The estimate is derived, not entered

The estimate SHALL take the year's assessable income and withholding credit from the filing figures and SHALL accept exactly two inputs: other assessable income and total deductions. Net income SHALL be the assessable total minus deductions, floored at zero.

#### Scenario: Deductions reduce net income

- **WHEN** assessable income is 10,974.19 and deductions are 60,000
- **THEN** net income is 0 and the tax is 0

#### Scenario: Deductions below income

- **WHEN** assessable income is 500,000 and deductions are 100,000
- **THEN** net income is 400,000

### Requirement: The tax follows the progressive brackets

The tax SHALL be computed from the same bracket table the tax planner uses: 0% to 150,000; 5% to 300,000; 10% to 500,000; 15% to 750,000; 20% to 1,000,000; 25% to 2,000,000; 30% to 5,000,000; 35% above.

#### Scenario: A figure inside one band

- **WHEN** net income is 200,000
- **THEN** the tax is 2,500

#### Scenario: A figure spanning bands

- **WHEN** net income is 500,000
- **THEN** the tax is 27,500

### Requirement: The credit is applied and the shortfall stated

The withholding credit SHALL be subtracted from the tax. When the credit is smaller, the section SHALL report the amount still payable; when it is larger, it SHALL report the excess as overpaid rather than showing zero.

#### Scenario: Amount still payable

- **WHEN** the tax is 27,500 and the credit is 2.39
- **THEN** the section reports 27,497.61 payable

#### Scenario: Credit exceeds the tax

- **WHEN** the tax is 1.00 and the credit is 2.39
- **THEN** the section reports 1.39 overpaid

#### Scenario: Marginal rate is shown

- **WHEN** net income is 400,000
- **THEN** the section reports a 10% marginal rate
