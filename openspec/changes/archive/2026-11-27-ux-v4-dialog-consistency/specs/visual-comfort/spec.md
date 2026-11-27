# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: All modal dialogs share consistent padded body containers, close button styling, and Escape dismissal

`FilingSummarySheet`, `DocRefDialog`, `MarkReinvestedDialog`, and `DividendRemitForm` SHALL wrap their body content in a padded modal container (`.trade-form` or `.modal-body`), use `.btn-close` for the header close button, dismiss when `Escape` is pressed, and dismiss when clicking the backdrop overlay.

#### Scenario: FilingSummarySheet and DocRefDialog dismiss on Escape and backdrop click

- **WHEN** `FilingSummarySheet` or `DocRefDialog` is open and the user presses `Escape` or clicks the overlay backdrop
- **THEN** `onClose` is invoked

#### Scenario: DividendRemitForm and MarkReinvestedDialog dismiss on Escape

- **WHEN** `DividendRemitForm` or `MarkReinvestedDialog` is open and the user presses `Escape`
- **THEN** its close/cancel callback is invoked

### Requirement: Tooltip trigger uses a monochrome SVG info icon

`Tooltip` SHALL render `IconInfo` (`<svg aria-hidden="true">`) as its default trigger icon when no custom `children` are supplied.

#### Scenario: Default Tooltip renders an SVG icon

- **WHEN** `Tooltip` renders without custom children
- **THEN** its trigger button contains an `<svg aria-hidden="true">` element
