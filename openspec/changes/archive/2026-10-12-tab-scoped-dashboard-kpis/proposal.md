# Proposal

## Why

The Dividend tab is cluttered because the dashboard renders capital-gain content on every tab, not
only on the tab it belongs to. Measured by rendering the dashboard with seeded data and switching to
the Dividend tab: **13 KPI cards** are on screen, of which **7 render above the tab nav** (4
capital-gain cards + 3 per-provider cards), and **two year dropdowns** sit on the page at once — a
labelled tax-year select above the tabs and an unlabelled dividend-year select inside the table
header. A user must scroll past two rows of cards that do not describe dividends, and must not mix
up two visually identical year controls, before reaching a single dividend row.

## What Changes

- Move the tab navigation up to sit directly below the dashboard header, above all tab content.
- Move the four capital-gain KPI cards and the per-provider breakdown row out of the shared area and
  into the Trades tab content.
- Move the tax-year filter and the data-freshness indicator into the Trades tab content, so the
  tax-year control is only shown where it has an effect.
- The Dividend tab and the Remittances tab render no capital-gain summary cards.
- Label the Dividend tab's year control ("ปีปันผล" / "Dividend Year") using the `divYear`
  translation key that already exists but is unused, so it is distinguishable from the tax-year
  control.
- Correct the Dividend tab empty-state hint so it points at the year control that actually filters
  that tab (today it points at the tax-year filter above, which does not affect dividends).
- Fix two incidental defects in the Dividend tab's summary area and rows: the unremitted KPI card
  requests a `warning` variant the `KpiCard` component does not support, and the per-record row
  fragment in the table body has no React `key`.

## Capabilities

### New Capabilities

- `dashboard-tab-layout`: what each dashboard tab renders — where the tab nav sits, which summary
  cards belong to which tab, which year control each tab exposes and how it is labelled, and the
  guidance shown when a tab has no rows for the selected year.

### Modified Capabilities

None. The existing `dividend-tracker` requirement ("DividendTab renders with table, KPI, and year
filter") stays true: the Dividend tab still renders its own KPI cards, year filter and table. This
change alters what is rendered *around* the tab content, which no existing capability describes.

## Impact

Affected code:

| File | Change |
|---|---|
| `src/components/Dashboard.tsx` | Tab nav moves above content; tax-year filter, data-freshness, 4 KPI cards and provider row move into the Trades tab block |
| `src/components/DividendTab.tsx` | Year control gets a label; empty-state hint corrected; unremitted KPI variant corrected; row fragment gets a key |
| `src/i18n/locales/th/dividend.json`, `src/i18n/locales/en/dividend.json` | Reuse `divYear`; reword the "no dividends this year" hint |
| `src/index.css` | `.year-filter` and `.kpi-grid` now sit inside tab content — verify spacing/alignment |

Not affected: `src/engine/*`, `src/store/*`, `src/validation/*`, `src/types/trade.ts`, storage keys,
tax rules, persisted data shape, and the dividend/capital-gain calculations.

## Non-goals

- Unifying the tax-year and dividend-year state into one source of truth. Both are remittance-year
  based, so they could be merged, but the two selectable-year lists are computed differently
  (trade/remittance years vs. remittance/dividend years) and merging them is a behavior change that
  needs its own decision. Deferred to a separate change.
- Reducing the Dividend tab's 6 KPI cards to 4, or moving the WHT/remitted figures to a secondary
  row. Raised during exploration but not confirmed as wanted.
- Showing per-tab headline numbers on the tab buttons themselves.
- Fixing the pre-existing `## Purpose` section errors in the `commission-fee-fields`,
  `dividend-tracker` and `sell-symbol-dropdown` specs.
