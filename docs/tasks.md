# 📋 Task Breakdown — Thai Tax Tracker

> **Created by:** BA | **For:** Dev  
> **Last updated:** 2026-07-25  
> **Status tracking:** ⬜ ยังไม่ได้ทำ | 🟡 กำลังทำ | ✅ ทำเสร็จแล้ว | ❌ ยกเลิก

---

## ✅ Completed

### TASK-000: Add Provider (Broker) Field + Provider-Aware FIFO

**Priority:** 🔴 P0  
**Effort:** L (6 files)  
**Status:** ✅ ทำเสร็จแล้ว  
**Completed:** 2026-07-25

**What was done:**
- Added `ProviderType` ('Dime' | 'Liberator' | 'FinansiaSyrus') + `provider` field in all interfaces
- Refactored FIFO engine to key lots by `symbol|provider` — no cross-provider matching
- Added Provider dropdown to TradeForm with DIP validation callback
- Added Provider column to TradeTable
- Removed Export/Import drawer and functions
- Added `migrateTrade()` for backward compatibility (old trades → 'Dime')
- Type check: `tsc --noEmit` → 0 errors

---

## 🔴 P0 — Critical (Must Do)

### TASK-011: Capital Losses Not Deductible (แยกกำไร-ขาดทุน)

**Priority:** 🔴 P0  
**Effort:** M (4 files)  
**Status:** ✅ ทำเสร็จแล้ว  
**Depends on:** TASK-000 ✅  
**Source:** PwC Thai Tax 2024/25 — "Capital losses cannot be offset against capital gains"

**User Story:**
> As a Thai investor filing ภ.ง.ด.90, I want only my capital gains (not losses) to count toward my taxable income, because Thai Revenue Code Section 40(4)(g) does not allow loss offsetting.

**Acceptance Criteria:**
| # | Condition |
|---|---|
| AC1 | Engine: `computeTaxableGains()` sums only `realizedGainTHB > 0` → `taxableGainTHB` |
| AC2 | Engine: Sum of negative gains → `excludedLossesTHB` (absolute value) |
| AC3 | `TaxSummary` type gains 2 new fields: `taxableGainTHB`, `excludedLossesTHB` |
| AC4 | KPI: `Net Realized Gain` → `Taxable Gain (เฉพาะกำไร)` — ใช้ `taxableGainTHB` |
| AC5 | KPI: เพิ่มการ์ดใหม่ `Excluded Losses` — แสดงยอดขาดทุนที่หักลบไม่ได้ (สีแดง) |
| AC6 | TradeTable: คอลัมน์ FIFO Gain แสดงตามจริง, เพิ่มคอลัมน์ `Taxable` แสดง ✅/❌ |
| AC7 | ทุกที่ที่แสดง net gain ต้องใช้ `taxableGainTHB` ไม่ใช่ `netRealizedGainTHB` |

**Technical Notes:**
| File | Action |
|---|---|
| `src/types/trade.ts` | เพิ่ม `taxableGainTHB: number`, `excludedLossesTHB: number` ใน `TaxSummary` |
| `src/engine/fifoEngine.ts` | เพิ่ม `computeTaxableGains()` — OCP: แยกฟังก์ชันใหม่ ไม่แก้ของเดิม |
| `src/components/Dashboard.tsx` | เปลี่ยน KPI Net → Taxable Gain, เพิ่ม KPI Excluded Losses |
| `src/components/TradeTable.tsx` | เพิ่มคอลัมน์ Taxable (✅/❌) |

**Edge Cases:**
- EC1: ปีที่มีแต่ขาดทุนอย่างเดียว → taxableGainTHB = 0, excludedLossesTHB = sum of losses
- EC2: ปีที่มีแต่กำไร → taxableGainTHB = netRealizedGainTHB, excludedLossesTHB = 0
- EC3: กำไร 0 บาท (ราคาเท่าทุน) → not taxable, not a loss

---

### TASK-012: Multi-Language Support EN/TH

**Priority:** 🟡 P1  
**Effort:** M (6 files: 2 new, 4 modified)  
**Status:** ✅ ทำเสร็จแล้ว  
**Depends on:** None  
**QA Test Cases:** ✅ 20 cases written, 17 executed — all PASS

**User Story:**
> As a Thai investor, I want the app in Thai by default but switchable to English, so I can use it in my preferred language.

**Spec:** See BA Spec — Custom `useContext` + typed JSON, localStorage persistence, TH default  
**QA:** 20 test cases ready — Dev must wait for QA test cases before starting

---

### TASK-013: Remove CRYPTO + Simplify to Single Asset Type

**Priority:** 🔴 P0  
**Effort:** M (7 files)  
**Status:** ✅ ทำเสร็จแล้ว  
**Depends on:** None

