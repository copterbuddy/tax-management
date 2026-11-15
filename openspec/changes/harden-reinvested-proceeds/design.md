# Design

## Context

See [proposal.md](./proposal.md) for why. Current state that shapes the approach:

- `MarkReinvestedDialog` rounds `row.availableBalanceUSD` to cents once (`toCents`) and uses that rounded figure for the hint text and `defaultValues`, but its zod schema caps the value at the raw `row.availableBalanceUSD`. The form registers the input with `valueAsNumber: true`, so the schema sees exactly what the user (or `defaultValues`) put in.
- `setReinvestedAmount` in `tradeSlice` already calls `applyReinvestedAmount`, which throws when the amount exceeds `sellRevenueUSD − totalRemittedUSD` (plus the shared half-cent money tolerance). The reducer catches that throw and logs it.
- The dialog closes inside `Dashboard.handleSubmitReinvested` immediately after dispatch, so nothing rendered inside the dialog can report a failure that happens during the dispatch.
- `importTrades` recomputes gains with an empty existing-gains list, and `recomputeGains` maps over freshly computed gains, merging remittances and `reinvestedUSD` from a map keyed by `sellTradeId`. Records therefore survive an import only if that list is supplied.
- Redux state lives in memory; only trades, gains, remittances, and reminders are persisted through `saveTrades` / `saveGains`. Component strings go through `t('<namespace>:<key>')` with matching en/th keys.

## Goals / Non-Goals

**Goals**

- Every refusal path the user can reach shows a message they can read, in their language, without changing any stored figure.
- The prefilled amount always submits, and the cap is exactly the balance shown.
- An import preserves everything it does not have to drop, before any import UI exists to exercise it.
- Both locale files parse to identical key sets with one indentation style.

**Non-Goals**

- No change to engine limits, tolerance, tax math, or the meaning of `reinvestedUSD`.
- No general form-error framework, toast system, or error boundary.
- No import UI. `importTrades` stays an unwired API; only its contract is fixed.
- No storage-key, schema-version, or persisted-shape change.

## Decisions

### D1 — Validate in whole cents against the displayed balance

Both sides of the cap are rounded to the same cent grid before comparison: the balance is `toCents(row.availableBalanceUSD)` (already computed), and the entered value is compared after `toCents`. The schema becomes `min(0)` plus a `refine(toCents(value) <= balance)` carrying the existing `markReinvestedExceeds` message; `.max(row.availableBalanceUSD)` disappears.

*Why*: the bug is a unit mismatch, not a rounding-direction bug. `0.30000000000000004` and `0.30` are the same number of cents; anything that compares them as floats rejects the dialog's own default. Comparing on the cent grid makes "prefilled always valid" and "one cent above is refused" both true by construction rather than by luck.

*Alternatives considered*: keeping `.max` and rounding the cap (`max(toCents(raw))`) fixes the reported case but still compares displayed-rounding against raw-typed values inconsistently, and leaves the two numbers compared in different units. Flooring to cents would wrongly refuse a legitimate `146.435` → display `146.44`… i.e. display and cap would disagree again.

*Constraint preserved*: the input keeps `min={0}` and must not gain a native `max` attribute — jsdom enforces native constraints on submit and would short-circuit the translated zod message.

### D2 — Report the failure on the Trades tab, not in the dialog

The dialog keeps closing on submit. The failure appears as a dismissible banner directly above the outstanding list, in the same presentational component that already owns that list.

*Why*: a message inside the dialog is unreachable in the failing path, because the dialog is gone by the time the reducer throws. Keeping the dialog open would require `handleSubmitReinvested` to learn success/failure from the store (or the dispatch result), turning a one-line handler into a two-phase flow for a rare path. The outstanding list is where the user was looking and where the row still shows the unchanged balance, so the message explains what they see.

*Alternatives considered*: keep the dialog open until the store confirms — rejected for the extra state machine; `window.alert` — rejected by the brief and untranslatable in tests; a toast library — new dependency for one message.

### D3 — The slice stores an error *code*, the component renders the text

`TradeState` gains `reinvestError: 'reinvestedExceedsBalance' | null`. The reducer sets it in the `catch` branch and leaves `gains`, `remainingLots`, and `taxSummaries` untouched; on success it clears it. A `clearReinvestError` action backs the dismiss control.

*Why*: a formatted message frozen into state would freeze the language too — switching en/th with the banner visible would leave stale text, and the store would need i18n at dispatch time. A code keeps translation in the view layer, where every other string already lives, and keeps the reducer free of React/translation concerns. A union of one member is deliberate: adding a second failure code forces a matching key in both locale files.

