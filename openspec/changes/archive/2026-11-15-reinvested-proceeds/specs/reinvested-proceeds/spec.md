# Spec Delta

## Purpose

Lets a realized gain record the part of its proceeds that was spent on another offshore purchase before any
money returned to Thailand, so those proceeds stop being reported as unreturned cash while remaining fully
accounted for in the tax record.

## ADDED Requirements

### Requirement: A realized gain records proceeds spent on another offshore purchase

Each realized gain SHALL be able to carry an optional USD amount describing how much of its own sale proceeds
was spent on another offshore purchase rather than returned to Thailand. The amount is entered by the user,
applies to one sell trade, and an absent or empty value SHALL read as zero.

#### Scenario: Amount is recorded against a gain

- **WHEN** the user records a reinvested amount for a sell trade's realized gain
- **THEN** that gain carries the amount, and the amount survives adding, editing or deleting other trades and
  survives reloading the application

#### Scenario: No amount is recorded

- **WHEN** a gain has no reinvested amount
- **THEN** the gain behaves exactly as it does when the amount is zero

#### Scenario: Amount cannot exceed what is still available

- **WHEN** the user records a reinvested amount larger than the gain's available balance
- **THEN** the amount is not recorded and a translated message states the largest amount that can be recorded

#### Scenario: Deleting the sale removes its recorded amount

- **WHEN** the sell trade behind a gain with a recorded amount is deleted
- **THEN** the recorded amount is deleted with that sale and no other gain is affected

### Requirement: A sale's available balance excludes remitted and reinvested proceeds

The available balance of a sale SHALL be its revenue minus the total already remitted minus the amount recorded
as reinvested. Every place in the application that reports or enforces what is still available for a sale SHALL
use this value.

#### Scenario: Balance falls by the reinvested amount

- **WHEN** a gain with revenue R, remitted M and a recorded reinvested amount of X is inspected
- **THEN** its available balance is R − M − X, and that is the balance shown wherever the gain's remaining
  proceeds are displayed

#### Scenario: Remitting reduces the balance

- **WHEN** a remittance is recorded against a gain that also has a reinvested amount
- **THEN** the available balance falls by the remitted amount and is never reduced twice for the same proceeds

### Requirement: A remittance above the available balance is refused

A remittance against a gain SHALL be refused when its amount exceeds the gain's available balance by more than
the application's shared money tolerance, and the refusal SHALL leave the stored tax figures unchanged.

#### Scenario: Remittance equal to the balance is accepted

- **WHEN** the user records a remittance equal to the gain's available balance
- **THEN** the remittance is stored and the balance becomes zero

#### Scenario: Remittance of proceeds already recorded as reinvested is refused

- **WHEN** the user tries to remit an amount that is only available as reinvested proceeds
- **THEN** the remittance is refused and the refusal reports the available balance

### Requirement: Outstanding proceeds are summed from per-gain clamped amounts

The outstanding-proceeds figure for a tax year SHALL be the sum, over the realized gains whose sell date falls
in that year, of the larger of zero and revenue minus remitted minus reinvested. Each gain SHALL be clamped on its
own, so one gain cannot reduce another gain's outstanding balance. The tax year's total reinvested amount SHALL
be reported alongside it.

#### Scenario: Reinvested proceeds are not outstanding

- **WHEN** a gain's revenue is fully covered by remittances and recorded reinvested proceeds
- **THEN** that gain contributes nothing to the outstanding figure

#### Scenario: A sale with no remittances is outstanding

- **WHEN** a sale in the tax year has no remittances at all
- **THEN** its whole available balance contributes to the outstanding figure

#### Scenario: A sale remitted in a later year is settled

- **WHEN** a sale in the tax year was fully remitted in the following year
- **THEN** its balance for the sell year is zero and it contributes nothing to that year's outstanding figure

#### Scenario: Other figures keep the remittance-year basis

- **WHEN** the outstanding figure is reported alongside the year's remitted total and estimated tax
- **THEN** those two figures count every remittance dated in that tax year, including one whose sale happened in
  an earlier year, and exclude a remittance dated in another year

#### Scenario: Partly returned proceeds stay outstanding

- **WHEN** a gain's revenue is partly remitted and partly recorded as reinvested, leaving a remainder
- **THEN** only the remainder contributes to the outstanding figure

#### Scenario: One over-recorded gain cannot mask another

- **WHEN** one gain records more remitted and reinvested proceeds than its revenue while another gain in the same
  year has an unremitted remainder
- **THEN** the over-recorded gain contributes zero and the other gain's remainder is still reported

### Requirement: The Trades tab lists gains that still have an outstanding balance

