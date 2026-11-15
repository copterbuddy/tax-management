# Proposal

## Why

The Trades tab's "not yet remitted" card is derived as `summary.totalRevenueUSD − summary.totalRemittedUSD` (`src/components/TradesTab.tsx:104`), which assumes every dollar of sale proceeds is either remitted or still held as cash offshore. That assumption is false whenever proceeds are spent on another offshore purchase before the money comes back to Thailand: the sale proceeds leave the account as a buy, so no remittance can ever clear them.

A verified example from the real 2026 book: on 2026-02-13, SELL 7 ALLW produced 204.75 USD of proceeds; 58.32 USD was remitted on 2026-03-09; the remaining 146.43 USD funded a same-day BUY of 0.5 SPGI (202.40 USD). That SPGI was sold on 2026-05-26 and fully remitted (207.18 USD). The capital did return, yet the card reports 146.43 USD as permanently unremitted. The only ways to clear it today are to record a remittance that never happened or to delete the sale — both corrupt the tax record.

The same defect breaks the project's layering rule: the component re-derives a total that belongs in `src/engine`.

A second defect sits in the same calculation. `computeTaxSummary` derives its base gains with
`computeAllRealizedGains(yearTrades)` (`src/engine/fifoEngine.ts:276-281`), i.e. from a per-year slice of the
trades, and then sums each included gain's lifetime `totalRemittedUSD` (`:295`). Neither figure is honestly
year-scoped:

- A sale remitted across two years contributes its lifetime remitted total to the year of the sale, so the
  "remitted" card overstates that year; its remittances in the later year then fall in no summary at all,
  because the gain belongs to the earlier year's slice.
- The same slice is why a remittance dated in year N against a sale from year N−1 is silently absent from
  `taxableGainTHB`, so it is never taxed.
- `netGainUSD` is filtered by "has a remittance this year", so a profitable sale that was never remitted
  contributes nothing to a card called Net Gain.
- The per-provider row mixes the two bases — a tax-year gain value above a sale-year net gain — and derives
  both from lifetime per-gain figures that do not sum to the card totals.
- Computing FIFO on the year's slice throws `Insufficient lots` for a sale of shares bought in an earlier
  year, which fails the whole year's summary.

The 2026 book hides all of it: every one of its remittances is dated 2026 and every sale's lots were bought
the same year, so year-scoped and lifetime figures agree. The defect only surfaces on books that cross a year
boundary, which makes it safe to correct now.

## What Changes

- A realized gain can record an optional USD amount of its own proceeds that was spent on another offshore purchase (`reinvestedUSD`). It is user-entered through a small dialog on the Trades tab; absent reads as 0.
- A sale's available balance becomes `sellRevenueUSD − totalRemittedUSD − reinvestedUSD`, and `applyRemittance` rejects any amount above it, so a remittance can never be recorded against proceeds that are no longer available.
- The engine exposes the outstanding position: `totalReinvestedUSD` and `unremittedUSD = Σ max(0, sellRevenueUSD − totalRemittedUSD − reinvestedUSD)`, clamped per gain so one over-recorded row cannot hide another gain's outstanding balance. `TaxSummary` carries both figures, and the card renders `summary.unremittedUSD` — the component performs no arithmetic.
- The Trades tab lists the gains that still have an outstanding balance, with the two actions that resolve them per row: remit (existing `RemitForm`, preselected with that gain) and mark-reinvested (new dialog prefilled with the full outstanding balance and editable down).
- The card's title, subtitle and tooltip describe proceeds not yet returned to Thailand. They no longer state or imply that the money is sitting as cash in an offshore account.
- The field is optional and backwards compatible: no storage-key change, no migration, no backfill. Records without it behave exactly as they do today.
- The year summary is rebuilt on two explicit populations instead of the current mixed basis. Base gains are
  computed from the complete trade history, never from a single year's slice. Figures about the sales
  (proceeds, cost basis, realised gain, buy/sell counts, outstanding proceeds) cover every sale dated in the
  selected year. Figures about the money (remitted total, taxable gain in USD and THB, remittance count,
  excluded losses, provider rows) cover every remittance dated in the selected year, whatever year the sale
  happened in.
