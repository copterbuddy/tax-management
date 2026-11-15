# Design

## Context

See `proposal.md` for why. The relevant machinery:

- `RealizedGainResult` (`src/types/trade.ts`) already carries one user-recorded field that FIFO cannot derive — `reinvestedUSD` — and `realizedGainSchema` declares it, with a matching round-trip test. The note follows the same pattern.
- `recomputeGains` (`src/store/tradeSlice.ts`) rebuilds every gain from trades, then merges `reinvestedUSD` and replays `remittances` from a map keyed by `sellTradeId`. `recomputeGainsWithModifiedRemittances` does the same for the one sale it is editing.
- `importTrades` calls `recomputeGains(state.trades, state.gains)`, so whatever the merge preserves survives an import for free.
- `data_test/tax_tracker_gains.json` already contains the note this change exists to protect.

## Goals / Non-Goals

**Goals**

- A note written by the user is still there after any edit, import, or reload.
- Zero change to any computed figure.

**Non-Goals**

- A note editor in the UI.
- Notes on trades (only realized gains).
- Length/format policy beyond a sane bound.

## Decisions

### D1 — The note lives on the realized gain

A note explains a sale's outcome ("proceeds went into SPGI"), which is exactly what a gain record is. It also matches the data already in `data_test`, so no migration is implied.

Alternative rejected: a note on the trade. It would need its own preservation path and would still not describe the realized result the user annotates after the fact.

### D2 — Preserve by merge, drop with the sale

Both recompute paths copy `note` from the existing gain keyed by `sellTradeId`, beside `reinvestedUSD`. A sale that no longer exists produces no merged gain, so its note disappears with it — the same rule the other records already follow.

Alternative rejected: persist notes in a separate storage key. More surface, and a second place to keep consistent with deletions.

### D3 — No UI in this change

The field is populated through the data path the user already maintains. A note editor is a UI feature with its own questions (where, autosave, length) and would double the change for no correctness gain here.

### D4 — No tax effect, by construction

`computeTaxSummary` reads `sellRevenueUSD`, `totalRemittedUSD`, `reinvestedUSD`, `remittances` and `gainPercent`. `note` participates in none of them, and a test asserts the summary is unchanged by adding a note.

## Risks / Trade-offs

- **A stale note survives a correction.** If the user edits the sale so the note's explanation no longer holds, the text stays. Accepted: it is free text for humans, and silently rewriting it would be worse.
- **A huge string could bloat localStorage.** No length bound is enforced: `loadGains` validates the whole array with `safeParse`, whose fallback is an empty list, so one over-long note would discard every gain instead of one field. A cosmetic limit is not worth that failure mode; the note is user-entered text in a personal app.

## Migration Plan

None. Absent `note` means "no note", which is today's behaviour; a stored note simply stops being stripped.