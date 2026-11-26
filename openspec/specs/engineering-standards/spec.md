# engineering-standards Specification

## Purpose

Captures the implemented architectural boundaries, component and state conventions, responsive UI rules, and verification gates established for the project (`README.md`, `.specify/memory/constitution.md`, `package.json`).

## Requirements

### Requirement: Calculation engines remain pure and framework-agnostic

Modules under `src/engine/` (`fifoEngine.ts`, `dividendEngine.ts`, `filingSummary.ts`, `taxBrackets.ts`, `taxEstimate.ts`) SHALL contain pure functions with no imports from React, Redux, or browser DOM/storage APIs, so every tax and gain calculation can be unit-tested in isolation.

#### Scenario: Engine modules import only domain types, constants, and sibling engines

- **WHEN** imports of modules under `src/engine/` are inspected
- **THEN** none import `react`, `react-redux`, `@reduxjs/toolkit`, or access `localStorage` or `window`

### Requirement: Redux state and localStorage I/O stay separated from presentational components

Shared domain state SHALL reside in Redux Toolkit slices under `src/store/`, with `Dashboard.tsx` acting as the container connecting Redux state and dispatchers to presentational components that accept data and callbacks via props. Reading and writing `localStorage` for domain records SHALL occur in store slices rather than inside presentational form or table components.

#### Scenario: Child tab and table components receive state via props

- **WHEN** `TradesTab`, `DividendTab`, `RemittanceLog`, `TradeTable`, or `FilingSummarySheet` renders
- **THEN** it consumes domain data and action callbacks passed from `Dashboard.tsx`

### Requirement: User inputs and stored data use Zod schema validation and i18n copy

Forms for trade and capital-gain remittance entry SHALL validate inputs via `react-hook-form` + `zodResolver`, persisted domain arrays SHALL validate via Zod schemas in `src/validation/schemas.ts`, and user-facing UI labels SHALL resolve through `react-i18next` translation keys across Thai (`th`) and English (`en`) locale bundles.

#### Scenario: Forms and persistence validate against Zod schemas

- **WHEN** a user submits `TradeForm` or `RemitForm`, or the store loads persisted arrays from `localStorage`
- **THEN** values are checked by Zod schemas before entering application state

### Requirement: Responsive tables pair desktop and mobile layouts cleanly

Tabular trade and dividend views SHALL adapt across desktop and mobile viewports using paired desktop table and mobile card markup controlled within responsive `@media` rules in `src/index.css`.

#### Scenario: Narrow viewports switch trade and dividend lists to card layout

- **WHEN** the viewport narrows below the mobile breakpoint (`max-width: 639px` / `767px`)
- **THEN** mobile card layouts are shown in place of desktop table columns

### Requirement: Automated Jest tests and lint checks gate changes

Every pure engine module, Redux slice, validation schema, and key UI component SHALL carry co-located `*.spec.ts` or `*.spec.tsx` Jest unit tests executed via `npm test`, and code quality SHALL be checked via `npm run lint` (`oxlint`), alongside Vite dev/build/preview scripts (`npm run dev`, `npm run build`, `npm run preview`).

#### Scenario: Unit tests and linter verify engine and UI behavior

- **WHEN** `npm test` and `npm run lint` run against the codebase
- **THEN** Jest executes all `*.spec.ts(x)` suites and `oxlint` checks source files without relying on backend services
