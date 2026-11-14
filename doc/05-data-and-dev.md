# ข้อมูล การเก็บข้อมูล และการพัฒนา

เอกสารนี้รวมเรื่อง "ภายใน" ที่นักพัฒนาต้องรู้: ข้อมูลถูกเก็บที่ไหน, ตรวจอย่างไร,
ย้ายข้อมูลเก่าอย่างไร, รันอะไรได้บ้าง และข้อบกพร่องที่รู้อยู่

---

## 1. การเก็บข้อมูล (localStorage)

แอปไม่มี backend — ทุกอย่างอยู่ใน `localStorage` ของเบราว์เซอร์ (single-user, single-browser)

| Key | ตัวแปรใน `constants.ts` | เก็บอะไร |
|---|---|---|
| `tax_tracker_trades` | `STORAGE_KEYS.TRADES` | `TradeTransaction[]` (BUY/SELL ทั้งหมด) |
| `tax_tracker_gains` | `STORAGE_KEYS.GAINS` | `RealizedGainResult[]` (มี remittance ฝังอยู่ข้างใน) |
| `tax_tracker_dividends` | `STORAGE_KEYS_DIVIDEND.DIVIDENDS` | `DividendRecord[]` (มี remittance ฝังอยู่) |
| `tax_tracker_theme` | `STORAGE_KEYS.THEME` | `'dark'` \| `'light'` |
| `lang` | `STORAGE_KEYS.LANGUAGE` | `'th'` \| `'en'` |

```text
+----------------------------+        +----------------------------+
|   localStorage             |        |   Redux store              |
+----------------------------+        +----------------------------+
| tax_tracker_trades     --> | -----> | trade.trades               |
| tax_tracker_gains      --> | -----> | trade.gains (remittances)  |
| tax_tracker_dividends  --> | -----> | dividend.records           |
+----------------------------+        +----------------------------+
             ^                                     |
             |            ทุก action ที่แก้ข้อมูล     |
             +-------------------------------------+
                        saveTrades / saveGains / saveDividends
```

**ทิศทางเดียว:** อ่านจาก `localStorage` ตอน module load เท่านั้น หลังจากนั้น Redux
เป็นแหล่งความจริง และเขียนกลับทุกครั้งที่ข้อมูลเปลี่ยน

---

## 2. การตรวจสอบข้อมูลด้วย zod

ทุกครั้งที่อ่านจาก `localStorage` จะผ่าน `safeParse` เสมอ:

```ts
const validated = safeParse(tradeArraySchema, parsed, [] as TradeTransaction[]);
```

- ถ้าข้อมูลไม่ผ่าน → **คืนค่า default (`[]`)** ไม่ throw → แอปไม่พังเพราะข้อมูลเสีย
- ผลข้างเคียง: ข้อมูลที่ผิดรูปจะหายเงียบ ๆ (ไม่มีแจ้งเตือนผู้ใช้)

### 2.1 ขอบเขตที่ schema บังคับ

จาก `VALIDATION` / `DATE_LIMITS` ใน `src/constants.ts`

| ค่า | ขอบเขต | คงที่ |
|---|---|---|
| ความยาว symbol | 1–10 ตัว | `SYMBOL_MAX_LENGTH` |
| จำนวนหุ้น | > 0, ≤ 1,000,000 | `QUANTITY_MAX` |
| ราคาต่อหน่วย | 0.0001 – 1,000,000 | `PRICE_MIN` / `PRICE_MAX` |
| อัตราแลกเปลี่ยน | 20 – 50 บาท/USD | `FX_RATE_MIN` / `FX_RATE_MAX` |
| ปีที่ earliest ที่กรอกได้ | 2000 | `EARLIEST_YEAR` |
| วันที่ย้อนหลัง | ≤ 5 ปี | `DATE_LIMITS.MAX_PAST_YEARS` |
| วันที่ในอนาคต | ห้าม | – |

---

## 3. การย้ายข้อมูลเก่า (migrations)

ทำที่ชั้น load ทุกครั้งที่เปิดแอป — เป็น idempotent

### 3.1 `migrateTrade`

| สภาพข้อมูลเก่า | สิ่งที่ทำ |
|---|---|
| ไม่มี `provider` | เติม `'Dime'` |
| มี `assetType` | ลบทิ้ง |
| มี `fxRateTHB` | ลบทิ้ง (เดิมเก็บ FX ที่ระดับ trade ซึ่งผิดหลักการ) |
| ไม่มี `exchangeFeeUSD` | เติม 0 |
| ไม่มี `tafFeeUSD` | เติม 0 |
| ไม่มี `commissionRebateUSD` | เติม 0 |
| ไม่มี `vatUSD` | เติม 0 |

### 3.2 `filterCrypto`

ทิ้ง trade ที่ `assetType === 'CRYPTO'` — แอปนี้รองรับเฉพาะหุ้น/ETF ต่างประเทศ

### 3.3 `repairRemittanceData` (เงินปันผล)

