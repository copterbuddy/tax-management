# Design

## Context

See [proposal.md](./proposal.md) for why. Current state that shapes the approach:

**Invested-proceeds path**

- `MarkReinvestedDialog` rounds `row.availableBalanceUSD` to cents once (`toCents`) and uses that rounded figure for the hint text and `defaultValues`, but its zod schema caps the value at the raw `row.availableBalanceUSD`. The form registers the input with `valueAsNumber: true`, so the schema sees exactly what the user (or `defaultValues`) put in.
- `setReinvestedAmount` in `tradeSlice` already calls `applyReinvestedAmount`, which throws when the amount exceeds `sellRevenueUSD − totalRemittedUSD` (plus the shared half-cent money tolerance). The reducer catches that throw and logs it.
- The dialog closes inside `Dashboard.handleSubmitReinvested` immediately after dispatch, so nothing rendered inside the dialog can report a failure that happens during the dispatch.
- `importTrades` recomputes gains with an empty existing-gains list, and `recomputeGains` maps over freshly computed gains, merging remittances and `reinvestedUSD` from a map keyed by `sellTradeId`. Records therefore survive an import only if that list is supplied.

**Remittance path**

- `src/engine/fifoEngine.ts` owns the arithmetic. `applyRemittance(gain, remittance)` (L215) is the only way a remittance enters a gain, and it signals rejection by **throwing** three plain `Error`s: non-positive amount, `sellTradeId` mismatch, and `totalRemittedUSD + amountUSD > sellRevenueUSD + MONEY_TOLERANCE_USD`. `MONEY_TOLERANCE_USD = 0.005` is module-private (L38).
- `src/engine/dividendEngine.ts` already has the opposite shape — `validateRemittance(dividend, amountUSD)` (L69) returns `{ valid, message }` and never throws. The two engines disagree on how validation is expressed.
- `src/store/tradeSlice.ts` calls `applyRemittance` in four places and swallows every throw: `recomputeGains` (L118), two blocks in `recomputeGainsWithModifiedRemittances` (L138, L145), and the `addRemittance` reducer (L230). `updateRemittance` and `deleteRemittance` route through `recomputeGainsWithModifiedRemittances`, so they inherit the same silence. `dividendSlice.ts` L102 repeats the pattern.
- `Dashboard.handleAddRemittance` (L139) calls `setShowRemitForm(false)` unconditionally after dispatch, so even a failed dispatch closes the form.
- `RemitForm.onFormSubmit` guards with `amount > effectiveRemaining` — no tolerance, so it is *stricter* than the engine. A slip-exact figure against a float-derived remainder (`6636.2699999999995` vs a `6636.27` slip) is refused by the form before the engine can accept it.
- `RemittanceLog` renders every remittance row, flattened from `gains` and filtered by year, and sums `amountUSD`/`amountTHB`/`taxableTHB` into a footer total.
- `remittanceRecordSchema` (L42) is a plain `z.object`, so zod strips unknown keys on load.
- Redux reducers cannot return a value to their dispatcher. Any design that reports failure must either pre-flight before dispatch or move the failure into state.

**Shared**

- Redux state lives in memory; only trades, gains, remittances, and reminders are persisted through `saveTrades` / `saveGains`. Component strings go through `t('<namespace>:<key>')` with matching en/th keys.

## Goals / Non-Goals

**Goals**

- Every refusal path the user can reach shows a message they can read, in their language, without changing any stored figure.
- The prefilled amount always submits, and the cap is exactly the balance shown.
- A remittance is either applied and counted, or rejected and reported — never dropped in silence, on both the capital-gain and the dividend path.
- An import preserves everything it does not have to drop, before any import UI exists to exercise it — and where it cannot preserve, it keeps the record and says so.
- One definition of "an acceptable remittance", expressed once and consumed by the form, by the storage path, and by recomputation.
- Both locale files parse to identical key sets with one indentation style.

**Non-Goals**

