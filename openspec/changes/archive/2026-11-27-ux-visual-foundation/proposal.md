# Proposal: UX Visual Foundation (Loop 1)

## Why

The current UI displays complete financial and tax data, but several visual friction points cause eye fatigue during extended review:
- `--color-text-tertiary` has low contrast (`#94a3b8` on `#ffffff` ≈ 2.5:1) on table headers and KPI labels.
- `Sarabun` and `JetBrains Mono` are declared in CSS tokens but never loaded in `index.html`, causing inconsistent Thai/numeric typography fallback.
- Multiple KPI cards use full-surface tinted gradients simultaneously, creating visual noise instead of guiding attention to the primary figure.
- Scattered emoji icons across tabs, KPI cards, header controls, and table action buttons introduce inconsistent visual weight and color clutter.
- Three minor CSS bugs degrade polish: `.remit-text` is clipped inside `.remit-progress` (`height: 6px; overflow: hidden`), an unclosed comment at `src/index.css:1827` risks invalidating `.doc-link` rules, and a global `*` 400ms transition makes interactive hover states feel sluggish.

## What Changes

1. **CSS & Visual Bug Fixes**: Fix the `.remit-progress` clipping bug by moving `.remit-text` outside the 6px bar track, repair the broken comment in `src/index.css`, and scope theme transitions away from the global `*` selector.
2. **Typography & Contrast**: Load `Sarabun` and `JetBrains Mono` in `index.html`; raise `--color-text-tertiary` contrast to AA-readable levels in both light and dark modes; replace heavy zebra striping with calm row dividers and generous cell padding.
3. **Calm KPI Card Styling**: Replace full-card colored gradients on `positive`, `negative`, and `warning` KPI variants with clean `--color-surface` cards + subtle left accent borders, reserving the soft tinted fill for `highlight` so visual hierarchy is immediate.
4. **Monochrome SVG Icon System**: Introduce a lightweight `src/components/Icons.tsx` module (zero external dependencies) and replace UI chrome emojis in `Dashboard`, `TabNav`, `TradesTab`, `DividendTab`, `TradeTable`, and `RemittanceLog`.
5. **Test Suite Health**: Fix the pre-existing missing `onSetRemittanceDocRef` prop in `src/components/DividendTab.spec.tsx` so all test suites pass.

## Non-Goals

- No changes to calculation engines, Redux state shape, or localStorage schemas.
- No changes to tab layout order, KPI count, or table column structure (addressed in Loop 2).
- No changes to modal form fields or notification dialogs (addressed in Loop 3).
