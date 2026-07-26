# 📐 Screen: Dashboard (หน้าจอหลัก)

> **Created:** 2026-07-26 | **Updated:** 2026-07-26 (Round 1)
> **Related Tasks:** TASK-017 (UX/UI Improvement Round 1)

---

## 🗺️ User Flow Context

- **User Goal:** ดูภาพรวมภาษีการลงทุน — กำไร/ขาดทุน, ภาษีที่ต้องจ่าย, รายการซื้อขาย, การนำเงินเข้าไทย
- **มาจากหน้า:** (หน้าเดียว — Single Page App)
- **ไปต่อหน้า:** Modal forms (TradeForm, RemitForm)

---

## 📱 Layout — Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────┐
│  Header                                                   │
│  📊 ภาษีหุ้นต่างประเทศ — ติดตาม    [☀️] [TH|EN]          │
│  คำนวณภาษีตามหลักเกณฑ์กรมสรรพากร                         │
├──────────────────────────────────────────────────────────┤
│  ภาษีปี: [2026 ▼]                    🟢 ข้อมูลล่าสุด: วันนี้ │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ 💰 ภาษีที่ต้อง │ │ 🏦 นำเข้าแล้ว  │ │ 📈 กำไรสุทธิ   │ │ 🌏 ยังไม่นำเข้า │ │
│  │    จ่าย       │ │   (USD)      │ │   (USD)      │ │   (USD)      │ │
│  │ ฿45,230.50   │ │ $12,500.00   │ │ +$3,850.00   │ │ $8,650.00    │ │
│  │ จาก 3 รายการ  │ │ จาก 5 รายการ  │ │ จาก 5 ขาย     │ │ รอในต่างประเทศ │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
├──────────────────────────────────────────────────────────┤
│  [📊 บันทึกซื้อขาย]  [🏦 บันทึกนำเงินเข้า]                   │
├──────────────────────────────────────────────────────────┤
│  📋 ประวัติการซื้อขาย — 2026                   [+ เพิ่มรายการ] │
│  (12 รายการ — 7 ซื้อ / 5 ขาย)                             │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Date    │ Sym │ Provider │ Type │ Qty  │ ... │ Gain   │ │
│  │─────────┼─────┼──────────┼──────┼──────┼─────┼────────│ │
│  │ 2026-03 │ AAPL│ Dime     │ BUY  │ 10   │ ... │ -      │ │
│  │ 2026-06 │ AAPL│ Dime     │ SELL │ 10   │ ... │ +$497  │ │
│  │ ...                                                │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 📱 Layout — Mobile (<640px)

```
┌──────────────────────────┐
│  📊 ภาษีหุ้นต่างประเทศ     │
│  ติดตามภาษีการลงทุน  [☀️] │
├──────────────────────────┤
│  ภาษีปี: [2026 ▼]        │
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │ 💰 ภาษีที่ต้องจ่าย   │  │
│  │ ฿45,230.50         │  │
│  │ จาก 3 รายการนำเข้า   │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🏦 นำเข้าแล้ว (USD)  │  │
│  │ $12,500.00         │  │
│  │ จาก 5 รายการขาย     │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 📈 กำไรสุทธิ (USD)   │  │
│  │ +$3,850.00         │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ 🌏 ยังไม่นำเข้า (USD) │  │
│  │ $8,650.00          │  │
│  └────────────────────┘  │
├──────────────────────────┤
│ [📊 ซื้อขาย] [🏦 นำเข้า]  │
├──────────────────────────┤
│  ┌─── AAPL · BUY ───┐   │
│  │ 2026-03-15        │   │
│  │ Dime · 10 shares  │   │
│  │ $185.50 · Fee $1.5│   │
│  │ Total: $1,856.50  │   │
│  └───────────────────┘   │
│  ┌─── AAPL · SELL ───┐   │
│  │ 2026-06-20        │   │
│  │ Dime · 10 shares  │   │
│  │ $200 · Fee $2     │   │
│  │ Gain: +$497 ✅     │   │
│  │ Taxable: ฿4,541   │   │
│  └───────────────────┘   │
└──────────────────────────┘
```

