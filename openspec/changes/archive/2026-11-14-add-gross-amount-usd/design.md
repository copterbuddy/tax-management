# Design

## Context

See `proposal.md` — Why.

Current state that shapes the approach:

- `calculateBuyCostUSD` and `calculateSellRevenueUSD` in `src/engine/fifoEngine.ts` both begin with `trade.quantity * trade.priceUSD`. Every downstream figure — `calculateUnitCostUSD`, FIFO lot costs, `gainUSD`, `gainPercent`, `taxableGainTHB`, and the remittance cap in `applyRemittance` — inherits that product.
- `TradeTransaction` (src/types/trade.ts) has no gross field, and `tradeTransactionSchema` (src/validation/schemas.ts) does not declare it. Zod strips undeclared keys on parse, so `loadTrades` → `saveTrades` deletes it. `migrateTrade` spreads the input (safe), so the only loss point is the schema.
- `TradeTable` does not call the engine. Both its desktop row and its mobile card recompute `totalUSD` inline from a locally-built fee sum, and the two copies disagree — mobile omits `vatUSD` and `tafFeeUSD`.
- `--color-warning` already resolves to an orange in all three theme blocks (`index.css` L20 light `#d97706`, L73 `[data-theme="dark"]` and L122 `prefers-color-scheme` `#fbbf24`). No new colour token is needed.
- `Tooltip` (src/components/Tooltip.tsx) renders a `<button>` trigger and hardcodes `aria-label="More information"`. Wrapping a table number in it would add a focusable button per cell and bring that hardcoded string into the accessibility path, so it is not used for this highlight.
- There is no JSON import/export UI in the app; `data_test/*.json` reaches the app by other means. Nothing in this design depends on that path.
- `recomputeGains` swallows `applyRemittance` errors (src/store/tradeSlice.ts L~119). That is why an under-derived revenue silently erases a taxable row instead of raising; the fix removes the trigger, not the swallow.

## Goals / Non-Goals

**Goals:**

- One place decides a trade's USD notional, so cost, revenue, the table, and the tax figure cannot disagree.
- Zero behavioural change for a trade that has no gross amount.
- The user can tell, per row, whether a number came from a slip or was calculated.
- A visibly wrong gross entry is caught at entry time rather than quietly becoming tax data.

**Non-Goals:**

- Deriving `priceUSD` from gross, or gross from price. Both stay independently enterable; they are independent evidence.
- Rounding or quantising money anywhere new.
- Fixing the silent `catch` in `recomputeGains`, the mobile card's missing VAT/TAF before this change, or `Tooltip`'s hardcoded label. The table refactor removes the mobile fee omission as a side effect of calling the engine, but no other pre-existing defect is in scope.
- Any storage key, shape version, or migration change.

## Decisions

### D1. One notional helper in the engine, `grossAmountUSD ?? quantity * priceUSD`

`fifoEngine.ts` gains a non-exported-by-default `notionalUSD(trade)` returning `trade.grossAmountUSD ?? trade.quantity * trade.priceUSD`. `calculateBuyCostUSD` and `calculateSellRevenueUSD` call it in place of the product.

Rationale: the precedence rule then exists exactly once, in the pure layer, and every consumer — including the table, once it calls these functions — inherits it. Adding the field to the cost/revenue functions rather than to every call site keeps the diff tiny.

Alternative rejected: branching inside the components. That reintroduces a second copy of the rule, which is the bug being fixed.

Alternative rejected: storing a precomputed `notionalUSD` on the trade. That freezes a derived value into user data and goes stale the moment quantity or price is edited.

### D2. Fallback, not migration

A missing gross amount falls back to the product. Nothing is backfilled into existing records, and `migrateTrade` is left alone.

Rationale: backfilling would need each historical trade's real slip figure, which the app does not have; inventing one from the product would make derived data indistinguishable from evidence. The fallback keeps existing local storage, existing `data_test` files, and existing engine tests valid unchanged.

Alternative rejected: a required field with a migration writing `quantity * priceUSD`. Same objection — it launders a guess into the authoritative field, and the orange indicator would then never appear for exactly the trades the user most needs it on.

### D3. `undefined` means absent; `0` is a real value

The schema declares `grossAmountUSD: z.number().min(0).optional()` — no `.default(0)`, and `migrateTrade` gains no default. The form uses `''` for empty and maps to `undefined` at submit.

Rationale: `0` is a legitimate (if implausible) figure, and `??` treats `null`/`undefined` as absent while treating `0` as present. A `.default(0)` would make every legacy trade read "gross = 0" and zero out its notional — the worst possible failure for a tax tool.

This is the one rule most likely to be broken by a well-meaning future edit, so it gets an explicit schema test.

### D4. Mismatch is a warning, never a block

`notionalMismatchUSD(trade)` returns `null` or `{ derived, gross, delta }`. It reports only when `|gross − derived| > quantity × 0.005 + 0.01`.

Rationale for warn-not-block: two-decimal unit prices make small gaps inevitable in normal trading; blocking would make legitimate trades unsaveable and would push the user to overwrite the slip figure with a worse one. The gross amount always wins regardless of the warning.

