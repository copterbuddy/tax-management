# 🧪 Test Cases — Thai Tax Tracker

> **Created by:** QA | **Last updated:** 2026-07-25  
> **Status tracking:** ⬜ ยังไม่ได้ทำ | 🟡 กำลังทดสอบ | ✅ PASS | ❌ FAIL

---

## 📊 Summary

| Task | Total | ✅ PASS | ❌ FAIL | ⬜ Pending | 🟡 Testing |
|---|---|---|---|---|---|
| TASK-000 (Provider) | 23 | 23 | 0 | 0 | 0 |
| TASK-017 (UX/UI) | 8 | 8 | 0 | 0 | 0 |
| **Total** | **31** | **31** | **0** | **0** | **0** |

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

---

## 🟡 TASK-012: Multi-Language Support EN/TH

**Reference Spec:** BA Spec — Multi-Language EN/TH  
**Task Status:** ⬜ ยังไม่ได้ทำ (QA test cases ready — waiting for Dev)  
**Test Status:** ⬜ ยังไม่ได้ทดสอบ

---

### 📦 Group 1: Language Provider & Context (`src/i18n/`)

---

#### TC-012-001: LanguageProvider wraps entire app

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** `main.tsx` — `<LanguageProvider>` ครอบ `<Provider store={store}><App /></Provider>`

---

#### TC-012-002: Default language = TH when localStorage empty

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** `localStorage.removeItem('lang')`  
**Expected:** ครั้งแรกที่โหลด → `lang === 'th'`

---

#### TC-012-003: Default language from localStorage

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** `localStorage.setItem('lang', 'en')`  
**Expected:** โหลดแอพ → `lang === 'en'`

---

#### TC-012-004: Fallback to TH for unknown lang value

**Covers:** EC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** `localStorage.setItem('lang', 'fr')`  
**Expected:** `lang === 'th'` (fallback)

---

#### TC-012-005: setLang() updates localStorage + context

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** เริ่มที่ `th` → เรียก `setLang('en')`  
**Expected:** `localStorage.getItem('lang') === 'en'`, UI re-render

---

#### TC-012-006: useLanguage() returns { t, lang, setLang }

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test / Static analysis

**Check:** hook returns 3 properties — `t` (function), `lang` (string), `setLang` (function)

---

#### TC-012-007: t() returns correct translation for both languages

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Scenario:**
- `t('buy')` with `lang='th'` → `'ซื้อ'`
- `t('buy')` with `lang='en'` → `'Buy'`
- `t('sell')` with `lang='th'` → `'ขาย'`

---

#### TC-012-008: All translation keys exist in both EN and TH

**Covers:** AC8, EC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis / TypeScript

**Check:** `TranslationDict` type — ทุก key ต้องมีทั้ง `en` และ `th`  
**Verify:** `npx tsc --noEmit` → 0 errors → แปลว่าไม่มี key ไหนหาย

---

### 📦 Group 2: Language Switcher UI

---

#### TC-012-009: Switcher appears at top-right header

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** Header มีปุ่มหรือ toggle สำหรับเปลี่ยนภาษา อยู่ขวาบน

---

#### TC-012-010: Switcher shows current language

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI

**Scenario:** เปิดแอพด้วยภาษา TH → switcher แสดง 🇹🇭 TH (active)  
**Expected:** EN แสดงเป็นตัวเลือกที่สลับได้

---

#### TC-012-011: Click switcher → language changes immediately

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI

**Scenario:** กด EN → UI เปลี่ยนเป็นภาษาอังกฤษทันที (ไม่ต้อง reload)  
**Expected:** KPI titles, table headers, form labels เปลี่ยนทั้งหมด

---

### 📦 Group 3: UI Label Translations

---

#### TC-012-012: Dashboard KPI titles translated

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification + Manual

**Expected TH:** "กำไรที่ต้องเสียภาษี", "ขาดทุนที่หักลบไม่ได้", "รายได้รวม", "ต้นทุนรวม"  
**Expected EN:** "Taxable Gain", "Excluded Losses", "Total Revenue", "Total Cost Basis"

