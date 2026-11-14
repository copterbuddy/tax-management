# Proposal

## Why

The Trade Type field is the single most consequential choice in the trade form — it changes which
fee fields apply, whether the symbol is free text or a restricted dropdown, and whether FIFO lots are
consumed or created. Today it is a native `<select>` sitting in the second row, visually
indistinguishable from the low-stakes date/provider fields, and as a dropdown it hides the two
possible values behind a click. Users filling the form top-to-bottom pick the date first and only then
discover the type, and on edit the field is locked, so a mistyped type cannot be corrected at all.

## What Changes

- Move Trade Type to the **first row** of the form, above the date, spanning the full width.
- Replace the `<select>` with a **two-button segmented control** (BUY on the left, SELL on the right).
  - Selected BUY: green tint, green text. Selected SELL: red tint, red text.
  - Unselected button stays transparent with a neutral border.
  - Colors are defined per theme so contrast holds in both light and dark mode.
- **BREAKING (behavioral)**: Trade Type is no longer disabled when editing an existing trade. Switching
  type clears the form instead of leaving mutually invalid values in place.
- Switching type now clears **all** entered values except the date (previously only `symbol` and
  `provider` were cleared), and clears any form-level error.
- Re-clicking the already-selected type is a no-op — it never clears anything.
- Two edit-mode guards are added, because an unlocked type makes invalid states reachable:
  - A type switch that would break FIFO lot availability for later SELL trades is rejected with a
    form-level error instead of throwing inside the Redux reducer.
  - A SELL trade that already has remittance records cannot be converted to BUY (the remittance
    history lives on the derived gain and would be silently discarded).

## Capabilities

### New Capabilities

- `trade-type-toggle`: the trade form's trade-type control — its position in the form, its
  segmented-button presentation and theme-aware colors, its keyboard and screen-reader semantics, and
  the reset behavior when the type changes.

### Modified Capabilities

- `sell-symbol-dropdown`: the requirement "Type toggle resets dependent fields" expands from
  *symbol + provider only* to *all entered values except the date*, and gains a no-op guarantee when the
  already-selected type is re-selected.

## Impact

- `src/components/TradeForm.tsx` — type control markup replaced, the type-change reset effect replaced
  by an explicit handler, `disabled` removed from the type control.
- `src/index.css` — new segmented-control styles plus per-theme color tokens for the selected state
  (light, dark, and the `prefers-color-scheme: dark` duplicate block).
- `src/components/Dashboard.tsx` — pre-flight validation for an edit that changes a trade's type.
- `src/i18n/locales/{en,th}/trade.json` — new labels/hints for the control and the two guard errors.
- `src/components/TradeForm.spec.tsx` — new test file (none exists today).
- No changes to `src/engine/`, `src/store/tradeSlice.ts`, the persisted schema, or any storage key.