- No change to engine limits, tolerance, tax math, FIFO matching, dividend handling, or the meaning of `reinvestedUSD`.
- No general form-error framework, toast system, or error boundary.
- No import UI. `importTrades` stays an unwired API; only its contract is fixed.
- No storage-key, schema-version, or persisted-shape change: both new flags are optional and absent means today's behaviour.
- No offshore cash ledger derived from bank transfers, and no DPZ/Liberator handling.

## Decisions

### D1 — Validate in whole cents against the displayed balance

Both sides of the cap are rounded to the same cent grid before comparison: the balance is `toCents(row.availableBalanceUSD)` (already computed), and the entered value is compared after `toCents`. The schema becomes `min(0)` plus a `refine(toCents(value) <= balance)` carrying the existing `markReinvestedExceeds` message; `.max(row.availableBalanceUSD)` disappears.

*Why*: the bug is a unit mismatch, not a rounding-direction bug. `0.30000000000000004` and `0.30` are the same number of cents; anything that compares them as floats rejects the dialog's own default. Comparing on the cent grid makes "prefilled always valid" and "one cent above is refused" both true by construction rather than by luck.

*Alternatives considered*: keeping `.max` and rounding the cap (`max(toCents(raw))`) fixes the reported case but still compares displayed-rounding against raw-typed values inconsistently, and leaves the two numbers compared in different units. Flooring to cents would wrongly refuse a legitimate `146.435` → display `146.44`… i.e. display and cap would disagree again.

*Constraint preserved*: the input keeps `min={0}` and must not gain a native `max` attribute — jsdom enforces native constraints on submit and would short-circuit the translated zod message.

*Relationship to the parent requirement*: this implements the comparison rule stated by the delta requirement *The mark-reinvested dialog accepts any amount up to the balance it displays*, which **refines** the parent requirement *Each outstanding gain offers remit and mark-reinvested actions*. That requirement's cap stays the only cap; this work changes only how the two numbers are compared and which one the message quotes.

### D2 — One transient error slot, one code, reported on the Trades tab

`TradeState` gains `ledgerError: LedgerError | null`, where `type LedgerError = { code: 'reinvestedExceedsBalance' }`. The `setReinvestedAmount` catch sets it and leaves `gains`, `remainingLots`, and `taxSummaries` untouched; it stays set until a record is accepted, the user dismisses it, an import is applied, `clearAllTrades` runs, or the page reloads. A `clearLedgerError` action backs the dismiss control. `TradesTab` renders a dismissible banner directly above the outstanding list — the same presentational component that already owns that list — so it appears on the Trades tab and nowhere else.

*Why a code, not a message*: a formatted message frozen into state would freeze the language too — switching en/th with the banner visible would leave stale text, and the store would need i18n at dispatch time. A code keeps translation in the view layer, where every other string already lives, and keeps the reducer free of React/translation concerns.

*Why one code and not a union*: an earlier revision also carried `{ code: 'importOverRemittance'; sellLabel }` for an import it refused wholesale. D10 replaces refusal with keep-and-flag, so no reducer can produce that variant and no branch could reach its key; a one-member union keeps the slot shaped for growth without dead copy in two locale files. Remittance rejections are reported through the validator's returned result (D4, D5), not through this slot, because the form answers them before any dispatch happens.

*Why the dialog still closes*: a refused record changes nothing, so the outstanding row the user acted on is still there with its unchanged balance, and reopening the dialog prefills that same balance — the value is recoverable in one click and no typing is lost that the list does not already show. Keeping the dialog open would buy nothing the list does not display, while costing a two-phase submit: `handleSubmitReinvested` would have to dispatch, read back whether the reducer refused, and only then decide whether to unmount, making the dialog's lifetime depend on store state written by the reducer it just triggered. A message rendered inside the dialog is unreachable anyway, because the dialog is unmounted by the time the reducer throws.

