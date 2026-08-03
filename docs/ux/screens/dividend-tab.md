# 📐 Screen: Dividend Tab — ระบบบันทึกเงินปันผลหุ้นต่างประเทศ

> **Created:** 2026-07-30 | **Updated:** 2026-07-30
> **UX Agent:** ux-dividend-tab
> **Related Tasks:** TASK-026 (Foreign Dividend Tracking)

---

## 🗺️ User Flow Context

- **มาจากหน้า:** Dashboard
- **ไปต่อหน้า:** Dashboard (หลังจาก submit, cancel, หรือ remit)
- **User Goal:** ผู้ใช้ต้องการบันทึกเงินปันผลที่ได้รับจากหุ้นต่างประเทศ พร้อมข้อมูลภาษีหัก ณ ที่จ่าย (WHT) และติดตามการนำเงินเข้าไทย เพื่อให้มีตัวเลขพร้อมกรอก ภ.ง.ด.90

**User Flows:**

```
Flow 1: บันทึกเงินปันผล
  Dashboard → เลือก Tab "เงินปันผล" → กด "➕ บันทึกเงินปันผล"
  → DividendForm → กรอกข้อมูล → Save → กลับมาที่ตาราง

Flow 2: นำเงินปันผลเข้าไทย
  Dashboard → เลือก Tab "เงินปันผล" → Dividend Row → กด "นำเข้าไทย"
  → DividendRemitForm → ระบุจำนวน + FX → Remit → กลับมาที่ตาราง

Flow 3: แก้ไข/ลบเงินปันผล
  Dashboard → เลือก Tab "เงินปันผล" → Dividend Row → กด ✏️
  → DividendForm (edit mode) → แก้ไข → Save

Flow 4: ดูสรุปทั้งปี
  Dashboard → เลือก Tab "เงินปันผล" → เปลี่ยน Year Filter
  → KPI + Table อัปเดตตามปีที่เลือก
```

---

## 📱 Layout — Desktop (≥1024px)

### Tab Bar

Tab bar มี 3 tabs เรียงตามลำดับ:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [📊 บันทึกการซื้อขาย]    [💵 เงินปันผล]    [🏦 บันทึกนำเงินเข้า]  │
│                         ─────────────                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

| Tab | Icon + Label | Active Indicator |
|---|---|---|
| Trade Log | 📊 บันทึกการซื้อขาย | Default (ซ้ายสุด) |
| **Dividends (ใหม่)** | **💵 เงินปันผล** | **ตรงกลาง — between Trade Log & Remittance Log** |
| Remittance Log | 🏦 บันทึกนำเงินเข้า | ขวาสุด |

Tab styling: อ้างอิงจาก Design System — Tabs section

---

### KPI Row (6 cards)

ด้านบนของ Dividend Tab มี KPI 6 cards (3×2 grid):

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│ │ 💵 เงินปันผลรวม   │ │ 💸 WHT ถูกหัก    │ │ ✅ Remit แล้ว     │               │
│ │ $2,300.00       │ │ -$345.00        │ │ $1,275.00       │               │
│ │ 3 รายการปันผล    │ │ 3 รายการ     ⓘ  │ │ 2 รายการ      ⓘ  │               │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                            │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│ │ 💰 รายได้ที่ต้องยื่น│ │ 🧾 WHT เครดิตภาษี│ │ ⏳ คงเหลือยังไม่ Remit │               │
│ │ ฿39,100.00     │ │ ฿5,250.00       │ │ $800.00          │               │
│ │ 2 รายการที่นำเข้า  │ │ สำหรับยื่น ภ.ง.ด.90│ │ 1 รายการ      ⓘ  │               │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