Rationale for the tolerance: half a cent per share is the largest rounding deficit two-decimal pricing can create per share, plus one cent of slack for cent-level slip rounding. The real book shows why this matters — the 224-share sell differs by 1.05, which is genuinely just price rounding, while the 173-share buy differed by 78.57 while its price was still entered as 29.50 against a slip of 5103.50, which was a data-entry error. A flat `0.01` tolerance would flag both; a percentage tolerance would flag neither. Every trade in the book as it stands today sits inside the tolerance, so the warning is expected to stay silent on correct data — it is a guard for the next entry, not a repair of the current one.

Surfacing: the trade form shows the notice inline when both figures are entered (that is where it can be corrected), and the row's total carries the same text as its `title` for trades loaded without passing through the form. Neither path blocks submit.

### D5. The orange highlight is a CSS class plus a native `title`, not a Tooltip

Fallback-derived values render as `<span className="value-fallback" title={t('trade:fromFallbackTitle', { qty, price })}>`. `index.css` defines `.value-fallback { color: var(--color-warning); }` once in the shared block, so all three theme blocks inherit the right orange.

Rationale: the table already has a focusable element per row (the row actions); adding a `Tooltip` button beside every derived number would multiply tab stops and drag `Tooltip`'s hardcoded English `aria-label` into a tax-sensitive surface. A native `title` supplies both the mouse hover text and the screen-reader accessible description with no new focus target.

Semantics: orange is scoped to "optional field not recorded", never to an error. `--color-danger` remains the error colour, which keeps a missing slip distinct from an invalid trade.

Alternative rejected: colouring the whole row. That implies the row is suspect when only one figure is derived.

### D6. `TradeTable` calls the engine instead of re-deriving

Both the desktop cell and the mobile card replace the inline fee arithmetic with `calculateBuyCostUSD(trade)` / `calculateSellRevenueUSD(trade)`.

Rationale: it is the only way to keep the contract in the spec — the displayed total must equal the amount FIFO used. It also silently repairs the mobile card's omission of `vatUSD` and `tafFeeUSD`, which today makes the two layouts show different totals for the same trade.

Consequence: the table imports from `src/engine/`. That respects the layering rule (pure functions, no state or IO), so no rule is bent.

### D7. `priceUSD` stays the primary input

The form keeps `priceUSD` as the required field it is and adds the gross amount as a secondary optional field beside it, with a hint that it comes from the contract note.

Rationale: gross is not derivable from price for a fractional-share trade, and price is what the user reads first off a fill. Reshaping the form around an optional field would regress every existing form test and the add-trade flow for no accuracy gain.

### Behavioural decisions confirmed by the user

These were first drafted while the user was unavailable and have since been confirmed as-is ("เอาแบบนี้"). Each one changes observable behaviour, so each is recorded here with the alternative that was rejected:

1. **Mismatch blocks nothing — confirmed.** Rejected: blocking, which would make D4's predicate a submit-time error and make the tolerance question moot. Chosen because two-decimal prices make small gaps normal.
2. **Tolerance = `quantity × 0.005 + 0.01` — confirmed.** Rejected: a flat 1-cent tolerance, and a 0.1 %-of-notional tolerance. Chosen so the real 1.05 gap on the 224-share sell stays silent while a gap the size of the old 78.57 error on the 173-share buy still speaks up. Consequence the user accepted: with the book as it stands, no trade triggers the warning.
3. **The form stays price-first — confirmed**, gross second and optional. Rejected: gross as the primary input with price derived, which would have changed D7 and the form tasks substantially.
4. **The orange highlight appears on the trade list total column only — confirmed** — not on the per-share price cell, not on the dashboard, not on the gain or taxable columns.

## Risks / Trade-offs

- **The fallback reproduces today's numbers exactly, so the fix is invisible until a slip figure is present.** → The orange highlight is the only evidence the field is missing; it must therefore render for every trade that lacks the field, including the `data_test` book once loaded. A test pins that a gross-less trade renders the fallback class.
- **`recomputeGains` still swallows `applyRemittance` errors.** A gross figure *lower* than the remitted amount would still erase a taxable row silently. → Out of scope to fix here, but the mismatch warning in the form is the first line of defence, and the risk should be logged as its own change.
- **`.default(0)` or a migration default silently zeroes every legacy trade's notional.** → Explicit schema test that an absent field parses to `undefined`, and a test that `0` is honoured as present.
- **Existing snapshots and expectations for `TradeTable` totals will move** for SELLs with VAT or TAF on mobile, because the mobile card's fee sum was incomplete. → Treat those diffs as the bug being fixed, not as regressions to paper over.
- **`title` is not shown on touch devices.** → The value is still coloured, and the form-side hint explains the convention; no interactive affordance is lost because none existed.
- **The schema change is the only thing standing between the field and deletion on the next save.** → Applied before any form or table work, and verified by a load→save round-trip test.

## Migration Plan

No data migration runs. On first load after deploy, existing records have no gross amount, the fallback applies, and every figure is unchanged; the trade list shows those totals in orange.

Rollback: removing the field from `tradeTransactionSchema` returns the app to derived-only behaviour, because zod strips the key on the next save. That rollback destroys the recorded figures, so it should only be used before the user has entered any.