*Alternatives considered*: keep the dialog open until the store confirms — rejected for the extra state machine above; `window.alert` — rejected by the brief and untranslatable in tests; a toast library — new dependency for one message; storing the thrown `Error.message` — English only, with an untranslatable `$x.xx` fragment; storing `{ code, availableUSD }` — the figure can be stale by the time it renders.

### D3 — Fix the import by supplying the current gains, not by merging after the fact

`importTrades` calls `recomputeGains(state.trades, state.gains)`, exactly as `addTrade`, `updateTrade`, and `deleteTrade` already do. No new merge code, no id reconciliation, no special case.

*Why*: `recomputeGains` already implements the correct contract — fresh FIFO over the new trade list, then re-attach remittances and `reinvestedUSD` per `sellTradeId`. Passing `[]` disabled half of that contract, and the comment above it rationalised the loss. Passing `state.gains` restores it, and the drop-only-vanished-sales rule falls out of `freshGains.map` for free. `clearAllTrades` keeps resetting state directly because wiping is its whole purpose.

*Why that alone is not the whole story*: the re-attach step runs inside `try { applyRemittance } catch { … }`, so a record the shrunken sale can no longer support would still vanish. D6 gives that path somewhere to put the record and D10 states what the import guarantees; the ordering matters because the `unapplied` flag is introduced by the remittance-integrity group that task group 4 covers, while the import group is task group 3.

*Alternatives considered*: a bespoke `mergeGains(imported, existing)` helper — duplicates logic that is already shared by three reducers; keeping the wipe and documenting it — rejected because "an imported list carries no such record" was never true: the records live in gains, not in the imported trade list.

### D4 — One pure engine validator that returns a result, and stays the only rule set

Add `validateRemittance(gain: RealizedGainResult, remittance: RemittanceRecord): ValidationResult` to `fifoEngine.ts`, mirroring `dividendEngine.validateRemittance`'s `{ valid, message }` shape. It encapsulates the same three rules as `applyRemittance` and calls the same internal tolerance constant, so `MONEY_TOLERANCE_USD` is referenced once. `applyRemittance` is re-expressed in terms of the same predicates and still throws, because it remains the last line of defence at the persistence boundary.

*Why a returned result rather than Redux state*: a reducer has no return channel, and the form can answer the question before it dispatches. `dividendEngine`'s precedent shows the codebase already prefers a returned result; a `lastError` field would need clearing logic and would go stale after the next successful dispatch. The `ledgerError` slot (D2) is deliberately **not** a general error channel — it carries the one refusal that happens *during* a dispatch, where no pre-flight can help. These are two mechanisms for two different failures, not competing designs.

*Why not make the form replicate the rule*: it already does, and the two copies have drifted (no tolerance in the form). Two copies is the defect.

### D5 — The form pre-flights and stays open; the reducer keeps its guard

Flow for a submission:

1. `RemitForm.onFormSubmit` builds the `RemittanceRecord` draft and calls `validateRemittance(selectedGain, draft)`.
2. If invalid → `setError('amountUSD', { message: t(...) })` (existing mechanism, existing `remittance:remitExceeds` key reused where the message matches) and **return without calling `onSubmit`**. The form stays open because the Dashboard handler is never reached.
3. If valid → call the `onSubmit` prop. `Dashboard.handleAddRemittance` dispatches and only then closes the form — the handler returns whether the dispatch applied, and the form closes on `true`.
4. The reducer still re-checks with the same validator before applying. This is not duplicated logic: it is the persistence-boundary guard for callers that bypass the form (tests, future code, restored data). On failure the reducer leaves state untouched and records the reason for diagnostics.

*Why the form is the right place*: `RemitForm` already holds the values and already renders per-field errors, and `react-hook-form` retains them for free once the component stops unmounting.

### D6 — Mark, don't drop, a remittance invalidated by a later trade change

`RemittanceRecord` gains an optional `unapplied?: boolean`. Recompute paths become:

```
working = gain recomputed from the trades alone
for each stored record in its stored order:
  if validateRemittance(working, record).valid
    -> working = applyRemittance(working, record); record.unapplied = undefined
  else
    -> keep the record untouched in the list, with unapplied: true
```