| # | KPI | Icon | Variant | Tooltip |
|---|---|---|---|---|
| 1 | เงินปันผลรวม (Gross USD) | 💵 | default | "ยอดรวมเงินปันผลก่อนหักภาษี ณ ที่จ่าย ของทุกประเทศ" |
| 2 | WHT ถูกหัก (USD) | 💸 | negative | "ภาษีหัก ณ ที่จ่ายทั้งหมดที่ถูกหักจากประเทศต้นทาง (Withholding Tax)" |
| 3 | Remit แล้ว (USD) | ✅ | positive | "ยอดเงินปันผลสุทธิที่นำเข้าประเทศไทยแล้ว" |
| 4 | รายได้ที่ต้องยื่น (THB) | 💰 | highlight | "มูลค่าเงินปันผลที่นำเข้าไทย × FX วันที่นำเข้า — ต้องกรอกใน ภ.ง.ด.90" |
| 5 | WHT เครดิตภาษี (THB) | 🧾 | neutral | "ภาษีที่ถูกหักต่างประเทศในสัดส่วนที่นำเข้า — ใช้ขอเครดิตภาษีใน ภ.ง.ด.90" |
| 6 | คงเหลือยังไม่ Remit (USD) | ⏳ | warning | "เงินปันผลสุทธิที่ยังไม่ได้นำเข้าไทย — ยังไม่ต้องเสียภาษี" |

Grid layout: `grid-template-columns: repeat(3, 1fr)` (3 columns 2 rows)

---

### Dividend Table (Desktop)

ใต้ KPI Row มี year filter + ตาราง:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  💵 เงินปันผล (3 รายการ)          [2026 ▼]  [➕ บันทึกเงินปันผล]                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  DATE         SYMBOL  COUNTRY  GROSS USD  WHT%  WHT USD  NET USD  REMITTED  REMAINING  │
│                                                                                              │
│  2026-06-15   AAPL    🇺🇸 US  $1,000.00  15%   $150.00  $850.00   $500.00    $350.00    │
│                                                                                              │
│  ▶ Remittance History (1/2 remitted)                                                        │
│    ┌─────────────────────────────────────────────────────────────────────────────────┐        │
│    │ Remit Date  │ Amount USD │ FX Rate │ Reportable THB │ WHT Credit THB │ Notes   │        │
│    │ 2026-06-16  │ $500.00    │ 31.00   │ ฿15,500.00     │ ฿2,735.29      │ —       │        │
│    └─────────────────────────────────────────────────────────────────────────────────┘        │
│                                                                                              │
│  2026-03-15   NVDA    🇺🇸 US    $500.00  15%    $75.00   $425.00   $425.00      $0.00  ✅  │
│  2026-01-10   MSFT    🇺🇸 US    $800.00  15%   $120.00   $680.00     $0.00    $680.00  ⏳  │
│                                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  สรุป:  $2,300.00  |  -$345.00  |  $1,275.00  |  ฿39,100.00  |  ฿5,250.00  |  $1,030.00   │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Columns (Desktop ≥1024px)

| # | Column | Width | Align | Sortable | Visible |
|---|---|---|---|---|---|
| 1 | Date | 110px | left | ✅ | Always |
| 2 | Symbol | 90px | left | ✅ | Always |
| 3 | Country | 80px | left | ✅ | Always |
| 4 | Gross (USD) | 110px | right | ✅ | Always |
| 5 | WHT% | 60px | center | ❌ | Always |
| 6 | WHT (USD) | 110px | right | ❌ | Table ≥768px |
| 7 | Net (USD) | 110px | right | ❌ | Always |
| 8 | Remitted (USD) | 110px | right | ❌ | Always |
| 9 | Remaining (USD) | 110px | right | ❌ | Always |
| 10 | Reportable (THB) | 130px | right | ❌ | Always |
| 11 | WHT Credit (THB) | 130px | right | ❌ | Table ≥768px |
| 12 | Status + Actions | 100px | center | ❌ | Always |

#### Columns (Tablet 768-1023px)

ซ่อน: WHT (USD), WHT Credit (THB) — เฉพาะคอลัมน์ที่ compressible

#### Status Badge ในคอลัมน์ Remaining + Actions

| Condition | Badge | Actions |
|---|---|---|
| `remainingToRemitUSD = 0` | ✅ นำเข้าแล้ว | 👁️ ดูประวัติ |
| `remainingToRemitUSD = netAmountUSD` | ⏳ ยังไม่นำเข้า | [นำเข้าไทย] ✏️ 🗑️ |
| `0 < remainingToRemitUSD < netAmountUSD` | 🔄 นำเข้าบางส่วน | [นำเข้าไทย] 👁️ |

---

### Dividend Row — Remittance History (Expandable)

แต่ละ row สามารถ expand เพื่อดูประวัติ remittance:

