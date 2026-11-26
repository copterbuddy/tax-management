# Spec Delta

## REMOVED Requirements

### Requirement: The estimate is derived, not entered

**Reason**: Personal income tax estimation (entering other income and deductions to compute net taxable income) is out of scope; the application only calculates assessable income and withholding tax credit to declare on the return.
**Migration**: Users take the 4 assessable-income and credit figures from `FilingSummarySheet` (or its CSV export) and compute final tax liability externally or when filling PND 90.

### Requirement: The tax follows the progressive brackets

**Reason**: Progressive Thai income tax bracket calculation is out of scope.
**Migration**: Remove `taxBrackets.ts`, `taxEstimate.ts`, and `taxSlice.ts`.

### Requirement: The credit is applied and the shortfall stated

**Reason**: Computing net tax payable or overpaid refund after subtracting withholding credit is out of scope.
**Migration**: `FilingSummarySheet` continues to report `dividendCreditTHB` alongside `dividendGrossTHB`, `capitalGainTHB`, and `totalAssessableTHB`.
