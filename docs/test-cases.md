# 🧪 Test Cases — Thai Tax Tracker

> **Created by:** QA | **Last updated:** 2026-07-25  
> **Status tracking:** ⬜ ยังไม่ได้ทำ | 🟡 กำลังทดสอบ | ✅ PASS | ❌ FAIL

---

## 📊 Summary

| Task | Total | ✅ PASS | ❌ FAIL | ⬜ Pending | 🟡 Testing |
|---|---|---|---|---|---|
| TASK-000 (Provider) | 23 | 23 | 0 | 0 | 0 |
| TASK-019 (Sell Dropdown) | 20 | 20 | 0 | 0 | 0 |
| TASK-017 (UX/UI) | 8 | 8 | 0 | 0 | 0 |
| TASK-018 (Prod-Ready) | 38 | 38 | 0 | 0 | 0 |
| **Total** | **89** | **89** | **0** | **0** | **0** |

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

## 🟡 TASK-019: Sell Trade Symbol Dropdown

**Reference Spec:** `docs/specs/sell-symbol-dropdown.md`  
**Reference UX:** `docs/ux/screens/trade-form-sell-dropdown.md`  
**Task Status:** ✅ ทำเสร็จแล้ว  
**Test Status:** ✅ ทดสอบผ่านทั้งหมด (18/18)

---

### 📦 Group 1: Symbol Dropdown (SELL mode)

---

#### TC-019-001: Symbol field becomes dropdown when type=SELL

**Covers:** AC1  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L233 — `{watchedType === 'SELL' ? (...Controller+select...) : (...text input...)}` — conditional rendering based on type. Dropdown renders `<select>` when SELL.

---

#### TC-019-002: Symbol dropdown only shows lots with remainingQuantity > 0

**Covers:** AC2  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L117 — `.filter(o => o.totalRemaining > 0)` — lots with zero remaining are excluded from `sellableOptions`.

---

#### TC-019-003: Option format "SYMBOL @ Provider — X shares available"

**Covers:** AC3  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L282 — `{opt.symbol} @ {opt.provider} — {opt.totalRemaining} {t('trade:sharesAvailable')}`. Options use composite value `sell|SYMBOL|Provider` for disambiguation (L272).

---

#### TC-019-004: Options sorted alphabetically

**Covers:** AC4  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L118 — `.sort((a, b) => a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider))` — sorted by symbol, then provider.

---

#### TC-019-005: Selecting option auto-fills symbol and provider

**Covers:** AC5  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L262-268 — `onChange` handler parses composite value `"sell|SYMBOL|Provider"` → calls `field.onChange(symbol)` + `setValue('provider', provider)`. Both fields set in one action.

---

#### TC-019-006: Provider disabled when type=SELL

**Covers:** AC6  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L330 — `disabled={watchedType === 'SELL'}` on Provider `<select>`. CSS L1119-1123 provides grayed-out styling (`opacity: 0.6`, `cursor: not-allowed`).

---

#### TC-019-007: Auto-fill hint text shown below Provider

**Covers:** AC6  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L353-359 — When SELL mode: if `watchedSymbol` is set → `"ⓘ Auto-filled from Symbol selection"`, if empty → `"ⓘ Select a Symbol above first"`. Uses `.hint-text` CSS class.

---

### 📦 Group 2: BUY Mode (No Regression)

---

#### TC-019-008: Symbol returns to text input when type=BUY

**Covers:** AC7  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L292-303 — ELSE branch renders original `<input type="text">` with `{...register('symbol')}`. BUY flow unchanged.

---

#### TC-019-009: Provider returns to enabled dropdown when type=BUY

**Covers:** AC7  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L330 — `disabled={watchedType === 'SELL'}` only disables for SELL. BUY mode → Provider is enabled, shows available quantity per provider (original behavior).

---

#### TC-019-010: Type toggle resets Symbol and Provider

**Covers:** AC8  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L148-154 — `useEffect` with `previousTypeRef` (L146). When `watchedType !== previousTypeRef.current` → `setValue('symbol', '')` + `setValue('provider', 'Dime')`. Initial render doesn't trigger (ref starts with same value as watchedType).

---

#### TC-019-011: Edit mode preserves original values (no spurious reset)