```
State: Collapsed
  AAPL   $1,000.00  15%   $150.00  $850.00   $500.00   $350.00  ▶
                                                                   ^-- click ▶ to expand

State: Expanded
  AAPL   $1,000.00  15%   $150.00  $850.00   $500.00   $350.00  ▼
  ├── 🔽 Remittance History (1/2 remitted):
  │   ┌──────────────────────────────────────────────────────────────────┐
  │   │ 📅 16 มิ.ย. 2026  │ 💵 $500.00  │ 💱 31.00  │ ฿15,500.00  🗑️ │
  │   │ 💰 รายได้ที่ต้องยื่น: ฿15,500.00  │ 🧾 WHT Credit: ฿2,735.29  │
  │   └──────────────────────────────────────────────────────────────────┘
  │   [➕ Remit Again — $350 remaining]  ← ปุ่มถ้า remaining > 0
```

---

## 📱 Mobile Layout (<640px — Card View)

### KPI Row (Mobile S: 2 columns, 3 rows)

```
┌───────────────────────────────────┐
│ 💵  $2,300.00   │ 💸  -$345.00   │
│ เงินปันผลรวม    │ WHT ถูกหัก     │
├─────────────────┼─────────────────┤
│ ✅  $1,275.00   │ 💰  ฿39,100.00 │
│ Remit แล้ว      │ รายได้ที่ต้องยื่น│
├─────────────────┼─────────────────┤
│ 🧾  ฿5,250.00  │ ⏳  $800.00    │
│ เครดิตภาษี      │ คงเหลือ         │
└───────────────────────────────────┘
```

### Dividend Card View (Mobile)

```
┌─────────────────────────────────────┐
│ 🇺🇸 AAPL                     ⏳ ✏️ 🗑️│
│ 2026-06-15                          │
│ Gross: $1,000.00  WHT: 15%         │
│ WHT USD: $150.00  Net: $850.00     │
│ ─────────────────────────────────── │
│ Remitted: $500.00 / $850.00        │
│ ████████████████░░░░░░░░░  58%      │
│ Reportable: ฿15,500.00             │
│ WHT Credit: ฿2,735.29              │
│                                     │
│ [💰 นำเข้าไทย]  👁️ 1 Remittance    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🇺🇸 NVDA                      ✅     │
│ 2026-03-15                          │
│ Gross: $500.00  WHT: 15%           │
│ WHT USD: $75.00  Net: $425.00      │
│ ─────────────────────────────────── │
│ Remitted: $425.00 / $425.00        │
│ █████████████████████████  100%     │
│ Reportable: ฿12,750.00             │
│ WHT Credit: ฿2,250.00              │
│                                     │
│ 👁️ 1 Remittance                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🇺🇸 MSFT                       ⏳   │
│ 2026-01-10                          │
│ Gross: $800.00  WHT: 15%           │
│ WHT USD: $120.00  Net: $680.00     │
│ ─────────────────────────────────── │
│ ยังไม่นำเข้า                         │
│ รายได้ที่ต้องยื่น: ฿0.00             │
│                                     │
│ [💰 นำเข้าไทย]                      │
└─────────────────────────────────────┘
```

---

## 🧩 Components

### Component 1: DividendTab

| Property | Value |
|---|---|
| **Location** | Dashboard — tab ระหว่าง "Trade Log" และ "Remittance Log" |
| **Container** | `<div>` same styling as other tab content |
| **Nested components** | YearFilter, KpiCard (x6), DividendTable, DividendForm (modal), DividendRemitForm (modal) |

**Data flow:**
```
dividendSlice → DividendTab
  ├── dividends (DividendRecord[])
  ├── displayYear (number)
  └── dispatch functions

dividendEngine → DividendTab
  ├── computeDividendSummary(dividends, year) → DividendSummary → KPI
  └── Available symbols from tradeSlice → Bonus info

Trade Slice (read-only)
  └── trades (TradeTransaction[]) → symbol list for form dropdown
```

---

### Component 2: DividendTable

| Property | Value |
|---|---|
| **Location** | ใต้ KPI row ใน DividendTab |
| **Element** | HTML `<table>` with `<thead>`, `<tbody>` |
| **Empty state** | แสดงข้อความ "ยังไม่มีบันทึกเงินปันผล" + CTA button |
| **Loading state** | Skeleton 5 rows (shimmer animation) |
| **Error state** | ไม่มี — filtered by year → empty state |

**Sub-component: DividendRow**