Every record is re-evaluated on every recompute — including one already flagged — so a raised revenue or a reduced amount re-applies it and the flag clears; the order of the loop never migrates a record, only its applied/unapplied state.

The record keeps every field (id, amountUSD, remitDate, fxRateTHB, notes) and stays in `tax_tracker_gains` inside `gain.remittances` — so nothing the user typed is lost — but it is excluded from `totalRemittedUSD`, `taxableGainTHB`, and every tax-year total.

*The decision is per record, in order*: each record is tested against the gain as the records before it left it, so a record that still fits at its turn stays applied. Revenue 100 against remittances of 75 and 75 leaves the first applied and counted and flags only the second; revenue 100 against 120 and 120 flags both, because the first already exceeds the whole balance on its own. Nothing about a record decides its fate — its position does — which is why "two records totalling more than the revenue" is not the same statement as "both are flagged".

*The flag must be filtered at the source, not only skipped when recording it*: `computeTaxSummary` builds `yearRemittances` from every gain's `remittances` filtered by date alone (`src/engine/fifoEngine.ts` L365–369), so a flagged record would still land in `totalRemittedUSD`, `taxableGainUSD`, `taxableGainTHB`, `totalRemittanceCount`, `remittedSellCount`, `excludedLossesUSD` and every `providerBreakdown` row. The "excluded from every tax-year total" claim above is true only once that one array also excludes `unapplied === true`; without the filter the flag changes a row on screen and leaves the tax figures untouched. That filter is therefore its own task in the engine group, ahead of the store-level marking, so the totals are correct the moment the first record is flagged.

*Why not push the invalid record into a throwaway `state.issues` array*: the record would only survive a reload if it lives inside `gain.remittances`, because that is what `saveGains` writes. An issues array is either persisted (same schema change, less obvious) or lost. Keeping the flag on the record makes the record self-describing and re-derivable on load.

*Word of warning that becomes a task*: zod strips unknown keys, so `unapplied` **must** be added to `remittanceRecordSchema` in `src/validation/schemas.ts`. Without it, the flag is stripped on the next load, the record silently re-applies, and the totals change across a reload.

### D7 — Report unresolved remittances once, where the user is looking

`RemittanceLog` already renders every remittance row with per-row edit and delete actions. The unresolved report goes there — the specific row is marked and a message states the reason — rather than a page-level banner. That satisfies "reported, not silently changed" while keeping the change inside an existing component, and it keeps the record actionable in place. A page-level banner was rejected as it would duplicate the per-row report and add UI surface for a rare state.

`RemittanceLog` also sums `amountUSD`, `amountTHB` and `taxableTHB` into a footer total across *all* rows in the selected year, so a flagged row would inflate those totals unless it is excluded. Excluding it from the sums while still rendering the row is what makes "retained for repair but not counted" true in the UI as well as in the store.

### D8 — The dividend path gets the same shape, not a second design

`dividendSlice.addDividendRemittance` already has a validator to call; the change is to pre-flight in `DividendRemitForm` and to replace the bare `catch { console.error }` with a reported failure, so both remittance paths behave identically. No new engine function is needed.

### D9 — Reuse `remittance:remitExceeds` where it already says the right thing

New messages go through `t('remittance:…')` in both `en` and `th`. Where an existing key already states the rejection (the exceeds-remaining case), it is reused and its interpolation receives the tolerance-aware remainder; new keys are added only for the non-positive and mismatch cases that currently have no message.

### D10 — An import keeps and flags; it no longer refuses

Because D6's re-attach step now keeps a record it cannot apply, `importTrades` passes `state.gains` (D3) and does nothing else: no pre-flight comparison of record counts, no rejected import. A sale whose revenue shrank below what was already remitted keeps every remittance with its date, the record is flagged `unapplied`, the unresolved state is visible in `RemittanceLog` (D7), and it is excluded from totals.

