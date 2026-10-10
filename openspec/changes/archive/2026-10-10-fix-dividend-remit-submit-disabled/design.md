# Design

## Context

The DividendRemitForm component in the dividend tab shows a remittance popup. Currently the submit button is disabled when `amountUSD <= 0 || remitFxRate <= 0` (line 211). The actual form state is driven by local state (`amountUSD`, `remitFxRate`) and validation via `useMemo` on the `validation` variable. The condition does not account for `NaN` from empty strings, nor does it account for the remittance date field being required. When a user fills all fields correctly the button can remain disabled due to parsing edge cases.

## Goals / Non-Goals

**Goals:**
- Ensure the submit button is enabled whenever amount > 0, FX rate > 0, and a date is selected
- Ensure the button remains disabled for zero, negative, NaN, or empty inputs
- Preserve existing validation flow (date future check, amount exceeding remaining)

**Non-Goals:**
- Change the overall remittance submission logic or date validation rules
- Modify the underlying engine calculations or Redux state shape

## Decisions

- Update the `disabled` attribute on the submit button to `!(Number(amountUSD) > 0 && Number(remitFxRate) > 0 && !!remitDate)`
- Add `min="0.01"` and `step="0.01"` HTML attributes to the amount and FX inputs for browser-level constraints
- Keep the existing `useMemo` validation in `handleSubmit` unchanged; the button state will be derived independently
- Do not alter the `max` date attribute on the date input (already set to today via DividendForm modal-change change)

## Risks / Trade-offs

- [Risk] If the `Number()` conversion produces unexpected `NaN` values from non-numeric strings, the disabled logic may still misfire. Mitigation: explicitly guard with `!isNaN(Number(amountUSD))` and `!isNaN(Number(remitFxRate))`.
- [Trade-off] Simpler condition may reduce verbosity but could mask other form-state bugs that were previously caught by the `useMemo` validation path; however, the button is a UI concern and should not duplicate business logic.

## Open Questions

None. The approach is well-scoped to the submit button condition and form inputs.