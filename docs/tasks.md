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

### TASK-016: Remittance Log + Tabbed Dashboard

**Priority:** 🟡 P1  
**Effort:** S (2 files new/modified)  
**Status:** ✅ ทำเสร็จแล้ว  
**Depends on:** TASK-015 ✅

**What was done:**
- Dashboard แบ่งเป็น 2 tabs: Trade Log / Remittance Log
- RemittanceLog component — แสดงทุกรายการ remit, filter ด้วย remit year, แสดงผลรวม
- TradeTable Remitted column → progress bar (visual %)
- ปุ่ม Record Remittance ย้ายไป Remittance Log tab

---

### TASK-001: Replace US Tax Brackets with Thai Tax Brackets

**Priority:** 🔴 P0  
**Effort:** M (3-5 files)  
**Status:** ✅ ทำเสร็จแล้ว (absorbed into TASK-018)  
**Completed:** 2026-07-26  
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
**Status:** ✅ ทำเสร็จแล้ว  
**Completed:** 2026-07-26  
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
**Status:** ✅ ทำเสร็จแล้ว  
**Completed:** 2026-07-26  
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
**Status:** ✅ ทำเสร็จแล้ว  
**Completed:** 2026-07-26  
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

### TASK-019: Sell Trade Symbol Dropdown (เปลี่ยน Symbol เป็น dropdown เมื่อขาย)

**Priority:** 🟡 P1
**Effort:** S (1 component file + 2 i18n files)
**Status:** ✅ ทำเสร็จแล้ว
**Assigned to:** Dev
**Depends on:** None
**Spec:** `docs/specs/sell-symbol-dropdown.md`

**User Story:**
> As a Thai investor recording a SELL transaction, I want the Symbol field to be a dropdown showing only the stocks I currently hold (with their provider and available quantity), so that I cannot accidentally enter a symbol I do not own or sell more shares than I have.

**Acceptance Criteria:**
| # | Condition |
|---|---|
| AC1 | เมื่อ type=SELL → Symbol field เปลี่ยนเป็น dropdown ทันที |
| AC2 | Dropdown แสดงเฉพาะหุ้นจาก remainingLots ที่มี remainingQuantity > 0 |
| AC3 | แต่ละ option แสดง "SYMBOL@Provider — X shares" |
| AC4 | เลือก option → auto-fill symbol และ provider |
| AC5 | Provider dropdown ถูก disabled เมื่อ type=SELL (เพราะค่า auto-fill แล้ว) |
| AC6 | เมื่อ type=BUY → Symbol กลับเป็น text input, Provider กลับมาเป็น dropdown ปกติ |
| AC7 | แก้ไขรายการขายเดิม → ฟอร์มแสดงค่าเดิมได้ แม้หุ้นจะขายหมดแล้ว |
| AC8 | ไม่มี remainingLots → dropdown แสดง empty state ที่สื่อความหมาย |
| AC9 | `tsc --noEmit` ผ่าน ไม่มี type error |
| AC10 | Existing BUY flow ไม่ได้รับผลกระทบ |

**Technical Notes:**
- `TradeForm.tsx` เท่านั้นที่ต้องแก้ — ใช้ `Controller` จาก react-hook-form
- `remainingLots` ถูกส่งเข้ามาแล้วใน props ไม่ต้องเปลี่ยน interface
- เพิ่ม i18n keys: `sellSymbolEmpty`, `sharesAvailable`, `sharesSoldOut` (EN+TH)
- ต้อง destructure `setValue` จาก `useForm` เพิ่มเพื่อ auto-fill provider

**Files to Change:**
- `src/components/TradeForm.tsx` — เปลี่ยน Symbol field เป็น conditional dropdown
- `src/i18n/locales/en/trade.json` — เพิ่ม 3 keys
- `src/i18n/locales/th/trade.json` — เพิ่ม 3 keys

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

### TASK-017: UX/UI Improvement — Design System + Round 1 & 2

**Priority:** 🟡 P1
**Effort:** L (10+ files)
**Status:** ✅ ทำเสร็จแล้ว
**Completed:** 2026-07-26
**Depends on:** None

**User Story:**
> As a Thai investor, I want a clean, modern UI with light/dark mode, informative KPI cards with tooltips, and responsive design, so I can use the app comfortably on any device.

**What was done (Round 1 + 2):**