- Provider rows are derived from that same remittance set and group by the provider of the sale being
  remitted, so they sum exactly to the card totals; a provider with no remittances in the year renders no row.
  `ProviderBreakdown.netGainUSD` becomes `gainInRemittancesUSD` so it can no longer be read as a sale-year gain.
- Every card and provider row states the period its figure covers, and the realised-gain card is independent of
  remittance status. Proceeds and cost basis stay full, non-prorated sale figures, so the sale-year cards do not
  sum to the taxable figure.
- The outstanding figure is documented as a current-balance view of one sell year: a sale from an earlier year
  that still has a balance appears in no year's figure or list, and the copy does not claim otherwise.

## Capabilities

### New Capabilities

- `reinvested-proceeds`: recording an optional reinvested amount against a realized gain, how it reduces the available balance, the rejection rule for remittances above that balance, the engine's outstanding-proceeds figures with per-gain clamping, the outstanding-balance list that lets the user resolve each gain, and the stated one-sell-year limit of that list.
- `tax-year-summary`: which population each per-year summary figure covers — base gains computed from all trades, sale-year figures over sales dated in the year, remittance-year figures over remittances dated in the year, provider rows derived from that same remittance set, and omitted when a provider has none.

### Modified Capabilities

- `dashboard-tab-layout`: the "not yet remitted" summary card on the Trades tab is redefined — it reports proceeds not yet returned to Thailand from a single engine-derived figure and no longer describes the money as cash held abroad. The realised-gain and remitted cards state the period they cover, the realised-gain figure no longer depends on remittance status, provider rows label their basis and appear only for providers with remittances in the year.

## Impact

- `src/types/trade.ts` — `RealizedGainResult.reinvestedUSD` (optional), `TaxSummary.totalReinvestedUSD`, `TaxSummary.unremittedUSD` and `TaxSummary.remittedSellCount`, the outstanding-row type the list renders, and `ProviderBreakdown.netGainUSD` → `gainInRemittancesUSD`.
- `src/engine/fifoEngine.ts` — `applyRemittance` available-balance rule and `remainingProceedsUSD` derivation; new pure `computeGainSummary`; `computeTaxSummary` rewritten around base gains from all trades, a sale-year population and a remittance-year population, with provider rows grouped from the year's remittances.
- `src/validation/schemas.ts` — `realizedGainSchema` accepts the optional field (zod stays the persistence gate).
- `src/store/tradeSlice.ts` — `recomputeGains` / `recomputeGainsWithModifiedRemittances` carry `reinvestedUSD` through recomputation alongside remittances; a new action records it and resaves gains.
- `src/components/TradesTab.tsx` — card reads `summary.unremittedUSD`; new outstanding-balance list with per-row actions (presentational, handlers via props); realised-gain and remitted cards and the provider row read the new fields and labels.
- `src/components/Dashboard.tsx` — wires the two row actions and passes the preselected gain to `RemitForm`.
- `src/components/RemitForm.tsx` — accepts an initially selected sell trade.
- New component for the mark-reinvested dialog, mirroring `RemitForm`'s react-hook-form + zod pattern.
- `src/i18n/locales/{en,th}/common.json` and `remittance.json` — corrected card copy, relabelled realised-gain and remitted cards, provider-row labels, plus new list and dialog strings in both languages.
- Engine, slice and component specs under `*.spec.ts` — new `computeTaxSummary` coverage including the provider-sum invariant and a cross-year remittance case.
- On a book whose remittances and sales do not share one calendar year, `taxableGainTHB` and `totalRemittedUSD` change for the affected years. That is the intended correction, not a regression; the 2026 book is unaffected.
- No storage-key change, no data migration, and no change to the tax formula (`amountUSD × gainPercent × fxRateTHB`), FIFO matching, dividend handling or FX bounds.