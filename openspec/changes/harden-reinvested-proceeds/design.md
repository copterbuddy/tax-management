# Design

## Context

See [proposal.md](./proposal.md) for why. Current state that shapes the approach:

- `MarkReinvestedDialog` rounds `row.availableBalanceUSD` to cents once (`toCents`) and uses that rounded figure for the hint text and `defaultValues`, but its zod schema caps the value at the raw `row.availableBalanceUSD`. The form registers the input with `valueAsNumber: true`, so the schema sees exactly what the user (or `defaultValues`) put in.
- `setReinvestedAmount` in `tradeSlice` already calls `applyReinvestedAmount`, which throws when the amount exceeds `sellRevenueUSD − totalRemittedUSD` (plus the shared half-cent money tolerance). The reducer catches that throw and logs it.
- The dialog closes inside `Dashboard.handleSubmitReinvested` immediately after dispatch, so nothing rendered inside the dialog can report a failure that happens during the dispatch.
- `importTrades` recomputes gains with an empty existing-gains list, and `recomputeGains` maps over freshly computed gains, merging remittances and `reinvestedUSD` from a map keyed by `sellTradeId`. Records therefore survive an import only if that list is supplied. Even with it supplied, the re-attach step runs inside `try { applyRemittance } catch { … }` and `withReinvestedAmount` swallows its own throw, so a record that no longer fits its sale's new revenue is dropped without a trace.
- Redux state lives in memory; only trades, gains, remittances, and reminders are persisted through `saveTrades` / `saveGains`. Component strings go through `t('<namespace>:<key>')` with matching en/th keys.

## Goals / Non-Goals

**Goals**

- Every refusal path the user can reach shows a message they can read, in their language, without changing any stored figure.
- The prefilled amount always submits, and the cap is exactly the balance shown.
- An import preserves everything it does not have to drop, before any import UI exists to exercise it — and when it cannot, it applies nothing and says which sale is in the way.
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

This decision implements the comparison rule stated by the delta requirement *The mark-reinvested dialog accepts any amount up to the balance it displays*, which refines the parent requirement *Each outstanding gain offers remit and mark-reinvested actions* — that requirement's cap stays the only cap, and this work changes only how the two numbers are compared and which one the message quotes.

### D2 — Report the failure on the Trades tab, and close the dialog

The dialog keeps closing on submit. The failure appears as a dismissible banner directly above the outstanding list, in the same presentational component that already owns that list. This is a decision, not an oversight: closing is what the spec scenario describes and what the accepted design does.

*Why closing is safe here*: a refused record changes nothing, so the outstanding row the user acted on is still there with its balance showing the amount that was not recorded, and reopening the dialog prefills that same balance — the value is recoverable in one click and no typing is lost that the list does not already show. Keeping the dialog open would therefore buy nothing the list does not already display, while costing a two-phase submit: `handleSubmitReinvested` would have to dispatch, read back whether the reducer refused, and only then decide whether to unmount, making the dialog's lifetime depend on store state written by the reducer it just triggered.

*Why a banner instead of a message inside the dialog*: the dialog is unmounted by the time the reducer throws, so any message rendered inside it is unreachable in the failing path.

*Alternatives considered*: keep the dialog open until the store confirms — rejected for the extra state machine described above; `window.alert` — rejected by the brief and untranslatable in tests; a toast library — new dependency for one message.

### D3 — The slice stores an error *code*, the component renders the text

`TradeState` gains `ledgerError: LedgerError | null`, where

```ts
type LedgerError =
  | { code: 'reinvestedExceedsBalance' }
  | { code: 'importOverRemittance'; sellLabel: string };
```

The reducers set it in their refusal paths and leave `gains`, `remainingLots`, and `taxSummaries` untouched; a successful record clears it. A `clearLedgerError` action backs the dismiss control.

*Why a code, not a message*: a formatted message frozen into state would freeze the language too — switching en/th with the banner visible would leave stale text, and the store would need i18n at dispatch time. A code keeps translation in the view layer, where every other string already lives, and keeps the reducer free of React/translation concerns.

