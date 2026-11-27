# Design: UX v7 — Styled Status Badges, Sticky Table Headers & One-Click Filing Copy

## Decisions

1. **Status Pill Badges (`src/index.css`)**:
   - `.badge`: `display: inline-flex; align-items: center; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 600; line-height: 1.3; white-space: nowrap;`
   - `.badge-success`: `--color-success-bg` / `--color-success` / `1px solid var(--color-success-border)`
   - `.badge-warning`: `--color-warning-bg` / `--color-warning` / `1px solid var(--color-warning-border)`
   - `.badge-neutral`: `--color-surface-hover` / `--color-text-secondary` / `1px solid var(--color-border)`
2. **Sticky Headers & Sort State (`src/index.css` + `src/components/TradeTable.tsx`)**:
   - `.trade-table thead th`: `position: sticky; top: 0; z-index: 2; background: var(--color-table-header-bg);`
   - `.trade-table th.is-sorted`: `color: var(--color-primary);`
   - Set `aria-sort={sortField === field ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}` on sortable headers in `TradeTable.tsx`.
3. **Copy Filing Summary (`src/components/FilingSummarySheet.tsx`)**:
   - Export `IconCopy` and `IconCheck` in `src/components/Icons.tsx`.
   - Add `filingCopy` and `filingCopied` i18n keys to `en/common.json` and `th/common.json`.
   - On click, format the 4 filing figures as clean multiline text and write to `navigator.clipboard?.writeText(...)`, toggling `copied` state for 2 seconds.
