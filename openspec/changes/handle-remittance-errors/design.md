# Design

## Context

See `proposal.md` for motivation and `specs/remittance-integrity/spec.md` for the requirements.

Current state that shapes the approach:

- `src/engine/fifoEngine.ts` owns the arithmetic. `applyRemittance(gain, remittance)` (L215) is the only way a remittance enters a gain, and it signals rejection by **throwing** three plain `Error`s: non-positive amount, `sellTradeId` mismatch, and `totalRemittedUSD + amountUSD > sellRevenueUSD + MONEY_TOLERANCE_USD`. `MONEY_TOLERANCE_USD = 0.005` is module-private (L38).
- `src/engine/dividendEngine.ts` already has the opposite shape — `validateRemittance(dividend, amountUSD)` (L69) returns `{ valid, message }` and never throws. The two engines therefore disagree on how validation is expressed.
- `src/store/tradeSlice.ts` calls `applyRemittance` in four places and swallows every throw: `recomputeGains` (L118), two blocks in `recomputeGainsWithModifiedRemittances` (L138, L145), and the `addRemittance` reducer (L230). `updateRemittance` and `deleteRemittance` route through `recomputeGainsWithModifiedRemittances`, so they inherit the same silence.
- `src/store/dividendSlice.ts` L102 repeats the pattern for dividend remittances.
- `Dashboard.handleAddRemittance` (L139) calls `setShowRemitForm(false)` unconditionally after dispatch, so even a failed dispatch closes the form.
- `RemitForm.onFormSubmit` guards with `amount > effectiveRemaining` — no tolerance, so it is *stricter* than the engine. A slip-exact figure against a float-derived remainder (`6636.2699999999995` vs a `6636.27` slip) is refused by the form before the engine can accept it.
- Redux reducers cannot return a value to their dispatcher. Any design that reports failure must either pre-flight before dispatch or move the failure into state.
- `remittanceRecordSchema` (L42) is a plain `z.object`, so zod strips unknown keys on load. Adding a persisted field without adding it to the schema silently deletes it on the next page load.

## Goals / Non-Goals

**Goals:**

- One definition of "an acceptable remittance", expressed once and consumed by the form, by the storage path, and by recomputation.
- Every rejection reaches a human. A rejection has exactly one cause visible at a time so the message is actionable.
- A remittance that was once applied can never vanish because a trade changed underneath it.

**Non-Goals:**

- Changing any tax arithmetic: `applyRemittance`'s acceptance formula, `MONEY_TOLERANCE_USD`, the FIFO matcher, `computeTaxSummary`, and the Thai tax rules 1–10 stay exactly as they are.
- Changing storage keys, migrating data, or changing the shape of an *accepted* remittance.
- A global toast/notification framework. Errors are surfaced where the user acted, reusing the existing inline-error and `alert()` patterns.
- Making `applyRemittance` stop throwing. It stays the last line of defence; the design adds a check in front of it rather than replacing it.

## Decisions

### D1 — Validate with a pure engine function that returns a result, before dispatching

Add `validateRemittance(gain: RealizedGainResult, remittance: RemittanceRecord): ValidationResult` to `fifoEngine.ts`, mirroring `dividendEngine.validateRemittance`'s `{ valid, message }` shape. It encapsulates the same three rules as `applyRemittance` and calls the same internal tolerance constant, so the tolerance stays in exactly one place. `applyRemittance` is refactored to be expressed in terms of the same predicates (throwing only to keep its existing contract).

Why not surface errors through Redux instead: a reducer has no return channel, so it would need a mutable `lastError`/`issues` field, a middleware, or thunks. `dividendEngine`'s precedent shows the codebase already prefers a returned result; a stated error field would also need clearing logic and would go stale after the next successful dispatch.

Why not make the form replicate the rule: it already does, and the two copies have drifted (no tolerance in the form). Two copies is the defect.

### D2 — The form pre-flights; the reducer keeps its throw and gains a report

Flow for a submission:

1. `RemitForm.onFormSubmit` builds the `RemittanceRecord` draft and calls `validateRemittance(selectedGain, draft)`.
2. If invalid → `setError('amountUSD', { message: t(...) })` (existing mechanism, existing `remittance:remitExceeds` key reused where the message matches) and **return without calling `onSubmit`**. The form stays open because the Dashboard handler is never reached.
3. If valid → call the `onSubmit` prop. `Dashboard.handleAddRemittance` dispatches and only then closes the form — the handler returns whether the dispatch applied, and the form closes on `true`.
4. The reducer still re-checks with the same validator before applying. This is not duplicated logic: it is the persistence-boundary guard for callers that bypass the form (tests, future code, restored data). On failure the reducer leaves state untouched and reports to the console with the reason — it is now unreachable from the UI, so a console record is a defect signal, not a user-facing channel.

`RemitForm` keeping the values is free: it stops unmounting, and react-hook-form retains state.

