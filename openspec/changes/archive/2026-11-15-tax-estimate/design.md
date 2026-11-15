# Design

## Context

`taxSlice` already holds a progressive-bracket calculator used by the tax-planning tab, but it is private to the slice. The filing sheet knows the year's assessable income (`totalAssessableTHB`) and the dividend credit (`dividendCreditTHB`).

## Decisions

### D1 — One bracket table, moved to the engine

The brackets are law, not slice state. Moving them to `src/engine/taxBrackets.ts` and importing them from the slice keeps the existing calculator's behaviour identical (same function, same rounding) while letting the estimate reuse it. Duplicating the table was the alternative and would drift on the next budget change.

### D2 — Two inputs, everything else derived

Other income and deductions are the only things the app cannot know. Assessable income comes from the sheet; the credit comes from the dividend records. This keeps the section honest: no field can silently disagree with the ledger.

### D3 — The estimate is ephemeral

Inputs are not persisted. An estimate is a what-if, and storing it would invite the reader to treat it as filed data — which is what the year lock exists to record.

### D4 — Show the payable, including a credit larger than the tax

`payable = max(0, tax − credit)` is what is owed; when the credit exceeds the tax the line instead reports the excess, because "0 to pay" would hide a refundable amount.

## Risks / Trade-offs

- **Allowances are entered as one number.** Itemising them is a different feature; the total is what the bracket needs.
- **No withholding other than dividends.** Salary withholding is not in the ledger; the estimate says so in its hint.
