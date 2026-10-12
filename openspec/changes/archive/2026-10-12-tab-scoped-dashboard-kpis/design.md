# Design

## Context

See `proposal.md` — Why for the measurements behind this change.

Current state, from reading the code:

- `src/components/Dashboard.tsx` (509 lines) owns the page header, the tax-year filter, the
  data-freshness indicator, the four capital-gain KPI cards, the per-provider breakdown row, the tab
  nav, and all modal state for trades, remittances and dividends. Only the tab *content* is
  delegated: `TradeTable`, `DividendTab`, `RemittanceLog`.
- `DividendTab.tsx` (448 lines) already owns its own KPI row, its own year selector and its own
  empty states — the pattern this change extends to the Trades tab.
- `RemittanceLog.tsx` keeps its year filter in **local component state** (`remitYear`,
  `useState(new Date().getFullYear())`) and never reads `trade.selectedTaxYear`.
- `DividendTab` reads `dividend.displayYear` from `dividendSlice`; `TradeTable` receives
  `selectedYear` from `trade.selectedTaxYear`. The two year selections are independent state in two
  slices.
- `KpiCard` defines variants `default | positive | negative | neutral | highlight` and maps each
  non-default variant to a `kpi-<variant>` class. The stylesheet defines `.kpi-positive`,
  `.kpi-negative`, `.kpi-highlight` only. `kpi-neutral` is requested in several places and has no
  rule; `warning` is requested once (`DividendTab.tsx:228`) and is not in the union at all.
- Design tokens `--color-warning`, `--color-warning-bg`, `--color-warning-border` exist in both the
  light and dark blocks of `src/index.css`.
- `divYear` already exists in both `th/dividend.json` ("ปีปันผล") and `en/dividend.json`
  ("Dividend Year") and is currently referenced by no component.
- Quality gates are `npm test` (Jest 30 + ts-jest + jsdom, 9 suites / 182 tests green today) and
  `npm run lint`. `npm run build` is already red for unrelated reasons (see project context).
- There is no test that renders `Dashboard`. Importing `src/i18n/index.ts` from a Jest spec currently
  fails, because the inline ts-jest `tsconfig` in `jest.config.ts` does not set `resolveJsonModule`
  while the module imports its locale JSON directly.

## Goals / Non-Goals

**Goals:**

- Make the boundary between "shared page chrome" and "tab content" explicit in the component tree,
  so a tab cannot accidentally inherit another tab's summary cards.
- Keep the diff reviewable: no changes to engines, slices, storage keys, or the persisted data shape.
- Leave the repo's test gates green, and add coverage for the tab-scoping behavior this change
  introduces.

**Non-Goals:**

- Introducing a routing layer or URL-addressable tabs. Tab selection stays local `useState` in
  `Dashboard`.
- Unifying `trade.selectedTaxYear` and `dividend.displayYear`. See Open Questions.
- Redesigning the KPI card visuals beyond adding the one missing variant.

## Decisions

### D1 — Extract a presentational `TradesTab.tsx`, mirroring `DividendTab`

The Trades tab content (tax-year filter + data-freshness, four capital-gain KPI cards, per-provider
row, `TradeTable`) moves into a new `src/components/TradesTab.tsx` that receives data and handlers as
props, exactly as `DividendTab` and `RemittanceLog` do.

*Alternatives considered:*

- **Inline conditional blocks in `Dashboard.tsx`** (`{activeTab === 'trades' && (<>…</>)}`). Smallest
  diff, but it leaves 509-line `Dashboard.tsx` as the only place where the tab boundary exists, and
  the boundary stays implicit — the same shape of mistake that produced this change would be easy to
  repeat. Rejected.
- **Keep the KPIs global and only reorder** the tab nav above them. Fixes the scroll cost but leaves
  capital-gain cards visible on the Dividend tab, which is the reported complaint. Rejected.

Consequence: `Dashboard.tsx` keeps the tab nav, the `activeTab` state and all modal state, and stops
rendering the capital-gain summary markup.

### D2 — The tax-year filter moves into the Trades tab

Verified before deciding: nothing outside the Trades tab reads `trade.selectedTaxYear`. `TradeTable`
consumes it as a prop; `RemittanceLog` uses its own `remitYear`; `DividendTab` uses
`dividend.displayYear`.

*Alternative considered:* leave the tax-year filter above the tab nav. Rejected — a year control that
has no effect on the active tab, sitting immediately beside a second year control that does, is the
confusion reported in the exploration.

Consequence, accepted deliberately: while the Dividend or Remittances tab is active, the tax year is
neither visible nor changeable. In this app the tax year is a Trades-tab concept, and the control is
one tab click away.

### D3 — Reuse the existing `divYear` translation key for the dividend year label

`divYear` already resolves to "ปีปันผล" / "Dividend Year" in both locales. Adding a second key with
the same text would create two sources of truth for one label.