| State | Display |
|---|---|
| **Collapsed** | แสดง 1 row ข้อมูลหลัก + ▶ expand icon |
| **Expanded** | แสดง remittance history table ใต้ row |
| **Fully remitted** | ✅ badge, ไม่มีปุ่ม "นำเข้าไทย" |
| **Partially remitted** | 🔄 badge, มีปุ่ม "นำเข้าไทย" |
| **Not remitted** | ⏳ badge, มีปุ่ม "นำเข้าไทย" |

**Sub-component: RemittanceHistoryPane**

เมื่อ expand row (คลิก ▶ หรือปุ่ม 👁️) — แสดง remittance entries:

```
หมายเหตุ: ใช้ CSS-animated slideDown (250ms)
แสดงเมื่อ: user คลิก expand หรือ "👁️ ดูประวัติ"
```

---

### Component 3: DividendForm (Modal)

| Property | Value |
|---|---|
| **When visible** | Add mode: click "➕ บันทึกเงินปันผล" / Edit mode: click ✏️ |
| **Element** | Modal — pattern เดียวกับ TradeForm |
| **Min-width** | 540px desktop, 100vw × 100vh mobile |
| **Animation** | fadeIn overlay + scaleIn modal (250ms) |

#### Form Layout

```
┌──────────────────────────────────────────────────────────┐
│  ➕ บันทึกเงินปันผล / ✏️ แก้ไขเงินปันผล              [×]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Row 1: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ วันที่ได้รับ      │ │ Symbol                  │  │
│         │ [2026-03-15    ]│ │ [AAPL                 ▼]│  │
│         └─────────────────┘ └─────────────────────────┘  │
│                                                          │
│  Row 2: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ ประเทศ          │ │ อัตรา WHT (%)            │  │
│         │ [🇺🇸 United Stat▼]│ │ [15.00                ]│  │
│         └─────────────────┘ └─────────────────────────┘  │
│         ┌──────────────────note────────────────────────┐  │
│         │ 🇺🇸 US-Thai Tax Treaty Art.10: 15% สำหรับ     │  │
│         │ บุคคลธรรมดาที่มี W-8BEN (ไม่มี W-8BEN = 30%)  │  │
│         └──────────────────────────────────────────────┘  │
│                                                          │
│  Row 3: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ จำนวนเงินปันผล   │ │ FX Rate วันที่ได้รับ     │  │
│         │ (USD)            │ │ (THB/USD)               │  │
│         │ [1,000.00      ]│ │ [30.00                 ]│  │
│         └─────────────────┘ └─────────────────────────┘  │
│                                                          │
│  ───────────────── Preview Box ────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📊 สรุปเงินปันผล (THB Snapshot)                       │ │
│  │                                                     │ │
│  │  Gross Dividend:   $1,000.00  × 30.00  = ฿30,000.00 │ │
│  │  US WHT (15%):     -$150.00   × 30.00  = -฿4,500.00 │ │
│  │  ────────────────────────────────────────             │ │
│  │  Net Received:      $850.00   × 30.00  =  ฿25,500.00 │ │
│  │                                                     │ │
│  │  💡 เก็บเป็น THB Snapshot (อ้างอิง) — ภาษีจะคำนวณ   │ │
│  │  จาก FX วันที่นำเข้า (Remit) อีกที                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  Row 4: ┌──────────────────┐                              │
│         │ หมายเหตุ (optional)│                              │
│         │ [                  ]│                              │
│         └────────────────────┘                              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                              [ยกเลิก]  [💾 บันทึก]        │
└──────────────────────────────────────────────────────────┘
```

#### Country Dropdown Options

| Option | Label EN | Label TH |
|---|---|---|
| US | 🇺🇸 United States | 🇺🇸 สหรัฐอเมริกา |
| UK | 🇬🇧 United Kingdom | 🇬🇧 สหราชอาณาจักร |
| SG | 🇸🇬 Singapore | 🇸🇬 สิงคโปร์ |
| OTHER | 🌏 Other | 🌏 อื่น ๆ |

**Interaction Flow:**

