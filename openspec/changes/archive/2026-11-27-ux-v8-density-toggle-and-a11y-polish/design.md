# Design: UX v8 — Display Density Toggle, Reduced Motion & Landmark Accessibility

## Decisions

1. **Density Hook (`src/hooks/useDensity.ts`)**:
   - Reads `localStorage.getItem('tax_tracker_density')`, defaulting to `'comfortable'`.
   - Applies `document.documentElement.setAttribute('data-density', density)` in `useEffect` and persists on change.
   - Exposes `[density, toggleDensity]` tuple.
2. **Header Control (`src/components/Dashboard.tsx`)**:
   - Export `IconSliders` in `src/components/Icons.tsx`.
   - Render `<button className="theme-toggle density-toggle" aria-pressed={density === 'compact'} ...>` next to the theme toggle in `.header-right`.
   - Wrap tab panels in `<main className="dashboard-main">`.
3. **Compact Mode & Reduced Motion (`src/index.css`)**:
   - `[data-density="compact"]`: tighter `.trade-table td` (`0.45rem 0.75rem`), tighter `.kpi-card` (`var(--space-3) var(--space-4)`), tighter `.dashboard` / `.trades-tab` gaps (`var(--space-4)`).
   - `@media (prefers-reduced-motion: reduce)`: set `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;`.
   - Add `:focus-visible` outline rings on `.form-collapsible-summary`, `.outstanding-summary`, and `.type-filter-btn`.
