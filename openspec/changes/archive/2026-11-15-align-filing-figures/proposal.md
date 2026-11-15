# Proposal

## Why

Two reporting labels misstate what a filer should do with the numbers, checked against current Thai practice (ป.161/2566 remittance rule; dividend declared gross with a withholding credit):

1. **The dividend card's headline is the wrong figure.** `รายได้ที่ต้องยื่น` shows the THB actually received — net of the 15% US withholding. The amount a Thai return asks for is the **gross** dividend of the remitted slice, with the withheld tax claimed as a credit. For the 2026 SPGI dividend that is ฿15.94 gross and ฿13.55 received: a user copying the headline under-declares by ฿2.39 and loses the credit it should justify. The gross figure exists in the summary (`totalGrossEquivalentTHB`) but sits in a sub-line under the net number.
2. **The capital-gain card calls assessable income "tax".** The card titled `ภาษีที่ต้องยื่น (ประมาณการ)` displays ฿10,958.25 — that is the assessable gain, before the 150,000 baht exemption, before any other income, and before progressive brackets. A user can reasonably read it as the amount owed, which is wrong by construction and can be wrong in both directions.

## What Changes

- The dividend card's headline becomes the **gross** dividend of the remitted slice (the amount to declare); the THB received moves to the sub-line, labelled as net of withholding. Both labels and tooltips name their basis, and the tooltip states that the withheld amount is claimed as a credit.
- The capital-gain card is retitled **เงินได้ที่ต้องยื่น (ประมาณการ)** / "Assessable Income (est.)", and its tooltip states that it is assessable income before the 150,000 baht exemption, before other income and before progressive rates — not tax payable.
- The same tooltip records how the figure is computed: the gain portion of each remittance, converted at the remittance-date rate, with FIFO lot matching assumed and exchange-rate differences not treated as income.
- No arithmetic changes; no storage-key, schema, or data change; no new tax estimate.

## Capabilities

### Modified Capabilities

- `dividend-tax-calculation`: the amount to declare becomes the gross dividend of the remitted slice, with the received amount reported beside it.
- `dashboard-tab-layout`: the capital-gain card states that it shows assessable income rather than tax payable.

## Impact

- `src/components/DividendTab.tsx` — headline/sub-line swap on the reportable card.
- `src/components/TradesTab.tsx` — no logic change; the label and tooltip come from i18n.
- `src/i18n/locales/{en,th}/dividend.json` and `common.json` — retitled card, new received-line label, rewritten tooltips.
- Tests: `DividendTab.spec.tsx`, `TradesTab.spec.tsx` (and `Dashboard.spec.tsx` if it asserts the old title).
- No change to `computeDividendSummary`, `computeTaxSummary`, or any stored value.