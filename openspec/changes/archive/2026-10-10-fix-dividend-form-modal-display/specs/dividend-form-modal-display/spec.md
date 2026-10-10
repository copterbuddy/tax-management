# Spec Delta

## Purpose

Defines the observable behavior of the DividendForm: when open, the dividend entry form SHALL be displayed as a centered modal overlay above all page content; when closed, it SHALL be hidden and never render in the page flow.

## ADDED Requirements

### Requirement: DividendForm renders as modal overlay when open

The DividendForm component SHALL render a full-viewport backdrop overlay with a centered content panel when opened, overlaying all page content with proper z-index separation. The form SHALL NOT render as inline elements appended below the dividend table.

#### Scenario: DividendForm modal visible when open
- **WHEN** `DividendForm` is rendered with `open={true}`
- **THEN** a full-viewport overlay element SHALL be present in the DOM
- **THEN** the modal content panel SHALL be centered within the viewport

#### Scenario: DividendForm hidden when closed
- **WHEN** `DividendForm` is rendered with `open={false}`
- **THEN** the overlay element SHALL NOT be present in the DOM
- **THEN** no modal content panel SHALL be rendered anywhere in the page flow

### Requirement: Overlay click closes the modal

Clicking on the backdrop (overlay area outside the content panel) SHALL close the modal by invoking `onClose`.

#### Scenario: Click backdrop closes modal
- **WHEN** the modal is open
- **WHEN** the user clicks on the backdrop overlay
- **THEN** `onClose` SHALL be invoked
- **THEN** the modal SHALL be hidden

### Requirement: Content click does not close modal

Clicking inside the content panel SHALL NOT close the modal.

#### Scenario: Click content keeps modal open
- **WHEN** the modal is open
- **WHEN** the user clicks inside the content panel
- **THEN** `onClose` SHALL NOT be invoked
- **THEN** the modal SHALL remain open
