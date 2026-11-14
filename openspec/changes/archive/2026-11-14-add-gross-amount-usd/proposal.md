# Proposal

## Why

A trade's USD basis is currently reconstructed as `quantity × priceUSD`. That reconstruction silently disagrees with the broker's own figures whenever the unit price is rounded to two decimals. With the 2026 book:

| Trade | `quantity × priceUSD` | Slip gross | Discrepancy |
|---|---|---|---|
| SELL 224 ALLW | 6,646.08 | 6,647.13 | **+1.05** |
| BUY 43 ALLW | 1,230.23 | 1,230.22 | −0.01 |
| BUY 0.5 SPGI | 202.085 | 202.08 | −0.005 |

The 1.05 gap on the 224-share sell is not cosmetic. The engine derives `sellRevenueUSD = 6,635.22`, which is *less* than the amount actually remitted (`6,636.27`). `applyRemittance` throws on that over-remittance and `recomputeGains` swallows the error, so the row's taxable gain is dropped without any message — the 2026 total falls from ฿10,958 to ฿6,548. The user's real workbook already carries the slip gross as a separate column, and the data files now contain `grossAmountUSD` on all nine trades, but the app strips the field on import and never reads it.

Fixing this removes a class of silent tax under-reporting, and it removes the need for six-decimal `priceUSD` workarounds.

## What Changes

- Add an optional `grossAmountUSD` field to a trade — the pre-fee notional as printed on the broker slip (contract note / 1099-B).
- Cost and revenue become **gross-authoritative with fallback**: `notional = grossAmountUSD ?? quantity × priceUSD`. Trades without the field behave exactly as today.
- `grossAmountUSD` is optional, never required, and never defaulted to `0`. A stored `0` would be indistinguishable from "absent" and would zero out a real trade.
- Persist the field: declare it in the runtime zod schema so a load → save cycle no longer destroys it, and accept it from the trade form.
- Warn — never block — when a present `grossAmountUSD` disagrees with `quantity × priceUSD` beyond rounding tolerance (`|Δ| > quantity × 0.005 + 0.01`). Rounding to two-decimal prices makes small gaps normal, so blocking would make ordinary trades unsaveable.
- Show the fallback visibly: when a displayed USD amount was derived from `quantity × priceUSD` because the field is absent, render it in the warning/orange colour with an explanatory tooltip. Orange means "optional field missing", not "error".
- Keep `priceUSD` as the primary form input; the gross field is a secondary, optional input beside the price.
- Add `grossAmountUSD` to the trade-type-change reset so a BUY↔SELL switch cannot carry a stale slip amount across (this touches an existing `trade-type-toggle` requirement).

Not breaking: no storage migration, no schema version bump, no change to dividends, FX handling, remittance caps, or the FIFO matching rules.

## Capabilities

### New Capabilities

- `trade-gross-amount`: the slip-authoritative USD notional of a trade — how it is stored, how it overrides the derived amount, when the derivation falls back, when a mismatch is flagged, and how the UI distinguishes a fallback-derived figure from a slip-backed one.

### Modified Capabilities

- `trade-type-toggle`: the "changing the trade type clears all entered values except the date" requirement must also clear the slip gross amount.

## Impact

**Types & validation**

- `src/types/trade.ts` — `TradeTransaction.grossAmountUSD?: number`
- `src/validation/schemas.ts` — `tradeTransactionSchema` accepts `grossAmountUSD: z.number().min(0).optional()`. This is the load-bearing change: zod strips undeclared keys, and `saveTrades` then persists the stripped object.

**Engine (pure, no new dependencies)**

- `src/engine/fifoEngine.ts` — `calculateBuyCostUSD` / `calculateSellRevenueUSD` take their notional from the shared fallback helper; add a mismatch predicate. Downstream FIFO, `gainPercent`, and `taxableGainTHB` follow with no further edits.

**Store**

- `src/store/tradeSlice.ts` — no formula changes; the existing `recomputeGains` path picks up the new revenue. The 224-share remittance stops being rejected.

**Components**

- `src/components/TradeForm.tsx` — form schema, three `reset()` defaults, type-change reset, submit mapping, and one optional input beside the price.
- `src/components/TradeTable.tsx` — desktop row and mobile card currently re-derive the total inline with their own fee formula instead of calling the engine; both switch to the engine helper so the table cannot drift from the taxable figure. Fallback-derived totals take the orange treatment.
- `src/i18n/locales/{en,th}/trade.json` — field label, mismatch message, fallback tooltip.

**Tests**

- `src/engine/fifoEngine.spec.ts`, `src/validation/schemas.spec.ts`, `src/components/TradeForm.spec.tsx`, plus the existing `TradeTable`/`TradesTab` expectations that assert inline totals.

**Data**

- `data_test/tax_tracker_trades.json` already carries `grossAmountUSD` on all nine trades; no data edit is required, but its values become meaningful on import.

**Out of scope**

- Auto-deriving `priceUSD` from gross (or the reverse) — both stay independently enterable.
- Adding DPZ or the SPGI dividend to the book, the 146.43 un-remitted remainder on the 7-share sell, and rounding `priceUSD` to six decimals. Those are separate data decisions.