*Why the union carries one extra field*: the reinvested refusal is about a row the user can still see, so its message needs no identifier, while the import refusal must name the sale the spec requires it to name. `sellLabel` holds `"<symbol> · <sellDate>"` — data assembled from the incoming trades, not a translated sentence — so each variant carries only what its message needs and a third code would force a matching key in both locale files.

*Alternatives considered*: a bare `'reinvestedExceedsBalance' | 'importOverRemittance'` string (the import message could not name the sale, or would have to look it up in a component that no longer has it); storing the thrown `Error.message` (English only, with an untranslatable `$x.xx` fragment); storing `{ code, availableUSD }` for the reinvested case (the figure can be stale by the time it renders, and the banner reads better without a precise number).

### D4 — `ledgerError` is transient, never persisted

The field is neither saved nor validated by a zod schema, and it is not part of any storage payload. A reload starts with `null`.

*Why*: the schema in `validation/schemas.ts` is the persistence gate for stored records; an error slot is session UI state. Persisting it would resurrect a stale complaint after the data it referred to is gone, and would force a schema-version conversation this change explicitly avoids.

### D5 — Fix the import by supplying the current gains, not by merging after the fact

`importTrades` calls `recomputeGains(state.trades, state.gains)`, exactly as `addTrade`, `updateTrade`, and `deleteTrade` already do. No new merge code, no id reconciliation, no special case.

*Why*: `recomputeGains` already implements the correct contract — fresh FIFO over the new trade list, then re-attach remittances and `reinvestedUSD` per `sellTradeId`. Passing `[]` disabled half of that contract, and the comment above it rationalised the loss. Passing `state.gains` restores it, and the drop-only-vanished-sales rule falls out of `freshGains.map` for free. `clearAllTrades` keeps resetting state directly because wiping is its whole purpose.

*Alternatives considered*: a bespoke `mergeGains(imported, existing)` helper — duplicates logic that is already shared by three reducers; keeping the wipe and documenting it — rejected because "an imported list carries no such record" was never true: the records live in gains, not in the imported trade list.

### D6 — An import that cannot keep a remittance is refused whole, not partially applied

`recomputeGains` re-attaches records inside `try { applyRemittance } catch { /* skip */ }`, and `withReinvestedAmount` swallows its own throw the same way. So supplying `state.gains` (D5) is necessary but not sufficient: if the imported list shrinks a sale's revenue below what was already remitted, the remittance is dropped silently and the sale reads as under-remitted while its history is already gone.

`importTrades` therefore compares, for every sale present in both the current and the imported list, the records the candidate gains would carry against the records the current gains carry — remittance count, each remittance's amount and date, and `reinvestedUSD`. If any surviving sale would lose a record, the reducer returns the state unchanged (no trades, no gains, no summaries, no remaining lots) and sets `ledgerError` to `{ code: 'importOverRemittance', sellLabel }`, where `sellLabel` is `"<symbol> · <sellDate>"` from the incoming trades.

*Why refuse rather than keep*: an over-remitted gain has remittances above its proceeds. `applyRemittance` cannot build that shape and `computeGainSummary` would clamp the balance to zero while `taxableGainTHB` charged tax on money the sale never earned, so "keep the records" is not a state the engine can represent — representing it means relaxing the engine invariant, which the brief forbids. Refusal is the only behaviour that keeps both the records and the tax math intact.

*Why whole and not just the offending sale*: a partial import leaves the app holding a mix of old and new sales that the user cannot reconstruct from either source, and the conflict is usually a sign the wrong file was chosen. Refusing everything makes the failure obvious and recoverable by importing the right list.

*Cost accepted*: an import that legitimately shrinks a sale below its remittances is now blocked until the user deletes or adjusts those remittances. That is a rare, deliberate edit, and the message names the sale so the fix is one screen away.

*Limit*: the check compares records it can see. A remittance already missing from stored gains before the import (dropped by an older `recomputeGains` run) cannot be resurrected or reported — nothing records that it once existed. The check prevents new loss; it does not audit historical loss.

### D7 — Locale normalisation is mechanical, verified structurally

Indentation of the drifted lines in `src/i18n/locales/{en,th}/common.json` becomes two spaces to match the rest of each file. No key is renamed, reordered, retranslated, or removed. Verification is structural rather than visual: every namespace in both languages parses as JSON, `en`/`th` key sets are identical per namespace, and a whitespace-insensitive diff of each edited file against its pre-change content is empty.

