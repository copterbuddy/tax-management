# Design

## Context

- `dividendEngine.validateRemittance` compares `amountUSD > remainingToRemitUSD` with no tolerance; `applyDividendRemittance` recomputes `remainingToRemitUSD = netAmountUSD − totalRemittedUSD` without a floor.
- `fifoEngine` already carries a private `MONEY_TOLERANCE_USD = 0.005` and imports `ValidationResult` from `dividendEngine`, so `dividendEngine` cannot import from `fifoEngine` without a cycle.
- `computeDividendSummary` sums `reportableIncomeTHB` and `whtCreditTHB` per remittance; gross = reportable + credit holds exactly, because both are the same remitted slice at the same FX rate.
- `importDividends` assigns `state.records = action.payload`, so anything the file omits is lost.

## Goals / Non-Goals

**Goals**

- A user can enter the balance the interface shows and have it accepted.
- The tab answers "what do I put on the return" for both filing bases without hand arithmetic.
- Import cannot destroy a stored remittance for a record that survives.

**Non-Goals**

- Changing what reportable income means (the cap's spec fixes it as the THB actually received).
- Re-defining WHT credit.
- Year-scoping `totalUnremittedUSD` (a separate display question).
- Editing dividends' tax-year attribution.

## Decisions

### D1 — One tolerance constant, moved to `constants.ts`

`MONEY_TOLERANCE_USD` moves to `src/constants.ts` and both engines import it. `dividendEngine` importing `fifoEngine` would create a cycle (fifoEngine already imports the `ValidationResult` type), and duplicating the literal invites drift.

### D2 — Accept up to half a cent above the balance, and quote the same number

The rule becomes `amount > remaining + MONEY_TOLERANCE_USD`, identical to the capital-gain side. The rejection message quotes `remaining.toFixed(2)`, which the rule now accepts by construction (0.1965 + 0.005 > 0.20). A remittance may leave the balance at exactly zero or a hair below; `applyDividendRemittance` clamps it at 0 so a negative remainder never reaches the UI.

*Alternative rejected*: rounding the balance down before comparing. It would reject a legitimate slip figure, the exact failure the capital-gain side already fixed.

### D3 — The gross figure is derived in the engine

`computeDividendSummary` returns `totalGrossEquivalentTHB = Σ (reportableIncomeTHB + whtCreditTHB)` over the year's remittances. Deriving it in the component would put a second definition of gross next to the one in the engine.

*Labelled as a reference*: the tab shows it as "ยอดเต็ม" beside the reportable figure with a tooltip that says which one the cap's spec calls reportable, so neither number is mistaken for the other.

### D4 — Import merges remittances by id, per surviving record

`importDividends` builds a map of existing records by id, then for each incoming record unions its remittances with the stored ones by remittance id (incoming wins on a shared id, stored-only ids are kept) and recomputes `totalRemittedUSD` / `remainingToRemitUSD` from the union. Records not present in the import are dropped.

*Why the union rather than "file wins"*: a dividends file is a data snapshot, and losing a remittance silently is the defect being fixed. A user who wants a remittance gone can delete it in the UI, where the action is visible.

*Trade-off accepted*: an import cannot be used to remove a remittance. That is the safer default for a tax record.

### D5 — No schema or storage-key change

`DividendRemittance` and `DividendRecord` keep their shapes; only derived summary output grows. Existing stored data loads unchanged.

## Risks / Trade-offs

- **A half-cent over-remittance is tolerated.** It can leave `totalRemittedUSD` a fraction above `netAmountUSD`; the clamp keeps the balance at 0 and the summary is unaffected because it sums remittances, not the balance. Accepted — this is the same rule the capital-gain side already ships.
- **Merged imports cannot delete.** Documented above; the UI remains the place to remove a record.
- **The gross figure is an addition, not a replacement.** A user who files net-based sees no change; the tooltip names both so the choice is explicit.