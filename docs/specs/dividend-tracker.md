# Spec: Foreign Dividend Tracking — ระบบบันทึกเงินปันผลหุ้นต่างประเทศ

> **Status:** Draft  
> **Created:** 2026-07-30  
> **Author:** BA  
> **Target:** `src/types/trade.ts`, `src/engine/dividendEngine.ts` (new), `src/store/dividendSlice.ts` (new), `src/components/DividendTab.tsx` (new), `src/components/DividendForm.tsx` (new), `src/constants.ts`, `src/validation/schemas.ts`, `src/i18n/locales/{en,th}/dividend.json` (new)

---

## User Story

> As a Thai investor receiving dividends from foreign stocks, I want to record dividend payments with withholding tax tracking and remittance-based income calculation, so that I have all the numbers ready — gross income, WHT credit, reportable income — to file ภ.ง.ด.90 correctly.

---

## Objective

Add a **Dividend Tab** to the dashboard for recording foreign stock dividends. Each dividend payment is a separate record linked to an existing stock position. The system:

1. Guides the user with **country-specific WHT rates** (auto-fill, override allowed)
2. Computes **THB snapshot** at dividend receipt date FX (reference)
3. Computes **reportable income & WHT credit** at remittance date FX (per Thai RD rules)
4. Tracks **partial remittance** with proper attribution
5. Aggregates **annual summary** by remittance year — ready for PND 90

---

## Key Design Principles

| Principle | Rationale |
|---|---|
| **THB for tax = remittance date FX** | ตาม ป.161/2566 + RD manual — ใช้ FX วันที่นำเข้าหรือวันทำการก่อนหน้า |
| **THB snapshot = dividend date FX** | เก็บไว้เป็นข้อมูลอ้างอิง — ไม่มีผลต่อการคำนวณภาษี |
| **Remittance-based trigger** | ยังไม่ remit = ยังไม่นับเป็นรายได้ในปีนั้น |
| **Tax year = remittance year** | สอดคล้องกับ capital gains — ระบบ remittance-based ทั้งระบบ |
| **Tracking tool, not filing software** | ระบบบันทึกและสรุปตัวเลข → ผู้ใช้กรอก ภ.ง.ด.90 เอง |
| **Extensible countries** | Config-driven — เพิ่มประเทศได้โดยไม่ต้องแก้ logic |

---

## Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | UI placement | Tab "Dividend" ระหว่าง Trade Log และ Remittance Log | แยกประเภทข้อมูล; อยู่ในบริบท Dashboard |
| D2 | WHT rate input | Dropdown ประเทศ → auto-fill % → override ได้ | UX: guidance + flexibility |
| D3 | Link to stock | ต้องมี BUY symbol ในพอร์ต | ปันผลมาจากการถือหุ้น |
| D4 | Remittance | Remit ได้บางส่วน — หลายครั้งต่อ 1 dividend record | ทยอยโอนเข้าไทยได้ |
| D5 | Currency | USD only | User requirement |
| D6 | Granularity | 1 record = 1 dividend payment | AAPL จ่าย 4 ครั้ง/ปี = 4 records |
| D7 | THB for tax | **FX วันที่นำเข้า** (remitFxRate) | ตามกฎหมายกรมสรรพากร |
| D8 | THB snapshot | เก็บ grossTHB/whtTHB/netTHB ที่ dividend date FX ไว้ | Reference เท่านั้น |
| D9 | Tax credit | ระบบสรุป WHT credit THB → ผู้ใช้เอาไปกรอกเอง | ไม่คำนวณ credit limit |
| D10 | Tax year | **Remittance year** (ปีที่นำเข้า) | เดียวกับ capital gains |

---

## Scenario Walkthrough

