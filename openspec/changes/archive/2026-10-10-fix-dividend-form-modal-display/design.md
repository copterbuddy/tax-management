# Design

## Context

See proposal.md - Why. DividendForm (modal) is rendered inside Dashboard.tsx with open prop; CSS class `.modal-overlay` lacks `position: fixed` / `z-index`, so content appears inline instead of overlay. Must match TradeForm / RemitForm modal behavior.

## Goals / Non-Goals

**Goals:**
- DividendForm displays as centered popup overlay when `open=true`
- Overlay click closes form; content click does not close
- Unit tests pass before CSS changes applied (test-first)

**Non-Goals:**
- Changing form fields or validation logic
- Changing Redux logic or localStorage schema

## Decisions

- CSS only: keep component JSX unchanged (minimal risk)
- Add `.modal-overlay` rules: fixed, full viewport, backdrop, z-index 1000+
- Add `.modal-content` rules: relative, centered (flex / margin), z-index 1001+
- Test file: `DividendForm.spec.tsx` using `@testing-library/react` (already in project via jest setup)

## Risks / Trade-offs

- [CSS only] If overlay still not centered, check `<main>` / parent `position` property → add `position: relative` to parent if needed
- [Test] If `@testing-library/react` not installed, use `render` from `react-dom/test-utils` instead — project already uses jest + jsdom so testing-library likely present

## Migration Plan

1. Write `DividendForm.spec.tsx` (test-first) — assert `open={true}` renders overlay, `open={false}` does not; assert overlay click triggers close.
2. Verify test fails initially (modal not visible correctly).
3. Apply CSS fix to `.modal-overlay` / `.modal-content`.
4. Run `npm test` — verify test passes and all existing tests still pass.
