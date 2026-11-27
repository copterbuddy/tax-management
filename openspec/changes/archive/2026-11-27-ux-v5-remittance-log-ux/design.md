# Design: UX v5 — Remittance Log Calm Layout, Mobile Visibility & Quick Filters

## Decisions

1. **Mobile Visibility (`src/index.css`)**:
   - In `@media (max-width: 639px)`, add `.trade-table.remit-log-table { display: table; }` so `RemittanceLog` never disappears on phones and smoothly scrolls inside `.table-wrapper`.
2. **Column Stacking (`src/components/RemittanceLog.tsx`)**:
   - 8 clean columns:
     1. Remit Date (with `.unapplied-badge` when flagged)
     2. Symbol / Provider (stacked `.symbol-badge` + `.cell-sub`)
     3. Amount (USD) (with `.unapplied-reason` when flagged)
     4. Amount (THB) / @ FX (stacked `฿amountTHB` + `@ fxRate` subline)
     5. Gain %
     6. Taxable (THB)
     7. Notes
     8. Actions (`.action-buttons` with paperclip, edit, delete SVG buttons)
   - Update `tfoot` `colSpan` from `3` to `2` so footer totals align directly under `Amount (USD)`, `Amount (THB)`, and `Taxable (THB)`.
3. **Quick Search & Provider Filter**:
   - Add `searchQuery` and `providerFilter` state (reset on `remitYear` change).
   - Reuse existing `trade:searchPlaceholder`, `trade:allProviders`, and `trade:noMatchingTrades` i18n keys + `.trade-table-controls` / `.table-search` / `.provider-filter` styles for 100% visual consistency with `TradeTable`.
