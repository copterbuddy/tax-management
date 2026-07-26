# 🎨 Design System — Thai Tax Tracker

> **Last updated:** 2026-07-26 (initial — to be expanded by UX agent)  
> **Purpose:** Single source of truth สำหรับ design tokens, components, และ patterns  
> **UX Agent:** อ่านไฟล์นี้ก่อนออกแบบทุกครั้ง

---

## 🎨 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | *(TBD by UX)* | Primary actions, links |
| `--color-primary-hover` | *(TBD by UX)* | Hover state |
| `--color-success` | *(TBD by UX)* | Positive gains, success states |
| `--color-danger` | *(TBD by UX)* | Losses, delete actions, errors |
| `--color-warning` | *(TBD by UX)* | Warnings, pending states |
| `--color-bg` | *(TBD by UX)* | Page background |
| `--color-surface` | *(TBD by UX)* | Card, modal, table background |
| `--color-text` | *(TBD by UX)* | Primary text |
| `--color-text-secondary` | *(TBD by UX)* | Secondary/muted text |
| `--color-border` | *(TBD by UX)* | Borders, dividers |

## 📝 Typography

| Token | Font Family | Size | Weight | Usage |
|---|---|---|---|---|
| `--font-heading` | *(TBD by UX)* | *(TBD)* | *(TBD)* | Page titles |
| `--font-subheading` | *(TBD by UX)* | *(TBD)* | *(TBD)* | Section headers |
| `--font-body` | *(TBD by UX)* | *(TBD)* | *(TBD)* | Body text |
| `--font-small` | *(TBD by UX)* | *(TBD)* | *(TBD)* | Captions, labels |
| `--font-mono` | *(TBD by UX)* | *(TBD)* | *(TBD)* | Numbers, code |

## 📏 Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | *(TBD)* | Tight spacing |
| `--space-sm` | *(TBD)* | Compact spacing |
| `--space-md` | *(TBD)* | Default spacing |
| `--space-lg` | *(TBD)* | Section spacing |
| `--space-xl` | *(TBD)* | Page margins |

## 🔲 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | *(TBD)* | Buttons, inputs |
| `--radius-md` | *(TBD)* | Cards, modals |
| `--radius-lg` | *(TBD)* | Large containers |

## 🧩 Component Patterns

> **UX Agent:** เพิ่ม component pattern ที่นี่เมื่อออกแบบ — 1 component ต่อ 1 section

### KpiCard
- **Layout:** *(TBD by UX)*
- **States:** default (value shown), loading (skeleton), empty ("--" or "฿0.00")
- **Variants:** positive (green), negative (red), neutral
- **Used in:** Dashboard

### TradeTable
- **Layout:** *(TBD by UX)*
- **States:** populated, empty ("ยังไม่มีรายการ"), loading (skeleton)
- **Columns:** Date, Symbol, Type, Provider, Qty, Price (USD), Commission (USD), Total (USD), Remitted, Taxable THB, Actions
- **Sortable:** Date, Symbol
- **Filterable:** Provider, Year
- **Used in:** Dashboard

### TradeForm (Modal)
- **Layout:** *(TBD by UX)*
- **States:** create (empty form), edit (pre-filled), validating (field errors), submitting (loading)
- **Fields:** Date, Symbol, Type (BUY/SELL), Provider, Quantity, Price (USD), Commission (USD), Notes
- **Used in:** Dashboard → Add/Edit Trade button

### RemitForm (Modal)
- **Layout:** *(TBD by UX)*
- **States:** create, validating, submitting
- **Fields:** Sell Trade (dropdown), Amount (USD), Date, FX Rate (THB/USD), Notes
- **Used in:** Dashboard → Remittance Log tab

### RemittanceLog
- **Layout:** *(TBD by UX)*
- **States:** populated, empty, loading
- **Features:** Year filter, totals row, progress bar per trade
- **Used in:** Dashboard → Remittance Log tab

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Layout |
|---|---|---|
| Mobile | 320px | 1-column, full-width cards, scrollable table |
| Tablet | 768px | 2-column KPI, scrollable table |
| Desktop | 1024px | 2-column KPI, full table, side panels |

---

## 🔄 Animation & Transitions

| Element | Trigger | Duration | Effect |
|---|---|---|---|
| Modal open | Click | *(TBD)* | Fade in + scale up |
| Modal close | Click/ESC | *(TBD)* | Fade out + scale down |
| Tab switch | Click | *(TBD)* | Fade transition |
| Row hover | Hover | *(TBD)* | Background color change |
| Progress bar | Data change | *(TBD)* | Width transition |

---

## ♿ Accessibility

- **Contrast Ratio:** ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- **Touch Targets:** ≥ 44px × 44px (mobile)
- **Focus States:** Visible focus ring on all interactive elements
- **Keyboard:** Tab order logical, Enter/Space for actions, Escape for modals

---

> **Note to UX Agent:** ไฟล์นี้คือ starting point — ทุกค่าที่ยังเป็น `(TBD)` ต้องถูกกำหนดเมื่อออกแบบหน้าจอแรกที่ต้องใช้ token นั้น
