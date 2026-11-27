# Tasks: UX v8 — Display Density Toggle, Reduced Motion & Landmark Accessibility

- [x] 1. Create `src/hooks/useDensity.ts` and add `IconSliders` to `src/components/Icons.tsx`.
- [x] 2. Add density toggle i18n keys to `en/common.json` and `th/common.json`.
- [x] 3. Wire `useDensity`, density toggle button, and `<main className="dashboard-main">` landmark into `src/components/Dashboard.tsx`.
- [x] 4. Add `[data-density="compact"]`, `@media (prefers-reduced-motion: reduce)`, and `:focus-visible` polish rules to `src/index.css`.
- [x] 5. Add unit tests for density toggle persistence and `<main>` landmark in `src/components/Dashboard.spec.tsx`.
- [x] 6. Run the FULL Jest test suite (`npm test -- --watchAll=false`), `npm run lint`, and `npx vite build`.
