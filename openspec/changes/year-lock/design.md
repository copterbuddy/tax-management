# Design

## Context

`filingSummary.ts` already produces the year's figures (`FilingFigures`). The sheet is read-only. Persistence in this app is one storage key per slice, loaded at module import.

## Decisions

### D1 — The lock stores figures, not a copy of the ledger

A snapshot of the four THB amounts plus a timestamp is enough to answer "did the filed numbers move?" and cannot drift from the format of trades or dividends. Copying records would duplicate data and need migration on every schema change.

### D2 — Its own slice and its own key

Locks are not trades and not dividends. A `filingSlice` with `tax_tracker_year_locks` keeps the concern and its persistence separate, and leaves both existing slices untouched.

### D3 — The sheet, not the tabs, reports the difference

The lock's job is to protect a declaration; the place a declaration lives is the filing sheet. Putting the warning in the tabs would compete with daily work.

### D4 — Locking is advisory, not an edit gate

Blocking edits would need every reducer across three slices to consult the lock and would still not stop an import. The snapshot answers the question that matters — what changed since filing — without turning the lock into a permission system.

*Alternative rejected*: refusing edits for locked years. High blast radius, and it makes correcting a genuine mistake harder than re-filing.

## Risks / Trade-offs

- **A user can edit a locked year and ignore the warning.** Accepted; the warning names the fields, which is what an audit needs.
- **Time zone of the timestamp**: stored as an ISO string in local time from `new Date().toISOString()`; displayed as a date only.
