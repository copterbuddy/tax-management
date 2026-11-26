# Spec Delta

## MODIFIED Requirements

### Requirement: Calculation engines remain pure and framework-agnostic

Modules under `src/engine/` (`fifoEngine.ts`, `dividendEngine.ts`, `filingSummary.ts`) SHALL contain pure functions with no imports from React, Redux, or browser DOM/storage APIs, so every assessable-income and filing-summary calculation can be unit-tested in isolation.

#### Scenario: Engine modules import only domain types, constants, and sibling engines

- **WHEN** imports of modules under `src/engine/` are inspected
- **THEN** none import `react`, `react-redux`, `@reduxjs/toolkit`, or access `localStorage` or `window`
