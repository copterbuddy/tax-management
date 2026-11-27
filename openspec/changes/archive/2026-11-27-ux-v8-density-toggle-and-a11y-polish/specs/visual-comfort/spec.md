# visual-comfort Delta Specification

## ADDED Requirements

### Requirement: Users can toggle between Comfortable and Compact display density

The dashboard header SHALL provide a density toggle button that switches between `comfortable` (default) and `compact` display density, sets `data-density` on `document.documentElement`, and persists the preference in `localStorage` (`tax_tracker_density`) without hiding any data fields.

#### Scenario: Toggling density updates document attribute and persists preference

- **WHEN** the user clicks the density toggle button in the header
- **THEN** `document.documentElement.getAttribute('data-density')` switches between `comfortable` and `compact`
- **AND** the choice is saved in `localStorage` under `tax_tracker_density`

### Requirement: Animations respect prefers-reduced-motion and main content uses a semantic landmark

`src/index.css` SHALL include a `@media (prefers-reduced-motion: reduce)` rule disabling non-essential transitions and animations, and `Dashboard` SHALL wrap its active tab content in a `<main>` landmark.

#### Scenario: Dashboard renders tab content inside main landmark

- **WHEN** `Dashboard` renders
- **THEN** the active tab panel is contained within a `<main>` element
