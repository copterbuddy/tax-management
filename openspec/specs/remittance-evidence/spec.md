# remittance-evidence Specification

## Purpose
The pointer from a recorded remittance to the document that proves it: what can be attached, how it survives storage, how the interface exposes it, and what it refuses.

## Requirements

### Requirement: A remittance can carry an optional document link

A capital-gain remittance and a dividend remittance SHALL each accept an optional document link identifying the supporting document (bank slip, broker confirmation, withholding certificate). The field SHALL be optional; a remittance without it SHALL be valid. Only `http` and `https` URLs SHALL be accepted.

#### Scenario: A remittance without a link is valid

- **WHEN** a remittance is recorded without a document link
- **THEN** it is accepted and stored
- **AND** no validation error mentions a document

#### Scenario: An http link is stored

- **WHEN** a remittance is saved with `https://example.com/slip.pdf`
- **THEN** the stored remittance reports that link

#### Scenario: A non-web link is refused

- **WHEN** a link such as `javascript:alert(1)` or a bare file path is submitted
- **THEN** it is refused with a message
- **AND** the stored remittance is unchanged

### Requirement: The link survives storage, recompute and import

The document link SHALL be retained when records are loaded, re-saved, recomputed from trades, or imported. It SHALL NOT be dropped, and it SHALL move with its remittance when the remittance does.

#### Scenario: The link is intact after a reload

- **WHEN** a stored remittance carrying a link is loaded and saved again
- **THEN** the link is unchanged

#### Scenario: The link survives a recompute

- **WHEN** an unrelated trade is edited and gains are recomputed
- **THEN** every remittance keeps its link

#### Scenario: The link survives a dividend import

- **WHEN** a dividends file without links is imported over records that have them
- **THEN** the links are still present afterwards

### Requirement: The row exposes the document

Each remittance row SHALL present one control that states whether a document is attached: activating it SHALL open the document in a new tab when one is attached, and SHALL offer to attach, change or remove one otherwise.

#### Scenario: An attached document opens

- **WHEN** the user activates the control on a remittance that has a link
- **THEN** the document opens in a new tab

#### Scenario: An empty row offers the dialog

- **WHEN** the user activates the control on a remittance without a link
- **THEN** a dialog opens where a link can be entered
- **AND** saving it marks the row as having a document

#### Scenario: A document can be removed

- **WHEN** the user removes the link from a remittance that has one
- **THEN** the remittance is stored without the field
- **AND** the row stops showing a document as attached