*Alternatives considered*: storing the thrown `Error.message` (English only, includes an untranslatable `$x.xx` fragment); storing `{ code, availableUSD }` (the figure can be stale by the time it renders, and the banner text reads better without a precise number).

### D4 — `reinvestError` is transient, never persisted

The field is neither saved nor validated by a zod schema, and it is not part of any storage payload. A reload starts with `null`.

*Why*: the schema in `validation/schemas.ts` is the persistence gate for stored records; an error slot is session UI state. Persisting it would resurrect a stale complaint after the data it referred to is gone, and would force a schema-version conversation this change explicitly avoids.

### D5 — Fix the import by supplying the current gains, not by merging after the fact

`importTrades` calls `recomputeGains(state.trades, state.gains)`, exactly as `addTrade`, `updateTrade`, and `deleteTrade` already do. No new merge code, no id reconciliation, no special case.

*Why*: `recomputeGains` already implements the correct contract — fresh FIFO over the new trade list, then re-attach remittances and `reinvestedUSD` per `sellTradeId`, skipping remittances that no longer fit. Passing `[]` disabled half of that contract, and the comment above it rationalised the loss. Passing `state.gains` restores it, and the drop-only-vanished-sales rule falls out of `freshGains.map` for free. `clearAllTrades` keeps resetting state directly because wiping is its whole purpose.

*Alternatives considered*: a bespoke `mergeGains(imported, existing)` helper — duplicates logic that is already shared by three reducers; keeping the wipe and documenting it — rejected because "an imported list carries no such record" was never true: the records live in gains, not in the imported trade list.

### D6 — Locale normalisation is mechanical, verified structurally

Indentation of the drifted lines in `src/i18n/locales/{en,th}/common.json` becomes two spaces to match the rest of each file. No key is renamed, reordered, retranslated, or removed. Verification is structural rather than visual: both files parse as JSON, the two key sets are identical, and a whitespace-insensitive diff of each file against its pre-change content is empty.

*Why*: a hand-fix risks value drift that no reviewer would spot in a whitespace-dominated diff. Comparing `JSON.parse` output with indentation stripped proves only formatting moved.

*Scope note*: `en/common.json` carries the same 14 drifted lines as the Thai file and is fixed alongside it — the two files are read as a pair and diverge only by translation. `en/trade.json` has three drifted lines from an earlier change (`formGrossAmount` and neighbours); they are out of scope here and left untouched.

### D7 — New behaviour lands as ADDED requirements, and ordering matters

The two new `reinvested-proceeds` requirements are ADDED rather than MODIFIED, so the parent change's requirement text and scenarios are untouched.

*Why*: MODIFIED must reproduce an entire existing requirement block, and the block being extended ("Each outstanding gain offers remit and mark-reinvested actions") describes the actions themselves, not validation precision or error reporting. Adding two requirements that each state one behaviour keeps the archive merge free of accidental loss.

*Ordering*: `openspec/changes/reinvested-proceeds/` is not archived, so `openspec/specs/reinvested-proceeds/spec.md` does not exist. Archiving this change first would merge its ADDED requirements into a main spec that is about to be created from scratch by the parent, and the parent's sync would then conflict with them. Archive the parent first.

## Risks / Trade-offs

- **Rounding at the cap admits sub-cent overshoot** (a typed `0.304` is treated as `0.30`) → Accepted: the app's money unit is the cent, the engine already tolerates half a cent, and the alternative is the bug being fixed.
- **A generic banner does not say which sale failed** → Mitigation: the message names the action and the rule, and the failing row is still on screen with its unchanged balance directly below the banner.
- **`reinvestError` can outlive its cause** if the user edits trades after a failure → Mitigation: it is cleared by the next successful record, by dismissal, and by reload; it never blocks or alters behaviour.
- **Import fix is unexercised in production** because no importer exists → Mitigation: slice tests drive `importTrades` directly with identical, partial, and no-op lists, and assert figure-for-figure summary equality.
- **Whitespace-only edits are easy to under-verify** → Mitigation: parse both locales and compare key sets plus a whitespace-insensitive diff, rather than eyeballing indentation.
- **`npm run build` stays red** for the pre-existing `tsc` spec-types reason → Out of scope; verification is `npm test`, `npm run lint`, and `openspec validate --strict`.

## Migration Plan

No data migration. Locale files are source, not stored data. Existing gains, remittances, and `reinvestedUSD` values load and behave exactly as before; the only observable differences are a dialog that accepts its own default and an error message that replaces a silent `console.error`. Rollback is a revert of the affected files — no stored shape changes, so a revert needs no cleanup.

## Open Questions

None blocking. The banner's exact copy is a translation decision that can be tuned during implementation without touching the specs, provided the meaning matches the requirement scenarios.