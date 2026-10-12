# Tasks

## 1. Test harness prerequisites

- [x] 1.1 Add `resolveJsonModule: true` to the inline `tsconfig` object in `jest.config.ts`; verify by writing a throwaway spec that imports `src/i18n/index.ts` and confirming `npm test` compiles it instead of failing with `TS7042 / TS2732`
- [x] 1.2 Add a `window.matchMedia` stub to `jest.setup.ts`; verify a spec that renders `ThemeProvider` runs without `TypeError: window.matchMedia is not a function`
- [x] 1.3 Add `warning` to the `KpiCardProps` variant union and a `.kpi-card.kpi-warning` rule in `src/index.css` mirroring `.kpi-card.kpi-positive` but using the `--color-warning*` tokens; verify with a new `KpiCard.spec.tsx` asserting the rendered class for each variant, and confirm the rule uses tokens defined in both the light and dark blocks

## 2. Trades tab extraction

- [x] 2.1 Create `src/components/TradesTab.tsx` as a presentational component receiving trades, gains, summary, selected year, available years, data-freshness date and handlers as props; render the four capital-gain KPI cards, the per-provider breakdown row and `TradeTable`; verify with a new `TradesTab.spec.tsx` asserting four capital-gain cards plus one card per provider
- [x] 2.2 Move the tax-year filter and the data-freshness indicator out of `Dashboard.tsx` into `TradesTab.tsx`; verify `TradesTab.spec.tsx` asserts a year selector labelled "ปีภาษี" in Thai and "Tax Year" in English, and that `Dashboard` renders no tax-year selector
- [x] 2.3 Render `TradesTab` from `Dashboard.tsx` for the trades tab and delete the moved markup; verify `npm test` (baseline 9 suites / 182 tests) and `npm run lint` are green

## 3. Tab nav placement and tab scoping

- [x] 3.1 Move the tab nav in `Dashboard.tsx` to directly below the page header, above all tab content; verify a new `Dashboard.spec.tsx` asserting the `.tab-nav` element precedes every `.kpi-card` in document order
- [x] 3.2 Verify tab scoping in `Dashboard.spec.tsx`: on the dividends tab and on the remittances tab no capital-gain card and no per-provider card is present, and the only year selector is the one belonging to that tab
- [x] 3.3 Update the component list and the KpiCard variant description in `.claude/skills/tax-management.md` to match the new tree (`TradesTab.tsx` added, variants now six); verify by reading the file and confirming each listed component exists under `src/components/`

## 4. Dividend tab fixes

- [x] 4.1 Give the dividend year selector a visible label using the existing `dividend:divYear` key and associate it with the select; verify a new `DividendTab.spec.tsx` asserts the label text "ปีปันผล" in Thai and "Dividend Year" in English
- [x] 4.2 Reword `noDividendsYearHint` in `th/dividend.json` and `en/dividend.json` so it refers to the dividend year control on this tab instead of the tax-year filter above; verify the spec asserts the rendered hint no longer contains "ปีภาษี" and that the key resolves in both locales
- [x] 4.3 Change the unremitted dividend card to the `warning` variant added in 1.3; verify `DividendTab.spec.tsx` asserts the card carries the warning class when the unremitted total is greater than zero and not when it is zero
- [x] 4.4 Key each dividend record's list entry (the row plus its optional remittance-history row) with a React `Fragment`; verify `DividendTab.spec.tsx` renders at least two records, asserts both are present exactly once, and asserts no React key warning is logged via a `console.error` spy

## 5. Integration verification

- [x] 5.1 Run `npm test` and `npm run lint` and confirm both are green, with the new specs included in the suite count
- [x] 5.2 Run the dev server and check the moved year filter and KPI grid at 1440 / 1024 / 768 / 480 px widths for spacing and for mobile-only rules leaking onto desktop
