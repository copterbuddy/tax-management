# Proposal: UX v4 — Dialog Consistency, Modal Ergonomics & Crisp Tooltips

## Why

Several secondary dialogs and overlays still have inconsistent padding, missing CSS classes, and incomplete keyboard dismissal:
- `FilingSummarySheet` and `DocRefDialog` place content directly inside `.trade-form-modal` without a padded body wrapper, causing text and inputs to touch modal edges.
- `DividendRemitForm` uses `.modal-close` (undefined in `src/index.css`) instead of `.btn-close`.
- `FilingSummarySheet`, `DocRefDialog`, `MarkReinvestedDialog`, and `DividendRemitForm` do not close on `Escape` key (and `FilingSummarySheet` / `DocRefDialog` do not close on backdrop click).
- `Tooltip` renders a raw Unicode `'ⓘ'` character instead of matching the monochrome SVG icon system introduced in v1.

## What Changes

1. Wrap `FilingSummarySheet` and `DocRefDialog` body contents in `.trade-form` (consistent modal body padding) and support backdrop click + `Escape` dismissal.
2. Fix `.modal-close` → `.btn-close` in `DividendRemitForm` and add `Escape` key dismissal to `DividendRemitForm` and `MarkReinvestedDialog`.
3. Add `IconInfo` to `src/components/Icons.tsx` and use it in `Tooltip.tsx` with refined popover readability.

## Non-Goals

- No changes to filing calculations, document URL validation, or reinvested amount rules.
