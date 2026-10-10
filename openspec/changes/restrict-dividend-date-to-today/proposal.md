# Proposal: restrict-dividend-date-to-today

## Why

The dividend recording form (`DividendForm.tsx`) allows selecting a future date for "วันที่ได้รับ" (Date Received). Dividends cannot be received in the future — this is a data integrity issue that can produce incorrect tax-year allocations. The sibling forms (TradeForm, RemitForm) already enforce a `max` date constraint, but DividendForm does not.

## What Changes

- **Added**: Date input `max` attribute set to today's date (`new Date().toISOString().substring(0, 10)`) in `DividendForm.tsx`
- **Added**: Validation error message and display when date exceeds today
- **Added**: Unit tests asserting date field rejects future dates, accepts today and yesterday

## Capabilities

**New Capabilities:**
- (none — no new domain capability introduced)

**Modified Capabilities:**
- (this is a UI validation constraint, no spec-level behavior change requiring a delta spec)

> Note: This change is a validation-layer fix within the existing "Foreign Dividend Tracking" domain. It adds a guard on input but does not change tax calculation behavior. Per OpenSpec guidance, since there is no spec-level behavior change, `skip_specs` may apply, but we keep a minimal spec for traceability.

## Impact

- **File modified:** `src/components/DividendForm.tsx` — add `max` attribute to date input + validation
- **File modified:** `src/components/DividendForm.spec.tsx` — add test cases for date boundary validation
- **i18n keys added:** `dividend:formDateFutureError` (TH + EN)
- **No API/backend changes** — client-side only React app
- **No breaking changes** — backward compatible; existing records unaffected

## Test Strategy (Per OpenSpec Proposal Rule: test first)

1. Write tests first in `DividendForm.spec.tsx` that assert:
   - Date input has `max` attribute equal to today's date
   - Submitting with a future date shows validation error
   - Submitting with today's date is allowed
   - Submitting with yesterday's date is allowed
2. Run tests — expect failures (RED) before code change
3. Implement the `max` attribute + validation in `DividendForm.tsx`
4. Run tests again — expect pass (GREEN)
5. Run `npm test` + `npm run lint` as quality gates (no separate `npm run build` gate due to pre-existing vacuous build issue documented in config.yaml)
