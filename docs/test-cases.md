# 🧪 Test Cases — Thai Tax Tracker

> **Created by:** QA | **Last updated:** 2026-07-25  
> **Status tracking:** ⬜ ยังไม่ได้ทำ | 🟡 กำลังทดสอบ | ✅ PASS | ❌ FAIL

---

## 📊 Summary

| Task | Total | ✅ PASS | ❌ FAIL | ⬜ Pending | 🟡 Testing |
|---|---|---|---|---|---|
| TASK-000 (Provider) | 23 | 23 | 0 | 0 | 0 |
| **Total** | **23** | **23** | **0** | **0** | **0** |

---

## 🔴 TASK-000: Provider (Broker) Field + Provider-Aware FIFO

**Reference Spec:** BA Spec — เพิ่ม Provider Feature  
**Task Status:** ✅ ทำเสร็จแล้ว (Dev)  
**Test Status:** ✅ ทดสอบผ่านทั้งหมด (23/23)

---

### 📦 Group 1: Type System (`src/types/trade.ts`)

---

#### TC-001: ProviderType union has correct values

**Covers:** AC1 (Provider dropdown options)  
**Status:** ✅ PASS  
**Type:** Static analysis

**Result:** `ProviderType = 'Dime' | 'Liberator' | 'FinansiaSyrus'` ที่บรรทัด 3, `provider: ProviderType` ใน TradeTransaction (L11), FifoLot (L23), `buyProvider: ProviderType` ใน FifoMatchDetail (L33), `provider: ProviderType` ใน RealizedGainResult (L44)

---

#### TC-002: TradeTransaction type check — required provider

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Compile-time

**Result:** `npx tsc --noEmit` → 0 errors — type system บังคับ provider field ถูกต้อง

---

### 📦 Group 2: TradeForm Component (`src/components/TradeForm.tsx`)

---

#### TC-003: New trade form — Provider defaults to 'Dime'

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `useState<ProviderType>('Dime')` ที่บรรทัด 24 — default เป็น 'Dime' ถูกต้อง

---

#### TC-004: Provider dropdown shows all 3 options

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `PROVIDER_OPTIONS = ['Dime', 'Liberator', 'FinansiaSyrus']` ที่บรรทัด 5 — OCP: เพิ่ม provider โดยแก้ array นี้เท่านั้น

---

#### TC-005: Select different provider — value updates

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `<select value={provider} onChange={e => setProvider(e.target.value as ProviderType)}>` ที่บรรทัด 178-180 — state อัปเดตตามที่เลือก, submit ส่ง `provider` ใน tradeData (L95)

---

#### TC-006: Edit existing trade — shows correct provider

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `setProvider(trade.provider)` ใน useEffect (L39) — ดึงค่า provider จาก trade เดิมมาแสดง

---

#### TC-007: SELL validation — insufficient lots for same provider

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Code + Unit test

**Result:** `handleValidate` callback (Dashboard L60-70) → `validateSellLots()` → valid: false → form แสดง error (TradeForm L104-107). Unit test TC-005 ยืนยัน validateSellLots ทำงานถูกต้องสำหรับ insufficient lots.

---

#### TC-008: SELL validation — no lots at all for provider

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Code + Unit test

**Result:** `handleValidate` filters lots by `symbol + provider` → ถ้าไม่มี lot เลย → `validateSellLots` returns `{ valid: false, availableQuantity: 0 }`. Unit test TC-006 ยืนยันการทำงาน.

---

#### TC-009: SELL validation — sufficient lots passes

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Code + Unit test

**Result:** `handleValidate` → `validateSellLots` → `{ valid: true }` → form submit ดำเนินการต่อ. Unit test TC-004 ยืนยัน.

---

#### TC-010: Edit BUY → SELL triggers re-validation

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `useEffect` รีเซ็ต `validationError` ทุกครั้งที่ `trade` prop เปลี่ยน (L56) → validation ถูกรันใหม่ทุกครั้งที่ submit ผ่าน `onValidate`

---

### 📦 Group 3: TradeTable Component (`src/components/TradeTable.tsx`)

---

#### TC-011: Trade table has Provider column header

**Covers:** AC2  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `<th>Provider</th>` ที่บรรทัด 75 — อยู่ระหว่าง Symbol และ Type

---

#### TC-012: Trade row shows correct provider value

**Covers:** AC2  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `<td>{trade.provider}</td>` ที่บรรทัด 103 — แสดงค่า provider จาก trade data โดยตรง

---

### 📦 Group 4: FIFO Engine (`src/engine/fifoEngine.ts`)

---

#### TC-013: FIFO matches only same symbol + same provider

**Covers:** AC3  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ Engine unit test — SELL Dime AAPL 5 → จับคู่กับ BUY Dime AAPL 10 เท่านั้น. BUY Liberator AAPL 10 ไม่ถูกแตะต้อง (remaining = 10). Gain คำนวณถูกต้อง.

---

#### TC-014: Cross-provider SELL throws error (engine level)

**Covers:** AC3, AC4  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ Engine unit test — BUY Dime AAPL + SELL Liberator AAPL → throws Error: "Insufficient lots for AAPL via Liberator..."

---

#### TC-015: Multi-provider FIFO — separate pools

