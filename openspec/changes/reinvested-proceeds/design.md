# Design

## Context

See proposal.md — Why. The figures the Trades tab shows today come from `computeTaxSummary` in `src/engine/fifoEngine.ts`, which is called once per year by `recomputeSummaries` in `src/store/tradeSlice.ts` and stored in `state.taxSummaries[year]`; `TradesTab.tsx` reads that object and is purely presentational. Gains themselves are rebuilt from trades on every mutation by `recomputeGains`, which replays each gain's stored remittances through `applyRemittance` — so any new per-gain field has to be replayed the same way or it is lost on the next add/edit/delete.

Two existing behaviours constrain the design:

- `computeTaxSummary` builds its base gains from `computeAllRealizedGains(yearTrades)` — FIFO over a single year's slice — keeps only gains with a remittance dated in the year, and then sums each kept gain's **lifetime** `totalRemittedUSD`. The result is neither honestly year-scoped nor sale-scoped: a sale remitted across two years inflates its sale year; a remittance dated in year N against a sale from year N−1 lands in no summary at all (and is never taxed); `netGainUSD` counts only sales that happened to be remitted, so a profitable unremitted sale shows nothing on a card called Net Gain; the per-provider rows mix a tax-year gain above a lifetime remitted figure; and FIFO on the year's slice raises `Insufficient lots` for a sale of lots bought in an earlier year, failing the whole year. This change replaces that computation, not just the card above it.
- `applyRemittance` already rejects a remittance above the sale's revenue (with `MONEY_TOLERANCE_USD = 0.005`) and rewrites `remainingProceedsUSD`, which `TradeTable` and `RemitForm` display.

A parallel in-progress change, `handle-remittance-errors`, introduces a shared remittance validator in `fifoEngine` used by both the form's pre-flight check and the reducer. This design does not depend on it, but states the balance rule in terms that validator can adopt unchanged.

## Goals / Non-Goals

**Goals:**

- One engine-owned definition of "proceeds still outside Thailand" and of a single sale's available balance.
- A per-gain optional amount that persists through the same replay path as remittances, with the zod schema as the only gate.
- Keep the existing render boundary: `TradesTab` receives data and handlers, never derives a total.

**Non-Goals:**

- Building an offshore cash ledger from bank transfers; tracking which purchase a reinvested amount funded; the DPZ/Liberator account.
- Cross-year carry-forward of an outstanding balance — a sale belongs to its sell year only.
- Any change to the tax formula (`amountUSD × gainPercent × fxRateTHB`), to `gainPercent`, to the FIFO matching rules, to dividend handling, to FX bounds or to storage keys. The *basis* also stays the remittance year; what changes in D1 is which trades the computation sees and how each figure is scoped, which alters cross-year books only.

## Decisions

### D1 — One pass over the whole book, three explicit populations

`computeTaxSummary` is rebuilt around the complete trade history and keeps two clearly separated populations.
Every figure is then either a sale-year figure or a remittance-year figure; nothing mixes the two.

```ts
const baseGains = allGains.length ? allGains : computeAllRealizedGains(trades).gains;
const y = String(taxYear);
const saleYearGains = baseGains.filter(g => g.sellDate.startsWith(y));
const yearRemittances = baseGains.flatMap(g =>
  g.remittances.filter(r => r.remitDate.startsWith(y)).map(r => ({ gain: g, remittance: r })),
);
```

- **Sale-year population** (`saleYearGains`) — `totalRevenueUSD`, `totalCostBasisUSD`, `netGainUSD`, buy and sell counts, `totalReinvestedUSD`, `unremittedUSD` and the outstanding rows.
- **Remittance-year population** (`yearRemittances`) — `totalRemittedUSD`, `taxableGainUSD`, `taxableGainTHB`, `totalRemittanceCount`, `remittedSellCount`, `excludedLossesUSD` and the provider rows.

Rationale: the two questions the tab answers are different questions. "What did I sell this year?" is a property of the sale's date. "What did I bring home, and what is it taxed at?" is a property of the remittance's date, because income is assessed in the year the money arrives. Deriving either from the other's population is what produced the current defects.

Consequences, all intentional:

