# Proposal: UX v6 — Collapsible Outstanding Proceeds, Dividend Filters & Calm Empty States

## Why

1. **Long Outstanding Proceeds panel**: On `TradesTab`, `.outstanding-proceeds` sits above the provider strip and trade table and cannot be collapsed when a user wants to focus on the trade history below.
2. **No filtering on DividendTab**: Unlike `TradeTable` and `RemittanceLog`, `DividendTab` has no symbol search or remittance-status filter (`All / Remitted / Partial / Unremitted`), making it harder to isolate unremitted dividends.
3. **Remaining raw emojis in empty states**: `TradeTable`, `DividendTab`, and `RemittanceLog` still render large raw emojis (`📊`, `💵`, `🔍`, `🏦`) in empty-state screens, breaking the monochrome SVG visual language.

## What Changes

1. Make `.outstanding-proceeds` in `TradesTab.tsx` a collapsible `<details>` card (expanded by default so all rows and actions remain immediately accessible, with a count + total USD badge in the header).
2. Add symbol/notes search input and remittance-status filter pills (`All / Remitted / Partial / Unremitted`) to `DividendTab.tsx` (resetting on year change).
3. Replace empty-state emojis in `TradeTable`, `DividendTab`, and `RemittanceLog` with clean monochrome SVG icons in `.empty-icon-badge` containers, and clean up the unnecessary `country` hook dependency warning in `DividendForm.tsx`.

## Non-Goals

- No changes to dividend calculation engines, remittance status logic, or outstanding proceeds math.
