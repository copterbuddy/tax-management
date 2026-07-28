# Spec: Add Exchange Fee and TAF Fee Fields

> **Status:** Draft  
> **Created:** 2026-07-28  
> **Author:** BA  
> **Target:** `src/types/trade.ts`, `src/engine/fifoEngine.ts`, `src/components/TradeForm.tsx`, `src/components/TradeTable.tsx`, `src/validation/schemas.ts`, `src/store/tradeSlice.ts`, `src/i18n/locales/{en,th}/trade.json`

---

## User Story

> As a Thai investor recording stock/crypto trades, I want to enter Exchange Fee (ค่าธรรมเนียมตลาดหลักทรัพย์) and TAF Fee (ค่าธรรมเนียมการขาย) separately from Commission Fee, so that my cost basis and net proceeds match my broker statements exactly.

---

## Objective

Real broker statements (Dime, Liberator, FinansiaSyrus) itemize fees into three separate line items:

1. **Commission Fee** — Broker commission (already implemented as `commissionUSD`)
2. **Exchange Fee** (Exchange/Market Fee / ค่าธรรมเนียมตลาดหลักทรัพย์) — Exchange-level transaction fee
3. **TAF Fee** (Trading Activity Fee / ค่าธรรมเนียมการขาย) — SEC-mandated fee applicable to US securities

Currently the system has only one `commissionUSD` field. Users must manually sum all three fees into commissionUSD, which:
- Does not match broker statement layout
- Causes confusion about what the "commission" number represents
- Makes data entry error-prone (user must calculate sum in their head)
- Loses the individual fee breakdown for audit/verification

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Table layout | 1 aggregate "Total Fees" column | 3 fee columns would make table too wide; total is what matters for quick scan |
| TAF on BUY? | SELL only | SEC Section 31 fee applies only to sales; hiding on BUY reduces clutter |
| TH naming | ค่าธรรมเนียมตลาดหลักทรัพย์ | Full formal name matching broker documentation |

---

## Current State Analysis

### TradeTransaction Interface

```typescript
interface TradeTransaction {
  id: string;
  date: string;            // YYYY-MM-DD
  symbol: string;
  type: TradeType;         // 'BUY' | 'SELL'
  provider: ProviderType;  // 'Dime' | 'Liberator' | 'FinansiaSyrus'
  quantity: number;
  priceUSD: number;        // Unit price in USD
  commissionUSD: number;   // Total commission in USD  ← Only fee field
  notes?: string;
}
```

### Engine Formulas (3 functions)

| Function | Current Formula | Applies To |
|---|---|---|
| `calculateBuyCostUSD(trade)` | `qty × price + commissionUSD` | BUY |
| `calculateSellRevenueUSD(trade)` | `qty × price - commissionUSD` | SELL |
| `calculateUnitCostUSD(trade)` | `calculateBuyCostUSD(trade) / qty` | BUY lots |

### Form Validation (TradeForm.tsx)

- `commissionUSD: z.number().min(0)` — Zod schema

### Table Display (TradeTable.tsx)

- 1 column: `colFee` = "Commission Fee (USD)"
- Total column: BUY = `qty×price + commission`, SELL = `qty×price - commission`

### Migration (tradeSlice.ts)

- `migrateTrade()` handles: missing provider → 'Dime', strips assetType, strips fxRateTHB

---

## Detailed Requirements

### R1: New Field Definitions

| Field | Thai Name | English Name | Applicable To |
|---|---|---|---|
| `exchangeFeeUSD` | ค่าธรรมเนียมตลาดหลักทรัพย์ | Exchange Fee | BUY + SELL |
| `tafFeeUSD` | ค่าธรรมเนียมการขาย (TAF) | TAF Fee | SELL only |

Both fields:
- Are `number` type, same as `commissionUSD`
- Default to `0` (both for new forms and migration of old trades)
- Have `z.number().min(0)` validation
- User can leave at `0` if not applicable