1. **Cross-year lots summarise correctly.** FIFO runs over all trades, so a year-N sale of a year-N−1 lot no longer throws `Insufficient lots`.
2. **`taxableGainTHB` changes on cross-year books.** A remittance dated in year N against a year-N−1 sale now counts in year N. That is the correction, not a regression: the 2026 book is unaffected because every remittance is dated 2026 and every lot was bought the same year, and it measures ฿10,958.25 both before and after.
3. **`totalRemittedUSD` is year-scoped.** `Σ r.amountUSD` over `yearRemittances`, never a per-gain lifetime total, so a sale remitted across two years contributes to each year only what arrived in it.
4. **`netGainUSD` no longer depends on remittance status.** Every sale dated in the year counts, which is what the card's users assume.
5. **Declaration order.** `yearRemittances` is computed before any figure that consumes it; the current code declares it after `totalRemittedUSD`.

The outstanding figure keeps the sell-year population, since `unremittedUSD` is a stock rather than a tax figure: under a remittance-year population a sale whose proceeds were entirely reinvested has no remittance record and would never surface in any year, so the mark-reinvested action could never reach it — the exact case this feature exists for. Consequences for the UI: the card title must say whose year it is (`ยอดขายปีนี้ที่ยังไม่กลับไทย` / `This Year's Sales Not Yet Returned`), and the view is stated as covering one sell year only (see D10).

Alternative considered: keep `computeAllRealizedGains(yearTrades)` and only fix the remitted sum. Rejected — it leaves the `Insufficient lots` failure and the "has a remittance this year" filter in place, and the remitted sum cannot exclude a later-year remittance that belongs to an earlier sale, because that sale is not in the slice at all.

### D2 — Reuse `remainingProceedsUSD` as the available balance

`remainingProceedsUSD` becomes `sellRevenueUSD − totalRemittedUSD − reinvestedUSD`. One field, one meaning ("what is still available"), no second derived field for components to choose between; `TradeTable`'s existing column and `RemitForm`'s "remaining" hint then show the corrected figure automatically.

Stored values are not trusted anyway: every mutation and every load recomputes gains, so the field is rewritten from the rule above and no stored value can disagree with it.

Alternative considered: add `availableBalanceUSD` alongside and leave `remainingProceedsUSD` as revenue − remitted. Rejected — two near-identical fields invite the component arithmetic we are removing, and the old field would become misleading.

### D3 — Engine API: a pure summary helper plus one recording rule

- `computeGainSummary(gains: RealizedGainResult[]): GainSummary` — pure, takes the sale-year population the caller already filtered and returns `{ totalReinvestedUSD, unremittedUSD, rows }`, where `rows` are the gains with a positive balance for the list. Keeping the year filter out of it means one definition of "this year's sales" (D1) feeds both the summary and the list.
- `applyReinvestedAmount(gain, amountUSD): RealizedGainResult` — validates and returns an updated gain. It throws when the amount is negative, when it is not finite, or when it exceeds the sale's revenue minus remitted (the amount that would be available *if nothing were reinvested*, so editing 146.43 down to 100 is allowed and 146.43 is a replacement, not an addition).
- `applyRemittance` keeps its signature; only its guard and `remainingProceedsUSD` derivation change to subtract `reinvestedUSD`, and its rejection message reports the available balance including reinvested.

`GainSummary` is written into `TaxSummary` as `totalReinvestedUSD`, `unremittedUSD` and `outstandingRows` (the rows the Trades tab renders), so the component reads fields instead of computing them — and `computeTaxSummary` stays the only entry point the slice calls.

Alternative considered: expose a separate selector returning the summary. Rejected — `taxSummaries[year]` is already the slice's published summary and adding a second selector path means two shapes for one tab.

### D4 — Optional field, stripped-safe persistence

`RealizedGainResult.reinvestedUSD?: number` and `reinvestedUSD: z.number().min(0).finite().optional()` in `realizedGainSchema`. Optional matters twice: old stored data parses without it, and zod keeps unknown keys out of the parsed object, so the field must be declared or it would be dropped on the next `saveGains`.

No storage-key change, no migration, no backfill: absent is 0 in every calculation, and no code writes 0 explicitly unless the user clears a value.

### D5 — Replay the amount alongside remittances in the slice

`recomputeGains` currently returns the freshly computed gain when the old gain has no remittances, and otherwise replays remittances. Both paths must copy `reinvestedUSD` from the old gain (matched by `sellTradeId`); `recomputeGainsWithModifiedRemittances` must copy it too. A new reducer `setReinvestedAmount({ sellTradeId, amountUSD })` applies `applyReinvestedAmount`, recomputes summaries and saves gains — the same shape as `addRemittance`, including its `try/catch`, so one bad record cannot break the store.

`importTrades` replaces the trade list and discards remittances today; it keeps discarding reinvested amounts, since the field lives on gains, not on trades. That is consistent, and worth a comment rather than a behaviour change.