1. User selects Country → WHT Rate auto-fills (from `COUNTRY_WHT_INFO.defaultWhtRate`)
2. Country note appears below WHT Rate field (e.g., treaty info)
3. User can override WHT Rate (0-100%)
4. As user types Gross Amount + FX Rate, the Preview Box updates in real-time
5. WHT Amount (USD) = Gross × WHT% / 100 — auto-calculated
6. Net Amount (USD) = Gross - WHT — auto-calculated
7. THB values = USD values × FX rate — auto-calculated

**Symbol Field (Add mode):** Dropdown — แสดงเฉพาะ symbols ที่มี BUY ในระบบ (เหมือน SellSymbolDropdown composite value pattern)

**Symbol Field (Edit mode):** Locked (disabled), grayed out — ไม่ให้เปลี่ยน

---

### Component 4: DividendRemitForm (Modal)

| Property | Value |
|---|---|
| **When visible** | Click "💰 นำเข้าไทย" ใน dividend table หรือ mobile card |
| **Element** | Modal — smaller than DividendForm |
| **Min-width** | 420px desktop |
| **Animation** | fadeIn + slideUp (250ms) |

#### Form Layout

```
┌──────────────────────────────────────────────────────┐
│  💰 นำเงินปันผลเข้าไทย  (AAPL — $350.00 remaining) [×] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Row 1: ┌─────────────────┐ ┌─────────────────────┐  │
│         │ วันที่นำเข้า      │ │ FX Rate (THB/USD)   │  │
│         │ [2026-06-20    ]│ │ [31.00             ]│  │
│         └─────────────────┘ └─────────────────────┘  │
│                                                      │
│  Row 2: ┌──────────────────────────────────────────┐ │
│         │ จำนวนเงิน (USD)                [Remit All]│ │
│         │ [350.00                    ]              │ │
│         │ สูงสุดที่นำเข้าได้: $350.00                │ │
│         └──────────────────────────────────────────┘ │
│                                                      │
│  ───────────────── Preview Box ────────────────────  │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 💡 ภาษีที่เกี่ยวข้อง                               │ │
│  │                                                  │ │
│  │  Actual THB Received:  $350.00 × 31.00 = ฿10,850│ │
│  │  ─────────────────────────────────────             │ │
│  │  💰 รายได้ที่ต้องยื่น (ภ.ง.ด.90):                  │ │
│  │     $350.00 × 30.00 (FX วันที่ปันผล) = ฿10,500.00│ │
│  │                                                  │ │
│  │  🧾 WHT Credit สำหรับ ภ.ง.ด.90:                  │ │
│  │     ($350/$850) × $150 × 30.00 = ฿1,852.94       │ │
│  │                                                  │ │
│  │  💡 รายได้ที่ต้องยื่น = จำนวนที่ remit × FX      │ │
│  │  วันที่ได้รับปันผล (ตามที่ผู้ใช้เลือก)             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                      │
│  Row 3: ┌──────────────────┐                          │
│         │ หมายเหตุ (optional)│                          │
│         │ [                  ]│                          │
│         └────────────────────┘                          │
│                                                      │
├──────────────────────────────────────────────────────┤
│                              [ยกเลิก]  [💰 นำเข้า]    │
└──────────────────────────────────────────────────────┘
```

**Quick-fill Button:** "Remit All" — auto-fills with `remainingToRemitUSD`

**Preview Box Behavior:**
- Updates in real-time as user types Amount + FX Rate
- If Amount = 0 or FX = 0: แสดง "กรุณากรอกจำนวนเงินและอัตราแลกเปลี่ยน"
- If Amount > remainingToRemit: แสดง⚠️ warning

---

## 🎭 States — Full Matrix

### DividendTab (Container)

| State | What happens | Visual |
|---|---|---|
| **Loading** | Initial load from localStorage | Skeleton KPI (6 cards) + skeleton table (5 rows) |
| **Empty (no records at all)** | `dividends.length === 0` | Empty state with CTA "➕ บันทึกเงินปันผล" |
| **Empty (year filter no match)** | `filteredDividends.length === 0` | Empty state: "ไม่มีรายการในปีนี้" + year filter hint |
| **Populated** | Has records in selected year | KPI + table |
| **Error (Zod validation fail on load)** | localStorage data corrupted | Fallback empty + toast "ข้อมูลเสีย — เริ่มต้นใหม่" |
| **Saving** | Dispatch `addDividend` in progress | Button loading spinner |

### DividendRow