*Why this supersedes refusing the whole import*: with the flag, an over-remitted gain is a state the engine **can** represent. `totalRemittedUSD` counts only applied records, so the counted sum still fits `sellRevenueUSD`, `remainingProceedsUSD` stays non-negative, and `taxableGainTHB` charges tax only on money the sale earned. Refusal was the fallback for when keeping those records was unrepresentable — the flag removes that premise, and keeping the user's history is strictly better than rejecting their file.

*Behaviour change accepted*: a shrunken sale's remaining balance reappears (its flagged record no longer offsets it) until the user corrects or deletes the record. That is the point — the sale really did earn less than the records claim, and the app shows the discrepancy instead of hiding it.

*Limit*: the mechanism acts on records it can see. A remittance already missing from stored gains before this change ships (dropped by the old `recomputeGains` inside `importTrades`) cannot be resurrected or reported — nothing records that it once existed, and no test can prove it was there. The change prevents new loss; it does not audit historical loss.

### D11 — `ledgerError` is transient, never persisted

The field is neither saved nor validated by a zod schema, and it is not part of any storage payload. A reload starts with `null`.

*Why*: the schema in `validation/schemas.ts` is the persistence gate for stored records; an error slot is session UI state. Persisting it would resurrect a stale complaint after the data it referred to is gone, and would force a schema-version conversation this change explicitly avoids. The same reasoning is why a successful `importTrades` and `clearAllTrades` both clear it: each replaces the state any previous complaint was about.

### D12 — Locale normalisation is mechanical, verified structurally

Indentation of the drifted lines in `src/i18n/locales/{en,th}/common.json` becomes two spaces to match the rest of each file. No key is renamed, reordered, retranslated, or removed. Verification is structural rather than visual: every namespace (`common`, `trade`, `remittance`, `dividend`) in both languages parses as JSON, `en`/`th` key sets are identical per namespace, and a whitespace-insensitive diff of each edited file against its pre-change content is empty.

*Why*: a hand-fix risks value drift that no reviewer would spot in a whitespace-dominated diff. Comparing `JSON.parse` output with indentation stripped proves only formatting moved.

*Scope note*: `en/common.json` carries the same 14 drifted lines as the Thai file and is fixed alongside it — the two files are read as a pair and diverge only by translation. The comparison covers all four namespaces so the check cannot be satisfied by fixing one. `en/trade.json` has three pre-existing drifted lines (`formGrossAmount` and neighbours, lines 37–39) from an earlier change; they are out of scope, so the task asserts they stay **byte-identical** rather than requiring them to be clean.

### D13 — New behaviour lands as ADDED requirements, and the spec base gates archiving

The new `reinvested-proceeds` requirements are ADDED rather than MODIFIED, so the parent change's requirement text and scenarios are untouched. `trade-import-safety` and `remittance-integrity` are both new capabilities, each with its own Purpose; `trade-import-safety` cross-references `remittance-integrity` for how an unresolved record is displayed and excluded, so that display rule is stated once and not duplicated.

*Why*: MODIFIED must reproduce an entire existing requirement block, and the block being extended ("Each outstanding gain offers remit and mark-reinvested actions") describes the actions themselves, not validation precision or error reporting. Adding requirements that each state one behaviour keeps the archive merge free of accidental loss.

*Spec base*: `reinvested-proceeds` is archived under `openspec/changes/archive/2026-11-15-reinvested-proceeds`, but archiving does not by itself write main specs, and this one was archived without a sync. Before this change is archived, `openspec/specs/reinvested-proceeds/spec.md` must exist with the parent's 9 requirements, `openspec/specs/tax-year-summary/spec.md` with 6, and `dashboard-tab-layout` must carry the not-yet-remitted card requirement it received from that change. As of this revision the check passes. If it ever fails, the repair is `mv openspec/changes/archive/2026-11-15-reinvested-proceeds openspec/changes/reinvested-proceeds`, then `openspec archive reinvested-proceeds --yes`, then `openspec validate --all --strict`. Archiving this change against a partial base would create `reinvested-proceeds/spec.md` from only the requirements added here, over a placeholder Purpose, silently losing the others.