```
📥 15 มี.ค. 2026 — ได้รับเงินปันผล AAPL

  USD:
  ├─ Gross Dividend:     $1,000.00
  ├─ US WHT 15%:        -$150.00
  └─ Net Received:        $850.00

  THB Snapshot (อ้างอิง — FX วันที่ได้รับ = 30):
  ├─ Gross THB:          ฿30,000.00
  ├─ WHT THB:            ฿4,500.00
  └─ Net THB:            ฿25,500.00

  Status: ⏳ ยังไม่นำเข้า (ยังไม่นับเป็นรายได้)

────────────────────────────────────────

📤 16 มี.ค. 2026 — นำเงินเข้าไทย $850

  FX วันที่นำเข้า = 31:
  ├─ Actual THB Received:    $850 × 31 = ฿26,350.00
  ├─ Reportable Income:      $850 × 31 = ฿26,350.00  ← กรอก ภ.ง.ด.90
  └─ WHT Credit:             $150 × 31 = ฿4,650.00   ← ขอเครดิตภาษี

  Status: ✅ นำเข้าแล้ว (remaining = $0)

────────────────────────────────────────

📊 Annual Summary 2026 (remittance year):
┌─────────────────────────────────────────────┐
│ 📥 เงินปันผลรวม (Gross):          $1,000.00 │
│ 💸 ถูกหัก WHT:                      -$150.00 │
│ 📤 Remit แล้ว (Net):                $850.00 │
│ 💰 รายได้ที่ต้องยื่น (THB):       ฿26,350.00 │
│ 🧾 WHT เครดิตภาษี (THB):          ฿4,650.00 │
│ ⏳ ยังไม่ Remit:                       $0.00 │
└─────────────────────────────────────────────┘
```

### Partial Remittance Example

```
📥 Dividend: gross $1,000, WHT $150 (15%), net $850

📤 Remit #1: $500 @ FX 31
   ├─ Reportable: $500 × 31 = ฿15,500
   ├─ WHT Credit: ($500/$850) × $150 × 31 = ฿2,735.29
   └─ Remaining: $350

📤 Remit #2: $350 @ FX 32
   ├─ Reportable: $350 × 32 = ฿11,200
   ├─ WHT Credit: ($350/$850) × $150 × 32 = ฿1,976.47
   └─ Remaining: $0 ✅

📊 Total:
   ├─ Reportable Income: ฿15,500 + ฿11,200 = ฿26,700.00
   └─ WHT Credit:        ฿2,735.29 + ฿1,976.47 = ฿4,711.76
```

---

## Data Model

### New Types (`src/types/trade.ts`)

```typescript
// === Country Configuration ===

type CountryCode = 'US' | 'UK' | 'SG' | 'OTHER';

interface CountryWhtInfo {
  code: CountryCode;
  nameTH: string;
  nameEN: string;
  defaultWhtRate: number;       // 15 for US, 0 for UK/SG
  hasDTATreaty: boolean;
  noteTH?: string;
  noteEN?: string;
}

// === Dividend Record ===

interface DividendRecord {
  id: string;
  date: string;                  // Dividend pay date (YYYY-MM-DD)
  symbol: string;                // Must exist in BUY trades
  country: CountryCode;
  
  // USD amounts
  grossAmountUSD: number;        // Total dividend before WHT
  whtRate: number;               // Percentage (user can override country default)
  whtAmountUSD: number;          // Auto: grossUSD × whtRate / 100
  netAmountUSD: number;          // Auto: grossUSD - whtUSD
  
  // THB snapshot — reference only, based on dividend receipt date FX
  dividendFxRate: number;
  grossAmountTHB: number;        // grossUSD × dividendFx  — reference
  whtAmountTHB: number;          // whtUSD × dividendFx    — reference
  netAmountTHB: number;          // netUSD × dividendFx    — reference
  
  // Remittance tracking
  totalRemittedUSD: number;      // Sum of all remittances
  remainingToRemitUSD: number;   // netUSD - totalRemittedUSD
  remittances: DividendRemittance[];
  
  notes?: string;
}

// === Dividend Remittance ===

interface DividendRemittance {
  id: string;
  dividendId: string;
  amountUSD: number;             // ≤ remainingToRemit at time of remittance
  remitDate: string;             // YYYY-MM-DD — date funds arrived in Thailand
  remitFxRate: number;           // THB per 1 USD on remittance date
  remitTHB: number;              // amountUSD × remitFxRate (actual THB received)
  reportableIncomeTHB: number;   // same as remitTHB — for PND 90
  whtCreditTHB: number;          // (amountUSD/netUSD) × whtUSD × remitFxRate
  notes?: string;
}

// === Annual Summary (grouped by remittance year) ===

interface DividendSummary {
  taxYear: number;                // Remittance year
  totalGrossUSD: number;
  totalWhtUSD: number;
  totalNetUSD: number;
  totalRemittedUSD: number;
  totalReportableIncomeTHB: number;   // Sum of all remitTHB — for PND 90
  totalWhtCreditTHB: number;          // Sum of all whtCreditTHB — for tax credit
  totalUnremittedUSD: number;         // netUSD of dividends not remitted in this year
  recordCount: number;                // Total dividend records
  remittedCount: number;              // # of dividend records with remittance in this year
}
```