---

#### TC-012-013: TradeTable headers translated

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Expected TH:** "วันที่", "สัญลักษณ์", "Provider", "ประเภท", "จำนวน", "ราคา", "ค่าธรรมเนียม", "FX", "รวม", "FIFO Gain", "คิดภาษี", "จัดการ"  
**Expected EN:** "Date", "Symbol", "Provider", "Type", "Qty", "Price", "Fee", "FX", "Total", "FIFO Gain", "Taxable", "Actions"

---

#### TC-012-014: TradeForm labels + buttons translated

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Expected TH:** "วันที่", "สัญลักษณ์", "ประเภทสินทรัพย์", "ประเภท", "Provider", "จำนวน", "ราคาต่อหน่วย", "ค่าธรรมเนียม", "อัตราแลกเปลี่ยน", "หมายเหตุ", "ยกเลิก", "เพิ่มรายการ", "แก้ไขรายการ"  
**Expected EN:** Same as current labels

---

#### TC-012-015: Buttons translated

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Expected TH:** "+ เพิ่มรายการ" (Add Trade), "ยกเลิก" (Cancel), "บันทึก" (Save)

---

### 📦 Group 4: Data Value Translations

---

#### TC-012-016: Trade type (BUY/SELL) translated

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI

**Expected TH:** BUY → "ซื้อ", SELL → "ขาย"  
**Expected EN:** BUY → "Buy", SELL → "Sell"

---

#### TC-012-017: Asset type translated

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI

**Expected TH:** FOREIGN_STOCK → "หุ้นต่างประเทศ", CRYPTO → "คริปโต"  
**Expected EN:** FOREIGN_STOCK → "Foreign Stock", CRYPTO → "Crypto"

---

#### TC-012-018: Taxable indicator translated

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Expected TH:** Tooltip "✅ นำไปคิดภาษีได้" / "❌ ขาดทุน — ไม่สามารถหักลบภาษีได้"  
**Expected EN:** "✅ Taxable" / "❌ Loss — not deductible"

---

### 📦 Group 5: Non-Translated (Stay EN)

---

#### TC-012-019: Validation errors stay in English

**Covers:** AC5 (ขอบเขต)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** Error messages ("Insufficient lots...", "Quantity must be positive") ยังเป็น EN ทั้ง TH และ EN mode

---

#### TC-012-020: Trade data (symbol, date, numbers) unchanged

**Covers:** AC5 (ขอบเขต)  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI

**Check:** Symbol (AAPL), วันที่ (2026-01-10), ตัวเลข (quantity, price) ไม่ถูกแปล

---

## 📋 Test Execution Log

| Date | Tester | TC Range | Result | Notes |
|---|---|---|---|---|
| — | — | — | — | รอ Dev ส่งมอบ |

---

## 📐 Traceability Matrix (TASK-012)

| AC | Test Cases |
|---|---|
| AC1 — LanguageProvider wraps app | TC-012-001 |
| AC2 — Default TH / localStorage | TC-012-002, TC-012-003, TC-012-004 |
| AC3 — Switcher top-right | TC-012-009, TC-012-010 |
| AC4 — Switch → update localStorage + re-render | TC-012-005, TC-012-011 |
| AC5 — UI labels translated | TC-012-012, TC-012-013, TC-012-014, TC-012-015 |
| AC6 — Data values translated | TC-012-016, TC-012-017, TC-012-018 |
| AC7 — useLanguage hook | TC-012-006, TC-012-007 |
| AC8 — Typed keys | TC-012-008 |
| EC1 — Unknown lang fallback | TC-012-004 |
| EC2 — Missing key → compile error | TC-012-008 |
| ขอบเขต — Errors stay EN | TC-012-019 |
| ขอบเขต — Data unchanged | TC-012-020 |

---

---

## 🔴 TASK-013: Remove CRYPTO + Simplify to Single Asset Type