**User Story:**
> As a user, I want to remove the crypto feature and simplify the app to a single asset type (foreign stocks only), because I only invest in foreign stocks.

**Spec:** See BA Spec — ลบ `AssetType` ทั้งหมด, filter out CRYPTO from localStorage, simplify KPI

---

### TASK-015: Remittance-Based Tax (นำเงินเข้าไทย)

**Priority:** 🔴 P0  
**Effort:** L (8 files: 1 new, 7 modified)  
**Status:** ✅ ทำเสร็จแล้ว  
**Depends on:** None

**What was done:**
- FIFO engine now calculates entirely in USD
- Gain% method: taxable = remitUSD × gain% × remitFX
- RemitForm: new component for recording remittances
- Tax year = remittance year (per Thai Revenue Code)
- Cost basis portion of remittance is NOT taxable
- Partial/多次 remittance supported with remaining proceeds tracking
- Old fxRateTHB data migrated out

---

### TASK-001: Replace US Tax Brackets with Thai Tax Brackets

**Priority:** 🔴 P0  
**Effort:** M (3-5 files)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

**User Story:**
> As a Thai investor, I want the tax calculator to use actual Thai personal income tax brackets so that my tax estimate is accurate for Thai Revenue Department filing.

**Current State:** `src/store/taxSlice.ts` has US 2024 brackets (10%-37%).

**Acceptance Criteria:**
- [ ] Replace all US bracket configurations with Thai 2024 brackets (0%-35%, progressive)
- [ ] Thai brackets: 0–150,000 (exempt), 150,001–300,000 (5%), 300,001–500,000 (10%), 500,001–750,000 (15%), 750,001–1,000,000 (20%), 1,000,001–2,000,000 (25%), 2,000,001–5,000,000 (30%), 5,000,001+ (35%)
- [ ] Remove `married_joint`, `married_separate`, `head_household` — Thai system doesn't use these
- [ ] Update `FilingStatus` type to Thai-relevant statuses or remove entirely
- [ ] Update default deductions to Thai standard (60,000 personal allowance + 100,000 expense deduction for employment income)
- [ ] Labels/UI text in Thai baht (฿) remain correct

**Files to Change:**
- `src/store/taxSlice.ts` — Replace brackets, filing statuses, defaults
- `src/types/trade.ts` — Update `FilingStatus` type if needed

**Edge Cases:**
- Income exactly at bracket boundary (e.g., 150,000.00)
- Zero income
- Very high income (50M+ THB)

---

### TASK-002: Prevent SELL Without Sufficient Provider Lots (UI Guard)

**Priority:** 🔴 P0  
**Effort:** S (1 file)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** TASK-000 ✅

**User Story:**
> As a user, I want the form to prevent me from accidentally selling through a provider that doesn't have enough buy lots, so I don't get errors.

**Current State:** Engine throws error in `processSellTrade` but TradeForm catches it via `onValidate`. UX could be improved.

**Acceptance Criteria:**
- [ ] TradeForm shows warning **before submit** when selected provider has insufficient lots
- [ ] Display available quantity next to provider dropdown: "Dime (10 AAPL available)"
- [ ] Disable submit button when validation fails (with reason tooltip)

**Files to Change:**
- `src/components/TradeForm.tsx` — Add real-time validation UI
- `src/components/Dashboard.tsx` — Pass lot summary data

**Edge Cases:**
- Edit trade changes from BUY→SELL after provider selected
- No available lots at all for symbol+provider
- Symbol not yet purchased at all (first transaction is SELL)

---

## 🟡 P1 — High Priority

### TASK-003: Provider-Aware KPI Dashboard

**Priority:** 🟡 P1  
**Effort:** M (2-3 files)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** TASK-000 ✅

**User Story:**
> As a multi-broker investor, I want to see gains broken down by provider in the KPI dashboard, so I can compare broker performance at a glance.

**Acceptance Criteria:**
- [ ] New row of KPI cards showing gain per provider (Dime / Liberator / FinansiaSyrus)
- [ ] KPI cards show both THB amount and percentage of total gain
- [ ] Negative gains shown in red, positive in green (consistent with existing KPI variants)
- [ ] Maintain existing 5 KPI cards + add new row with 3 cards
- [ ] Reuse `KpiCard` component — do NOT create new card type

**Files to Change:**
- `src/components/Dashboard.tsx` — Add provider KPI row
- `src/types/trade.ts` — Add `providerBreakdown` to `TaxSummary` (if not already)
- `src/engine/fifoEngine.ts` — Compute provider breakdown in `computeTaxSummary`

**Edge Cases:**
- Provider with zero transactions (show ฿0.00)
- All gains negative for one provider
- New year with no data

