# Proposal: UX Forms, Live Trade Summary & Non-Blocking Feedback (Loop 3)

## Why

Two remaining interaction patterns disrupt visual calm and user focus:
1. **Long unstructured trade form**: `TradeForm` presents 13 fields in a single flat vertical stack without visual grouping or a live total preview before submission, making routine BUY/SELL entry feel heavy even when fees/slip details are secondary.
2. **Blocking browser `alert()` dialogs**: `Dashboard` still calls native `window.alert()` in 4 places (editing a SELL trade with remittances, FIFO update conflict backstop, editing/deleting a dividend with remittances), which abruptly freezes the page and breaks the visual theme.
3. **Modal keyboard ergonomics**: Pressing `Escape` does not close `TradeForm`, `RemitForm`, or `DividendForm`.

## What Changes

1. **Non-Blocking Toast Notification System (`src/components/Toast.tsx`)**:
   - Render an accessible, theme-aware floating toast banner with auto-dismiss and manual close button.
   - Replace all 4 `window.alert()` calls in `Dashboard.tsx` with calm non-blocking toasts.
2. **Progressive Disclosure & Live Summary in `TradeForm.tsx`**:
   - Group primary trade fields cleanly above a native collapsible `<details className="form-collapsible">` section for **Fees, slip gross amount & notes** (showing live net fees on the summary header and auto-opening when editing a trade with secondary data or when a validation error/warning occurs inside).
   - Add a real-time **Trade Summary Bar** above the action buttons displaying Gross/Subtotal, Net Fees, and Estimated Net Cost (BUY) / Net Proceeds (SELL) before saving.
3. **Modal Keyboard Ergonomics & Polish**:
   - Support `Escape` key dismissal on `TradeForm`, `RemitForm`, and `DividendForm`, and harmonize modal styling in `src/index.css`.

## Non-Goals

- No changes to Zod validation schemas, FIFO engine math, or Redux persistence.
- No changes to existing `TradeForm` field IDs, labels, or reset behavior.