### R2: Business Rules — Fee Aggregation

**BUY — Total Cost:**
```
TotalCostUSD = qty × priceUSD + commissionUSD + exchangeFeeUSD
(tafFeeUSD is 0 for BUY — not applicable)
```

**SELL — Net Revenue:**
```
NetRevenueUSD = qty × priceUSD - commissionUSD - exchangeFeeUSD - tafFeeUSD
```

**Unit Cost (for FifoLot creation):**
```
UnitCostUSD = TotalCostUSD / qty
```

### R3: Formula Changes

#### `calculateBuyCostUSD(trade)`
```typescript
return trade.quantity * trade.priceUSD + trade.commissionUSD + (trade.exchangeFeeUSD ?? 0);
```

#### `calculateSellRevenueUSD(trade)`
```typescript
return trade.quantity * trade.priceUSD - trade.commissionUSD - (trade.exchangeFeeUSD ?? 0) - (trade.tafFeeUSD ?? 0);
```

#### `calculateUnitCostUSD(trade)`
No formula change — delegates to `calculateBuyCostUSD()` which already includes new fees.

### R4: Form — Two New Input Fields

**BUY mode:** Show 2 fee inputs (Commission + Exchange Fee)
**SELL mode:** Show 3 fee inputs (Commission + Exchange Fee + TAF Fee)

Layout: Single row using `.form-row-fees` CSS class
- `grid-template-columns: 1fr 1fr 1fr` (desktop)
- `grid-template-columns: 1fr` (tablet/mobile)

### R5: Table — Aggregate Total Fees Column

**Desktop:** Replace `colFee` with `colTotalFees`
- Cell value: `commissionUSD + exchangeFeeUSD + tafFeeUSD`
- Total column: BUY = `qty×price + fees`, SELL = `qty×price - fees`

**Mobile Card:** Single "Total Fees" row showing aggregate sum

**Responsive:** `col-total-fees` hidden at `max-width: 767px`

### R6: Migration

```typescript
if (migrated.exchangeFeeUSD === undefined) migrated.exchangeFeeUSD = 0;
if (migrated.tafFeeUSD === undefined) migrated.tafFeeUSD = 0;
```

### R7: i18n Keys

| Key | EN | TH |
|---|---|---|
| `colTotalFees` | `Total Fees (USD)` | `ค่าธรรมเนียมรวม (USD)` |
| `formExchangeFee` | `Exchange Fee (USD)` | `ค่าธรรมเนียมตลาดหลักทรัพย์ (USD)` |
| `formTafFee` | `TAF Fee (USD)` | `ค่าธรรมเนียม TAF (USD)` |

Existing `colFee` and `formFee` keys remain unchanged.

---

## Acceptance Criteria

| # | Condition | Priority |
|---|---|---|
| AC1 | `TradeTransaction` interface has `exchangeFeeUSD` and `tafFeeUSD` as `number` fields | Must |
| AC2 | `tradeTransactionSchema` validates both new fields: `z.number().min(0)` | Must |
| AC3 | `calculateBuyCostUSD` includes commission + exchangeFee | Must |
| AC4 | `calculateSellRevenueUSD` subtracts commission + exchangeFee + tafFee | Must |
| AC5 | TradeForm shows exchangeFee input for both BUY and SELL | Must |
| AC6 | TradeForm shows tafFee input **only when type=SELL** (hidden on BUY) | Must |
| AC7 | TradeForm schema includes both new fields with `z.number().min(0)` | Must |
| AC8 | TradeForm defaults: `trade?.exchangeFeeUSD ?? 0`, `trade?.tafFeeUSD ?? 0` | Must |
| AC9 | TradeTable shows 1 aggregate "Total Fees" column = sum of all fees | Must |
| AC10 | TradeTable total column uses aggregate fees in BUY/SELL formula | Must |
| AC11 | TradeTable mobile card shows "Total Fees" aggregate row | Must |
| AC12 | `migrateTrade()` sets `exchangeFeeUSD: 0`, `tafFeeUSD: 0` for old trades | Must |
| AC13 | Migration does NOT overwrite existing values | Must |
| AC14 | 6 i18n keys added to both EN and TH (3 col + 3 form) | Must |
| AC15 | TAF Fee input appears/disappears when toggling BUY↔SELL | Must |
| AC16 | `tsc --noEmit` passes | Must |
| AC17 | All existing tests pass | Must |
| AC18 | New test cases cover migration + engine formulas + validation | Must |