### Country Configuration (`src/constants.ts`)

```typescript
const COUNTRY_WHT_INFO: Record<CountryCode, CountryWhtInfo> = {
  US: {
    code: 'US',
    nameTH: 'สหรัฐอเมริกา',
    nameEN: 'United States',
    defaultWhtRate: 15,
    hasDTATreaty: true,
    noteTH: 'US-Thai Tax Treaty Art.10: 15% สำหรับบุคคลธรรมดาที่มี W-8BEN (ไม่มี W-8BEN = 30%)',
    noteEN: 'US-Thai Tax Treaty Art.10: 15% for individuals with W-8BEN (30% without)',
  },
  UK: {
    code: 'UK',
    nameTH: 'สหราชอาณาจักร',
    nameEN: 'United Kingdom',
    defaultWhtRate: 0,
    hasDTATreaty: true,
    noteTH: 'UK ไม่หัก WHT เงินปันผล — เสียภาษีตาม Thai PIT เท่านั้น',
    noteEN: 'UK does not withhold tax on dividends — taxed under Thai PIT only',
  },
  SG: {
    code: 'SG',
    nameTH: 'สิงคโปร์',
    nameEN: 'Singapore',
    defaultWhtRate: 0,
    hasDTATreaty: true,
    noteTH: 'สิงคโปร์ไม่มี WHT เงินปันผล — เสียภาษีตาม Thai PIT เท่านั้น',
    noteEN: 'Singapore has no dividend WHT — taxed under Thai PIT only',
  },
  OTHER: {
    code: 'OTHER',
    nameTH: 'อื่น ๆ',
    nameEN: 'Other',
    defaultWhtRate: 0,
    hasDTATreaty: false,
    noteTH: 'กรุณาตรวจสอบอัตรา WHT กับประเทศต้นทาง — อาจไม่มี DTA กับไทย',
    noteEN: 'Please verify WHT rate — may not have DTA with Thailand',
  },
};
```

---

## Business Rules

### BR1: THB Snapshot (Reference Only)

```
grossAmountTHB = grossAmountUSD × dividendFxRate
whtAmountTHB   = whtAmountUSD × dividendFxRate
netAmountTHB   = netAmountUSD × dividendFxRate
```

- Calculated once on record creation
- **Immutable** — ไม่เปลี่ยนแม้ remit ทีหลังที่ FX ต่างกัน
- **ไม่มีผลต่อการคำนวณภาษี** — ใช้เป็นข้อมูลอ้างอิงเท่านั้น

### BR2: Reportable Income (For PND 90)

```
reportableIncomeTHB = remittedAmountUSD × remitFxRate
```

- ยังไม่ remit → reportable = ฿0
- Remit บางส่วน → เฉพาะส่วนที่ remit
- Remit ทั้งหมด → sum ของทุกรายการ remit
- **ใช้ remitFxRate** — ตามกฎหมายกรมสรรพากร

### BR3: WHT Credit (For PND 90)

```
whtCreditTHB = (remittedAmountUSD / netAmountUSD) × whtAmountUSD × remitFxRate
```

- คิดตามสัดส่วนที่ remit — remit ครบ = WHT credit เต็มจำนวน
- **ใช้ remitFxRate** — ตาม RD manual สำหรับ foreign tax credit
- ยังไม่ remit → ยังใช้เครดิตไม่ได้

### BR4: Partial Remittance

| Action | Calculation |
|---|---|
| 1st remit: $500 of $850 | `remainingToRemit = 850 - 500 = 450` |
| 2nd remit: $450 of $850 | `remainingToRemit = 450 - 450 = 0` → fully remitted |
| Try remit $500 when $450 remains | ❌ Validation error |

### BR5: Symbol Validation

- Dividend `symbol` ต้องมี BUY transaction ในระบบ (symbol ตรงกัน)
- ไม่ต้องเช็ค `remainingQuantity` — ต่อให้ขายหุ้นหมดแล้วก็ได้รับปันผลย้อนหลังได้
- Symbol input: dropdown จาก BUY symbols (reuse pattern เดียวกับ SellSymbolDropdown)

