# Design

## Context

`RemittanceRecord` and `DividendRemittance` already carry user-entered facts that no engine can derive (`notes`, `unapplied`). Their zod schemas are the persistence gate: a field missing there is stripped on load, which is how a note was lost before. Both record types are persisted inside their parent (`gain.remittances`, `dividend.remittances`), so no new storage key is involved.

## Decisions

### D1 — The link lives on the remittance, not on the trade or the dividend

Evidence belongs to the money movement: one sale can have two remittances with different slips, and one dividend can be remitted in parts. Attaching it to the parent would make "which slip is this?" unanswerable.

### D2 — Stored as a plain URL string, validated on the way in

`docRef?: string` with a `refine` that accepts only `http:`/`https:` (or empty). A local file path would look like evidence but break the moment the app is opened on another machine; a URL is the only form that survives.

### D3 — One dialog for both record kinds

`DocRefDialog` takes the current value and returns `string | null` — nothing about it is capital-gain or dividend specific. Both tabs reuse it, so the interaction cannot drift between them.

### D4 — The row shows state, the dialog edits it

The paperclip is filled when a link exists and outlined when it does not; clicking a filled one opens the document, clicking an empty one opens the dialog. No new column, no extra text — the minimal-UI constraint.

*Alternative rejected*: inline editing in the row. It widens the table on mobile and puts a form inside a scrollable table.

## Risks / Trade-offs

- **A link can rot.** The app cannot verify that a URL still resolves. Accepted: it is a pointer to the user's own storage, not a copy.
- **No file upload.** Storing binaries in localStorage is out of the question; the link is the pragmatic middle.