The Trades tab SHALL list every realized gain whose sell date falls in the selected tax year and whose available
balance is greater than zero, showing enough of each gain to recognise it and offering the two actions that
resolve it. A sale with no remittances SHALL be listed.

#### Scenario: A gain with a balance is listed

- **WHEN** a gain in the selected tax year has an available balance greater than zero
- **THEN** it appears in the outstanding list with its identifying details and its outstanding amount

#### Scenario: A fully reinvested sale is reachable

- **WHEN** a sale in the tax year has no remittances and all of its proceeds recorded as reinvested
- **THEN** it is listed until its full balance is covered, so the amount can be corrected or part-remitted later

#### Scenario: A resolved gain is not listed

- **WHEN** a gain's available balance is zero or less
- **THEN** it does not appear in the outstanding list

#### Scenario: The list follows the tax year

- **WHEN** the user selects a different tax year
- **THEN** the outstanding list shows only the gains of that year

### Requirement: The outstanding view covers the sales of one year only

The outstanding figure and the outstanding list SHALL be a current-balance view of the gains sold in the selected
tax year. A gain from an earlier year that still has a balance SHALL NOT appear in a later year's figure or list,
and no copy SHALL claim the figure is the complete outstanding total across all years.

#### Scenario: An earlier year's outstanding sale is absent from a later year

- **WHEN** a sale dated 2025 still has an unremitted balance and the user selects 2026
- **THEN** the 2026 outstanding figure and list do not contain it

#### Scenario: The sale's own year still shows it

- **WHEN** the user selects 2025
- **THEN** that sale appears in the 2025 outstanding list with its current balance, whatever has been remitted
  since

#### Scenario: The list names the sell year it covers

- **WHEN** the outstanding list renders for a tax year
- **THEN** its heading states the year whose sales it covers

#### Scenario: Copy does not claim a cross-year total

- **WHEN** the outstanding figure's title, subtitle and tooltip are inspected in either language
- **THEN** none of them claims to total all outstanding proceeds across every year

### Requirement: Each outstanding gain offers remit and mark-reinvested actions

Every row of the outstanding list SHALL offer a remit action that opens the existing remittance form with that
gain already selected, and a mark-reinvested action that opens a dialog prefilled with the gain's full
outstanding balance and editable down. The dialog SHALL NOT accept an amount above the outstanding balance.

#### Scenario: Remit action preselects the gain

- **WHEN** the user chooses the remit action on an outstanding row
- **THEN** the remittance form opens with that sell trade already selected

#### Scenario: Mark-reinvested dialog is prefilled

- **WHEN** the user chooses the mark-reinvested action on a row with outstanding balance B
- **THEN** the dialog opens with the amount field set to B and accepts a smaller positive amount

#### Scenario: Reducing the amount leaves a remainder

- **WHEN** the user records a reinvested amount smaller than the outstanding balance
- **THEN** the remainder stays in the outstanding list and can be remitted later

#### Scenario: Full amount clears the row

- **WHEN** the user records a reinvested amount equal to the outstanding balance
- **THEN** the row leaves the outstanding list and the outstanding figure on the card falls by that amount

### Requirement: Recording reinvested proceeds changes no tax figure

Recording a reinvested amount SHALL NOT alter the taxable gain of any year, the gain proportion of a sale, the
FIFO matching of lots, or any exchange-rate handling. Only gains remitted to Thailand remain taxable.

#### Scenario: Taxable gain is unchanged

- **WHEN** a reinvested amount is recorded against a gain that already has remittances
- **THEN** the year's taxable gain in THB is exactly what it was before the amount was recorded

#### Scenario: Reinvested proceeds are not taxable income

- **WHEN** a gain is fully recorded as reinvested and has no remittances in the year
- **THEN** it adds nothing to the year's taxable gain

#### Scenario: The tax basis stays the remittance year

- **WHEN** a remittance is dated in the tax year
- **THEN** it still counts toward that year's remitted total and estimated tax even if its sale happened in an
  earlier year

### Requirement: Records without a reinvested amount behave exactly as before

The reinvested amount SHALL be an optional part of a stored gain. Loading data that predates it SHALL succeed
unchanged, with no migration, no backfill and no change to how existing records are stored or interpreted.

#### Scenario: Existing stored data loads unchanged

- **WHEN** the application loads gains stored before this capability existed
- **THEN** they load without error and each is treated as having a reinvested amount of zero

#### Scenario: Storage location is unchanged

- **WHEN** gains are saved after a reinvested amount is recorded
- **THEN** they are saved where they were saved before, with the amount added to each gain record

#### Scenario: Previously valid remittances stay valid

- **WHEN** a stored remittance was accepted before this capability existed
- **THEN** it is still accepted and still counted after it