| Feature | Status |
|---|---|
| Design System Foundation (`docs/ux/design-system.md`) | ✅ |
| Light/Dark Mode CSS Tokens + ThemeContext | ✅ |
| Theme toggle + Language switcher in header | ✅ |
| KPI cards: F-pattern reorder + tooltip ⓘ + subValue2 context | ✅ |
| Tooltip component (click/ESC/click-outside) | ✅ |
| ConfirmDialog component | ✅ |
| Data freshness indicator | ✅ |
| Tab navigation with active indicator | ✅ |
| Responsive table → card view on mobile | ✅ |
| Empty state CTA button (TradeTable) | ✅ |
| Empty state CTA button (RemittanceLog) | ✅ |

**Files:**
- `src/components/TradeTable.tsx` — Add CTA button in empty state
- `src/components/RemittanceLog.tsx` — Add CTA button in empty state
- `src/components/Tooltip.tsx` — ✅ New
- `src/components/ConfirmDialog.tsx` — ✅ New
- `src/components/KpiCard.tsx` — ✅ Modified
- `src/components/Dashboard.tsx` — ✅ Modified
- `src/context/ThemeContext.tsx` — ✅ New
- `src/main.tsx` — ✅ Modified
- `src/index.css` — ✅ Modified
- `src/App.css` — ✅ Modified
- `docs/ux/design-system.md` — ✅ Complete
- `docs/ux/screens/dashboard.md` — ✅ Round 1 spec
- `docs/ux/screens/dashboard-r2.md` — ✅ Round 2 spec

📝 Post-Task: skills updated — added ThemeContext, Tooltip, ConfirmDialog to architecture; added Theme + UI Components to features

---

### TASK-018: Production-Ready Backend — i18n, Validation, Error Handling, Form Refactor

**Priority:** 🔴 P0
**Effort:** XL (15+ files: 10 new, 10+ modified)
**Status:** ✅ ทำเสร็จแล้ว
**Completed:** 2026-07-26
**Depends on:** TASK-012 ✅ (i18n context already exists)

**User Story:**
> As a developer, I want a production-ready codebase with proper i18n (no if/else), runtime validation, centralized error handling, and type-safe form management — so the app scales without accumulating technical debt.

**Scope:**
1. Replace custom i18n with `i18next` + `react-i18next` (ICU, pluralization, namespace)
2. Add `zod` for runtime schema validation (localStorage data, form inputs)
3. Add `react-hook-form` + `@hookform/resolvers` for form state management
4. Add `react-error-boundary` for graceful error handling
5. Implement TASK-001 (Thai Tax Brackets) — replace dead US code
6. Centralize constants (storage keys, config)
7. Remove all `lang === 'th' ? '...' : '...'` inline conditions — use translation keys

---

### TASK-020: RemitForm UX — Clear Labels, Quick-fill, Enhanced Preview

**Priority:** 🟡 P1  
**Effort:** S (3 files)  
**Status:** ✅ ทำเสร็จแล้ว  
**Completed:** 2026-07-28  
**Source:** BA analysis — user entered per-share price ($29) instead of total proceeds ($203) in amountUSD field, causing taxable preview to show "$1.00 × fxRate = ฿35" instead of the correct "$7.00 × 35 = ฿245"

**What was done:**
- BA verified formula `amountUSD × gainPercent × fxRateTHB` is mathematically correct per Thai Revenue Code
- Quantity IS encoded in `gainPercent = gainUSD / sellRevenueUSD` — proof: `fullRemit → taxableTHB = quantity × perShareGain × fxRate`
- Root cause: UX clarity — amount field label was ambiguous

**UX Fixes Applied:**
| Fix | File | Change |
|-----|------|--------|
| Label | `i18n/locales/*/remittance.json` | "Amount (USD)" → "Total Amount to Remit (USD)" + hint text |
| Quick-fill | `RemitForm.tsx` | "Remit Remaining" button auto-fills `remainingProceedsUSD` |
| Preview | `RemitForm.tsx` | Breakdown: remit amount → gain portion → cost basis → taxable THB |

**Verification:**
- `npx tsc --noEmit` → 0 errors
- Manual: BUY 7@$28 + SELL 7@$29 → Record Remittance → Click quick-fill → $203 auto-filled → fxRate 35 → Preview shows ฿245.00

---

### TASK-021: Add Exchange Fee + TAF Fee Fields (ค่าธรรมเนียมตลาดหลักทรัพย์ + ค่าธรรมเนียม TAF)

**Priority:** 🟡 P1
**Effort:** M (12 source files + 2 doc files)
**Status:** ✅ ทำเสร็จแล้ว
**Completed:** 2026-07-28
**Spec:** `docs/specs/commission-fee-fields.md`

