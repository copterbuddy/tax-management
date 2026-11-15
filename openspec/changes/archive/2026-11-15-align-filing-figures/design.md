# Design

## Context

- `DividendSummary` already carries both figures: `totalReportableIncomeTHB` (the THB received: `amountUSD × remitFxRate`) and `totalGrossEquivalentTHB` (`reportable + whtCreditTHB`). Gross − received = the withholding credit by construction, because both are the same remitted slice at the same rate.
- The dividend card renders `totalReportableIncomeTHB` as its value and `totalGrossEquivalentTHB` as a sub-line, so the headline is the number a return does **not** ask for.
- The capital-gain card renders `summary.taxableGainTHB` under the title `ภาษีที่ต้องยื่น (ประมาณการ)`. That value is assessable income from remittances; the app computes no tax payable anywhere (`taxSlice` is a standalone calculator not wired to the data).
- `dividend-tax-calculation` currently defines reportable income as "the actual THB amount received", which is the source of the mislabel; changing the headline without changing that requirement would leave spec and UI disagreeing.

## Goals / Non-Goals

**Goals**

- The headline number on the dividend card is the one a Thai return asks for.
- No card calls assessable income "tax".
- Every figure keeps a label that states its basis.

**Non-Goals**

- Computing tax payable (needs other income, deductions, brackets) — a separate change.
- Changing stored remittance values or the summary maths.
- Reworking the tax-year/provider cards.

## Decisions

### D1 — Gross becomes the headline; received becomes the sub-line

`totalGrossEquivalentTHB` moves to the card value, `totalReportableIncomeTHB` to the sub-line, labelled "รับจริง (สุทธิหลัง WHT)". No new computation: both values already exist and their difference is exactly the credit.

*Alternative rejected*: keep net as the headline and only change the tooltip. The number a user copies is the headline; leaving the wrong figure largest keeps the defect.

### D2 — The requirement, not just the label, changes

`dividend-tax-calculation` says reportable income is what was received. That sentence is what produced the label, so it is replaced with: the amount to declare is the gross dividend of the remitted slice (received + withholding credit), converted at the remittance-date rate, with the received amount reported beside it. The three existing scenarios are preserved by name; one new scenario states that gross exceeds received by the credit.

### D3 — The capital-gain card is retitled, not re-scoped

Only the title and tooltip change: `เงินได้ที่ต้องยื่น (ประมาณการ)` / "Assessable Income (est.)". The tooltip carries three facts a filer needs and the number cannot show: it is before the 150,000 baht exemption and other income; it is not tax payable; and it is computed as the gain portion of each remittance at the remittance-date rate with FIFO lot matching, exchange-rate differences not treated as income.

*Alternative rejected*: rename the field. The engine name `taxableGainTHB` is accurate (it is taxable gain), and renaming it would ripple through the store and every spec for no user-visible gain.

### D4 — No fallback estimate

Showing an actual tax number would require other income and deductions; half an estimate is worse than a correct base. The card states what it is and the separate change can add the calculator.

## Risks / Trade-offs

- **Two figures on one card can be confused.** Mitigated by naming both bases in the labels and stating the credit relationship in the tooltip.
- **The gross figure is larger than what the user received.** That is the point: the return asks for gross and credits the withholding; the tooltip says so.
- **Tooltip length.** It carries method plus caveats; kept to three short lines so it stays readable in the existing tooltip component.

## Migration Plan

None. Display only; stored data and every computed total are untouched.