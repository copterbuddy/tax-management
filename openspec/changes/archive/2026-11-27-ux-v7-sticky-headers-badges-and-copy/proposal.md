# Proposal: UX v7 — Styled Status Badges, Sticky Table Headers & One-Click Filing Copy

## Why

1. **Unstyled status badges**: `DividendTab` already assigns `.badge`, `.badge-success`, `.badge-warning`, and `.badge-neutral` to remittance statuses, but `src/index.css` defines no rules for those classes—so statuses render as plain unstyled text.
2. **Scrolling long tables loses column context**: Without sticky headers and active-sort styling, scanning long trade/dividend/remittance tables requires scrolling back up to remember which column is which.
3. **Manual transcription from Filing Summary**: Users fill PND 90 by hand from `FilingSummarySheet`; a one-click Copy button alongside CSV export saves time and prevents typos.

## What Changes

1. Define calm tinted pill badge styles (`.badge`, `.badge-success`, `.badge-warning`, `.badge-neutral`) in `src/index.css`, and add sticky `thead th` headers + `.is-sorted` styling.
2. Mark active sorted headers with `.is-sorted` and `aria-sort` in `TradeTable.tsx`.
3. Add `IconCopy` and `IconCheck` to `src/components/Icons.tsx`, add Thai/English copy labels to `common.json`, and add a one-click Copy button with instant copied feedback in `FilingSummarySheet.tsx`.

## Non-Goals

- No changes to filing calculation formulas or CSV export format.