**Reference Spec:** BA Spec — Remove CRYPTO  
**Task Status:** ⬜ ยังไม่ได้ทำ (QA test cases ready — waiting for Dev)  
**Test Status:** ⬜ ยังไม่ได้ทดสอบ

---

### 📦 Group 1: Type System Cleanup

#### TC-013-001: AssetType type removed

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `grep "AssetType" src/types/trade.ts` → 0 matches

---

#### TC-013-002: assetType field removed from TradeTransaction

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `TradeTransaction` interface ไม่มี `assetType` field

---

#### TC-013-003: assetType field removed from RealizedGainResult

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `RealizedGainResult` interface ไม่มี `assetType` field

---

#### TC-013-004: assetTypeBreakdown removed from TaxSummary

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `TaxSummary` interface ไม่มี `assetTypeBreakdown` field

---

### 📦 Group 2: Engine Cleanup

#### TC-013-005: computeAllRealizedGains works without assetType

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Sample trades without `assetType` field  
**Expected:** FIFO computation works correctly, `gains[]` ไม่มี `assetType` field

---

#### TC-013-006: computeTaxSummary returns simplified result

**Covers:** AC3, AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Check:** `TaxSummary` ไม่มี `assetTypeBreakdown`, มีแค่ aggregate fields

---

#### TC-013-007: No assetType reference anywhere in engine

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `grep -i "assettype\|asset_type\|FOREIGN_STOCK\|CRYPTO" src/engine/fifoEngine.ts` → 0 matches

---

### 📦 Group 3: Storage Migration

#### TC-013-008: CRYPTO trades filtered from loaded data

**Covers:** AC8  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** localStorage มี trades: 2 FOREIGN_STOCK + 1 CRYPTO  
**Expected:** `loadTrades()` return 2 trades, CRYPTO หายไป

---

#### TC-013-009: All-CRYPTO empty → clean empty state

**Covers:** EC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** localStorage มีแต่ CRYPTO trades  
**Expected:** `loadTrades()` return `[]` — empty state ปกติ

---

#### TC-013-010: No assetType in persisted trades after save

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** สร้าง BUY trade ใหม่ (ไม่มี assetType field) → dispatch addTrade  
**Expected:** localStorage data ไม่มี `assetType` field

---

### 📦 Group 4: UI Cleanup

#### TC-013-011: TradeForm — no Asset Type dropdown

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** `grep -i "asset.?type\|FOREIGN_STOCK\|CRYPTO" src/components/TradeForm.tsx` → 0 matches

---

#### TC-013-012: TradeTable — no asset badge

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** `grep -i "STK\|CRYPTO\|asset.?type\|badgeStock\|badgeCrypto" src/components/TradeTable.tsx` → 0 matches

---

#### TC-013-013: Dashboard — no Crypto KPI

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** `grep -i "crypto\|CRYPTO" src/components/Dashboard.tsx` → 0 matches

---

#### TC-013-014: Dashboard — "Stock Taxable Gain" renamed to "Taxable Gain"

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** KPI title = `t.taxableGain` (ไม่ใช่ `t.stockTaxableGain`)

---

### 📦 Group 5: Translation Cleanup

#### TC-013-015: Crypto translation keys removed

**Covers:** AC9  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `TranslationDict` ไม่มี keys: `assetCrypto`, `assetForeignStock`, `cryptoTaxableGain`, `stockTaxableGain`, `badgeStock`, `badgeCrypto`

---

#### TC-013-016: Translation file has no CRYPTO/FOREIGN_STOCK strings

**Covers:** AC9  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `grep -i "crypto\|foreign_stock\|คริปโต\|หุ้นต่างประเทศ" src/i18n/translations.ts` → 0 matches

---

### 📦 Group 6: Global Cleanup

#### TC-013-017: No CRYPTO or FOREIGN_STOCK left in entire src/

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `grep -r "CRYPTO\|FOREIGN_STOCK\|AssetType\|assetType" src/` → 0 matches

---

#### TC-013-018: tsc --noEmit passes

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Compile check

