# Design: UX Layout Hierarchy & Table Progressive Disclosure (Loop 2)

## Decisions

### 1. Balanced KPI Grids & Secondary Provider Strip (`src/index.css`)
- Add `.kpi-grid.kpi-grid-3` media query rule at `min-width: 1024px`: `grid-template-columns: repeat(3, 1fr);`.
- Style `.kpi-provider-row` as a compact secondary breakdown strip:
  - `.kpi-provider-row .kpi-card`: reduced padding (`var(--space-3) var(--space-4)`), `.kpi-value` at `var(--text-lg)` instead of `var(--text-2xl)`, `.kpi-icon` at `28px × 28px`, subtle elevation so primary KPIs clearly dominate.

### 2. TradeTable Column Stacking, Quick Filters & Expandable Detail Row (`src/components/TradeTable.tsx`)
- Toolbar controls (`.trade-table-controls`):
  - Search box (`.table-search-input`) filtering `symbol` and `notes` case-insensitively.
  - Segmented type filter (`.type-filter-group` with `All`, `BUY`, `SELL` buttons using `aria-pressed`).
  - Existing provider `<select>`.
  - Primary `+ Add Trade` button.
- Reset `searchQuery`, `typeFilter`, and `expandedId` alongside `providerFilter` whenever `selectedYear` changes.
- Desktop table columns (9 columns instead of 12):
  1. Date (sortable)
  2. Symbol / Provider (sortable by symbol; stacks `.symbol-badge` + `.cell-sub` provider)
  3. Type (`BUY` / `SELL` badge)
  4. Qty / Price (stacks `quantity` + `@ $priceUSD` subline)
  5. Total (`td.num.col-total` — preserves `.value-fallback` + `title`)
  6. Gain
  7. Remitted (`.remit-progress-wrap` from Loop 1)
  8. Taxable
  9. Actions (Edit button, Delete button, non-focusable expand chevron icon so `row.querySelectorAll('button, a, input, select, textarea, [tabindex]')` stays length 2!)
- Clicking `<tr>` toggles `expandedId`; action buttons call `e.stopPropagation()`.
- Expanded row (`tr.trade-detail-row > td[colSpan=9]`) renders `.trade-detail-pane` with a clean definition grid of:
  - Gross Amount (slip value or derived fallback)
  - Commission, VAT, Exchange Fee, TAF Fee (for SELL or >0), Commission Rebate, Net Fees
  - Notes (when present)

### 3. DividendTab WHT Stacking (`src/components/DividendTab.tsx`)
- Merge `colWhtPct` and `colWhtUSD` columns into one `WHT` column displaying `$whtAmountUSD` with `whtRate%` as `.cell-sub`, updating `remittance-history-row` `colSpan` from `12` to `11`.
- Add `kpi-grid-3` class to the dividend KPI grid.
