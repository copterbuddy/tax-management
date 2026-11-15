# Tasks

## 1. One money tolerance for both engines

- [x] 1.1 Move `MONEY_TOLERANCE_USD` from `src/engine/fifoEngine.ts` to `src/constants.ts` (exported, with a comment that it is half a cent), and import it in `fifoEngine` instead of defining it locally. Verify `npm test` stays green — no behaviour change.
- [x] 1.2 Import the same constant in `src/engine/dividendEngine.ts`. Do not import from `fifoEngine` (it already imports `ValidationResult` from the dividend engine, so the reverse would cycle).

## 2. The visible balance becomes enterable

- [x] 2.1 In `dividendEngine.validateRemittance`, reject only when `amountUSD > remainingToRemitUSD + MONEY_TOLERANCE_USD`; keep the non-positive check. Message keeps quoting `remainingToRemitUSD.toFixed(2)`.
- [x] 2.2 In `applyDividendRemittance`, clamp `remainingToRemitUSD` at 0 (`Math.max(0, netAmountUSD − totalRemittedUSD)`).
- [x] 2.3 Add engine tests: remaining `0.19649999999999998` → `0.20` accepted and `0.1965` accepted, both leaving balance exactly 0; `0.21` rejected; zero and negative rejected; a clearly-over amount still names the balance.

## 3. The summary reports the gross equivalent

- [x] 3.1 Add `totalGrossEquivalentTHB` to `DividendSummary` (`src/types/trade.ts`) and compute it in `computeDividendSummary` as the sum of `reportableIncomeTHB + whtCreditTHB` over the year's remittances.
- [x] 3.2 Engine tests: the SPGI-shaped case reports 8.4195 gross equivalent against 7.1566 reportable (within 0.01); a zero-WHT dividend reports equal figures; a split remittance attributes each year's own gross equivalent and the two years sum to the full gross.
- [x] 3.3 In `src/components/DividendTab.tsx`, show the gross equivalent beside the reportable figure (KPI sub-value) and add the label/tooltip keys to `{en,th}/dividend.json` naming both bases. Verify with a `DividendTab.spec.tsx` case that both figures render and neither is labelled simply "income".

## 4. Import preserves remittance history

- [x] 4.1 Rewrite `dividendSlice.importDividends` to merge: build a map of stored records by id; for each incoming record union its remittances with the stored ones by remittance id (incoming wins on a shared id), then recompute `totalRemittedUSD` and `remainingToRemitUSD`; records absent from the import are dropped. Keep the existing year-selection behaviour.
- [x] 4.2 Add slice tests: importing a file whose record carries no remittances keeps the stored one and its totals; an incoming extra remittance is added; a shared id is not duplicated; a vanished record disappears with its history; a no-op import leaves every year's summary identical.

## 5. Verification

- [x] 5.1 Run `npm test` and `npm run lint`; both must pass. `npm run build` stays red for the pre-existing spec-types reason and is not part of this change.
- [x] 5.2 Re-import `data_test/tax_tracker_dividends.json` and confirm the real SPGI record still shows one remittance of 0.4165 on 2026-04-07, reportable income ฿13.55, credit ฿2.39, gross equivalent ฿15.94 (at 32.53), and that the year summary is unchanged apart from the new figure.
- [x] 5.3 Run `openspec validate harden-dividend-remittances --strict`, then archive the change so both capabilities land in `openspec/specs/`.