**Run:** `npx tsc --noEmit` → 0 errors

---

## 📐 Traceability Matrix (TASK-013)

| AC | Test Cases |
|---|---|
| AC1 — ลบ AssetType type | TC-013-001 |
| AC2 — ลบ assetType field | TC-013-002, 003, 010 |
| AC3 — ลบ assetTypeBreakdown | TC-013-004, 006 |
| AC4 — ลบจาก engine | TC-013-005, 006, 007 |
| AC5 — ลบ dropdown จาก form | TC-013-011 |
| AC6 — ลบ badge จาก table | TC-013-012 |
| AC7 — ลบ Crypto KPI, rename Stock | TC-013-013, 014 |
| AC8 — Filter out CRYPTO | TC-013-008, 009 |
| AC9 — ลบ translation keys | TC-013-015, 016 |
| AC10 — Clean codebase | TC-013-017, 018 |

---

---

## 🔴 TASK-015: Remittance-Based Tax (นำเงินเข้าไทย)

**Reference Spec:** BA Spec — Remittance-Based Tax  
**Task Status:** ⬜ ยังไม่ได้ทำ  
**Test Status:** ⬜ ยังไม่ได้ทดสอบ

---

### 📦 Group 1: Type System — USD-based

#### TC-015-001: TradeTransaction — no fxRateTHB, has USD fields only

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `TradeTransaction` ไม่มี `fxRateTHB`, มี `priceUSD`, `commissionUSD` — เท่านั้น ไม่มี THB calculation

---

#### TC-015-002: RemittanceRecord type exists

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `RemittanceRecord` มี: `id`, `sellTradeId`, `amountUSD`, `remitDate`, `fxRateTHB`

---

#### TC-015-003: RealizedGainResult — gain in USD

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `RealizedGainResult` มี `gainUSD`, `revenueUSD`, `costBasisUSD`, `gainPercent`

---

### 📦 Group 2: FIFO Engine — USD Computation

#### TC-015-004: FIFO calculates gains in USD

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** BUY AAPL 10 @ $150 + fee $1, SELL AAPL 10 @ $200 + fee $2  
**Expected:** gainUSD = (10×200 - 2) - (10×150 + 1) = 1998 - 1501 = 497

---

#### TC-015-005: Gain % calculated correctly

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** BUY cost = $1,000, SELL revenue = $1,500 → gain = $500  
**Expected:** gainPercent = 500/1500 = 33.33%

---

#### TC-015-006: Multiple BUY lots — FIFO weighted cost in USD

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** BUY 5 @ $100, BUY 5 @ $120, SELL 8 @ $150  
**Expected:** Cost = 5×100 + 3×120 = 860, Revenue = 8×150 - fee, Gain = revenue - 860

---

### 📦 Group 3: Remittance Tax Calculation

#### TC-015-007: Full remit — gain% × amount × remitFX

**Covers:** AC4, AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Sell proceeds = $2,000, gainPercent = 25%, remit $2,000 @ FX 36  
**Expected:** taxableGainTHB = 2000 × 0.25 × 36 = 18,000

---

#### TC-015-008: Partial remit — gain% applied to partial amount

**Covers:** AC4, AC8  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Sell proceeds = $2,000, gain% = 25%, remit $500 @ FX 35  
**Expected:** taxableGainTHB = 500 × 0.25 × 35 = 4,375

---

#### TC-015-009: Cost basis portion not taxable

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Remit $800 from $2,000 proceeds, gain% = 25%  
**Expected:** Taxable = $200, Non-taxable (cost return) = $600

---

#### TC-015-010: Multiple remittances — cumulative check

**Covers:** AC8, EC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Setup:** Remit $1,000 from $2,000 proceeds (เหลือ $1,000)  
**Input:** Remit อีก $1,500 → เกิน remaining  
**Expected:** Validation error — "Remaining proceeds: $1,000"

---

#### TC-015-011: Remit 0 or negative — blocked

**Covers:** EC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Expected:** Validation error

