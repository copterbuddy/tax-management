# Design: restrict-dividend-date-to-today

## Context

See proposal.md for motivation. The dividend form (`DividendForm.tsx`) currently renders a date input without a maximum constraint, unlike TradeForm and RemitForm which enforce `max={today}`.

## Goals

- Prevent users from selecting future dates for dividend receipt
- Maintain consistency with sibling form components
- Do not change any tax calculation logic (reference-only date snapshot)

## Non-Goals

- Changing tax year or remittance logic
- Adding backend validation (client-side only app)
- Changing the default date selection logic (still defaults to today)

## Decisions

### D1: Add `max` attribute to HTML input, not just JS validation
- **Choice**: Use native HTML `max` + JS validation on submit
- **Rationale**: Native `max` blocks picker selection; JS validation catches any edge case; consistent with RemitForm approach
- **Alternative considered**: Only JS validation — rejected because native picker allows future selection

### D2: Validation message delivered via existing `error` state
- **Choice**: Reuse DividendForm's existing `useState('')` error banner (`form-error-banner`)
- **Rationale**: No new state mechanism needed; consistent with existing error display
- **Alternative considered**: New zod schema + react-hook-form — rejected (component uses manual state, not react-hook-form; don't mix patterns)

### D3: Modal body padding
- **Choice**: Add `.modal-body { padding: var(--space-5) var(--space-6); }` in index.css
- **Rationale**: `.modal-header` and `.modal-actions` already use `padding: var(--space-5) var(--space-6)`, but `.modal-body` had no padding — form input edges touched the modal sides
- **Alternative considered**: Inline style on `.modal-body` div — rejected; CSS class is reusable and consistent with design system tokens

## Risks / Trade-offs

- [Risk] Existing records edited in the future will fail validation. → [Mitigation] Only applies to new submissions/edit; records already saved are not re-validated on load.
- [Risk] Date format mismatch (`YYYY-MM-DD` vs `YYYY-MM-DD`). → [Mitigation] Both use `new Date().toISOString().split('T')[0]`, identical to RemitForm.