**User Story:**
> As a Thai investor recording a trade, I want to enter Exchange Fee (ค่าธรรมเนียมตลาดหลักทรัพย์) and TAF Fee (ค่าธรรมเนียมการขาย) separately from Commission Fee, so my cost basis and net proceeds match my broker statement exactly.

**What was done:**

| Change | File | Detail |
|---|---|---|
| Interface | `src/types/trade.ts` | Add `exchangeFeeUSD`, `tafFeeUSD` to `TradeTransaction` |
| Validation | `src/validation/schemas.ts` | Add both fields with `z.number().min(0).default(0)` |
| Migration | `src/store/tradeSlice.ts` | `migrateTrade()` sets defaults for old trades |
| Engine | `src/engine/fifoEngine.ts` | `calculateBuyCostUSD` / `calculateSellRevenueUSD` updated |
| Form | `src/components/TradeForm.tsx` | 2 inputs (BUY) / 3 inputs (SELL) with conditional TAF |
| Table | `src/components/TradeTable.tsx` | `colTotalFees` aggregate column + mobile card |
| CSS | `src/index.css` | `.form-row-fees` + responsive breakpoints |
| i18n EN | `src/i18n/locales/en/trade.json` | 3 new keys |
| i18n TH | `src/i18n/locales/th/trade.json` | 3 new keys |
| Tests | 3 test files | 15 new test cases (engine 5 + validation 6 + migration 4) |

**Decisions:**
- Table: 1 aggregate "Total Fees" column (not 3 separate columns)
- TAF Fee: SELL only (hidden on BUY form)
- TH naming: ค่าธรรมเนียมตลาดหลักทรัพย์ / ค่าธรรมเนียม TAF

**Verification:**
- `npx tsc --noEmit` → 0 errors
- `npm test` → 101 tests pass (all suites)
- Manual: Form shows 2 fee inputs on BUY, 3 on SELL
- Manual: Desktop table shows "Total Fees" column
- Manual: Mobile card shows "Total Fees" aggregate row

---

### TASK-022: Add Commission Rebate (เงินคืนค่าคอมมิชชั่น)

**Priority:** 🟡 P1
**Effort:** S (10 files)
**Status:** ✅ ทำเสร็จแล้ว
**Completed:** 2026-07-28
**Spec:** Design decisions from chat

**User Story:**
> As a Thai investor, I want to enter promotional commission rebates separately, so my net fees reflect broker promotions/discounts accurately.

**What was done:**

| Change | File | Detail |
|---|---|---|
| Interface | `src/types/trade.ts` | Add `commissionRebateUSD: number` |
| Validation | `src/validation/schemas.ts` | `z.number().min(0).default(0)` |
| Migration | `src/store/tradeSlice.ts` | `migrateTrade()` sets default 0 |
| Engine | `src/engine/fifoEngine.ts` | BUY: `cost - rebate`, SELL: `revenue + rebate` |
| Form | `src/components/TradeForm.tsx` | Rebate input in separate row + validate ≤ total fees |
| Table | `src/components/TradeTable.tsx` | Total Fees = `sum fees - rebate` (net) |
| i18n | EN/TH locale | `formRebate` key |

**Decisions:**
- Net fees approach: rebate affects gain calculation (reduces cost / increases revenue)
- Table: included in Total Fees (net), no separate rebate column
- Range: 0 ≤ rebate ≤ total fees (validated in form)

**Verification:**
- `npx tsc --noEmit` → 0 errors
- `npm test` → 109 tests pass (all suites)
- Manual: Form shows rebate row below fees
- Manual: Rebate > total fees → validation error

---

## 📊 Summary

| Priority | Count | Done | Pending | Tasks |
|---|---|---|---|---|
| 🔴 P0 | 5 | 5 | 0 | TASK-000 ✅, TASK-011 ✅, TASK-001 ✅, TASK-018 ✅, TASK-002 ✅ |
| 🟡 P1 | 8 | 8 | 0 | TASK-012 ✅, TASK-017 ✅, TASK-003 ✅, TASK-004 ✅, TASK-020 ✅, TASK-019 ✅, TASK-021 ✅, TASK-022 ✅ |
| 🟢 P2 | 3 | 0 | 3 | TASK-005 ⬜, TASK-006 ⬜, TASK-007 ⬜ |
| ⚪ P3 | 3 | 0 | 3 | TASK-008 ⬜, TASK-009 ⬜, TASK-010 ⬜ |
| **Total** | **19** | **13** | **6** | |
