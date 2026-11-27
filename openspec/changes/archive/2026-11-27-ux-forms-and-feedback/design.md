# Design: UX Forms, Live Trade Summary & Non-Blocking Feedback (Loop 3)

## Decisions

### 1. Non-Blocking Toast (`src/components/Toast.tsx`)
- Lightweight presentational component accepting `message`, `variant` (`'warning' | 'error' | 'info'`), and `onDismiss`.
- Renders at bottom-right (`.toast-banner`) with `role="alert"` for warning/error and `role="status"` for info, left accent border, crisp close button, and subtle slide-up entrance.
- `Dashboard.tsx` holds `toast: { message: string; variant: 'warning' | 'error' | 'info' } | null` state with a 5-second auto-dismiss timer (`useEffect` cleanup).
- Replaces all 4 `alert(...)` calls in `Dashboard.tsx`.

### 2. TradeForm Progressive Disclosure & Live Summary (`src/components/TradeForm.tsx`)
- Watch `commissionUSD`, `vatUSD`, `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD` alongside existing watched fields.
- Compute `liveSummary` via `useMemo`:
  - `grossUSD = watchedGrossAmountUSD !== undefined ? watchedGrossAmountUSD : quantity * priceUSD`
  - `netFeesUSD = commission + vat + exchangeFee + (type === 'SELL' ? tafFee : 0) - rebate`
  - `netTotalUSD = type === 'BUY' ? grossUSD + netFeesUSD : grossUSD - netFeesUSD`
- Wrap Slip Gross Amount, Fees row, Rebate, and Notes inside `<details className="form-collapsible" open={detailsOpen} onToggle={...}>`.
  - Default `detailsOpen` to `true` when editing a trade that has any non-zero fee, slip gross amount, or notes; default `false` for fresh trades so the form opens clean and focused.
  - Auto-open if any validation error or `grossMismatch` warning appears inside the secondary fields.
- Render `.trade-live-summary` right above `.form-actions` whenever `grossUSD > 0`.

### 3. Escape Key Dismissal
- Add a clean `useEffect` keydown listener for `e.key === 'Escape'` in `TradeForm.tsx`, `RemitForm.tsx`, and `DividendForm.tsx`.
