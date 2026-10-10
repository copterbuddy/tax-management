# Tasks

## 1. Component Fix

- [x] 1.1 Update DividendRemitForm submit disabled condition to `!(Number(amountUSD) > 0 && !isNaN(Number(amountUSD)) && Number(remitFxRate) > 0 && !isNaN(Number(remitFxRate)) && !!remitDate)` and add `min`/`max` attributes; verify by rendering component with valid/invalid inputs and checking button disabled state
- [x] 1.2 Add `min="0.01"` and `step="0.01"` to amount input and FX rate input; verify by inspecting DOM attributes

## 2. Tests

- [x] 2.1 Write DividendRemitForm.spec.tsx covering submit enabled/disabled scenarios (valid, amount=0, fx=0, date missing, NaN); verify `npm test` passes
- [x] 2.2 Verify existing tests (`npm test`) still pass; verify `npm run lint` passes

## 3. Validation

- [x] 3.1 Update `tasks.md` checkboxes to completed and verify `openspec validate fix-dividend-remit-submit-disabled` passes (validated 2026-10-10)
- [x] 3.2 Verify design.md and specs match the implemented behavior and there are no remaining open questions (design matches disabled logic + date requirement; specs cover valid/invalid states)