### BR6: Country → WHT Auto-fill

เลือก Country → WHT Rate auto-fill จาก `COUNTRY_WHT_INFO.defaultWhtRate`  
ผู้ใช้ override ได้ (0-100%)

### BR7: Tax Year = Remittance Year

- เงินปันผลจัดอยู่ในปีภาษีตาม **ปีที่ remit**
- Dividend record เองไม่มี tax year — จนกว่าจะ remit
- Annual summary จัดกลุ่มตาม `remitDate` year

---

## Engine API (`src/engine/dividendEngine.ts` — New)

Pure functions — no React/Redux imports:

| Function | Input | Output | Purpose |
|---|---|---|---|
| `calculateDividendTHB(grossUSD, whtRate, fxRate)` | amounts + rate + FX | `{ grossTHB, whtTHB, netTHB }` | THB snapshot at dividend date |
| `calculateWhtCredit(remitUSD, netUSD, whtUSD, remitFx)` | remittance + dividend data | `number` | WHT credit THB for this remittance |
| `applyDividendRemittance(record, remittance)` | DividendRecord, DividendRemittance | `DividendRecord` (updated) | Record remittance, update totals |
| `computeDividendSummary(records, year)` | DividendRecord[], remittance year | `DividendSummary` | Annual summary by remittance year |
| `getAvailableSymbols(trades)` | TradeTransaction[] | `string[]` | Unique symbols from BUY trades |
| `validateRemittance(record, amountUSD)` | DividendRecord, number | `{ valid: boolean, message: string }` | Check amount ≤ remainingToRemit |

---

## Store (`src/store/dividendSlice.ts` — New)

| Action | Purpose |
|---|---|
| `addDividend(record)` | Add dividend → save localStorage |
| `updateDividend(record)` | Edit dividend → recompute → save |
| `deleteDividend(id)` | Delete dividend → save |
| `addDividendRemittance(remittance)` | Record remittance → recompute → save |
| `removeDividendRemittance(dividendId, remittanceId)` | Undo remittance entry |
| `setDividendDisplayYear(year)` | Filter dividend display by remittance year |
| `importDividends(records)` | Bulk import (replaces all) |
| `clearAllDividends()` | Wipe all dividend data |

**Persistence:** `localStorage` key `tax_tracker_dividends`. Zod validated on load.

---

## Acceptance Criteria

### 🏗️ Data & Storage

| # | Condition | Priority |
|---|---|---|
| AC1 | `CountryCode`, `CountryWhtInfo`, `DividendRecord`, `DividendRemittance`, `DividendSummary` types defined in `src/types/trade.ts` | Must |
| AC2 | `COUNTRY_WHT_INFO` constant (US/UK/SG/OTHER) in `src/constants.ts` | Must |
| AC3 | Dividend data persisted to `localStorage` key `tax_tracker_dividends` | Must |
| AC4 | Zod schema validates dividend data on load; fallback to `[]` on corruption | Must |

### 🧮 Engine

| # | Condition | Priority |
|---|---|---|
| AC5 | `calculateDividendTHB()` — correct THB snapshot at dividend FX | Must |
| AC6 | `calculateWhtCredit()` — proportional WHT at remittance FX | Must |
| AC7 | `applyDividendRemittance()` — updates `totalRemittedUSD`, `remainingToRemitUSD`, appends remittance | Must |
| AC8 | `computeDividendSummary()` — groups by remittance year, correct totals | Must |
| AC9 | `getAvailableSymbols()` — unique symbols from BUY trades | Must |
| AC10 | `validateRemittance()` — rejects if amount > `remainingToRemitUSD` | Must |

### 📋 UI — Dividend Tab

| # | Condition | Priority |
|---|---|---|
| AC11 | Tab "📊 เงินปันผล / Dividends" ระหว่าง Trade Log และ Remittance Log | Must |
| AC12 | Table columns: Date, Symbol, Country, Gross (USD), WHT%, WHT (USD), Net (USD), Remitted (USD), Remaining (USD), Reportable (THB), WHT Credit (THB) | Must |
| AC13 | Responsive: table → cards on mobile (pattern เดียวกับ TradeTable) | Must |
| AC14 | Empty state: "ยังไม่มีบันทึกเงินปันผล" + CTA button | Must |
| AC15 | KPI row: เงินปันผลรวม, WHT รวม, Remit แล้ว, รายได้ที่ต้องยื่น, เครดิตภาษี, คงเหลือ | Must |
| AC16 | KPI reuses `KpiCard` component | Must |
| AC17 | Year filter: dropdown เลือก remittance year (เหมือน TradeTable filter) | Must |