| State | Display | Actions available |
|---|---|---|
| **Fully remitted** | ✅ badge, remaining = $0 | 👁️ expand history only (no remit button) |
| **Partially remitted** | 🔄 badge, remaining > 0 | [💰 นำเข้าไทย] + 👁️ |
| **Not remitted** | ⏳ badge, remaining = netAmount | [💰 นำเข้าไทย] + ✏️ + 🗑️ |
| **Edit mode locked** | Row being edited | Modal open, background row has reduced opacity |

### DividendForm

| State | Display |
|---|---|
| **Add (empty)** | All fields empty with placeholders |
| **Add (filled, valid)** | All fields filled, preview shows, button enabled |
| **Add (validation error)** | Field with error has red border + error text |
| **Edit (pre-filled, no remit)** | Fields pre-filled, symbol locked, all editable |
| **Edit (with remit, blocked)** | ❌ Block with alert: "ลบรายการนำเข้าก่อนแก้ไข" |
| **Submitting** | Button loading spinner, fields disabled |

### DividendRemitForm

| State | Display |
|---|---|
| **Default (empty)** | Amount empty, preview hidden |
| **Filled (valid)** | All fields filled, preview shows, "💰 นำเข้า" enabled |
| **Amount > remaining** | ⚠️ "จำนวนเงินเกินที่สามารถนำเข้าได้ ($350)" |
| **Amount = remaining** | ✅ Fully remit — "นำเข้าครบจำนวน" |
| **Submitting** | Loading spinner |
| **Quick-fill** | "Remit All" button → auto-fills remaining amount |

---

## 📱 Responsive Breakpoints

| Breakpoint | KPI Layout | Table View | Modal | Notes |
|---|---|---|---|---|
| ≥1024px | 3×2 grid | Full table (11 columns) | 540px centered | Full desktop |
| 768-1023px | 3×2 grid | Table — hide WHT+Credit cols | 540px centered | Tablet L |
| 640-767px | 2×3 grid | Table — hide more cols | 90vw centered | Tablet |
| <640px | 2×3 grid | **Card view** | 100vw×100vh | Mobile — full screen form |

---

## 🎨 Design Tokens Used

| Token | Where |
|---|---|
| `--color-primary` | Tab active, "นำเข้าไทย" button, focus, link |
| `--color-success` | ✅ badge, positive gain, remitted |
| `--color-warning` | ⏳ badge, partial remit |
| `--color-danger` | 🗑️ delete, validation errors |
| `--color-border` | Table border, modal border |
| `--color-input-bg` | Form inputs |
| `--font-mono` | All financial numbers (USD/THB) |
| `--font-sans` | Labels, notes, country info |
| `--text-xs` | Badge, tooltip, helper text |
| `--text-sm` | Table cells, form labels |
| `--text-base` | Input values |
| `--text-2xl` | KPI values |
| `--radius-md` | Table container, modal |
| `--radius-sm` | Inputs, buttons |
| `--space-4` | Default gap |
| `--space-5` | Card padding |
| `--color-table-header-bg` | Table header |
| `--color-surface-hover` | Row hover |
| `--color-primary-bg` | Preview box |

---

## ♿ Accessibility Notes

1. **Dividend tab** — `role="tabpanel"`, `aria-labelledby` อ้างอิงถึง tab button
2. **Expandable rows** — `aria-expanded` on toggle button, `aria-controls` on content region
3. **Modal forms** — focus trap, `role="dialog"`, `aria-modal="true"`, ESC close
4. **Financial data** — `aria-label` สำหรับตัวเลข: "$1,000.00 → one thousand dollars"
5. **Country emoji flags** — `aria-hidden="true"` (เป็น decoration)
6. **Preview box** — `role="status"` เมื่อ content เปลี่ยน
7. **Icon buttons** — `aria-label` explicit (e.g., "แก้ไขเงินปันผล", "ลบเงินปันผล")
8. **Year filter** — `<label>` connected to `<select>`

---

## 🎯 Interaction Notes

