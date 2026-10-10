# Proposal

## Why
In dividend tab remittance popup (DividendRemitForm), submit button stays disabled after valid fields filled due to disabled condition not accounting for NaN / zero-string edge cases.

## What Changes
- Fix button disabled logic in DividendRemitForm.tsx
- Add test cases for submit enabled/disabled states
- Update spec for dividend-form-modal-display

## Capabilities
### New Capabilities
- dividend-remit-submit-state: submit button state logic

### Modified Capabilities
- dividend-form-modal-display: button behavior requirement

## Impact
src/components/DividendRemitForm.tsx, spec + tests