---

## Edge Cases

| # | Scenario | Expected |
|---|---|---|
| EC1 | Old trades (no new fields) → loaded from localStorage | Migration sets both to 0 |
| EC2 | BUY trade → tafFeeUSD field hidden | tafFeeUSD defaults to 0 in data |
| EC3 | SELL trade → tafFeeUSD = 0 | Works fine, revenue = qty×price - commission - exchangeFee |
| EC4 | All fees = 0 | Cost = qty×price, Revenue = qty×price |
| EC5 | Edit SELL trade with stored tafFeeUSD | Shows stored value |
| EC6 | Edit old BUY trade (no tafFeeUSD in stored data) | Shows 0, exchangeFeeUSD shows 0 |
| EC7 | Narrow/mobile screen | "Total Fees" column hides (col-optional), mobile card shows aggregate |

---

## Implementation Notes

### Files Modified

| File | Change |
|---|---|
| `src/types/trade.ts` | Add `exchangeFeeUSD: number`, `tafFeeUSD: number` to interface |
| `src/validation/schemas.ts` | Add both fields to `tradeTransactionSchema` with `z.number().min(0).default(0)` |
| `src/store/tradeSlice.ts` | Extend `migrateTrade()` for new fields |
| `src/engine/fifoEngine.ts` | Update `calculateBuyCostUSD` and `calculateSellRevenueUSD` formulas |
| `src/components/TradeForm.tsx` | Add 2 inputs, schema, defaults, submit handler |
| `src/components/TradeTable.tsx` | Replace `colFee` → `colTotalFees`, update total calc |
| `src/index.css` | Add `.form-row-fees`, update responsive breakpoints |
| `src/i18n/locales/en/trade.json` | Add 3 new keys |
| `src/i18n/locales/th/trade.json` | Add 3 new keys |

### Test Files Updated

| File | Changes |
|---|---|
| `src/engine/fifoEngine.spec.ts` | `makeTrade` helper + 5 new test cases |
| `src/validation/schemas.spec.ts` | Fixtures + 6 new test cases |
| `src/store/tradeSlice.spec.ts` | `makeTrade` helper + 4 new migration tests |

### Doc Files Updated

| File | Changes |
|---|---|
| `.claude/skills/tax-management.md` | Update `TradeTransaction` type documentation |
| `docs/test-cases.md` | Add TASK-021 section (28 test cases) |

---

## Verification Checklist

- [ ] `tsc --noEmit` → 0 errors
- [ ] `npm test` → all 101 tests pass
- [ ] Form BUY: shows Commission + Exchange Fee inputs (2 fields)
- [ ] Form toggle to SELL: TAF Fee input appears (3 fields)
- [ ] Form toggle back to BUY: TAF Fee input disappears (2 fields)
- [ ] Desktop table: "Total Fees" column shows sum of all 3 fees
- [ ] Mobile card: "Total Fees" row shows aggregate sum
- [ ] Edit old trade (no new fields): exchangeFee=0, tafFee=0
- [ ] Edit SELL trade with stored tafFeeUSD: shows stored value
- [ ] Switch EN↔TH: labels change correctly

---

## Out of Scope

- Adding fee fields to `FifoLot` or `RealizedGainResult`
- Dashboard-level fee aggregation or KPI
- CSV import/export for fee data
- Validation warning if TAF is zero on SELL
- Historical recalculation (old trades get 0 for both fees)