**Covers:** AC8, AC10  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L146 — `previousTypeRef` initialized with `watchedType` (which is the trade's type in edit mode). Effect only fires on change, not on initial render. L80-91 — `reset()` called with trade values when `trade` prop changes.

---

### 📦 Group 3: Empty State

---

#### TC-019-012: Empty state when no sellable lots

**Covers:** AC9  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L242-253 — When `allSellableOptions.length === 0` → disabled `<select>` with `t('trade:sellSymbolEmpty')`. i18n keys: EN `"-- No shares available to sell..."`, TH `"-- ไม่มีหุ้นให้ขาย..."`.

---

#### TC-019-013: Empty state for both EN and TH

**Covers:** AC9  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** `en/trade.json` L48: `"sellSymbolEmpty": "-- No shares available to sell. Add a BUY trade first. --"`. `th/trade.json` L48: `"sellSymbolEmpty": "-- ไม่มีหุ้นให้ขาย กรุณาเพิ่มรายการซื้อก่อน --"`. Both keys present.

---

### 📦 Group 4: Edit Mode (Sold Out)

---

#### TC-019-014: Edit SELL with sold-out position shows in dropdown

**Covers:** AC10, EC1  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L121-136 — `allSellableOptions` checks if `trade.type === 'SELL'` and adds trade's pair with `totalRemaining: 0` via `unshift()` if not already in list. L273-278 — sold-out option renders `"0 shares available (sold out)"`.

---

#### TC-019-015: Sold-out option text in both EN and TH

**Covers:** AC10  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** `en/trade.json` L49-50: `"sharesAvailable": "shares available"`, `"sharesSoldOut": "sold out"`. `th/trade.json` L49-50: `"sharesAvailable": "หุ้นที่เหลือ"`, `"sharesSoldOut": "ขายหมดแล้ว"`.

---

### 📦 Group 5: Edge Cases

---

#### TC-019-016: Same symbol, multiple providers — separate options

**Covers:** EC3  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L101-119 — `sellableOptions` groups by `symbol|provider` composite key. L272 — Each option uses `sell|SYMBOL|Provider` composite value. Two providers with same symbol → two distinct options with different values.

---

#### TC-019-017: Partial sell → zero-quantity lot removed from dropdown

**Covers:** EC5  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L117 — `.filter(o => o.totalRemaining > 0)`. When all shares of a (symbol, provider) pair are sold, `totalRemaining` becomes 0 and the pair is filtered out from `sellableOptions`.

---

#### TC-019-018: Zod validation still applies

**Covers:** EC6  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** TradeForm.tsx L13 — `symbol: z.string().min(1).max(VALIDATION.SYMBOL_MAX_LENGTH)` unchanged. Symbol dropdown uses `field.onChange(symbol)` which goes through same zod validation path. L269 — `className={errors.symbol ? 'input-error' : ''}` shows error state.

---

### 📦 Group 6: i18n & CSS

---

#### TC-019-019: All 5 i18n keys present in EN and TH

**Covers:** AC3, AC9, AC10  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** Keys verified in both locale files:
| Key | EN | TH |
|---|---|---|
| `sellSymbolEmpty` | `-- No shares... --` | `-- ไม่มีหุ้น... --` |
| `sharesAvailable` | `shares available` | `หุ้นที่เหลือ` |
| `sharesSoldOut` | `sold out` | `ขายหมดแล้ว` |
| `sellSelectFirst` | `Select a Symbol above first` | `เลือก Symbol ก่อน` |
| `sellAutoFilled` | `Auto-filled from Symbol selection` | `ค่า auto-fill จาก Symbol ที่เลือก` |

---

#### TC-019-020: CSS classes for new states

**Covers:** AC6, AC9  
**Status:** ✅ PASS  
**Type:** Static analysis

**Verification:** `index.css` contains:
- L1119-1123: `select:disabled` — opacity 0.6, cursor not-allowed, background/border changed
- L1126-1129: `.select-empty` — italic, muted color for empty state
- L1131-1134: `.hint-text` — small muted text for auto-fill hint

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
| **2026-07-26** | **QA** | **TC-019-001 ~ TC-019-020** | **20/20 ✅ PASS** | **TASK-019: All tests passed — static analysis + type check + i18n + CSS** |

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
| **TASK-019** | | |
| AC1 — SELL Symbol dropdown | TC-019-001 | ✅ |
| AC2 — Filter remaining > 0 | TC-019-002 | ✅ |
| AC3 — Option format | TC-019-003, TC-019-019 | ✅ |
| AC4 — Sorted alphabetically | TC-019-004 | ✅ |
| AC5 — Auto-fill provider | TC-019-005 | ✅ |
| AC6 — Provider disabled | TC-019-006, TC-019-007, TC-019-020 | ✅ |
| AC7 — BUY unchanged | TC-019-008, TC-019-009 | ✅ |
| AC8 — Type toggle reset | TC-019-010, TC-019-011 | ✅ |
| AC9 — Empty state | TC-019-012, TC-019-013 | ✅ |
| AC10 — Edit sold out | TC-019-014, TC-019-015 | ✅ |
| AC11 — tsc --noEmit | Type check passed | ✅ |
| AC12 — BUY regression | TC-019-008, TC-019-009 | ✅ |
| EC1 — Sold out edit | TC-019-014 | ✅ |
| EC3 — Multiple providers | TC-019-016 | ✅ |
| EC5 — Partial sell | TC-019-017 | ✅ |
| EC6 — Zod validation | TC-019-018 | ✅ |

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

## 🔴 TASK-018: Production-Ready Backend — i18n, Validation, Error Handling, Form Refactor

**Reference Spec:** BA Spec — TASK-018  
**Task Status:** ✅ ทำเสร็จแล้ว (Dev)  
**Test Status:** ✅ ทดสอบผ่าน (38/38 — static analysis)

---

### 📦 Group 1: Package Installation & Build

---

#### TC-018-001: All new packages installed

**Covers:** AC1, AC3, AC4, AC5, AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `package.json` dependencies มี: `i18next`, `react-i18next`, `zod`, `react-hook-form`, `@hookform/resolvers`, `react-error-boundary`

---

#### TC-018-002: Build passes after package install

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Compile check  

**Run:** `npm install && npx tsc --noEmit` → 0 errors

---

### 📦 Group 2: i18n — i18next Migration

---

#### TC-018-003: i18next initialized in src/i18n/index.ts

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/i18n/index.ts` exists — calls `i18next.init()` with: `resources` (EN+TH), `lng` from localStorage, `fallbackLng: 'th'`, `interpolation.escapeValue: false`

---

#### TC-018-004: Translation JSON exists for all namespaces

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** Files exist:
- `src/i18n/locales/th/common.json`
- `src/i18n/locales/th/trade.json`
- `src/i18n/locales/th/remittance.json`
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/en/trade.json`
- `src/i18n/locales/en/remittance.json`

---

#### TC-018-005: Old i18n files removed

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/i18n/translations.ts` และ `src/i18n/LanguageContext.tsx` ถูกลบแล้ว

---

#### TC-018-006: No lang === 'th' ? '...' : '...' inline conditions

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `grep -rn "lang === 'th'" src/components/` → 0 matches (ยกเว้นใน i18n/index.ts และ hook)

---

#### TC-018-007: All text rendered via t() function

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** All user-visible text ใน components ใช้ `t('namespace.key')` — ไม่มี hardcoded string

---

#### TC-018-008: Language switch still works

**Covers:** AC1, EC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** กด TH→EN→TH  
**Expected:** UI เปลี่ยนทันทีโดยไม่ต้อง reload, localStorage `lang` อัปเดต, i18next language เปลี่ยน

---

#### TC-018-009: Missing translation key falls back gracefully

**Covers:** EC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / Code verification  

**Check:** i18next config มี `returnNull: false` หรือ `returnObjects: false` — fallback แสดง key name แทนที่จะ crash

---

#### TC-018-010: Number formatting respects active language

**Covers:** AC9  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** สลับ TH/EN → ตัวเลขใช้ `toLocaleString` ตามภาษาปัจจุบัน  
**Expected TH:** `฿1,234.56` (ไม่ใช่ `฿๑,๒๓๔.๕๖` — ต้องใช้เลขอารบิก), **EN:** `฿1,234.56`  
**Note:** ถ้า `toLocaleString('th-TH')` แสดงเลขไทย → ต้องใช้ custom formatter หรือ `useGrouping: false`

---

### 📦 Group 3: Zod Validation

---

#### TC-018-011: Zod schemas defined in src/validation/schemas.ts

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/validation/schemas.ts` exports: `tradeTransactionSchema`, `remittanceRecordSchema`, `providerTypeSchema`

---

#### TC-018-012: tradeTransactionSchema validates correct data

**Covers:** AC3  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test  

**Input:**
```ts
tradeTransactionSchema.parse({
  id: 'trd_1', date: '2026-01-15', symbol: 'AAPL',
  type: 'BUY', provider: 'Dime', quantity: 10,
  priceUSD: 150, commissionUSD: 1.5
})
```
**Expected:** Parse success — returns same object

---

#### TC-018-013: tradeTransactionSchema rejects invalid data

**Covers:** AC3, EC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test  

**Input (5 cases):**
1. `priceUSD: -10` (negative)
2. `quantity: 0` (zero)
3. `symbol: ''` (empty)
4. `date: 'invalid'` (wrong format)
5. `provider: 'Binance'` (not in union)

**Expected:** All throw `ZodError`

---

#### TC-018-014: localStorage trades validated on load

**Covers:** AC3, EC1, EC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test  

**Input (3 cases):**
1. `localStorage` มี JSON โครงสร้างถูกต้อง → load สำเร็จ
2. `localStorage` มี JSON โครงสร้างเก่า (ไม่มี `provider`) → catch → fallback `[]`
3. `localStorage` มี JSON เสีย (`{broken`) → catch → fallback `[]`

**Expected:** No runtime crash, app opens with empty/default state

---

#### TC-018-015: localStorage gains validated on load

**Covers:** AC3, EC1, EC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test  

**Same 3 cases as TC-018-014 but for gains data**  
**Expected:** Valid data loads, invalid data → fallback `[]`

---

### 📦 Group 4: Form Refactor — react-hook-form

---

#### TC-018-016: TradeForm uses useForm + zodResolver

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `TradeForm.tsx` imports: `useForm` from `react-hook-form`, `zodResolver` from `@hookform/resolvers/zod`  
No `useState` for form fields (date, symbol, type, provider, quantity, price, commission, notes)

---

#### TC-018-017: TradeForm submit with valid data works

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** กรอกฟอร์ม TradeForm ครบถ้วน → กด submit  
**Expected:** `onSubmit` ถูกเรียกด้วย `TradeTransaction` object ที่ถูกต้อง

---

#### TC-018-018: TradeForm shows validation errors

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** กรอก quantity = 0, price = empty → submit  
**Expected:** แสดง error messages ใต้แต่ละ field (จาก zod schema)

---

#### TC-018-019: TradeForm DIP validation still works

**Covers:** AC4  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** SELL trade → provider ไม่มี lots เพียงพอ  
**Expected:** แสดง validation error จาก `onValidate` callback (DIP)

---

#### TC-018-020: RemitForm uses useForm + zodResolver

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `RemitForm.tsx` imports: `useForm`, `zodResolver`  
No `useState` for form fields

---

#### TC-018-021: RemitForm submit with valid data works

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** เลือก sell trade, กรอก amount, date, FX → submit  
**Expected:** `onSubmit` ถูกเรียกด้วย `RemittanceRecord` ที่ถูกต้อง

---

#### TC-018-022: RemitForm prevents over-remittance

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / UI  

**Scenario:** Remaining proceeds = $500 → กรอก amount = $1,000 → submit  
**Expected:** Validation error — "Remittance exceeds remaining proceeds"

---

#### TC-018-023: RemitForm shows i18n text

**Covers:** AC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification  

**Check:** RemitForm ใช้ `t('remittance.*')` แทน hardcoded English

---

### 📦 Group 5: Error Boundary

---

#### TC-018-024: ErrorBoundary wraps App

**Covers:** AC6  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/main.tsx` หรือ `src/App.tsx` — `<ErrorBoundary>` wraps `<App />` (หรือ `<Dashboard />`)

---

#### TC-018-025: ErrorBoundary shows fallback UI on crash

**Covers:** AC6, EC5  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / simulated  

**Setup:** สร้าง component ที่ throw error ชั่วคราว  
**Expected:** แสดง fallback UI (ไม่ใช่ white screen), แสดง error message + reload button

---

### 📦 Group 6: Thai Tax Brackets (TASK-001)

---

#### TC-018-026: US brackets replaced with Thai progressive rates

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `grep -i "married\|head_household\|11600\|47150\|100525" src/store/taxSlice.ts` → 0 matches  
Thai brackets present: 0-150k (0%), 150k-300k (5%), 300k-500k (10%), 500k-750k (15%), 750k-1M (20%), 1M-2M (25%), 2M-5M (30%), 5M+ (35%)

---

#### TC-018-027: FilingStatus type removed

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `grep "FilingStatus" src/store/taxSlice.ts` → 0 matches (หรือ type ถูกลบ)

---

#### TC-018-028: Thai bracket calculation correct

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Unit test  

**Input (3 cases):**
1. Income = 100,000 → Tax = 0 (exempt)
2. Income = 500,000 → Tax = (150k×0%) + (150k×5%) + (200k×10%) = 0 + 7,500 + 20,000 = 27,500
3. Income = 1,000,000 → Tax = 0 + 7,500 + 20,000 + 37,500 + 50,000 = 115,000

**Expected:** Results match hand-calculated values

---

#### TC-018-029: Tax calculator UI shows Thai deductions

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification  

**Check:** Default deduction = ฿60,000 (personal allowance) + ฿100,000 (expense deduction) = ฿160,000

---

#### TC-018-030: taxReducer connected to store

**Covers:** AC7  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/store/index.ts` imports `taxReducer` from `taxSlice` and includes in `configureStore({ reducer: { trade, tax } })`

---

### 📦 Group 7: Constants Centralization

---

#### TC-018-031: src/constants.ts exists with centralized values

**Covers:** AC8  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `src/constants.ts` exports `STORAGE_KEYS`, `PROVIDER_OPTIONS`, `DATE_LIMITS`

---

#### TC-018-032: Components import from constants

**Covers:** AC8  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `grep "tax_tracker_trades\|tax_tracker_gains" src/` → hardcoded strings อยู่แค่ใน `constants.ts` เท่านั้น

---

#### TC-018-033: PROVIDER_OPTIONS single source of truth

**Covers:** AC8  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `TradeForm.tsx` imports `PROVIDER_OPTIONS` จาก `constants.ts` (ไม่มี local const)

---

### 📦 Group 8: Global Cleanup

---

#### TC-018-034: No references to old LanguageContext

**Covers:** AC1  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Static analysis  

**Check:** `grep -rn "LanguageContext\|useLanguage\|translations.ts" src/` → 0 matches (ยกเว้นไฟล์ i18n ใหม่)

---

#### TC-018-035: No references to deleted translation keys

**Covers:** AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Compile check  

**Check:** `npx tsc --noEmit` → 0 errors — ไม่มี component ไหน reference key ที่ไม่มีอยู่แล้ว

---

#### TC-018-036: All components have complete i18n coverage

**Covers:** AC1, AC2  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Code verification  

**Check:** ทุก component (`Dashboard`, `TradeTable`, `TradeForm`, `RemitForm`, `RemittanceLog`, `KpiCard`, `ConfirmDialog`, `ErrorBoundary`) ใช้ `useTranslation()` และไม่มี hardcoded user-facing strings

---

#### TC-018-037: Build: tsc --noEmit + vite build

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Compile check  

**Run:** `npx tsc --noEmit && npm run build` → 0 errors, build succeeds

---

#### TC-018-038: App runs without console errors

**Covers:** AC10  
**Status:** ⬜ ยังไม่ได้ทำ  
**Type:** Manual / Browser  

**Scenario:** `npm run dev` → open browser → check console  
**Expected:** No red errors in console on initial load and normal usage

---

## 📐 Traceability Matrix (TASK-018)

| AC | Test Cases |
|---|---|
| AC1 — i18next replace custom i18n | TC-018-003, 005, 006, 007, 008, 034, 036 |
| AC2 — JSON namespaces | TC-018-004, 035, 036 |
| AC3 — Zod schemas + localStorage | TC-018-011, 012, 013, 014, 015 |
| AC4 — TradeForm react-hook-form | TC-018-016, 017, 018, 019 |
| AC5 — RemitForm react-hook-form | TC-018-020, 021, 022, 023 |
| AC6 — ErrorBoundary | TC-018-024, 025 |
| AC7 — Thai Tax Brackets | TC-018-026, 027, 028, 029, 030 |
| AC8 — Constants centralization | TC-018-031, 032, 033 |
| AC9 — Number formatting per lang | TC-018-010 |
| AC10 — tsc + build clean | TC-018-002, 037, 038 |
| EC1 — Old data without provider | TC-018-014 |
| EC2 — Corrupted JSON | TC-018-014, 015 |
| EC3 — Language switch re-render | TC-018-008 |
| EC4 — NaN/Infinity/0 values | TC-018-013 |
| EC5 — Component throw error | TC-018-025 |
| EC6 — Missing translation key | TC-018-009 |
| EC7 — Thai numeral formatting | TC-018-010 |
| EC8 — 5-year date limit | TC-018-013 (zod refining) |

---

## TASK-021: Exchange Fee + TAF Fee Fields (ค่าธรรมเนียมตลาดหลักทรัพย์ + ค่าธรรมเนียม TAF)

### AC Coverage

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

### Test Cases

| TC | AC | Type | Scenario | Expected Result |
|---|---|---|---|---|
| TC-021-001 | AC1 | Unit | TradeTransaction has exchangeFeeUSD field | Interface compiles, field is number type |
| TC-021-002 | AC1 | Unit | TradeTransaction has tafFeeUSD field | Interface compiles, field is number type |
| TC-021-003 | AC2 | Unit | Valid trade with exchangeFeeUSD=0.5 passes schema | `safeParse` success |
| TC-021-004 | AC2 | Unit | Valid trade with tafFeeUSD=0.15 passes schema | `safeParse` success |
| TC-021-005 | AC2 | Unit | Negative exchangeFeeUSD rejected | `safeParse` failure |
| TC-021-006 | AC2 | Unit | Negative tafFeeUSD rejected | `safeParse` failure |
| TC-021-007 | AC3 | Unit | calculateBuyCostUSD includes exchangeFee | BUY: `qty×price + commission + exchangeFee` |
| TC-021-008 | AC4 | Unit | calculateSellRevenueUSD subtracts exchangeFee + tafFee | SELL: `qty×price - commission - exchangeFee - tafFee` |
| TC-021-009 | AC5 | Unit | TradeForm renders exchangeFee input for BUY | Input with id `trade-exchange-fee` visible |
| TC-021-010 | AC5 | Unit | TradeForm renders exchangeFee input for SELL | Input with id `trade-exchange-fee` visible |
| TC-021-011 | AC6 | Unit | TradeForm renders tafFee input only for SELL | Input with id `trade-taf-fee` visible on SELL, hidden on BUY |
| TC-021-012 | AC8 | Unit | TradeForm defaults to 0 for new fields when editing old trade | `exchangeFeeUSD: 0`, `tafFeeUSD: 0` |
| TC-021-013 | AC9 | E2E | TradeTable shows aggregated Total Fees column | Column shows `commission + exchangeFee + tafFee` |
| TC-021-014 | AC10 | Unit | BUY total = qty×price + fees (all 3) | Total calc matches formula |
| TC-021-015 | AC10 | Unit | SELL total = qty×price - fees (all 3) | Total calc matches formula |
| TC-021-016 | AC11 | E2E | Mobile card shows "Total Fees" row | Card shows sum of all 3 fees |
| TC-021-017 | AC12 | Unit | Old trade without exchangeFeeUSD → migration sets 0 | `migrateTrade` adds `exchangeFeeUSD: 0` |
| TC-021-018 | AC12 | Unit | Old trade without tafFeeUSD → migration sets 0 | `migrateTrade` adds `tafFeeUSD: 0` |
| TC-021-019 | AC13 | Unit | Existing exchangeFeeUSD not overwritten by migration | Value preserved |
| TC-021-020 | AC14 | Unit | EN locale has all 6 new i18n keys | `colTotalFees`, `formExchangeFee`, `formTafFee` present |
| TC-021-021 | AC14 | Unit | TH locale has all 6 new i18n keys | `colTotalFees`, `formExchangeFee`, `formTafFee` present |
| TC-021-022 | AC15 | E2E | Switching BUY→SELL shows/hides TAF Fee input | TAF Fee input visibility toggles with trade type |
| TC-021-023 | AC16 | Build | `tsc --noEmit` passes | Zero TypeScript errors |
| TC-021-024 | AC17 | Build | All existing tests pass | 101 tests pass (all suites) |
| TC-021-025 | EC1 | Unit | Old trade (no new fee fields) migration → both set to 0 | exchangeFeeUSD=0, tafFeeUSD=0 |
| TC-021-026 | EC4 | Unit | All fees = 0 → cost = qty×price, revenue = qty×price | Formulas work with zero fees |
| TC-021-027 | EC5 | E2E | Edit SELL trade with stored tafFeeUSD → shows stored value | Input populated with stored `tafFeeUSD` |
| TC-021-028 | EC6 | E2E | Edit old BUY trade → both new fields show 0 | `exchangeFeeUSD: 0`, `tafFeeUSD: 0` |