---

#### TC-015-012: Loss trade (gain < 0) — remit = return of capital only

**Covers:** EC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Loss trade (gain% negative), remit any amount  
**Expected:** taxableGainTHB = 0, all remit = cost return

---

### 📦 Group 4: Remittance Form UI

#### TC-015-013: RemitForm component exists

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis

**Check:** `src/components/RemitForm.tsx` มีอยู่

---

#### TC-015-014: RemitForm — select sell trade, amount, date, FX

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** Form มี: dropdown เลือก sell trade, input amount (USD), date picker, FX rate input

---

#### TC-015-015: RemitForm shows remaining proceeds per trade

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** ตอนเลือก sell trade → แสดง "Remaining: $X,XXX"

---

### 📦 Group 5: Dashboard & Table

#### TC-015-016: Dashboard — Taxable Gain shows remittance-based amount

**Covers:** AC9  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** KPI ใช้ `taxableGainTHB` จาก remittance calculation (ไม่ใช่จาก trade date FX)

---

#### TC-015-017: Dashboard — Tax Year = remittance year

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Trade ขายปี 2025, remit ปี 2026  
**Expected:** Tax year = 2026, gain ปรากฏใน summary ปี 2026

---

#### TC-015-018: TradeTable — shows gain in USD + remitted status

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification

**Check:** คอลัมน์: Gain (USD), Remitted (USD), Remaining (USD), Taxable (THB)

---

### 📦 Group 6: Migration

#### TC-015-019: Old trades with fxRateTHB — loaded, fxRate ignored

**Covers:** AC11  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test

**Input:** Old trade: `{ fxRateTHB: 35, ... }`  
**Expected:** Loaded successfully, fxRateTHB stripped, engine works in USD

---

#### TC-015-020: TypeScript compiles cleanly

**Covers:** AC12  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Compile check

**Run:** `npx tsc --noEmit` → 0 errors

---

## 📐 Traceability Matrix (TASK-015)

| AC | Test Cases |
|---|---|
| AC1 — USD FIFO | TC-015-003, 004, 006 |
| AC2 — No fxRateTHB | TC-015-001 |
| AC3 — RemitForm | TC-015-013, 014, 015 |
| AC4 — Gain % method | TC-015-005, 007, 008 |
| AC5 — THB conversion at remit | TC-015-007 |
| AC6 — Tax year = remit year | TC-015-017 |
| AC7 — Cost basis not taxable | TC-015-009 |
| AC8 — Partial remit | TC-015-008, 010 |
| AC9 — KPI remittance | TC-015-016 |
| AC10 — Table display | TC-015-018 |
| AC11 — Migration | TC-015-019 |
| AC12 — tsc clean | TC-015-020 |
| EC1-7 | TC-015-010, 011, 012 |

---

## 🔜 Next: TASK-001 Test Cases (Thai Tax Brackets)

Will be added when Dev completes TASK-001 implementation.

---

## 🟡 TASK-017: UX/UI Improvement — Design System + Round 1 & 2

**Reference Spec:** BA Spec — TASK-017 (dashboard.md, dashboard-r2.md, design-system.md)
**Task Status:** ✅ ทำเสร็จแล้ว (Dev)
**Test Status:** ✅ ทดสอบผ่านทั้งหมด (8/8)

---

### 📦 Group 1: Empty State CTA Buttons

---

#### TC-017-001: TradeTable empty state has CTA button

**Covers:** Round 2 spec — TradeTable empty state CTA
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** เมื่อไม่มี trades ในปีที่เลือก TradeTable empty state ต้องมีปุ่ม "Add First Trade"
**Expected Result:** `<button className="btn btn-primary" onClick={onAddNew}>` ใน empty state block
**Actual Result:** ✅ Found at `TradeTable.tsx:69` — `<button className="btn btn-primary" onClick={onAddNew}>` with EN/TH labels

---

#### TC-017-002: RemittanceLog empty state has CTA button