*Why*: a hand-fix risks value drift that no reviewer would spot in a whitespace-dominated diff. Comparing `JSON.parse` output with indentation stripped proves only formatting moved.

*Scope note*: `en/common.json` carries the same 14 drifted lines as the Thai file and is fixed alongside it — the two files are read as a pair and diverge only by translation. The comparison covers `common`, `trade`, `remittance`, and `dividend` so the check cannot be satisfied by fixing one namespace. `en/trade.json` has three drifted lines from an earlier change (`formGrossAmount` and neighbours); they are out of scope and are verified to stay byte-identical.

### D8 — New behaviour lands as ADDED requirements, and the spec base gates archiving

The two new `reinvested-proceeds` requirements are ADDED rather than MODIFIED, so the parent change's requirement text and scenarios are untouched. The new `trade-import-safety` capability is a new spec with its own Purpose.

*Why*: MODIFIED must reproduce an entire existing requirement block, and the block being extended ("Each outstanding gain offers remit and mark-reinvested actions") describes the actions themselves, not validation precision or error reporting. Adding requirements that each state one behaviour keeps the archive merge free of accidental loss.

*Spec base*: `reinvested-proceeds` is archived under `openspec/changes/archive/2026-11-15-reinvested-proceeds`, but archiving does not by itself write main specs. Before this change is archived, `openspec/specs/reinvested-proceeds/spec.md` must exist with the parent's 9 requirements, `openspec/specs/tax-year-summary/spec.md` with 6, and `dashboard-tab-layout` must carry the not-yet-remitted card requirement it received from that change. As of this revision the check passes. If it ever fails, the repair is `mv openspec/changes/archive/2026-11-15-reinvested-proceeds openspec/changes/reinvested-proceeds`, then `openspec archive reinvested-proceeds --yes`, then `openspec validate --all --strict`. Archiving this change against a partial base would create `reinvested-proceeds/spec.md` from only the two requirements added here, over a placeholder Purpose, silently losing the other nine.

## Risks / Trade-offs

- **Rounding at the cap admits sub-cent overshoot** (a typed `0.304` is treated as `0.30`) → Accepted: the app's money unit is the cent, the engine already tolerates half a cent, and the alternative is the bug being fixed.
- **A reinvested refusal does not name the sale** → Mitigation: the failing row is still on screen with its unchanged balance directly below the banner; the message names the action and the rule.
- **`ledgerError` can outlive its cause** if the user edits trades after a failure → Mitigation: it is cleared by the next successful record, by dismissal, and by reload; it never blocks or alters behaviour. It is not cleared by unrelated actions, so a stale import conflict message can sit on screen until dismissed — accepted, since dismissing is one click and the alternative (auto-clearing on any dispatch) would hide the message before it is read.
- **Import refusal blocks a legitimate shrink** → Mitigation: the message names the sale; the user adjusts that sale's remittances and retries. Documented as a cost in D6.
- **Import fix is unexercised in production** because no importer exists → Mitigation: slice tests drive `importTrades` directly with identical, partial, no-op, and over-remitted lists, and assert figure-for-figure summary equality plus byte-equality on refusal.
- **The conflict check is only as good as the stored records** → Accepted: a remittance dropped by an older build cannot be reported (D6 limit). New loss is prevented; past loss needs the user's own records.
- **Whitespace-only edits are easy to under-verify** → Mitigation: parse every locale namespace in both languages and compare key sets plus a whitespace-insensitive diff, rather than eyeballing indentation.
- **`npm run build` stays red** for the pre-existing `tsc` spec-types reason → Out of scope; verification is `npm test`, `npm run lint`, and `openspec validate --strict`.

## Migration Plan

No data migration. Locale files are source, not stored data. Existing gains, remittances, and `reinvestedUSD` values load and behave exactly as before; the only observable differences are a dialog that accepts its own default, an error message that replaces a silent `console.error`, and an import that refuses instead of quietly discarding a record. Rollback is a revert of the affected files — no stored shape changes, so a revert needs no cleanup.

## Open Questions

None blocking. The banner's exact copy is a translation decision that can be tuned during implementation without touching the specs, provided the meaning matches the requirement scenarios.