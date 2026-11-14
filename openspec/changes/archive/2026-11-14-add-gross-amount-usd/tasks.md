# Tasks

## 1. Data model and persistence

- [x] 1.1 Add `grossAmountUSD?: number` to `TradeTransaction` in `src/types/trade.ts` directly after `priceUSD`, commented as the slip pre-fee notional. Verify `npm run lint` passes with no unused or implicit-any complaints.
- [x] 1.2 Declare `grossAmountUSD: z.number().min(0).optional()` in `tradeTransactionSchema` (`src/validation/schemas.ts`, after `priceUSD`) — no `.default(0)`. Verify with a new test in `src/validation/schemas.spec.ts` that an object omitting the key parses with `grossAmountUSD === undefined` and that one carrying `0` parses with `0`.
- [x] 1.3 Add a round-trip test asserting a trade carrying `grossAmountUSD: 6647.13` survives parse → serialize → parse unchanged, pinning that the field is no longer stripped. Verify it fails if the schema line from 1.2 is removed.
- [x] 1.4 Confirm `migrateTrade` (`src/store/tradeSlice.ts`) spreads the input and needs no edit; add a slice test through `configureStore` that hydrates a legacy trade with no gross amount and reloads the trade list with the key still absent (not `0`). Verify the test fails if a `grossAmountUSD = 0` default is added.

## 2. Engine: notional precedence and mismatch detection

- [x] 2.1 Add `notionalUSD(trade)` in `src/engine/fifoEngine.ts` returning `trade.grossAmountUSD ?? trade.quantity * trade.priceUSD`, and call it from `calculateBuyCostUSD` and `calculateSellRevenueUSD` in place of the existing product. Verify existing `src/engine/fifoEngine.spec.ts` cases still pass unchanged — the fallback must not move any current figure.
- [x] 2.2 Add `isNotionalFromFallback(trade)` returning true only when `grossAmountUSD` is `undefined`. Verify with a unit test covering absent, `0`, and `6647.13`.
- [x] 2.3 Add `notionalMismatchUSD(trade)` returning `null` when the field is absent or within tolerance, else `{ derived, gross, delta }`, using `|gross − quantity*priceUSD| > quantity*0.005 + 0.01`. Verify with engine tests for four cases: 224 × 29.67 vs 6647.13 → `null` (Δ 1.05, inside tolerance 1.13); 43 × 28.61 vs 1230.22 → `null` (Δ 0.01); 173 × 29.15 vs 5103.50 → delta 60.55; and a trade with no gross amount → `null`.
- [x] 2.4 Verify the gross amount reaches the tax figure: an engine test where the 224-share SELL yields revenue `6636.27` and a remittance of `6636.27` is accepted by `applyRemittance`, whereas the same trade without the gross amount yields `6635.22` and is rejected.

## 3. Trade form

- [x] 3.1 Add `grossAmountUSD` to `tradeFormSchema` (`src/components/TradeForm.tsx`) as optional, registered with `setValueAs` mapping `''` to `undefined` so an empty input does not become `NaN` or `0`. Verify with a form test that submitting an empty gross amount stores no key.
- [x] 3.2 Add the field to all three `reset()` defaults (initial `defaultValues`, the `trade`-prop effect, and `handleTypeChange`) as `trade?.grossAmountUSD ?? ''`. Verify the type-change test asserts the gross input is empty after switching BUY ↔ SELL.
- [x] 3.3 Map `grossAmountUSD` through `onFormSubmit` into the submitted `TradeTransaction`, omitting the key when the input is empty. Verify with a form test that a filled value is submitted and an empty one is not.
- [x] 3.4 Render the optional gross input beside the price input with `step="any"` and a hint that it comes from the contract note, keeping `priceUSD` required and primary. Verify the input renders and is labelled.
- [x] 3.5 Render the non-blocking mismatch notice when `notionalMismatchUSD` is non-null for the current form values, showing both figures; confirm the trade still submits. Verify with a form test entering 173 shares at 29.15 against a slip gross of 5103.50: notice names 5042.95 and 5103.50, save succeeds, and the stored gross is 5103.50.
- [x] 3.6 Add the form's i18n keys (field label, note hint, mismatch message with interpolation) to `src/i18n/locales/en/trade.json` and `th/trade.json`. Verify no hardcoded English remains in the new form markup and both locales resolve the keys.

## 4. Trade list display