### 📝 UI — Dividend Form (Add/Edit)

| # | Condition | Priority |
|---|---|---|
| AC18 | Fields: Date, Symbol (dropdown from BUY), Country (dropdown), Gross Amount (USD), WHT Rate (%), Dividend FX Rate | Must |
| AC19 | เลือก Country → WHT Rate auto-fill + แสดง country note | Must |
| AC20 | Real-time preview: WHT(USD), Net(USD), Gross(THB), WHT(THB), Net(THB) | Must |
| AC21 | react-hook-form + zodResolver (pattern เดียวกับ TradeForm) | Must |
| AC22 | Edit: symbol locked; ถ้ามี remittance → ต้องลบ remit ก่อน | Must |
| AC23 | Delete: ConfirmDialog → block ถ้ามี remittance | Must |

### 💸 UI — Dividend Remittance

| # | Condition | Priority |
|---|---|---|
| AC24 | ปุ่ม "นำเข้าไทย" ใน dividend table สำหรับรายการที่ `remainingToRemitUSD > 0` | Must |
| AC25 | Remit dialog: Amount (USD), Remit Date, Remit FX Rate | Must |
| AC26 | Preview: Actual THB, Reportable Income, WHT Credit | Must |
| AC27 | Validation: amount ≤ `remainingToRemitUSD`, amount > 0 | Must |
| AC28 | Partial remit: ได้หลายครั้ง — แสดงประวัติใน expandable row | Should |

### 🌐 i18n

| # | Condition | Priority |
|---|---|---|
| AC29 | Namespace `dividend:` พร้อม EN/TH JSON | Must |
| AC30 | Country names/notes รองรับทั้ง TH/EN (จาก `COUNTRY_WHT_INFO`) | Must |
| AC31 | ไม่มี `lang === 'th' ? ... : ...` — ใช้ `t('dividend:key')` เสมอ | Must |

### 🔍 Quality Gates

| # | Condition | Priority |
|---|---|---|
| AC32 | `npx tsc --noEmit` → 0 errors | Must |
| AC33 | Unit tests: `dividendEngine.ts` — all exported functions | Must |
| AC34 | Unit tests: Zod validation schemas | Must |
| AC35 | Existing Trade Log / Remittance Log / FIFO engine — zero regressions | Must |
| AC36 | `npm test` → all tests pass | Must |

---

## Edge Cases

| # | Scenario | Expected |
|---|---|---|
| EC1 | WHT = 0% (UK/SG) | whtAmountUSD = 0, whtCreditTHB = 0 |
| EC2 | WHT = 30% (US without W-8BEN) | รองรับ — ผู้ใช้ override 15% → 30% |
| EC3 | ยังไม่ remit | reportableIncomeTHB = 0, whtCreditTHB = 0 |
| EC4 | Remit ครั้งเดียวทั้งหมด | remainingToRemitUSD = 0, status "นำเข้าแล้ว" |
| EC5 | Remit หลายครั้งจนครบ | รวม reportable + WHT credit จากทุกครั้ง |
| EC6 | Symbol ถูกลบจาก trade log ภายหลัง | Dividend record ยังอยู่ครบ — ไม่ orphan |
| EC7 | หุ้นเดียวกัน หลาย provider | Dividend ไม่สน provider — link แค่ symbol |
| EC8 | แก้ไข dividend หลัง remit | ❌ Block — ต้องลบ remittance ก่อน |
| EC9 | ลบ dividend ที่มี remittance | ❌ Block — ต้องลบ remittance ก่อน |
| EC10 | FX rate ≤ 0 | ❌ Validation: `z.number().positive()` |
| EC11 | WHT rate > 100 | ❌ Validation: `z.number().min(0).max(100)` |
| EC12 | Gross amount ≤ 0 | ❌ Validation: `z.number().positive()` |
| EC13 | Remit ต่างปีจาก dividend date | Tax year = remit year; reportable + WHT ใช้ remitFxRate |
| EC14 | หลาย remittance ในปีภาษีต่างกัน | `computeDividendSummary` แยกกลุ่มตาม remit date year |