**Covers:** Round 2 spec — RemittanceLog empty state CTA
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** เมื่อไม่มี remittances ในปีที่เลือก RemittanceLog empty state ต้องมีปุ่ม "Record Remittance"
**Expected Result:** `<button className="btn btn-primary" onClick={onRecordRemit}>` ใน empty state block
**Actual Result:** ✅ Found at `RemittanceLog.tsx:69` — `<button className="btn btn-primary" onClick={onRecordRemit}>`

---

### 📦 Group 2: Design System Foundation

---

#### TC-017-003: CSS custom properties — Light mode tokens

**Covers:** Round 1 spec — Design System tokens
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** `:root` ต้องมี CSS custom properties ครบตาม design-system.md
**Expected Result:** Tokens: --color-primary, --color-success, --color-danger, --color-bg, --color-surface, --color-text-primary, --color-text-secondary, --color-text-tertiary, --color-border, --shadow-sm/md/lg
**Actual Result:** ✅ All tokens present in `index.css:8-51`

---

#### TC-017-004: CSS custom properties — Dark mode tokens

**Covers:** Round 1 spec — Dark mode
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** `[data-theme="dark"]` ต้อง override CSS properties
**Expected Result:** Dark mode block with inverse colors
**Actual Result:** ✅ Found at `index.css:54` — complete dark mode token overrides

---

#### TC-017-005: ThemeContext provides light/dark toggle

**Covers:** Round 1 spec — Theme switching
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** ThemeContext ต้องมี provider + useTheme hook + localStorage persistence
**Expected Result:** `ThemeProvider` wraps app in `main.tsx`, `useTheme()` returns `{theme, toggleTheme}`, localStorage key = `tax_tracker_theme`
**Actual Result:** ✅ `ThemeContext.tsx` — STORAGE_KEY, getInitialTheme(), toggleTheme(), data-theme attribute on `<html>`

---

### 📦 Group 3: UI Components

---

#### TC-017-006: Tooltip component exists with correct API

**Covers:** Round 2 spec — Tooltip component
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** Tooltip component ต้องรับ `content`, `children?`, `position?` props
**Expected Result:** Interface matches spec, เปิดด้วย click, ปิดด้วย ESC/click-outside
**Actual Result:** ✅ `Tooltip.tsx` — `interface TooltipProps { content: string; children?: ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }`, click toggle + ESC + click-outside handlers

---

#### TC-017-007: KpiCard supports tooltip + subValue2 + highlight variant

**Covers:** Round 2 spec — Enhanced KPI cards
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** KpiCard ต้องมี props: `tooltip?`, `subValue2?`, variant `highlight`
**Expected Result:** Props interface matches, renders Tooltip when tooltip prop provided, renders subValue2 line
**Actual Result:** ✅ `KpiCard.tsx` — all props present, renders `<Tooltip>` when tooltip prop exists, renders `kpi-sub-detail` for subValue2

---

#### TC-017-008: ConfirmDialog component exists

**Covers:** Round 2 spec
**Status:** ✅ PASS
**Type:** Static analysis

**Scenario:** ConfirmDialog ต้องรองรับ danger variant + ESC close
**Expected Result:** `ConfirmDialogProps { message, confirmLabel?, cancelLabel?, onConfirm, onCancel, danger? }`, ESC closes
**Actual Result:** ✅ `ConfirmDialog.tsx` — full interface match, ESC key handler, danger button variant

---

### 📊 Traceability Matrix — TASK-017

| Spec Reference | Test Cases |
|---|---|
| Round 1 — Design System | TC-017-003, TC-017-004 |
| Round 1 — Theme toggle | TC-017-005 |
| Round 2 — Empty state CTA | TC-017-001, TC-017-002 |
| Round 2 — Tooltip | TC-017-006 |
| Round 2 — KPI card enhanced | TC-017-007 |
| Round 2 — ConfirmDialog | TC-017-008 |

---

## 🔜 Next: TASK-001 Test Cases (Thai Tax Brackets)

Will be added when Dev completes TASK-001 implementation.