ไล่ทุกระยะ: ถ้า `reportableIncomeTHB !== remitTHB` → เซ็ตให้เท่ากัน
เพราะโดยนิยามต้องเท่ากันเสมอ (ดู [04](./04-dividends.md#1-ทำไมเงินปันผลต้องมี-fx-สองตัว))
เป็น action ที่เรียกจาก UI (Data tab) ไม่ได้เรียกอัตโนมัติ

---

## 4. การรันโปรเจกต์

```powershell
npm install
npm run dev        # Vite dev server
npm test           # Jest (jsdom + ts-jest)
npm run lint       # oxlint
```

### 4.1 สถานะของแต่ละคำสั่ง (ตรวจแล้ว)

| คำสั่ง | สถานะ | หมายเหตุ |
|---|---|---|
| `npm run dev` | ✅ ใช้ได้ | Vite 8 |
| `npm test` | ✅ **13 suites / 213 tests ผ่านหมด** (~55 วินาที) | |
| `npm run lint` | ✅ ใช้ได้ | oxlint |
| `npm run build` | ❌ **แดง** | `tsconfig.app.json` type-check ไฟล์ `*.spec.ts` แต่ไม่มี jest types → error ที่ `describe`/`it`/`expect` |

> `tsc --noEmit` ที่ root ไม่มีประโยชน์ เพราะ root `tsconfig.json` เป็น `files: []` (project references only)
> การตรวจ type จริงเกิดตอน `build` ซึ่งแดงอยู่แล้ว — อย่าใช้ `build` เป็นตัววัดผลงาน
> ให้ใช้ `npm test` + `npm run lint`

### 4.2 ไฟล์ทดสอบที่มี

```text
src/engine/fifoEngine.spec.ts              ← FIFO + remittance
src/engine/dividendEngine.spec.ts          ← เงินปันผล + WHT credit
src/store/tradeSlice.spec.ts
src/store/dividendSlice.spec.ts
src/store/taxSlice.spec.ts                 ← ทดสอบ code ที่ไม่ได้ถูกใช้จริง
src/store/repairRemittanceData.spec.ts
src/validation/schemas.spec.ts
src/components/Dashboard.spec.tsx
src/components/TradesTab.spec.tsx
src/components/DividendTab.spec.tsx
src/components/DividendForm.spec.tsx
src/components/DividendRemitForm.spec.tsx
src/components/KpiCard.spec.tsx
```

`jest.config.ts`: jsdom, `ts-jest`, alias `@/` → `src/`, coverage จำกัดที่ `engine` / `store` / `validation`

---

## 5. ข้อควรระวังและปัญหาที่รู้อยู่

### 🐞 5.1 `computeTaxSummary` throw เมื่อขายคนละปีกับที่ซื้อ — **ยืนยันด้วยการรันจริง**

```text
BUY  AAPL 10 @ $100  2024-03-01
SELL AAPL 10 @ $150  2025-06-01

computeTaxSummary(trades, 2025) → Error:
  "Insufficient lots for AAPL via Dime. Available: 0, Requested: 10"
```

สาเหตุ: ฟังก์ชันกรอง trade เหลือเฉพาะปีภาษีก่อน แล้วเรียก `computeAllRealizedGains` ใหม่

**ความรุนแรงสูง**: `tradeSlice` เรียก `recomputeSummaries` ใน `buildInitialState()` ตอน
module load → throw ก่อน React mount → `AppErrorBoundary` จับไม่ได้ → **จอขาว**

### 🐞 5.2 ภาษีเป็น 0 เมื่อโอนคนละปีกับที่ขาย — **ยืนยันด้วยการรันจริง**

```text
ซื้อ/ขายปี 2025, โอน 2026-01-15 @ 35.00
applyRemittance(...)              → taxableGainTHB = 35,000.00   ✅
computeTaxSummary(trades, 2026)   → taxableGainTHB = 0.00        ❌
computeTaxSummary(trades, 2025)   → taxableGainTHB = 0.00        ❌
```

สาเหตุ: `yearGains` / `yearRemittances` ถูกกรองจาก `mergedGains` ที่อิง `yearTrades`
(วันที่ของ trade) เท่านั้น

**ผลกระทบ**: แอปรายงานภาษีถูกเฉพาะเมื่อ ซื้อ + ขาย + โอน อยู่ในปีเดียวกัน

**ทำไมไม่มี test จับได้:** `fifoEngine.spec.ts` import `computeTaxSummary` แต่ **ไม่เคยเรียกใช้**

### 🐞 5.3 ชื่อ field หลอก: `excludedLossesTHB`

`computeTaxableGainsTHB` ใส่ `Math.abs(gainUSD)` ลงตัวแปรชื่อ `excludedLossesTHB`
และ `computeTaxSummary` ก็ส่งค่านี้เข้า `excludedLossesUSD` — ค่าจริงเป็น **USD**

### 🐞 5.4 `taxSlice` เป็น dead code

มี reducer ครบ (8 ขั้นบันไดภาษี, `deductions` default 160,000) แต่ **ไม่มี component ไหน
เชื่อมต่อเลย** — และ `DEFAULT_DEDUCTION` ไม่ได้ถูกเรียกใช้จริง
ยังมี `taxSlice.spec.ts` (6.5 KB) ที่ผ่าน test ทำให้ดูเหมือนใช้งานได้

### 🐞 5.5 ข้อความ error ใน engine ไม่ผ่าน i18n

`validateRemittance` ใน `dividendEngine.ts` คืนข้อความไทย hardcode
(`'จำนวนเงินต้องมากกว่า 0'`) ในขณะที่ UI อื่นทั้งหมดใช้ `react-i18next`

### 🐞 5.6 เอกสารประกอบเก่าไม่ตรงกับ code

| ไฟล์ | ข้อมูลที่ล้าสมัย |
|---|---|
| `openspec/config.yaml` | อ้าง key `tax_tracker_remittances` / `tax_tracker_calculations` และ remittance slice แยก — **ไม่มีอยู่จริง** |
| `README.md` | อ้าง `docs/`, `src/pages/`, และ "Remit Tab" — **ไม่มีอยู่จริง** |

### 🐞 5.7 ประสิทธิภาพ: คำนวณซ้ำเกินจำเป็น

ทุก action ใน `tradeSlice` เรียก `computeAllRealizedGains(state.trades)` **สองครั้ง**
(ครั้งหนึ่งใน `recomputeGains`, อีกครั้งเพื่อเอา `remainingLots`) — ข้อมูลหลักพันรายการ
ยังไม่รู้สึก แต่เป็นจุดที่ optimize ได้ง่าย

### ℹ️ 5.8 สภาพแวดล้อม

- **OpenSpec CLI ไม่ได้ติดตั้ง** บนเครื่องนี้ (`openspec` ไม่รู้จัก) — อ่าน `openspec/` ด้วยตัวเอง
- **`graphify-out/` ไม่มี** — ยังไม่ได้รัน graphify
- Node บนเครื่อง: v24.14.0 (รันไฟล์ `.ts` ตรง ๆ ได้ผ่าน native type stripping
  แต่ใช้ได้เฉพาะไฟล์ที่ import แบบมี path ชัดเจน)

---

## 6. แนวทางแก้ที่แนะนำ (ยังไม่แก้ — เอกสารนี้ไม่แตะ code)

| ปัญหา | แนวทาง |
|---|---|
| 5.1 + 5.2 | ให้ `computeTaxSummary` **ไม่กรอง trade ตามปี** ก่อนคำนวณ FIFO แต่คำนวณจาก `trades` ทั้งหมด แล้วค่อยกรอง "*ผลลัพธ์*" ตามปีของ `remitDate` |
| 5.1 (อาการจอขาว) | ย้าย `buildInitialState` ไปเป็น lazy init หรือห่อ `recomputeSummaries` ด้วย try/catch แล้ว fallback เป็น `{}` |
| 5.2 | ให้ summary รวม `taxableGainTHB` จาก `state.gains` ที่ `applyRemittance` คำนวณไว้แล้ว แทนการคำนวณซ้ำ |
| 5.3 | เปลี่ยนชื่อเป็น `excludedLossesUSD` ให้ตรงทั้ง code และ type |
| 5.4 | ลบ `taxSlice` + spec หรือทำ UI มาใช้จริง |
| 5.5 | ใช้ i18n key ใน engine หรือย้ายข้อความไปที่ layer UI |
| 5.6 | อัปเดต `README.md` และ `openspec/config.yaml` ให้ตรง |
| build แดง | แยก `tsconfig.spec.json` ที่มี `types: ['jest']` หรือ exclude `*.spec.ts` จาก `tsconfig.app.json` |

---

## 7. ธรรมเนียมของ codebase

| เรื่อง | กติกา |
|---|---|
| Engine | ต้องเป็น pure function — ห้าม import React / Redux / DOM |
| State | แก้ที่ slice เท่านั้น, engine คืนค่าใหม่เสมอ (immutable) |
| Derived data | **ห้าม cache** ค่าที่คำนวณได้ — คำนวณสดใน `useMemo` หรือตอน reducer |
| Component | มีเพียง `Dashboard` ที่ต่อ Redux, ที่เหลือรับ props |
| ข้อความ | ผ่าน `t()` จาก i18next (ยกเว้น engine) |
| ตัวเลขเงิน | `number` ธรรมดา (ไม่ใช้ decimal library) — ปัดเฉพาะตอนแสดงผล |
| path import | ใช้ alias `@/` |
| ภาษาใน comment | อังกฤษ; ข้อความ UI มีทั้งไทย/อังกฤษ |

---

## 8. ดูละเอียดต่อ

- ภาพรวมแอป → [00-overview.md](./00-overview.md)
- สถาปัตยกรรมและ data flow → [01-architecture.md](./01-architecture.md)
- FIFO และกำไรขั้นต้น → [02-trades-fifo.md](./02-trades-fifo.md)
- การโอนเงินกลับและภาษี → [03-remittance-tax.md](./03-remittance-tax.md)
- เงินปันผลและเครดิต WHT → [04-dividends.md](./04-dividends.md)