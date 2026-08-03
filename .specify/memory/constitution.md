<!--
Sync Impact Report
- Version change: (uninitialized template) → 1.0.0
- Modified principles: N/A (initial fill of template placeholders)
- Added sections:
  - Core Principles: I. SOLID Principles, II. Component Reusability,
    III. Readable & Document-Centric Code, IV. Unit Testing with Jest,
    V. React Best Practices
  - Section 2: Technology Stack & Architecture Constraints
  - Section 3: Development Workflow & Quality Gates
  - Governance
- Removed sections: N/A
- Follow-up TODOs: none (all placeholders resolved)
-->

# Thai Tax Tracker Constitution

## Core Principles

### I. SOLID Principles
Every class, module, and component MUST adhere to the SOLID principles:
Single Responsibility, Open/Closed, Liskov Substitution, Interface
Segregation, and Dependency Inversion. Business logic MUST live in pure,
framework-agnostic modules (e.g. `src/engine/`) with no side effects, so it
can be reasoned about and tested in isolation. Components MUST depend on
abstractions (props, hooks, injected services) rather than concrete
implementations where a seam is warranted.

### II. Component Reusability
Components MUST be designed for reuse as much as possible. Shared UI
primitives and business components MUST be extracted into dedicated,
self-contained modules with a clear, minimal prop contract. No component
MUST be written inline for a single screen when it can be generalized
without speculative complexity. Reusable components MUST be documented and
covered by tests so they can be safely consumed across features.

### III. Readable & Document-Centric Code
Code MUST be readable and self-documenting: clear naming, small focused
functions, and no unexplained magic values. Every feature MUST be
document-centric — requirements, acceptance criteria, and design decisions
MUST be captured in `docs/` (specs, UX screens, design system) before
implementation, and code MUST reference that documentation. Complex logic
MUST carry inline rationale comments explaining the "why", not just the
"what".

### IV. Unit Testing with Jest (NON-NEGOTIABLE)
Unit testing with Jest is mandatory. Every pure engine function, reducer,
validation schema, and reusable component MUST have corresponding tests
under `*.spec.ts` / `*.spec.tsx`. Tests MUST be written to cover the
acceptance criteria defined in the spec, including edge cases. The test
suite MUST pass (`npm test`) and `tsc --noEmit` MUST pass before any work is
considered complete. Test-first (red-green-refactor) is strongly preferred
for new logic.

### V. React Best Practices
React code MUST follow current best practices as documented by the React
ecosystem (reference up-to-date guidance, e.g. via Context7, before adopting
new APIs). This includes: functional components with hooks, controlled
forms via `react-hook-form` + `zod` validation, state management via Redux
Toolkit, and i18n via `react-i18next`. Components MUST be pure with respect
to their props, side effects MUST be isolated in effects/handlers, and
performance-sensitive patterns (memoization, stable callbacks) MUST be used
only where they provide measurable benefit.

## Technology Stack & Architecture Constraints

The project is a Thai personal-investor tax calculator built with React 19 +
TypeScript 6 + Vite 8 + Redux Toolkit. The following constraints MUST hold:

- **Type safety**: `tsc --noEmit` MUST pass before delivery; no `any` leaks
  into shared contracts.
- **FIFO Engine**: `src/engine/fifoEngine.ts` and `src/engine/dividendEngine.ts`
  MUST remain pure functions with no side effects; pools MUST be isolated by
  symbol + provider.
- **State management**: All shared application state MUST live in Redux
  Toolkit slices under `src/store/`; components MUST read via typed hooks.
- **Validation**: All user input MUST be validated with `zod` schemas under
  `src/utils/validation/`.
- **Internationalization**: All user-facing strings MUST come from i18n
  locale files (`en` / `th`); no hardcoded UI text.
- **Reusability**: Shared UI MUST be extracted into reusable components with
  documented prop contracts rather than duplicated per screen.

## Development Workflow & Quality Gates

- **Document-centric workflow**: Every feature MUST follow the phase order
  BA (spec) → UX (design) → Dev (code) → QA (tests), with each phase's
  output written to `docs/` before the next phase begins. No code MAY be
  written before its spec exists.
- **Quality gates**: A change is complete only when (1) `tsc --noEmit`
  passes, (2) the Jest test suite passes, and (3) the relevant `docs/`
  documents and `docs/tasks.md` are updated.
- **Reusability review**: Before implementing a new component, developers
  MUST check whether an existing reusable component can be extended or
  reused; duplication MUST be justified.
- **Task tracking**: `docs/tasks.md` MUST be updated whenever a Dev or QA
  phase completes.

## Governance

This constitution supersedes all other ad-hoc practices in this repository.
Amendments MUST be documented, approved, and versioned. Any change to a
principle, section, or governance rule MUST increment the version per
semantic versioning: MAJOR for backward-incompatible principle
removals/redefinitions, MINOR for new principles or materially expanded
guidance, PATCH for clarifications and wording fixes. All PRs and reviews
MUST verify compliance with these principles; complexity MUST be justified;
and runtime development guidance lives in the project's `docs/` and
`CLAUDE.md` files.

**Version**: 1.0.0 | **Ratified**: 2026-08-03 | **Last Amended**: 2026-08-03
