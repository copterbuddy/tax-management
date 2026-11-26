# Design

## Context

The codebase currently mixes two distinct responsibilities:
1. Calculating **assessable income and withholding credit** to declare on PND 90 (`fifoEngine.ts`, `dividendEngine.ts`, `filingSummary.ts`, `FilingSummarySheet.tsx` figures/lock/export).
2. Calculating **progressive personal income tax liability** (`taxBrackets.ts`, `taxEstimate.ts`, `taxSlice.ts`, `THAI_TAX` constants, and the collapsible `<details className="filing-estimate">` section inside `FilingSummarySheet.tsx`).

Note that `taxSlice` is already orphaned (no UI reads `state.tax`), while `FilingSummarySheet` renders `estimateThaiTax` inside a collapsed `<details>` block.

## Goals / Non-Goals

**Goals:**
- Remove all progressive personal income tax calculation UI, engine logic, Redux slice, constants, CSS rules, i18n keys, and unit tests.
- Keep all assessable-income calculation, FIFO matching, dividend WHT credit, filing summary figures, readiness checks, year lock, and CSV export completely intact.
- Record progressive personal income tax calculation as explicitly out of scope in `openspec/config.yaml` and retire the `tax-estimate` capability.

**Non-Goals:**
- Changing any assessable-income formula, KPI card (`TradesTab` `kpiEstTax` still shows `taxableGainTHB`, which is assessable capital-gain income), or CSV export columns.
- Refactoring unrelated parts of `FilingSummarySheet`, `tradeSlice`, or `dividendSlice`.

## Decisions

1. **Delete `taxBrackets.ts`, `taxEstimate.ts`, `taxSlice.ts`, and `THAI_TAX` completely** rather than only hiding the UI section in `FilingSummarySheet.tsx`.
   - *Rationale*: Leaving unused bracket/tax-calculation code in `src/engine/` and `src/store/` contradicts the explicit out-of-scope boundary and creates dead code/tests to maintain.
   - *Alternative*: Hide only `<details className="filing-estimate">` — rejected because `taxSlice` is already dead code and `taxBrackets`/`taxEstimate` have no other callers.
2. **Retire `openspec/specs/tax-estimate/spec.md`** using `retire_capabilities: true` + `## REMOVED Requirements`, and update `openspec/config.yaml` `Scope Boundaries`.
   - *Rationale*: Ensures future specs/changes do not re-introduce tax-liability calculation and cleans up stale `taxSlice.ts` / `tax_tracker_calculations` references in `openspec/config.yaml`.
3. **Preserve `FilingSummarySheet.spec.tsx` existing figure/lock/export tests**: Line 26 uses `getAllByText('฿2.39').length > 0`, which still passes after removing the estimate section (the figure remains in the main `<dl className="filing-figures">`).

## Risks / Trade-offs

- **Redux state shape change**: Removing `tax` from `configureStore` in `src/store/index.ts` changes `RootState`; verified via search that no component or other slice reads `state.tax`.
- **i18n / CSS cleanup**: Removing `filingEstimate` and `estimate*` keys from both `th/common.json` and `en/common.json`, and `.filing-estimate` / `.estimate-*` from `src/index.css`, leaves no unused styles or orphan translation keys.