**Covers:** AC3  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ Engine unit test — SELL Dime AAPL 15 จับคู่กับ BUY Dime 2 lots (10 + 5), FIFO เรียงตามวันที่, `buyProvider` = 'Dime' ทั้งสอง matched lot

---

#### TC-016: validateSellLots — sufficient lots

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ `{ valid: true, availableQuantity: 10, requestedQuantity: 5 }`

---

#### TC-017: validateSellLots — insufficient lots

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ `{ valid: false, availableQuantity: 10, requestedQuantity: 15, message: "Insufficient lots..." }`

---

#### TC-018: validateSellLots — no lots at all

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ `{ valid: false, availableQuantity: 0, requestedQuantity: 5 }`

---

### 📦 Group 4b: Complex Integration Tests

---

#### TC-019: Complex multi-symbol multi-provider scenario

**Covers:** AC3  
**Status:** ✅ PASS  
**Type:** Unit test

**Scenario:** 7 trades: BUY Dime AAPL 10, BUY Liberator AAPL 20, BUY Dime GOOGL 5, SELL Dime AAPL 8, SELL Liberator AAPL 5, BUY Dime AAPL 3, SELL Dime AAPL 4

**Result:** ✅
- SELL1: AAPL Dime 8 → จับคู่ b1 ทั้งหมด 8 (1 lot)
- SELL2: AAPL Liberator 5 → จับคู่ b2 ทั้งหมด 5 (1 lot)
- SELL3: AAPL Dime 4 → จับคู่ b1 เหลือ 2 + b4 ใหม่ 2 (2 lots)
- Remaining: 3 lots (GOOGL Dime 5, AAPL Dime b4 เหลือ 1, AAPL Liberator b2 เหลือ 15)

---

#### TC-020: Provider type validation — only 3 valid values

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Unit test

**Result:** ✅ `ProviderType` มี 3 ค่า: 'Dime', 'Liberator', 'FinansiaSyrus'

---

### 📦 Group 5: Data Migration (`src/store/tradeSlice.ts`)

---

#### TC-021: Old trade without provider — migrates to 'Dime'

**Covers:** AC5  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `migrateTrade()` (tradeSlice L26-33) — เช็ค `if (!trade.provider)` → `{ ...trade, provider: 'Dime' }`. `loadTrades()` เรียก `raw.map(migrateTrade)` ทุกครั้งที่โหลด.

---

#### TC-022: Trade with existing provider — unchanged

**Covers:** AC5  
**Status:** ✅ PASS  
**Type:** Code verification

**Result:** `migrateTrade()` — ถ้ามี provider อยู่แล้ว → return trade เดิม (ไม่เปลี่ยนค่า)

---

### 📦 Group 6: Removed Features

---

#### TC-023: Export/Import button removed

**Covers:** AC6  
**Status:** ✅ PASS  
**Type:** Static check

**Result:** Grep Dashboard.tsx → ไม่พบ `ExportImportDrawer`, `showDrawer`, `importTrades`. Header right section เหลือแต่ comment `{/* Export/Import removed per BA spec */}`

---

#### TC-024: ExportImportDrawer.tsx deleted

**Covers:** AC6  
**Status:** ✅ PASS  
**Type:** Static check

**Result:** File not found — `ls: cannot access 'ExportImportDrawer.tsx': No such file or directory`

---

#### TC-025: Generate/parse functions removed from engine

**Covers:** AC6  
**Status:** ✅ PASS  
**Type:** Static check

**Result:** Grep `generateMarkdownTable|generateCSV|parseCSV` ใน fifoEngine.ts → 0 matches. Functions ถูกลบออกหมดแล้ว.

---

## 📋 Test Execution Log

| Date | Tester | TC Range | Result | Notes |
|---|---|---|---|---|
| 2026-07-25 | QA | TC-001 ~ TC-002 | 2/2 PASS | Static analysis + type check |
| 2026-07-25 | QA | TC-003 ~ TC-012 | 10/10 PASS | Code verification — UI logic |
| 2026-07-25 | QA | TC-013 ~ TC-020 | 8/8 PASS | Unit tests — engine functions |
| 2026-07-25 | QA | TC-021 ~ TC-022 | 2/2 PASS | Code verification — migration |
| 2026-07-25 | QA | TC-023 ~ TC-025 | 3/3 PASS | Static check — removed features |
| **2026-07-25** | **QA** | **TC-001 ~ TC-025** | **25/25 ✅ PASS** | **TASK-000: All tests passed** |

---

## 📐 Traceability Matrix

| AC | Test Cases | Status |
|---|---|---|
| AC1 — Provider dropdown | TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-020 | ✅ 7/7 |
| AC2 — Provider column | TC-011, TC-012 | ✅ 2/2 |
| AC3 — FIFO per provider | TC-013, TC-014, TC-015, TC-019 | ✅ 4/4 |
| AC4 — SELL validation | TC-007, TC-008, TC-009, TC-010, TC-016, TC-017, TC-018 | ✅ 7/7 |
| AC5 — Migration | TC-021, TC-022 | ✅ 2/2 |
| AC6 — Remove Export/Import | TC-023, TC-024, TC-025 | ✅ 3/3 |

---

## 🔜 Next: TASK-001 Test Cases (Thai Tax Brackets)

Will be added when Dev completes TASK-001 implementation.
