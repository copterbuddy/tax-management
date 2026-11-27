# Tasks: UX Layout Hierarchy & Table Progressive Disclosure (Loop 2)

- [x] 1. Add i18n keys for trade search, type filter, and expandable detail labels in `src/i18n/locales/en/trade.json` and `src/i18n/locales/th/trade.json`.
- [x] 2. Add `.kpi-grid-3`, compact `.kpi-provider-row`, `.cell-stack` / `.cell-sub`, `.trade-table-controls`, `.type-filter-group`, `.table-search`, and `.trade-detail-pane` styles in `src/index.css`.
- [x] 3. Refactor `src/components/TradeTable.tsx` with stacked Symbol/Provider and Qty/Price cells, quick search + BUY/SELL type filter, and expandable row details.
- [x] 4. Update `src/components/DividendTab.tsx` to use `.kpi-grid-3` and stack WHT amount + rate into a single cell.
- [x] 5. Update `src/components/TradeTable.spec.tsx` and `src/components/DividendTab.spec.tsx` with tests covering the new layout, filters, and expandable trade details.
- [x] 6. Run `npm test` and `npm run lint` and verify all suites pass with zero lint errors.