- [x] 4.1 Define `.value-fallback { color: var(--color-warning); }` once in `src/index.css` so all three theme blocks inherit it. Verify the orange resolves in light, `[data-theme="dark"]`, and `prefers-color-scheme: dark`.
- [x] 4.2 Replace the inline fee and total arithmetic in the desktop row of `src/components/TradeTable.tsx` with `calculateBuyCostUSD` / `calculateSellRevenueUSD`. Verify with a component test that a BUY's rendered total equals the cost FIFO uses for that lot.
- [x] 4.3 Apply the same replacement in the mobile card block, which today omits `vatUSD` and `tafFeeUSD`. Verify with a component test that a SELL carrying VAT and TAF renders the same total in both layouts.
- [x] 4.4 Wrap the total cell in a `span` carrying `value-fallback` and a `title` with the fallback explanation when `isNotionalFromFallback(trade)`, and the plain class otherwise. Verify with a component test that a gross-less trade has the class and a gross-bearing one does not; confirm no new focusable element is added.
- [x] 4.5 Add the list's i18n keys (fallback explanation with quantity and price interpolation) to `en/trade.json` and `th/trade.json`, and keep the mobile-card CSS inside the same `@media` block as the table. Verify no stray top-level media rules were introduced.

## 5. Integration verification

- [x] 5.1 Run `npm test` and confirm every suite passes, treating changed mobile SELL totals as the intended correction rather than a regression to restore.
- [x] 5.2 Run `npm run lint` and confirm a clean result. Note that `npm run build` type-checks `*.spec.ts` without jest types and is already red for that pre-existing reason; do not attempt to fix it here.
- [x] 5.3 Import `data_test/tax_tracker_trades.json` with `data_test/tax_tracker_gains.json` and confirm the 224-share SELL revenue is `6636.27`, its remittance of `6636.27` is accepted rather than swallowed, and no row is dropped. Confirm the row's cost falls from the stale `6501.34` to `6501.31` (because the 173- and 43-share lots now price at their slip notionals), its gain rises to `134.96`, and the 2026 total becomes **฿10,958.25**. The current file's Σ`taxableGainTHB` is ฿10,957.27; note its derived fields are pre-fix output and are rebuilt by `recomputeGains` on import.
- [x] 5.4 Confirm all nine `data_test` trades carry a gross amount so none of them renders the fallback highlight, and confirm that with this book no trade exceeds the mismatch tolerance, so the warning stays silent on correct data. Verify the highlighted-vs-plain and warning states deliberately with synthetic trades instead, since the real book exercises neither.

## Workflow follow-up

- The four design assumptions were confirmed by the user as-is on 2026-11-14 (warn-not-block, tolerance `quantity × 0.005 + 0.01`, price-first form, orange on the total column only). No re-confirmation is needed before code work starts.
- Archive the change after review, and sync the `trade-gross-amount` delta into the main spec.

## Implementation notes

- `applyRemittance` now compares against `sellRevenueUSD + MONEY_TOLERANCE_USD` (0.005). Once revenue is read from the slip gross amount it equals the remittance to the cent, and binary float error (`6647.13 − 10.86 = 6636.2699999999995`) rejected the legitimate full remittance that task 2.4 requires to be accepted. The tolerance is half a cent, so a genuine over-remittance still throws.
- Task 3.2's `?? ''` default was implemented as `undefined` instead, because `grossAmountUSD` is `number | undefined` on the trade type and `''` would violate it. react-hook-form's `reset()` skips the DOM write for a key whose new value is `undefined`, leaving stale text in the input, so `syncGrossAmountInput()` writes the element value directly after both reset paths.
- Task 3.4 asks for the input "beside the price input". It is rendered as a full-width row directly under the quantity/price row instead, so the two required fields stay in the grid's two columns and the optional field does not compete with them for space. Rendering, labelling, hint, and `step="any"` are unchanged.
- Task 4.4's spec requirement says the fallback explanation is "exposed as the accessible name or description of the value" on focus **or** hover, while 4.4 itself forbids adding a focusable element. The total is a non-focusable `<span>` carrying only a native `title`, which resolves the hover path (HTML-AAM promotes `title` to the accessible description); no tab stop was added, so keyboard users read the total but not the tooltip.
- Tasks 5.3 and 5.4 were verified end-to-end through the real store import path with a throwaway spec (deleted afterwards, so the numbers are not pinned by a test that would break whenever `data_test/` is edited): 9 trades loaded, 224-share SELL revenue `6636.27`, cost `6501.31`, gain `134.96`, taxable ฿`4410.49`, its remittance of `6636.27` accepted with `remainingProceedsUSD = 0`, 2026 total ฿`10958.25`, and all nine trades gross-bearing with `isNotionalFromFallback === false` and `notionalMismatchUSD === null`.
- `recomputeGains` in `src/store/tradeSlice.ts` still wraps each remittance in `try { … } catch { /* skip */ }`, so an over-limit remittance is dropped without a trace. That silent failure is what hid the ฿4,409.51 loss before this change; it is pre-existing and out of scope here, but it should be made visible (surface the error rather than swallowing it) in a follow-up.