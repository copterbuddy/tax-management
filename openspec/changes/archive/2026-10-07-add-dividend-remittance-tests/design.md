# Design

## Context

See `proposal.md` — Why for motivation.

Constraints that shape the approach:

- The bug is in a React component (`DividendRemitForm.tsx`), not in the engine. The engine's
  `calculateWhtCredit()` already takes `remitFxRate` as a parameter and is already correct.
- `reportableIncomeTHB` is not produced by any engine function. It is a bare inline
  multiplication in the component, then persisted into the `DividendRemittance` object.
- Jest is configured with `testMatch: ['**/*.spec.ts', '**/*.spec.tsx']` and `jsdom`, so a
  component test is technically available — but `collectCoverageFrom` covers only
  `engine/`, `store/` and `validation/`, and no component spec exists anywhere in the repo.
- The change must be reviewable as "tests + the one-line fix they force". Every additional
  refactor widens the diff and the review burden.

## Goals / Non-Goals

**Goals:**

- Make the remittance-date FX rule executable: a test that fails if the rule is broken.
- Cover every exported engine function and every slice action, so no dividend code path is
  untested.
- Keep the production change to the minimum needed to satisfy the tests.

**Non-Goals:**

- Extracting a new engine function. See Decision 1.
- Migrating already-persisted wrong `reportableIncomeTHB` values. See Decision 4.
- Fixing the year-scoping behaviour in `computeDividendSummary()` / `DividendTab`. Deferred
  so this change cannot accidentally redefine what "correct" means for those totals.

## Decisions

### 1. Keep the fix inline; do not add an engine function

`reportableIncomeTHB` stays as `const reportableIncomeTHB = remitTHB;` in the component
rather than being moved into a new `calculateReportableIncome()` in `dividendEngine.ts`.

*Rationale.* The formula is one multiplication with no branching, no reuse (one call site),
and no validation. Introducing an engine function for it would put a trivial wrapper behind
an import and make the diff larger for no gain.

*Alternative considered.* A `calculateRemittanceTHB()` returning all three THB figures
together. This would be the better long-term shape — it is what `calculateDividendTHB()`
already does for the dividend-date snapshot — but it changes the component's data flow and
the reason for this change is to add tests, not to restructure. If the same figure is ever
needed in a second place, do that extraction in its own change, with the tests already in
place to protect it.

*Consequence for tests.* Because the formula lives in a component, its correctness is
verified indirectly. This is the main limitation of the design; Decision 3 addresses it.

### 2. Test the engine directly; do not render the dialog

`dividendEngine.spec.ts` imports and calls the pure functions. No React rendering, no store,
no jsdom.

*Rationale.* The engine is pure by project convention (`config.yaml` — "engine/ is pure").
Direct calls give exact assertions on exact numbers, which is what a tax calculation needs;
a rendered test would only see formatted strings.

*Alternative considered.* Snapshot-testing the `DividendRemitForm` preview panel. Rejected —
snapshots assert "the output did not change", not "the output is right". A snapshot taken
today would freeze the ฿25,500 bug in place.

### 3. Pin the invariant, not just the value

The headline test asserts that `reportableIncomeTHB` equals `amountUSD × remitFxRate` **and**
that it is unchanged when `dividendFxRate` differs from `remitFxRate`. Two records differing
only in dividend-date rate must produce the same reportable income.

*Rationale.* A test asserting only "850 × 31 = 26,350" still passes if someone later changes
the divisor to a third rate. Asserting independence from `dividendFxRate` names the actual
rule, so the test fails for the actual mistake this change is fixing.

### 4. No data migration in this change — deferred to a follow-up change

Remittances already stored with a wrong `reportableIncomeTHB` are left alone **by this
change only**. The user has decided (2026-10-05) that the cleanup happens later, as its own
change, after this change's test results are visible.

*Rationale.* Two reasons, and they point the same way. First, correctness is not a blocker:
`remitTHB` on the same record is already right, so `reportableIncomeTHB` is exactly
recoverable as `remitTHB` — the data loss is nil. Second, a migration rewrites tax figures a
user may already have filed, and the user should decide whether to re-file. Deferring keeps
the two decisions separable: prove the rule with tests first, then rewrite stored figures
with full knowledge of what was wrong.

*Alternative considered.* Fix up on load inside `loadDividends()`, silently setting
`reportableIncomeTHB = remitTHB` for every record where they differ. Rejected: it mutates
stored data as a side effect of a test-and-fix change, and a silent write on read makes the
"what changed" question unanswerable.

**Follow-up change (agreed, not in scope here):** repair stored dividend remittances where
`reportableIncomeTHB !== remitTHB`. Because `remitTHB` was always computed correctly, the
repair is a copy, not a recomputation — the source figure is on the same record. It still
needs its own proposal, because it rewrites figures the user may already have submitted.

### 5. Follow the existing slice test pattern

`dividendSlice.spec.ts` mirrors `taxSlice.spec.ts`: `configureStore({ reducer: { dividend:
dividendReducer } })`, dispatch actions, assert `store.getState().dividend`.

*Rationale.* Consistency with the 116 tests already in the repo beats a locally novel
approach. The reducers call engine functions and write localStorage, so this covers the
integration for free — no separate harness.

*Note.* localStorage state must be cleared in `beforeEach`, since `buildInitialState()` reads
from it at module load.

## Risks / Trade-offs

- **The reportable-income formula remains untested at its actual source.** Decision 1 accepts
  this. The engine-level invariant test (Decision 3) plus the persisted-value test in the
  slice suite bound the risk: a wrong value reaching storage is caught, even though the
  component line itself is not directly executed. → Mitigation: if a second call site for
  this figure ever appears, extract to the engine first, then test it there.

- **Rounding.** `toFixed(2)` is used for display while stored values keep full float
  precision. Tests use `toBeCloseTo` for the fractional credit figures
  (2,735.294117… → 2,735.29) rather than exact equality, so a legitimate precision change
  does not break the suite. → Mitigation: `toBeCloseTo(x, 2)` for THB figures, exact
  equality for USD figures.

- **`npm run build` remains red.** `tsconfig.app.json` type-checks `src/*.spec.ts` without
  jest types. Adding two more spec files does not make this worse, but it also does not fix
  it, and the failure count will look like it grew. → Mitigation: verify with `npm test` +
  `npm run lint`, as `config.yaml` documents. The tsconfig fix goes through the repo's own
  BA → Dev → QA flow, not through this change.

- **Test brittleness against `crypto.randomUUID()`.** Fixtures must supply stable ids rather
  than reading generated ones. → Mitigation: construct `DividendRecord` fixtures with literal
  ids.

- **Scope creep via the year-scoping bugs.** A tester reading the new summary tests may
  notice `totalUnremittedUSD` ignores the selected year and try to fix it here. →
  Mitigation: `tasks.md` lists the year-scoping items as explicitly out of scope, and the
  summary tests assert current behaviour rather than ideal behaviour, so nobody is invited
  to "correct" them mid-change.

## Migration Plan

None. No schema change, no stored-format change, no deploy step. One production line changes
(`DividendRemitForm.tsx:48`); new files are tests only.

Rollback is a revert of that one line.

## Open Questions

None. Everything that would change the specs or the task breakdown — the fix shape, the
migration decision, the year-scoping deferral — is settled above or deferred in the proposal.