### D6 — Preselection and dialog wiring

`RemitForm` gains `initialSellTradeId?: string`, used as the `sellTradeId` default when `remittance` is not provided (its edit path already derives the default from the remittance). Passing a fake `RemittanceRecord` was the alternative; rejected as a lie about the argument's meaning.

`Dashboard` already owns `showRemitForm`/`editingRemittance` and passes `gains`; it gains `reinvestGainTradeId` state and the dialog. `TradesTab` gains `onRemitGain(sellTradeId)` and `onMarkReinvested(sellTradeId)` props and renders the outstanding list from `summary.outstandingRows`, so it stays presentational.

The mark-reinvested dialog mirrors `RemitForm`: react-hook-form + zodResolver with a schema for the amount alone, prefilled with the row's balance, validating `amount >= 0` and `amount <= balance + MONEY_TOLERANCE_USD` with a translated error naming the balance. Zero is accepted and clears the record, restoring the balance — cheaper than a separate "undo" action.

### D7 — Copy states proceeds, not cash

`kpiNotRemitted` becomes `ยอดขายปีนี้ที่ยังไม่กลับไทย` / `This Year's Sales Not Yet Returned`; `kpiNotRemittedSub` and `tooltipNotRemitted` are rewritten in both languages to describe proceeds not yet returned to Thailand and their tax treatment (assessed in the year remitted), and to drop every claim that the money sits in an offshore account. New list and dialog strings go next to them in `common.json` and `remittance.json` respectively, in both languages.

### D8 — Provider rows are a partition of the year's remittances

Each provider row is computed from `yearRemittances` filtered to that provider's sales, so the rows are a partition of one array and sum to the cards by construction:

```ts
const rows = PROVIDERS.flatMap(provider => {
  const rs = yearRemittances.filter(x => x.gain.provider === provider);
  if (rs.length === 0) return [];
  return [{
    provider,
    totalRemittedUSD:      sum(rs, x => x.remittance.amountUSD),
    taxableGainUSD:        sum(rs, x => x.remittance.amountUSD * x.gain.gainPercent),
    taxableGainTHB:        sum(rs, x => x.remittance.amountUSD * x.gain.gainPercent * x.remittance.fxRateTHB),
    gainInRemittancesUSD:  sum(rs, x => x.remittance.amountUSD * x.gain.gainPercent),
    sellCount:             new Set(rs.map(x => x.remittance.sellTradeId)).size,
  }];
});
```

- **`netGainUSD` → `gainInRemittancesUSD`.** The old field name invited reading it as the provider's profit on that year's sales; it is the gain represented by the money remitted, and under the old code it was a lifetime number next to a year-scoped one. The rename makes the population part of the name. It equals the row's `taxableGainUSD` by construction (same array, same formula) and is kept because the row renders a THB gain indicator beside a USD figure.
- **`sellCount` is the number of distinct sales remitted in the year**, not the number of sales dated in it — the same trap as the Remitted card's subtitle.
- **A provider with no remittances in the year gets no row.** Reporting it at zero states "this provider earned nothing", which is not what happened; it says nothing arrived. Rendering also stops depending on a fixed set of three cards, so `PROVIDERS` supplies order only.

Alternative considered: keep grouping by `yearGains` (sales dated in the year) and accept the small mismatch with the remittance cards. Rejected — that is the defect being fixed, and the invariant test below would fail by design.

### D9 — Excluded losses follow the remittance population

`excludedLossesUSD` becomes `Σ max(0, −(amountUSD × gainPercent))` over `yearRemittances`, replacing `computeTaxableGainsTHB(mergedGains)` in this function. A loss is excluded when its money is remitted, in the year it is remitted, so it must come from the same array as `taxableGainTHB`; on any other basis the two figures describe different populations and cannot be read together.

The old code published `excludedLossesTHB` under a field named `excludedLossesUSD` — a THB amount with a USD name. The new formula produces a genuine USD figure. Nothing renders it today (`TradesTab.spec.tsx` only mocks it), so the field is kept for the store shape and gets no translation work.

### D10 — Every card and provider row states its own basis

| Element | New label (th / en) | Stated basis |
| --- | --- | --- |
| Realised-gain card (`kpiNetGain`) | `กำไรจากการขายปีนี้ (USD)` / `Realised Gain — This Year's Sales` | every sale dated in the year, whatever its remittance status |
| Remitted card (`kpiRemitted`) | `รับเงินเข้าไทยปีนี้ (USD)` / `Remitted to Thailand — This Tax Year` | every remittance dated in the year, including against earlier years' sales |
| Provider row | labels say `ของเงินที่โอนเข้าในปีนี้` / `of the money remitted this year` | the row's remittances dated in the year |
| Not-yet-remitted card | unchanged from the earlier draft (D7) | this year's sales not yet returned to Thailand |

