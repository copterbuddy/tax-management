# Proposal

## Why

The dividend module ships with **zero unit tests**. All 116 existing tests cover the FIFO
engine, tax slice, trade slice and Zod schemas — nothing covers `dividendEngine.ts` or
`dividendSlice.ts`, the code that decides how much Thai tax a dividend costs.

That gap is not theoretical. `src/components/DividendRemitForm.tsx:48` computes
`reportableIncomeTHB` using `dividend.dividendFxRate` (the FX rate on the day the dividend
was received) instead of `remitFxRate` (the FX rate on the day the money was brought into
Thailand). The figure is wrong by roughly 3–5% of the amount, it is shown in the UI as
"รายได้ที่ต้องยื่น", and it is **persisted to localStorage** — so it survives reloads and
is the number the user would type into their ภ.ง.ด.90 return. Two lines above it,
`calculateWhtCredit()` correctly uses `remitFxRate`, so the dialog contradicts itself:
"เงินที่ได้รับจริง ฿26,350 / รายได้ที่ต้องยื่น ฿25,500".

Writing the tests first is how this gets caught and stays caught. Today nothing would fail
if the same mistake were reintroduced tomorrow.

## What Changes

- **Add `src/engine/dividendEngine.spec.ts`** — direct unit tests for every exported pure
  function, with the reportable-income FX rule (BR2) and proportional WHT credit rule
  (BR3) as the headline cases.
- **Add `src/store/dividendSlice.spec.ts`** — reducer tests through `configureStore`,
  following the existing `taxSlice.spec.ts` pattern: CRUD, partial remittance arithmetic,
  remittance removal recomputation, and localStorage persistence.
- **Fix `DividendRemitForm.tsx:48`** — `reportableIncomeTHB` must use `remitFxRate`, so it
  equals `remitTHB`. This is what the new tests assert, so the fix lands with the test that
  demands it.
- **Add a regression guard** — a test that pins the invariant
  `reportableIncomeTHB === remitTHB === amountUSD × remitFxRate` and asserts it is
  independent of `dividendFxRate`.

Explicitly **not** in this change:

- Pre-2024 dividend exemption. Income received before 1 Jan 2024 (BE 2567) is permanently
  exempt in Thailand and the app does not model it. Deliberately deferred.
- Repairing stored remittances whose `reportableIncomeTHB` was written with the wrong FX.
  The user decided on 2026-10-05 to do this as a separate follow-up change, after this
  change's test results are visible. `remitTHB` on each record is correct, so the repair is a
  copy rather than a recomputation — see `design.md` Decision 4.
- The year-scoping inconsistencies in `computeDividendSummary()` (`totalUnremittedUSD`
  ignores the selected year) and `DividendTab.tsx` (row totals ignore the selected year).
  Real issues, but they change behaviour rather than lock behaviour in — a separate change.
- Foreign tax credit limit calculation.
- Any UI restructuring.

## Capabilities

### New Capabilities

- `dividend-tax-calculation`: Correct, tested calculation of Thai-taxable dividend income —
  reportable income in THB, proportional foreign withholding-tax credit, partial and
  cross-year remittance attribution, and the annual summary grouped by remittance year.

### Modified Capabilities

None. This repository has no existing OpenSpec specs (`openspec list --specs` is empty);
the dividend requirements currently live only in `docs/specs/dividend-tracker.md`, which
is the project's pre-OpenSpec BA workflow document and is not a delta target.

## Impact

**Files created**

| File | Contents |
|---|---|
| `src/engine/dividendEngine.spec.ts` | Tests for `calculateDividendTHB`, `calculateWhtCredit`, `validateRemittance`, `applyDividendRemittance`, `computeDividendSummary`, `getAvailableSymbols`, `getDividendYears` |
| `src/store/dividendSlice.spec.ts` | Reducer tests for the 8 exported actions |

**Files modified**

| File | Change |
|---|---|
| `src/components/DividendRemitForm.tsx` | Line 48: `dividend.dividendFxRate` → `remitFxRate` |

**Unaffected**

`src/types/trade.ts`, `src/constants.ts`, `src/validation/schemas.ts`, `src/i18n/**`,
`src/engine/fifoEngine.ts`, `src/store/tradeSlice.ts`, `src/store/taxSlice.ts`,
`src/components/DividendTab.tsx`, `src/components/DividendForm.tsx`.

**Existing data.** The fix corrects future entries only. Remittances already saved with the
wrong `reportableIncomeTHB` stay wrong on disk. Recomputing them from `remitTHB` (which was
always correct) would be a separate data-migration change, agreed with the user before it
is written — it rewrites stored tax figures.

**Verification.** `npm test` (jest, jsdom, `*.spec.ts`). Note that `npm run build` is
already red for an unrelated reason: `tsconfig.app.json` type-checks `src/*.spec.ts` without
jest types. `npm run lint` stays the second gate.