# Proposal: UX Layout Hierarchy & Table Progressive Disclosure (Loop 2)

## Why

Even with calmer colors and icons from Loop 1, two structural density problems still cause scanning fatigue:
1. **Unbalanced KPI grids & competing card rows**: `DividendTab` renders 6 KPI cards in a 4-column desktop grid (leaving an awkward 4 + 2 orphan row), while `TradesTab` renders the secondary per-provider breakdown (`kpi-provider-row`) at the exact same visual scale as the 4 primary KPI cards.
2. **Wide 12-column tables without quick filtering**: `TradeTable` spreads 12 columns across a single horizontal row (date, symbol, provider, type, qty, price, fees, total, gain, remitted, taxable, actions), making numbers hard to track across a row, and lacks quick symbol search or BUY/SELL type filtering. `DividendTab` similarly splits `WHT%` and `WHT (USD)` into separate narrow columns.

## What Changes

1. **Balanced KPI Hierarchy**:
   - Style `.kpi-grid-3` on `DividendTab` so its 6 KPI cards form a balanced 3×2 grid on desktop.
   - Style `.kpi-provider-row` in `TradesTab` as a compact secondary breakdown strip (tighter padding, smaller typography, clear secondary visual weight) while preserving all provider figures and existing class contracts.
2. **TradeTable Progressive Disclosure & Quick Filters**:
   - Stack related columns (`Symbol` + `Provider`, `Qty` + `@ Price`) and move itemized fee breakdown + slip gross amount + notes into an **expandable row detail pane** (toggled by clicking the row, matching `DividendTab` without adding extra focusable elements to `<tr>`).
   - Add a quick search input (filtering by symbol or notes) and segmented `All / Buy / Sell` type filter pills in the `TradeTable` toolbar with Thai and English i18n copy.
3. **DividendTab Column Consolidation**:
   - Stack `WHT (USD)` and `WHT%` into a single stacked cell so the dividend table breathes horizontally without losing any figure.

## Non-Goals

- No changes to calculation engines, Redux state, or tax figures.
- No changes to modal forms or browser `alert()` notifications (addressed in Loop 3).
