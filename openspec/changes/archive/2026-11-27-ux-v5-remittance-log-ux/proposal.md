# Proposal: UX v5 — Remittance Log Calm Layout, Mobile Visibility & Quick Filters

## Why

`RemittanceLog` currently has three UX gaps compared to the Trades tab:
1. **Hidden on mobile viewports**: `RemittanceLog` uses `.trade-table` without a mobile fallback, so `@media (max-width: 639px) { .trade-table { display: none; } }` hides the entire remittance table on phones.
2. **Wide 10-column density**: Splitting `Symbol`, `Provider`, `Amount THB`, and `FX Rate` across separate columns makes scanning across rows tiring.
3. **No quick search or provider filtering**: Users with many remittances in a year cannot filter by symbol, notes, or broker.

## What Changes

1. Add `.remit-log-table` override in `src/index.css` so the remittance table remains visible and horizontally scrollable on narrow viewports instead of vanishing under `<640px`.
2. Stack `Symbol` + `Provider` and `Amount (THB)` + `@ FX` in `RemittanceLog.tsx`, reducing 10 columns to 8 cleaner columns while preserving every figure, footer total, and unapplied marker.
3. Add a quick search input (symbol or notes) and provider filter dropdown to the `RemittanceLog` toolbar (resetting when remittance year changes).

## Non-Goals

- No changes to remittance tax math, unapplied exclusion rules, or document attachment storage.
