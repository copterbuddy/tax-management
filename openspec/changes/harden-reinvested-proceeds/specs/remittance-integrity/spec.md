# Spec Delta

## Purpose

Guarantees that a remittance is either applied and counted in the tax figures or rejected and reported, so no remittance can be dropped in silence and no tax-year total can shrink without the user being told why. Covers both capital-gain and dividend remittances.

## ADDED Requirements

### Requirement: A rejected remittance is reported, never dropped in silence
WHEN a submitted remittance is rejected by the rule set, the system SHALL not store it, SHALL leave every tax-year total unchanged, and SHALL report a translated message naming the affected trade and the reason for rejection. Discarding a remittance without reporting it SHALL NOT be an accepted outcome.

#### Scenario: Rejected amount is not positive
- **WHEN** the user submits a remittance whose USD amount is zero or negative
- **THEN** no remittance is stored, the tax-year totals are unchanged, and a translated message states that the amount must be positive

#### Scenario: Rejected amount exceeds the remaining proceeds
- **WHEN** the user submits a remittance larger than what remains of the sell trade's proceeds, beyond the shared money tolerance
- **THEN** no remittance is stored, the tax-year totals are unchanged, and the message names the sell trade and the amount still available

#### Scenario: Rejected because the sell trade does not match
- **WHEN** a remittance is submitted against a sell trade it does not belong to
- **THEN** no remittance is stored, the tax-year totals are unchanged, and the message states that the remittance does not match the sell trade

### Requirement: A rejection leaves the form open with the entered values
When a submission is rejected, the system SHALL keep the remittance form open with the user's entered values so the mistake can be corrected, and SHALL close it only once the remittance has actually been stored.

#### Scenario: Form stays open after rejection
- **WHEN** the user submits a remittance that the rule set rejects
- **THEN** the form remains open, the entered amount, date, FX rate and notes are preserved, and the rejection message is displayed in the form

#### Scenario: Form closes only on success
- **WHEN** the user submits a remittance that the rule set accepts
- **THEN** the remittance is stored, the form closes, and the remittance appears in the list for that sell trade

### Requirement: A stored remittance made inapplicable by a later trade change is surfaced as unresolved
WHEN adding, editing, or deleting a trade makes an already-stored remittance inapplicable, the system SHALL retain that remittance, SHALL report it as unresolved with the trade and the reason, and SHALL NOT let the affected tax-year total change without that report. The report SHALL clear once the data is consistent again.

#### Scenario: Trade edit invalidates a stored remittance
- **WHEN** the user edits a sell trade so its proceeds fall below an amount already remitted against it
- **THEN** the remittance is reported as unresolved, naming the sell trade and the reason, instead of disappearing from the tax-year figures

#### Scenario: Correction clears the report
- **WHEN** the user corrects either the trade or the remittance so that the remittance fits again
- **THEN** the unresolved report clears and the remittance is counted in the tax-year totals as before

#### Scenario: Deleting the remittance clears the report
- **WHEN** the user deletes the remittance that was reported as unresolved
- **THEN** the report clears and no remittance remains against that sell trade

### Requirement: One shared rule set decides acceptance for both the form and storage
The decision to accept a remittance SHALL be produced by a single shared rule set used by both the form's pre-submission check and the storage path, so the two cannot disagree. The money tolerance SHALL be defined in one place and applied identically by every check.

#### Scenario: Form and storage agree on rejection
- **WHEN** a remittance fails the shared rule set in the form
- **THEN** the storage path would reject the same remittance for the same reason

#### Scenario: Amount within tolerance of the remaining proceeds is accepted
- **WHEN** the entered amount differs from the computed remaining proceeds by less than the shared money tolerance
- **THEN** both the form and the storage path accept it and the remittance is stored

#### Scenario: Amount beyond tolerance is rejected by both
- **WHEN** the entered amount exceeds the computed remaining proceeds by more than the shared money tolerance
- **THEN** both the form and the storage path reject it

### Requirement: Dividend remittance rejections are reported the same way
A rejected dividend remittance SHALL be handled identically to a rejected capital-gain remittance: not stored, the dividend figures unchanged, and a translated message naming the dividend and the reason.

#### Scenario: Dividend remittance exceeds the remaining dividend income
- **WHEN** the user submits a dividend remittance larger than the amount still available to remit for that dividend
- **THEN** no dividend remittance is stored, the dividend figures are unchanged, and a translated message names the dividend and the amount still available