The Thai empty-state hint (`noDividendsYearHint`, currently "ลองเปลี่ยนปีภาษีด้านบน หรือเพิ่มรายการปันผลใหม่")
must be reworded: "ด้านบน" points at the tax-year filter, which does not filter dividends. The
English hint is already period-neutral and only needs the same treatment for symmetry.

### D4 — Add a `warning` variant to `KpiCard` instead of reusing `negative` or `highlight`

`DividendTab.tsx:228` asks for `warning` on the "unremitted" card, which means "not yet brought into
Thailand — pending action", not a loss. `negative` would read as a loss; `highlight` already means
"this is the headline number" on the trades side. The design system already ships warning tokens for
both themes, so the variant is additive: one entry in the `KpiCardProps` union and one
`.kpi-card.kpi-warning` rule mirroring `.kpi-card.kpi-positive`.

Not fixed here: `kpi-neutral` is passed in several call sites and has no CSS rule, so it silently
renders as default. Harmless today, recorded as an open question rather than swept into this change.

### D5 — Key the dividend list entry, not the inner row

The current code maps records to a bare `<>` fragment holding the record's `<tr>` plus its optional
remittance-history `<tr>`. The list *entry* is the pair, so the fragment gets the key
(`<Fragment key={record.id}>`), not the inner row.

### D6 — Add `resolveJsonModule` to the Jest ts-jest tsconfig, then add component specs

The spec requirements are all render-level (which cards are present, which labels are shown, which
variants are requested). Verifying them needs a spec that renders the dashboard tabs, and that means
importing `src/i18n/index.ts`, which imports locale JSON. Verified failing today:

```
src/i18n/index.ts:11:22 - error TS7042: Module './locales/th/common.json' was resolved to
'.../common.json', but '--resolveJsonModule' is not used.
```

Fix: add `resolveJsonModule: true` to the inline `tsconfig` object inside `jest.config.ts`. This only
adds a compiler option to ts-jest; it does not change how any existing suite runs.

Rendering `Dashboard` also needs `window.matchMedia`, which jsdom does not implement and
`ThemeContext.getInitialTheme` calls unconditionally — today no spec renders a component that uses
`useTheme`, so nothing has hit it. Add a minimal stub to `jest.setup.ts` (one line, applied to every
suite) rather than repeating it per spec.

*Alternative considered:* mock `react-i18next` in the new specs so no i18n import is needed. Rejected
— the spec asserts the actual label text in both languages, and a mocked `t()` returning keys would
make that assertion meaningless.

## Risks / Trade-offs

- **Moving markup breaks an existing test** → run the full suite (`npm test`) after the move; today's
  baseline is 9 suites / 182 tests green, and no existing spec renders `Dashboard`, so the expected
  blast radius is zero. Verify rather than assume.
- **Removing the always-visible tax number feels like lost information on the Dividend tab** → the
  number stays one tab click away, and the tab nav is now the first thing on the page. If it turns
  out to be missed, per-tab headline numbers on the tab buttons are the follow-up (explicit
  non-goal here).
- **`.kpi-grid` / `.year-filter` move inside tab content and change spacing** → confirmed real during
  apply: `.dashboard` is a flex column with `gap: var(--space-6)`, so nesting the blocks inside
  `.trades-tab` collapsed the rhythm between the year filter, the KPI grid, the provider row and the
  trade table. Mitigated by giving `.trades-tab` the same flex-column gap, and verified in a headless
  browser at 1440 / 1024 / 768 / 480 px: every consecutive pair now measures 22–23 px (≈ 1.5rem).
  This repo has previously been bitten by media-query rules leaking between desktop and mobile
  blocks, so the breakpoint behaviour was checked in the same pass.
- **The Jest config change affects every suite** → it adds a compiler option only. Confirm with the
  full suite, not just the new specs.
- **A `warning` variant added now could be reused inconsistently later** → it is defined once in
  `KpiCard` and in the stylesheet, next to the other variants, so the next caller finds it by reading
  the component.

## Migration Plan

No data migration: no storage key, no persisted shape, and no engine or slice changes. Deployment is
a normal client rebuild. Rollback is reverting the commit — the change is confined to components,
two locale files, one stylesheet rule and one Jest option.

## Open Questions

- Whether `trade.selectedTaxYear` and `dividend.displayYear` should become one selection. Both are
  remittance-year based, but their selectable-year lists are computed differently
  (`tradeSlice.getAvailableYears` = trade years ∪ remittance years; `dividendEngine.getDividendYears`
  = remittance years ∪ dividend years of unremitted records). Merging is a behavior change that needs
  its own spec delta; deferred to a separate change.
- Whether the Dividend tab should keep all six KPI cards, or show four and demote the WHT/remitted
  figures to a secondary row. Raised in exploration, not confirmed as wanted.
- Whether to remove the dead `neutral` variant or give it a stylesheet rule.