The realised-gain tooltip also states the two things a reader would otherwise assume and get wrong: every amount is the sale's **full** figure rather than prorated to what came back, and the tax figure is computed from remittances, so the cards deliberately do not add up to it.

`totalRevenueUSD` and `totalCostBasisUSD` end up rendered nowhere once `TradesTab.tsx:104` stops subtracting them. They stay in `TaxSummary` (tests and invariants use them) and get **no** i18n keys — skipping the labels also removes any temptation to render a figure without its basis.

The year control keeps its `ปีภาษี` / `Tax Year` label. Two of the four cards (estimated tax, remitted) and the provider rows are scoped by the remittance year, which is what "tax year" means here; the other two name their own sell-year basis in their titles. Alternative considered: relabel the control `ปี`; rejected as vaguer without being more accurate.

## Risks / Trade-offs

- [The outstanding figure now includes sales with no remittances, so it can be larger than the card showed before on real books] → Intended and stated in the card title; the value still falls to zero as each sale is remitted or marked reinvested. Verified against the 2026 book: same five 2026 sales, `Σ` = the historic 146.43 before recording the reinvested amount, 0 after.
- [Redefining `remainingProceedsUSD` changes a stored field's meaning] → Recompute-on-load means stored values are always rewritten from the rule; `gainsArraySchema` is unchanged for that field.
- [`applyReinvestedAmount` and the `handle-remittance-errors` validator could diverge] → Both express the same available-balance formula; the design states the formula once (revenue − remitted − reinvested, `MONEY_TOLERANCE_USD` 0.005) so the other change can adopt it verbatim.
- [A user may mark a sale as reinvested when the money actually came back, hiding taxable income] → The amount only ever reduces the outstanding figure; it never creates a remittance, so taxable gain cannot be reduced by it. Marking is reversible (edit or clear), and the card copy states that taxable income is assessed on remittance.
- [`meta` rows for gains whose `sellTradeId` is absent from `allGains` show a full balance] → When `allGains` is empty the summary computes base gains from `trades` itself, so a test that passes trades but no gains sees every sale as outstanding. The app always passes the full gains list. Documented in the helper's signature.
- [Extra dialog increases the surface of a tab that is already dense] → The list only renders when something is outstanding, and each row offers the two actions instead of a fourth card.
- [Tax figures change on cross-year books] → Intended correction (D1). The 2026 book measures ฿10,958.25 before and after, so the change is invisible on the book the user actually verifies against; a cross-year test pins the new behaviour so it cannot be read as an accident.
- [Provider cards now appear and disappear as the year changes] → Correct: no remittance in the year means there is nothing to report, and a zero card would invent a fact. The `dashboard-tab-layout` delta states it so the existing "one card per provider" reading is not left stale.
- [Renaming `ProviderBreakdown.netGainUSD` and adding `TaxSummary` fields breaks existing object literals] → Compile-time only (strict TS); the mocks in `TradesTab.spec.tsx` and any test fixture are updated in the same change, and no runtime data carries these derived types.
- [`gainInRemittancesUSD` duplicates the row's `taxableGainUSD`] → Accepted: same number, different label and currency role in the row. Documented in D8 so a future reader does not mistake the duplication for drift.
- [The provider-sum invariant is asserted against a hardcoded ฿ total that may be stale] → Assert the relation (Σ rows = card, to the cent) as the primary check, and assert the 2026 figure from a re-measured value rather than from memory; the two figures quoted during planning (฿10,957.27 and ฿10,958.25) are reconciled that way.

## Migration Plan

Ship as one release: types → schema → engine → slice → UI → i18n. No data step, no storage-key change, no backfill. Rollback is a revert; gains written with `reinvestedUSD` still parse on the old code because zod strips the unknown key, and old code then counts those proceeds as outstanding again (the pre-feature number), losing nothing. Rolling back also restores the previous year-summary computation, so cross-year books return to their previous (incorrect) figures — no stored value is affected either way, because every summary is derived on load.

## Open Questions

None. The population question is settled (sale-year for the sale figures and the outstanding view, remittance-year for the money and tax figures), and the only remaining discrepancy is arithmetic: the 2026 taxable total was quoted as ฿10,957.27 and measured as ฿10,958.25. Implementation re-measures it and asserts the invariant, so no decision is pending.