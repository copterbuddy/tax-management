# Design: UX v6 — Collapsible Outstanding Proceeds, Dividend Filters & Calm Empty States

## Decisions

1. **Collapsible Outstanding Proceeds (`src/components/TradesTab.tsx`)**:
   - Replace `<div className="outstanding-proceeds">` with `<details className="outstanding-proceeds" open>`.
   - Keep `<h3>` inside `<summary className="outstanding-summary">` so existing selectors (`section.querySelector('h3')`) and heading semantics remain 100% compatible, alongside a `.outstanding-count-badge` showing `${outstandingRows.length}` and total `$${fmtUSD(outstandingTotal)}`.
2. **DividendTab Search & Status Filter (`src/components/DividendTab.tsx`)**:
   - Add `searchQuery` and `statusFilter` (`'ALL' | 'REMITTED' | 'PARTIAL' | 'UNREMITTED'`) state, resetting on `displayYear` change.
   - Apply search + status filter on top of `filteredDividends` to produce `visibleDividends` for the table and mobile cards, showing a clean `trade:noMatchingTrades` empty state if filters match nothing.
3. **Calm Empty States (`src/index.css` + tables)**:
   - Add `.empty-icon-badge` (`56px × 56px` rounded circle with `--color-surface-hover` background and `--color-text-tertiary` stroke SVG) and replace raw emojis in `TradeTable`, `DividendTab`, and `RemittanceLog` empty states.