---

## 🧩 Components

| Component | Position | Props/Variants | Notes |
|---|---|---|---|
| Header | Top | title, subtitle, themeToggle, langSwitch | Sticky on mobile |
| YearFilter | Below header | selectedYear, years[], onChange | + "ข้อมูลล่าสุด" indicator |
| KpiCard × 4 | Below filter | variant: highlight/neutral/positive/neutral | ดู design-system KpiCard |
| TabNav | Below KPI | tabs: ['trades', 'remittances'] | 2 tabs |
| TradeTable | Active tab 1 | trades, gains, year, callbacks | หรือ card view บน mobile |
| RemittanceLog | Active tab 2 | gains, callbacks | |
| TradeForm (modal) | On demand | trade?, onSubmit, onCancel, onValidate | |
| RemitForm (modal) | On demand | gains, onSubmit, onCancel | |

---

## 🎭 States

| State | เมื่อไหร่ | หน้าตา |
|---|---|---|
| **Empty (no data)** | ยังไม่มีรายการเลย | Empty state: icon + "เริ่มต้นบันทึกการลงทุน" + ปุ่มเพิ่มรายการ |
| **Empty (no data for year)** | มีข้อมูลแต่คนละปี | Empty state: "ไม่มีรายการในปี 2026" + hint ให้เปลี่ยนปี |
| **Loading** | ครั้งแรก (localStorage ช้า) | 4 skeleton KPI cards + 5 skeleton rows |
| **Populated** | มีข้อมูล | KPI + ตาราง/การ์ด |
| **Error** | localStorage เสีย | Error banner + ปุ่ม reset |

---

## 🎯 Interaction Notes

1. **KPI คลิกได้** — คลิก KPI การ์ด → filter ตารางตามหมวดนั้น (optional, Round 3)
2. **Tab เปลี่ยน** — KPI คงเดิม, เฉพาะตารางด้านล่างเปลี่ยน
3. **Row click** — คลิกแถวในตาราง → เปิด TradeForm แบบแก้ไข
4. **Theme toggle** — animate icon หมุน 360°
5. **Year change** — KPI + ตารางเปลี่ยนตามปีที่เลือก
6. **Data freshness** — แสดง "อัปเดตล่าสุด: <เวลาที่แก้ไขล่าสุด>" ถัดจาก year filter

---

## 📱 Responsive

| Breakpoint | Layout Changes |
|---|---|
| Desktop (≥1024px) | 4-column KPI, full table, side padding 24px |
| Tablet L (768-1023px) | 2-column KPI, table hides Fee+Remitted columns |
| Tablet (640-767px) | 2-column KPI, table hides Fee+Remitted columns, 20px padding |
| Mobile L (480-639px) | 2-column KPI, card view (no table), 16px padding |
| Mobile S (<480px) | 1-column KPI, card view, full-width, 12px padding |

---

## 🆕 สิ่งที่เปลี่ยนจากของเดิม (Quick Reference สำหรับ Dev)

| ของเดิม | เปลี่ยนเป็น |
|---|---|
| Dark mode only | Light mode default + dark mode toggle |
| KPI แข็งๆ (gains only) | KPI มี hierarchy: สำคัญสุดก่อน + มี tooltip ⓘ |
| KPI static | KPI มี context: "จาก N รายการ" |
| Tab เป็น plain button | Tab มี active indicator ชัดเจน |
| Empty state ธรรมดา | Empty state มี illustration + CTA button |
| ไม่มี data freshness | แสดง "อัปเดตล่าสุด" |
| ตาราง 12 คอลัมน์ทุกขนาด | Responsive columns + card view บน mobile |
| Header มีแค่ lang switch | Header มี theme toggle + lang switch |
