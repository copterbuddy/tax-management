# 📐 Screen: Dashboard — Round 2 Redesign

> **Created:** 2026-07-26 | **Updated:** 2026-07-26 (Round 2)
> **Related Tasks:** TASK-017-R2 (UX/UI Improvement Round 2)

---

## 🎯 Design Goals — Round 2

1. **Progressive Disclosure** — KPI สำคัญสุดมาก่อน, รายละเอียดซ่อนอยู่หลัง tooltip
2. **Information Hierarchy** — ผู้ใช้ scan แล้วรู้ทันทีว่าต้องดูอะไร
3. **Context Everywhere** — ทุกตัวเลขมี "แล้วไง?" — trend, comparison, explanation
4. **Empty State ที่มีประโยชน์** — ไม่ใช่แค่บอกว่า "ไม่มีข้อมูล" แต่บอกว่าต้องทำอะไรต่อ
5. **Tooltip System** — คำศัพท์เทคนิคมี ⓘ กดเพื่ออ่านคำอธิบาย

---

## 🔄 KPI Card Reorder (ตามความสำคัญ)

**ของเดิม (ไม่เรียงลำดับ):**
1. Taxable Gain (นำเข้าแล้ว) — 💰
2. Total Remitted (USD) — 🏦
3. Net Gain (All Sells, USD) — 📈
4. Not Yet Remitted (USD) — 🌏

**ของใหม่ (เรียงตามความสำคัญ — F-pattern):**

| ตำแหน่ง | KPI | Icon | Variant | คำอธิบาย |
|---|---|---|---|---|
| 1 (ซ้ายบน) | **ภาษีที่ต้องยื่น (ประมาณการ)** | 💰 | highlight | ตัวเลขสำคัญที่สุดที่ผู้ใช้ต้องการรู้ |
| 2 | **นำเงินเข้าแล้ว (USD)** | 🏦 | neutral | เงินที่โอนเข้าไทยแล้ว |
| 3 | **กำไร/ขาดทุน สุทธิ (USD)** | 📈 | positive/negative | กำไรรวมที่ยังไม่รวมภาษี |
| 4 | **ยังไม่นำเข้า (USD)** | 🌏 | neutral | เงินที่ยังอยู่ในต่างประเทศ |

---

## 🆕 KPI Card — Enhanced Design

แต่ละ KPI card มี 3 ระดับข้อมูล:
```
┌──────────────────────────────────────┐
│ 💰  ภาษีที่ต้องยื่น (ประมาณการ)
  ⓘ   │  ← Title + tooltip
│     ฿45,230.50                       │  ← Value (ใหญ่สุด)
│     ≈ $1,239.19 USD                  │  ← Sub-value 1 (context)
│     จาก 3 รายการนำเงินเข้า · อัปเดตล่าสุด 20 มิ.ย.  │  ← Sub-value 2 (detail)
└──────────────────────────────────────┘
```

### Tooltip ⓘ Content:
- **ภาษีที่ต้องจ่าย:** "คำนวณจากส่วนกำไรของเงินที่นำเข้าไทย × อัตราแลกเปลี่ยน ณ วันที่นำเข้า เฉพาะส่วนกำไรที่ต้องเสียภาษีตามประมวลรัษฎากร"
- **นำเงินเข้าแล้ว:** "ยอดเงินที่โอนเข้าประเทศไทยแล้ว (ทั้งเงินต้นและกำไร) — ใช้คำนวณภาษีตามหลักเกณฑ์ ป.161/2566"
- **กำไร/ขาดทุน สุทธิ:** "กำไรรวมทุกการขาย (USD) — ยังไม่หักส่วนที่นำเข้าและยังไม่คำนวณภาษี"
- **ยังไม่นำเข้า:** "เงินที่ได้จากการขายแต่ยังอยู่ในบัญชีต่างประเทศ — ยังไม่ต้องเสียภาษีจนกว่าจะนำเข้าไทย"

---

## 🆕 Tooltip Component

```
ⓘ ← กดปุ่มนี้
│
▼
┌──────────────────────────────┐
│  💡 คำอธิบาย                  │
│                              │
│  คำนวณจากส่วนกำไรของเงินที่   │
│  นำเข้าไทย × อัตราแลกเปลี่ยน   │
│  ณ วันที่นำเข้า ...           │
│                              │
│  📖 อ่านเพิ่มเติมเกี่ยวกับภาษี  │
└──────────────────────────────┘
```

- เปิด: click ที่ ⓘ icon
- ปิด: click ที่เดิม, click outside, ESC key
- Position: below icon, auto-flip
- Animation: fadeIn + slideDown (150ms)

---

## 🆕 Empty States (ปรับปรุง)

### Dashboard — ยังไม่มีข้อมูลเลย
```
┌──────────────────────────────────────┐
│                                      │
│           📊 (64px)                  │
│                                      │
│      เริ่มต้นติดตามภาษีการลงทุน       │
│                                      │
│   บันทึกรายการซื้อขายหุ้นต่างประเทศ    │
│   และติดตามภาษีที่ต้องจ่ายเมื่อนำเงิน   │
│   เข้าประเทศไทย ได้ง่ายๆ ที่นี่        │
│                                      │
│        [➕ เพิ่มรายการแรก]            │
│                                      │
│   💡 ยังไม่แน่ใจ? อ่านคู่มือเริ่มต้น   │
└──────────────────────────────────────┘
```

### Trade Table — ไม่มีรายการในปีที่เลือก
```
┌──────────────────────────────────────┐
│                                      │
│           🔍 (48px)                  │
│                                      │
│     ไม่มีรายการซื้อขายในปี 2026      │
│                                      │
│   ลองเปลี่ยนปีภาษีด้านบน              │
│   หรือเพิ่มรายการซื้อขายใหม่          │
│                                      │
│        [➕ เพิ่มรายการ]              │
└──────────────────────────────────────┘
```

---

## 🧩 Components Changed (Round 2)

| Component | Change |
|---|---|
| KpiCard | เพิ่ม tooltip ⓘ, เพิ่ม sub-value แถวที่ 2, variant=highlight |
| Tooltip | 🆕 Component ใหม่ — ใช้กับ KPI + คำศัพท์ในตาราง |
| Dashboard | จัด KPI ใหม่ตามลำดับความสำคัญ, empty states |
| TradeTable | ปุ่ม Add ใน empty state |
| RemittanceLog | ปุ่ม Record ใน empty state |

---

## 📐 Spec for Dev

### 1. Tooltip Component (`src/components/Tooltip.tsx`)
```typescript
interface TooltipProps {
  content: string;       // คำอธิบาย (รองรับ \n สำหรับขึ้นบรรทัดใหม่)
  children?: ReactNode;  // trigger element (default: ⓘ icon)
  position?: 'top' | 'bottom' | 'left' | 'right';
}
```

### 2. KpiCard — เพิ่ม props:
```typescript
interface KpiCardProps {
  // ... existing
  tooltip?: string;      // ถ้ามี → แสดง ⓘ และ tooltip
  subValue2?: string;    // context แถวที่ 2
}
```

### 3. Dashboard — Empty state override
- ถ้า `trades.length === 0` → แสดง landing empty state
- ถ้า `yearTrades.length === 0` แต่มี trades ในปีอื่น → แสดง "no trades for this year"