1. **Country dropdown → WHT auto-fill is instant** — ไม่ต้องรอ validation
2. **Preview update is real-time** — พิมพ์ Gross Amount → Preview รีเฟรชทันที (ใช้ `watch()` จาก react-hook-form)
3. **Country note disappears when user overrides WHT** — แค่ WHT field note หาย, country note ข้างล่างยังอยู่
4. **Remit dialog amount validation** — validate ทันทีที่พิมพ์ (ไม่รอ submit)
5. **"Remit All" quick-fill** — เติม `remainingToRemitUSD` ให้, no confirm needed (undo ได้)
6. **Expandable row animation** — slideDown 250ms
7. **Tab switch preserves filter** — เปลี่ยนไป Trade Log แล้วกลับมา Dividend → year filter ยังคงเดิม
8. **No layout shift on country change** — WHT note height fixed (min-height), ป้องกัน form กระโดด

---

## 📐 Spec for Dev

### File: `src/components/DividendTab.tsx`

```typescript
interface DividendTabProps {
  trades: TradeTransaction[];            // From tradeSlice — read only
  dividends: DividendRecord[];           // From dividendSlice
  displayYear: number;
  onAdd: () => void;                      // Open DividendForm (add)
  onEdit: (id: string) => void;           // Open DividendForm (edit)
  onDelete: (id: string) => void;         // ConfirmDialog → delete
  onRemit: (id: string) => void;          // Open DividendRemitForm
  onYearChange: (year: number) => void;
}
```

### File: `src/components/DividendForm.tsx`

```typescript
interface DividendFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (record: DividendRecord) => void;
  editRecord?: DividendRecord;          // undefined = add mode
  availableSymbols: string[];           // From getAvailableSymbols(trades)
}
```

### File: `src/components/DividendRemitForm.tsx`

```typescript
interface DividendRemitFormProps {
  open: boolean;
  onClose: () => void;
  onRemit: (remittance: DividendRemittance) => void;
  dividend: DividendRecord;             // The dividend being remitted
}
```

---

## 🔗 Related Files

| File | Relationship |
|---|---|
| `docs/specs/dividend-tracker.md` | BA spec this design is based on |
| `docs/ux/design-system.md` | Design tokens and component patterns |
| `docs/ux/screens/dashboard-r2.md` | Parent dashboard — tab bar context |
| `src/types/trade.ts` | Dividend data types |
| `src/engine/dividendEngine.ts` | Pure functions for calc |
| `src/store/dividendSlice.ts` | Redux slice |
| `src/components/DividendTab.tsx` | Tab component |
| `src/components/DividendForm.tsx` | Add/Edit form |
| `src/components/DividendRemitForm.tsx` | Remittance form |
| `src/i18n/locales/en/dividend.json` | EN translations |
| `src/i18n/locales/th/dividend.json` | TH translations |

---

## ✅ Implementation Checklist (for Dev reference)

### Data Layer
- [ ] Types: `DividendRecord`, `DividendRemittance`, `DividendSummary`, `CountryCode`, `CountryWhtInfo`
- [ ] Constants: `COUNTRY_WHT_INFO`
- [ ] Zod schemas: `dividendSchema`, `dividendRemittanceSchema`
- [ ] Engine: `calculateDividendTHB`, `calculateWhtCredit`, `applyDividendRemittance`, `computeDividendSummary`, `getAvailableSymbols`, `validateRemittance`
- [ ] Store: `dividendSlice` with localStorage persistence

### UI Components
- [ ] Tab: "💵 เงินปันผล / Dividends" between Trade Log and Remittance Log
- [ ] KPI: 6 cards — reuse `KpiCard` with tooltip
- [ ] Table: 11 columns, responsive card view
- [ ] Expandable row: remittance history + delete/remit actions
- [ ] Empty state: CTA button "➕ บันทึกเงินปันผล"
- [ ] Year filter: same pattern as existing

### DividendForm
- [ ] Modal with form fields
- [ ] Country → WHT auto-fill + note display
- [ ] Symbol dropdown from BUY trades
- [ ] Real-time preview (THB snapshot)
- [ ] Edit mode: symbol locked, remittance block
- [ ] Delete: ConfirmDialog

### DividendRemitForm
- [ ] Modal with amount + date + FX
- [ ] Remit All quick-fill
- [ ] Preview: reportable income + WHT credit
- [ ] Validation: amount ≤ remaining
- [ ] Partial remit support (add multiple)

### i18n
- [ ] `dividend:` namespace EN/TH
- [ ] No `lang === 'th'` conditions

### Quality
- [ ] `tsc --noEmit` → 0 errors
- [ ] `npm test` → all pass
- [ ] Zero regressions in existing components