---

## Implementation Notes

### Files to Create

| File | Purpose |
|---|---|
| `src/engine/dividendEngine.ts` | Pure functions: THB calc, remittance, summary, validation |
| `src/engine/dividendEngine.spec.ts` | Unit tests for dividend engine |
| `src/store/dividendSlice.ts` | Redux slice: CRUD + remittance + persistence |
| `src/store/dividendSlice.spec.ts` | Unit tests for dividend slice |
| `src/components/DividendTab.tsx` | Tab content: KPI cards + dividend table |
| `src/components/DividendForm.tsx` | Modal form: add/edit dividend (react-hook-form) |
| `src/components/DividendRemitForm.tsx` | Modal/panel: record remittance |
| `src/i18n/locales/en/dividend.json` | EN translations |
| `src/i18n/locales/th/dividend.json` | TH translations |

### Files to Modify

| File | Change |
|---|---|
| `src/types/trade.ts` | Add 5 new interfaces + 1 type alias |
| `src/constants.ts` | Add `COUNTRY_WHT_INFO` |
| `src/validation/schemas.ts` | Add `dividendSchema`, `dividendRemittanceSchema` |
| `src/store/index.ts` | Register `dividendSlice` reducer |
| `src/i18n/index.ts` | Add `dividend` namespace |
| `src/components/Dashboard.tsx` | Add "Dividend" tab (between Trade Log / Remittance Log) |
| `src/App.css` / `src/index.css` | Dividend styles (follow existing patterns) |
| `docs/tasks.md` | Add TASK-026 |

### Files NOT Modified

| File | Reason |
|---|---|
| `src/engine/fifoEngine.ts` | Separate engine — no changes |
| `src/store/tradeSlice.ts` | Separate slice + storage key |
| `src/components/TradeForm.tsx` | Separate form |
| `src/components/TradeTable.tsx` | Separate table |
| `src/components/RemitForm.tsx` | Separate remittance flow |
| `src/components/RemittanceLog.tsx` | Existing Remittance Log = capital gains only |
| `src/store/taxSlice.ts` | No changes |

---

## Compliance Notes (⚠️ สำหรับผู้ใช้)

| # | หมายเหตุ |
|---|---|
| CN1 | **FX Rate:** ระบบใช้ FX วันที่นำเข้า (remitFxRate) ในการคำนวณ reportable income และ WHT credit — ตรงตามกฎหมายกรมสรรพากร |
| CN2 | **US WHT:** Default 15% สำหรับผู้มี W-8BEN — ถ้าไม่มี ต้อง override เป็น 30% |
| CN3 | **Pre-2024 Income:** รายได้ก่อน 1 ม.ค. 2024 ได้รับการยกเว้นถาวร |
| CN4 | **Tax Filing:** ระบบเป็น tracking tool — ผู้ใช้ต้องนำตัวเลขไปกรอก ภ.ง.ด.90 เอง |

---

## Out of Scope

- Foreign tax credit limit calculation (credit = min(ตปท, ไทย))
- Multi-currency dividends (USD only)
- Export ไฟล์สำหรับยื่นภาษี
- หุ้นไทย dividend
- Auto-fetch FX rate จาก API
- W-8BEN expiry detection

---

## Verification Checklist

- [ ] `tsc --noEmit` → 0 errors
- [ ] Add dividend: form → save → appears in table
- [ ] Country dropdown: US→15%, UK→0%, SG→0%
- [ ] WHT manual override: 15% → 30%
- [ ] THB snapshot preview updates real-time เมื่อเปลี่ยน FX
- [ ] Remit full amount: remaining→0, reportable+WHT credit คำนวณถูกต้อง
- [ ] Remit partial: $500 of $850 → remaining=$350
- [ ] Remit again: $350 → fully remitted
- [ ] Try remit > remaining: ❌ validation
- [ ] Edit dividend (no remit): ✅ allowed
- [ ] Edit dividend (has remit): ❌ blocked
- [ ] Delete dividend (has remit): ❌ blocked
- [ ] Delete remittance → delete dividend: ✅
- [ ] KPI cards update after add/edit/delete/remit
- [ ] Year filter: แสดงเฉพาะ remittance ในปีที่เลือก
- [ ] Switch EN↔TH: all labels correct
- [ ] Existing Trade Log / Remittance Log zero regressions
- [ ] `npm test` → all tests pass