### D3 — Mark, don't drop, a remittance invalidated by a later trade change

`RemittanceRecord` gains an optional `unapplied?: boolean`. Recompute paths become:

```
apply list = records where !unapplied
for each record:
  candidate = validateRemittance(currentGain, record)
  if valid  -> currentGain = applyRemittance(currentGain, record)
  else      -> keep the record in the list with unapplied: true
```

The record keeps every field (id, amountUSD, remitDate, fxRateTHB, notes) and stays in `tax_tracker_gains` inside `gain.remittances` — so nothing the user typed is lost — but it is excluded from `totalRemittedUSD`, `taxableGainTHB`, and every tax-year total. `RealizedGainResult` gains a derived `unappliedRemittances` view (or the UI filters `remittances` by the flag) for reporting.

Why not push the invalid record into a throwaway `state.issues` array: the record would still be written to localStorage by `saveGains` only if it lives inside `gain.remittances`; an issues array is either persisted (same schema change, less obvious) or lost. Keeping the flag on the record makes the record self-describing and re-derivable on load.

Word of warning that becomes a task: zod strips unknown keys, so `unapplied` **must** be added to `remittanceRecordSchema` in `src/validation/schemas.ts`. Without it, the flag is stripped on the next load, the record silently re-applies, and the totals change across a reload.

### D4 — Report unresolved remittances once, where the user is looking

`RemittanceLog` already renders every remittance row (flattened from `gains`, filtered by year) with per-row edit and delete actions. The unresolved report goes there — the specific row is marked and a message states the reason — rather than a page-level banner. That satisfies "reported, not silently changed" while keeping the change inside an existing component, and it keeps the record actionable in place. A page-level banner was rejected as it would duplicate the per-row report and add UI surface for a rare state.

`RemittanceLog` also sums `amountUSD`, `amountTHB` and `taxableTHB` into a footer total across *all* rows in the selected year, so a flagged row would inflate those totals unless it is excluded. Excluding it from the sums while still rendering the row is what makes "retained for repair but not counted" true in the UI as well as in the store.

### D5 — Dividend path gets the same shape, not a second design

`dividendSlice.addDividendRemittance` already has a validator to call; the change is to pre-flight in `DividendRemitForm` and to replace the bare `catch { console.error }` with a reported failure, so both remittance paths behave identically. No new engine function is needed.

### D6 — Reuse `remittance:remitExceeds` where it already says the right thing

New messages go through `t('remittance:…')` in both `en` and `th`. Where an existing key already states the rejection (the exceeds-remaining case), it is reused and its interpolation receives the tolerance-aware remainder; new keys are added only for the non-positive and mismatch cases that currently have no message.

## Risks / Trade-offs

- **The zod schema omission silently undoes D3** (flag stripped on load, record re-applies) → `unapplied` is added to `remittanceRecordSchema` in the same change, and a test loads a gains array containing an `unapplied` record and asserts it stays unresolved.
- **Retaining invalid records makes `gain.remittances` contain records that are not counted**, so any code that sums the array directly (rather than `totalRemittedUSD`) would over-count → audit every `remittances` consumer; `totalRemittedUSD` and `remainingProceedsUSD` remain the authoritative computed fields.
- **The form and the reducer can still diverge if a future rule is added to only one** → both call the single validator; the spec scenario "form and storage agree" is covered by a test that runs the same input through both.
- **A user editing a SELL can no longer "reset" a remittance by shrinking the trade** → the record is now visible and must be edited or deleted deliberately. This is the intended behaviour (a change that alters a tax figure must be explicit) but is a workflow change worth stating.
- **`unapplied` records still pass `amountUSD: z.number().positive()`**, so they do not break the load; but a record whose amount later becomes invalid for another reason would fail the array parse → out of scope here, noted in Open Questions.
- **`npm run build` is already red** for unrelated reasons (`tsconfig.app.json` type-checks `*.spec.ts` without jest types; a pre-existing `TS6133` in `dividendSlice.ts`). Verification uses `npm test` + `npm run lint`, and this change must not be blamed for, or attempt to fix, the build failure.

## Migration Plan

No data migration. Existing localStorage loads unchanged: absent `unapplied` means "applied", which is exactly today's meaning. A remittance that is currently being silently dropped is inert data that does not exist in storage, so there is nothing to recover; after this change it will be retained from the moment it is first rejected.

Rollback is a code revert. Records written with `unapplied: true` become ordinary records the moment the field is no longer recognised, i.e. they would silently re-apply — so revert and re-check the tax-year totals rather than assuming the old numbers return.

## Open Questions

- Whether a remittance whose `amountUSD` fails the schema's `positive()` check (which fails the whole `gains` array parse and resets every gain to `[]`) should be quarantined per-record instead of losing the array. Separate concern; the current behaviour predates this change and is not made worse by it.