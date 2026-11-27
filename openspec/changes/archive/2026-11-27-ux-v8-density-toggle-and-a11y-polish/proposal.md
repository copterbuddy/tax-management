# Proposal: UX v8 — Display Density Toggle, Reduced Motion & Landmark Accessibility

## Why

Different users and tasks need different visual density:
- Reviewing a few trades or reading tax summaries feels most restful in **Comfortable** spacing (default).
- Auditing dozens of rows across a full tax year benefits from a **Compact** mode that fits more rows on screen without hiding any column or figure.
- In addition, animations should respect OS `prefers-reduced-motion`, interactive `<summary>` / filter pills need clear `:focus-visible` rings, and the dashboard tab body should sit inside a semantic `<main>` landmark.

## What Changes

1. Add `src/hooks/useDensity.ts` persisting `comfortable` | `compact` in `localStorage` (`tax_tracker_density`) and applying `data-density` on `<html>`.
2. Add a density toggle button (`IconSliders`) to `Dashboard.tsx` header with Thai/English labels in `common.json`, and wrap the active tab body in `<main className="dashboard-main">`.
3. Add `[data-density="compact"]`, `@media (prefers-reduced-motion: reduce)`, and consistent `:focus-visible` rules in `src/index.css`.

## Non-Goals

- No changes to calculation engines, Redux slices, or hidden/removed columns.