---

### TASK-004: Provider Filter & Sort in Trade Table

**Priority:** 🟡 P1  
**Effort:** S (1 file)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** TASK-000 ✅

**User Story:**
> As a user with many trades across brokers, I want to filter and sort by provider so I can review trades for a specific broker quickly.

**Acceptance Criteria:**
- [ ] Provider column header is clickable for sorting (ascending/descending)
- [ ] Add provider filter dropdown above table: "All Providers" / "Dime" / "Liberator" / "FinansiaSyrus"
- [ ] Filter and sort work together (e.g., show only Dime, sorted by date)
- [ ] Filter state resets when year changes

**Files to Change:**
- `src/components/TradeTable.tsx` — Add filter dropdown + sort logic

**Edge Cases:**
- Filter returns zero results → show empty state
- Sort by provider then by date (secondary sort)

---

## 🟢 P2 — Medium Priority

### TASK-005: Install Test Framework (Vitest)

**Priority:** 🟢 P2  
**Effort:** M (setup + initial tests)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

**Acceptance Criteria:**
- [ ] Install `vitest` as dev dependency
- [ ] Configure `vitest` in `vite.config.ts`
- [ ] Add `"test": "vitest"` script to `package.json`
- [ ] Write unit tests for all exported functions in `fifoEngine.ts`
- [ ] Write tests for `tradeSlice` reducers
- [ ] Minimum 80% coverage on engine, 60% on store

**Test Cases (Engine):**

| Function | Happy Path | Edge Cases |
|---|---|---|
| `calculateBuyCostTHB` | Normal BUY | Zero qty, zero price, zero commission |
| `calculateSellRevenueTHB` | Normal SELL | Zero qty, commission > revenue |
| `validateSellLots` | Sufficient lots | Zero available, exact match, cross-provider |
| `processSellTrade` | Single lot match, multi-lot match | Partial match across many lots |
| `computeAllRealizedGains` | Interleaved BUY/SELL | Same symbol different providers, empty trades |
| `computeTaxSummary` | Multi-symbol year | Year with only BUYs, year with only SELLs |

---

### TASK-006: Responsive Mobile Layout

**Priority:** 🟢 P2  
**Effort:** M (CSS only)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

**Acceptance Criteria:**
- [ ] Table scrolls horizontally on mobile (max-width: 768px)
- [ ] KPI cards stack vertically on mobile (2 columns → 1 column)
- [ ] TradeForm modal is full-screen on mobile
- [ ] Buttons are touch-friendly (min 44px tap target)
- [ ] No horizontal page scroll (except inside table wrapper)

---

### TASK-007: Data Validation Improvements

**Priority:** 🟢 P2  
**Effort:** S (1-2 files)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

**Acceptance Criteria:**
- [ ] Date validation: no future dates, reasonable past (≥ 2000)
- [ ] Symbol validation: alphanumeric only, max 10 chars, auto-uppercase
- [ ] Quantity validation: max 1,000,000 units (prevent typos)
- [ ] FX Rate: reasonable range 20-50 THB/USD
- [ ] Price: reasonable range $0.0001 - $1,000,000

---

## ⚪ P3 — Nice to Have

### TASK-008: Trade Summary Chart

**Priority:** ⚪ P3  
**Effort:** M  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

Add a simple bar/line chart showing monthly gain/loss trend within the selected tax year. Use lightweight charting (no heavy dependency).

### TASK-009: Export Thai Tax Filing Worksheet

**Priority:** ⚪ P3  
**Effort:** L  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

Generate a formatted PDF/print view that matches the Thai Revenue Department format (ภ.ง.ด.90).

### TASK-010: Multiple Portfolios

**Priority:** ⚪ P3  
**Effort:** L  
**Status:** ⬜ ยังไม่ได้ทำ  
**Depends on:** None

Allow users to switch between portfolios (e.g., "Personal", "Spouse", "Company") — each with separate trades and FIFO pools.

---

## 📊 Summary

| Priority | Count | Done | Pending | Tasks |
|---|---|---|---|---|
| 🔴 P0 | 4 | 2 | 2 | TASK-000 ✅, TASK-011 ✅, TASK-001 ⬜, TASK-002 ⬜ |
| 🟡 P1 | 3 | 1 | 2 | TASK-012 ✅, TASK-003 ⬜, TASK-004 ⬜ |
| 🟢 P2 | 3 | 0 | 3 | TASK-005 ⬜, TASK-006 ⬜, TASK-007 ⬜ |
| ⚪ P3 | 3 | 0 | 3 | TASK-008 ⬜, TASK-009 ⬜, TASK-010 ⬜ |
| **Total** | **13** | **3** | **10** | |
