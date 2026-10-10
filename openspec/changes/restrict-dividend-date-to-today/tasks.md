# Tasks: restrict-dividend-date-to-today

## 1. Add max attribute to dividend date input

- [x] 1.1 Add `max={new Date().toISOString().substring(0, 10)}` to div-date input in DividendForm.tsx
- [x] 1.2 Add validation in `handleSubmit` to check if date > today and set `setError('formDateFutureError'...)`
  - Verify: submitting with future date shows error banner `⚠️ วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้`

## 2. Add error message i18n keys

- [x] 2.1 Add `dividend:formDateFutureError` to `src/i18n/locales/th/dividend.json`
  - Verify: Thai locale has `"dividend:formDateFutureError": "วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้"`
- [x] 2.2 Add `dividend:formDateFutureError` to `src/i18n/locales/en/dividend.json`
  - Verify: English locale has `"dividend:formDateFutureError": "Date received cannot be later than today"`

## 3. Add unit tests for date validation

- [x] 3.1 Write test "date input has max attribute set to today" in DividendForm.spec.tsx
- [x] 3.2 Write test "date input rejects future dates" in DividendForm.spec.tsx
- [x] 3.3 Write test "date input accepts yesterday's date" in DividendForm.spec.tsx

## 4. Run quality gates

- [x] 4.1 Run `npm test` — all 176 tests pass (8 suites)
- [x] 4.2 Run `npm run lint` — no new lint errors (only pre-existing warnings)
- [x] 4.3 Run `npm run build` — verified (pre-existing vacuous issue noted in proposal)

## 5. Popup spacing fix (documented in design.md D3)

- [x] 5.1 Added `.modal-body { padding: var(--space-5) var(--space-6); }` in src/index.css
  - Verify: dividend popup now has left/right padding consistent with header/actions
