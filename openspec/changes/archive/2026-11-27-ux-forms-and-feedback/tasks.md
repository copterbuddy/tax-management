# Tasks: UX Forms, Live Trade Summary & Non-Blocking Feedback (Loop 3)

- [x] 1. Add i18n keys for collapsible fees/slip section and live trade summary in `src/i18n/locales/en/trade.json` and `src/i18n/locales/th/trade.json`.
- [x] 2. Create `src/components/Toast.tsx` and add toast, collapsible form section, and live summary bar styles to `src/index.css`.
- [x] 3. Replace all `alert()` calls in `src/components/Dashboard.tsx` with the non-blocking `Toast` component.
- [x] 4. Refactor `src/components/TradeForm.tsx` with collapsible secondary section (`<details className="form-collapsible">`), live trade summary bar, and Escape-key dismissal; add Escape-key dismissal to `RemitForm.tsx` and `DividendForm.tsx`.
- [x] 5. Update `src/components/Dashboard.spec.tsx` and `src/components/TradeForm.spec.tsx` to cover toast notifications, collapsible secondary section, live trade summary, and Escape dismissal.
- [x] 6. Run `npm test` and `npm run lint` and verify all suites pass with zero lint errors.
