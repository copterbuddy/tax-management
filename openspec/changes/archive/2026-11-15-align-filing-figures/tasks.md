# Tasks

## 1. Dividend card reports the amount to declare

- [x] 1.1 In `src/components/DividendTab.tsx`, make the reportable card's value the gross dividend (`summary.totalGrossEquivalentTHB`) and its sub-line the received amount (`summary.totalReportableIncomeTHB`), labelled "รับจริง". Verify with `npx jest DividendTab` that both figures render and the larger one is the value.
- [x] 1.2 Update `{en,th}/dividend.json`: `kpiReportable` becomes "เงินได้ที่ต้องยื่น (ยอดเต็ม)" / "Income to declare (gross)", add `kpiReceivedLabel` ("รับจริง (สุทธิหลัง WHT)" / "Received (net of WHT)"), and rewrite `kpiTooltipReportable` to state that the gross figure is the amount a return asks for and that the withheld amount is claimed as a credit. Verify no `t()` call lacks a key in either language.
- [x] 1.3 Extend `DividendTab.spec.tsx`: with the standard fixture, the card value reads ฿5,751.50 and the sub-line ฿4,888.80; and the tooltip text contains both "ยอดเต็ม" and "เครดิต".

## 2. Capital-gain card says income, not tax

- [x] 2.1 In `{en,th}/common.json`, change `kpiEstTax` to "เงินได้ที่ต้องยื่น (ประมาณการ)" / "Assessable Income (est.)" and rewrite `tooltipEstTax` to carry the three caveats and the computation note (150,000 baht exemption, not tax payable, gain portion at the remittance rate with FIFO and no FX income). Verify both locales resolve.
- [x] 2.2 Extend `TradesTab.spec.tsx`: the rendered card title matches the new label and contains no "ภาษี"; the tooltip button's `title`/content includes "150,000".
- [x] 2.3 Confirm the displayed value is unchanged by the retitle — assert it still equals the computed taxable gain for the fixture year.

## 3. Verification

- [x] 3.1 Run `npm test` and `npm run lint`; both pass. `npm run build` stays red for the pre-existing spec-types reason.
- [x] 3.2 Load `data_test` in the running app and confirm: dividend card reads ฿15.94 with ฿13.55 beneath it; the Trades card reads "เงินได้ที่ต้องยื่น (ประมาณการ)" and still shows ฿10,958.25.
- [x] 3.3 Run `openspec validate align-filing-figures --strict`, then archive the change so both deltas land in `openspec/specs/`.