## Risks / Trade-offs

- **Rounding at the cap admits sub-cent overshoot** (a typed `0.304` is treated as `0.30`) → Accepted: the app's money unit is the cent, the engine already tolerates half a cent, and the alternative is the bug being fixed.
- **A reinvested refusal does not name the sale** → Mitigation: the failing row is still on screen with its unchanged balance directly below the banner; the message names the action and the rule.
- **`ledgerError` can outlive its cause** if the user edits trades after a failure → Mitigation: it is cleared by the next successful record, by dismissal, by a successful import, by `clearAllTrades`, and by reload; it never blocks or alters behaviour. It is not cleared by unrelated actions, so a stale message can sit on screen until dismissed — accepted, since dismissing is one click and auto-clearing on any dispatch would hide the message before it is read.
- **The zod schema omission silently undoes D6** (flag stripped on load, record re-applies) → `unapplied` is added to `remittanceRecordSchema` in the same change, and a test loads a gains array containing an `unapplied` record and asserts it stays unresolved.
- **Retaining invalid records makes `gain.remittances` contain records that are not counted**, so any code that sums the array directly (rather than `totalRemittedUSD`) would over-count → audit every `remittances` consumer; `totalRemittedUSD` and `remainingProceedsUSD` remain the authoritative computed fields.
- **A shrunken sale's balance reappears while its record sits flagged** → Intended, and stated in D10: the sale genuinely earned less than the records claim, and one edit restores the intended figures. A user who does not notice the flag sees a larger outstanding balance, never a smaller tax figure.
- **A user editing a SELL can no longer "reset" a remittance by shrinking the trade** → the record is now kept, visible, and must be edited or deleted deliberately. Intended (a change that alters a tax figure must be explicit) but a workflow change worth stating.
- **`withReinvestedAmount` still swallows its throw**, so a `reinvestedUSD` that no longer fits a shrunken import is dropped → stated as a known limitation, not fixed here: giving `reinvestedUSD` the same flagged treatment would need a second flag and a second repaired state in the outstanding list, and no user has hit it.
- **The form and the reducer can still diverge if a future rule is added to only one** → both call the single validator; a test runs the same input through both.
- **Import fix is unexercised in production** because no importer exists → Mitigation: slice tests drive `importTrades` directly with identical, shrunken, and no-op lists, and assert figure-for-figure summary equality.
- **The keep-and-flag path is only as good as the stored records** → Accepted: a remittance dropped by an older build cannot be reported (D10 limit). New loss is prevented; past loss needs the user's own records.
- **Whitespace-only edits are easy to under-verify** → Mitigation: parse every locale namespace in both languages and compare key sets plus a whitespace-insensitive diff, rather than eyeballing indentation.
- **`npm run build` stays red** for the pre-existing `tsc` spec-types reason → Out of scope; verification is `npm test`, `npm run lint`, and `openspec validate --strict`.

## Migration Plan

No data migration. Locale files are source, not stored data. Existing gains, remittances, and `reinvestedUSD` values load and behave exactly as before: absent `unapplied` means "applied", which is exactly today's meaning. The observable differences are a dialog that accepts its own default, an error message that replaces a silent `console.error`, an import that preserves what it used to discard, and a remittance that is kept and flagged instead of dropped.

Rollback is a code revert. Records written with `unapplied: true` become ordinary records the moment the field is no longer recognised, i.e. they would silently re-apply — so revert and re-check the tax-year totals rather than assuming the old numbers return.

## Open Questions

- Whether a remittance whose `amountUSD` fails the schema's `positive()` check (which fails the whole `gains` array parse and resets every gain to `[]`) should be quarantined per-record instead of losing the array. Separate concern; the current behaviour predates this change and is not made worse by it.
- The banner's exact copy is a translation decision that can be tuned during implementation without touching the specs, provided the meaning matches the requirement scenarios.