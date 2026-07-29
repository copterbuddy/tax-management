# 🎨 Design System — Thai Tax Tracker

> **Last updated:** 2026-07-26 (Round 1: Complete Design System Foundation)  
> **Purpose:** Single source of truth สำหรับ design tokens, components, และ patterns  
> **UX Agent:** อ่านไฟล์นี้ก่อนออกแบบทุกครั้ง

---

## 🎨 Color Palette

### Light Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | #4f46e5 | Primary actions, links, accent |
| `--color-primary-hover` | #4338ca | Hover state for primary |
| `--color-primary-bg` | #eef2ff | Primary tint background (badges, highlights) |
| `--color-success` | #059669 | Positive gains, success states |
| `--color-success-bg` | #ecfdf5 | Success tint background |
| `--color-danger` | #dc2626 | Losses, delete actions, errors |
| `--color-danger-bg` | #fef2f2 | Danger tint background |
| `--color-warning` | #d97706 | Warnings, pending states |
| `--color-warning-bg` | #fffbeb | Warning tint background |
| `--color-bg` | #f8fafc | Page background |
| `--color-surface` | #ffffff | Card, modal, table background |
| `--color-surface-hover` | #f1f5f9 | Hover state for cards/rows |
| `--color-surface-elevated` | #ffffff | Elevated surface (dropdown, popover) |
| `--color-text-primary` | #0f172a | Primary text (headings, body) |
| `--color-text-secondary` | #475569 | Secondary/muted text |
| `--color-text-tertiary` | #94a3b8 | Placeholder, disabled text |
| `--color-border` | #e2e8f0 | Borders, dividers |
| `--color-border-light` | #f1f5f9 | Subtle borders |
| `--color-input-bg` | #ffffff | Input background |
| `--color-input-border` | #cbd5e1 | Input border |
| `--color-table-header-bg` | #f8fafc | Table header background |
| `--color-table-row-alt` | #f8fafc | Alternating row (zebra stripe) |
| `--color-overlay` | rgba(15, 23, 42, 0.5) | Modal/drawer backdrop |

### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | #818cf8 | Primary actions, links, accent |
| `--color-primary-hover` | #6366f1 | Hover state for primary |
| `--color-primary-bg` | rgba(129, 140, 248, 0.12) | Primary tint background |
| `--color-success` | #34d399 | Positive gains, success states |
| `--color-success-bg` | rgba(52, 211, 153, 0.10) | Success tint background |
| `--color-danger` | #f87171 | Losses, delete actions, errors |
| `--color-danger-bg` | rgba(248, 113, 113, 0.10) | Danger tint background |
| `--color-warning` | #fbbf24 | Warnings, pending states |
| `--color-warning-bg` | rgba(251, 191, 36, 0.10) | Warning tint background |
| `--color-bg` | #0f1117 | Page background |
| `--color-surface` | #1a1d28 | Card, modal, table background |
| `--color-surface-hover` | #232636 | Hover state for cards/rows |
| `--color-surface-elevated` | #1e2130 | Elevated surface (dropdown, popover) |
| `--color-text-primary` | #e8eaf0 | Primary text |
| `--color-text-secondary` | #9ca3af | Secondary/muted text |
| `--color-text-tertiary` | #6b7280 | Placeholder, disabled text |
| `--color-border` | #2a2d3a | Borders, dividers |
| `--color-border-light` | #353849 | Subtle borders |
| `--color-input-bg` | #252836 | Input background |
| `--color-input-border` | #353849 | Input border |
| `--color-table-header-bg` | #1e2130 | Table header background |
| `--color-table-row-alt` | rgba(30, 33, 48, 0.4) | Alternating row |
| `--color-overlay` | rgba(0, 0, 0, 0.6) | Modal/drawer backdrop |

### Theme Switching

```css
/* Default: Light mode */
:root { /* light mode tokens */ }

/* Dark mode override */
[data-theme="dark"] { /* dark mode tokens */ }

/* System preference auto-detection */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark mode tokens */ }
}
```

- Default: `light` (ตามที่ผู้ใช้เลือก)
- เก็บ preference ใน `localStorage` key: `tax_tracker_theme`
- Transition: `background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease`

---

## 📝 Typography

### Font Families

| Token | Font Stack | Usage |
|---|---|---|
| `--font-sans` | `'Sarabun', 'Noto Sans Thai', system-ui, -apple-system, sans-serif` | Body text, headings, UI |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', ui-monospace, Consolas, monospace` | Numbers, financial data, code |

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | 1.5 | 400/500/600 | Badge text, tooltip, caption |
| `--text-sm` | 0.8125rem (13px) | 1.5 | 400/500/600 | Table cell, form label, helper text |
| `--text-base` | 0.9375rem (15px) | 1.6 | 400/500/600 | Body text, input value, button |
| `--text-lg` | 1.125rem (18px) | 1.5 | 500/600/700 | Section title, card title |
| `--text-xl` | 1.25rem (20px) | 1.4 | 600/700 | Modal title, KPI label |
| `--text-2xl` | 1.5rem (24px) | 1.3 | 700 | KPI value (numbers) |
| `--text-3xl` | 1.75rem (28px) | 1.2 | 700 | Page title (h1) |

### Heading Styles

```css
h1 { font-size: var(--text-3xl); font-weight: 700; letter-spacing: -0.02em; }
h2 { font-size: var(--text-xl); font-weight: 600; letter-spacing: -0.01em; }
h3 { font-size: var(--text-lg); font-weight: 600; }
```

### Financial Numbers

- ตัวเลขทั้งหมดใช้ `--font-mono`
- จัดชิดขวา (`text-align: right`)
- ใช้ `tabular-nums` (fixed-width digits — ป้องกันตัวเลขกระพริบเวลาเปลี่ยน)
- ตัวเลขบวกแสดง `+` นำหน้า, ตัวเลขลบแสดง `-` นำหน้า
- Format: `$1,234.56` / `฿12,345.67` (มี comma, ทศนิยม 2 ตำแหน่ง)

---

## 📏 Spacing Scale (4px base system)

| Token | Value | Usage |
|---|---|---|
| `--space-0` | 0 | No spacing |
| `--space-1` | 0.25rem (4px) | Tight gap (icon+label, badge padding) |
| `--space-2` | 0.5rem (8px) | Compact gap, button padding-y, inline gap |
| `--space-3` | 0.75rem (12px) | Form row gap, table cell padding-x |
| `--space-4` | 1rem (16px) | Default gap, card padding, section gap |
| `--space-5` | 1.25rem (20px) | KPI card padding |
| `--space-6` | 1.5rem (24px) | Section spacing, modal padding |
| `--space-8` | 2rem (32px) | Large section gap |
| `--space-10` | 2.5rem (40px) | Page top/bottom padding |
| `--space-12` | 3rem (48px) | Major layout separation |

### Layout Container

| Token | Value | Usage |
|---|---|---|
| `--container-max` | 1280px | Max page width |
| `--container-padding` | var(--space-4) | Page edge padding (mobile) |
| `--container-padding-desktop` | var(--space-6) | Page edge padding (desktop) |

---

## 🔲 Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-none` | 0 | Table, divider |
| `--radius-sm` | 0.375rem (6px) | Input, button, badge, select |
| `--radius-md` | 0.625rem (10px) | Card, table container |
| `--radius-lg` | 1rem (16px) | Modal, drawer |
| `--radius-full` | 9999px | Pill badge, progress bar, avatar |

---

## 🧭 Shadow / Elevation

### Light Mode

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Card default |
| `--shadow-md` | 0 4px 12px rgba(0,0,0,0.08) | Card hover, dropdown, popover |
| `--shadow-lg` | 0 12px 40px rgba(0,0,0,0.12) | Modal, drawer |
| `--shadow-xl` | 0 20px 60px rgba(0,0,0,0.18) | Full-screen overlay |

### Dark Mode

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.3) | Card default |
| `--shadow-md` | 0 4px 12px rgba(0,0,0,0.4) | Card hover, dropdown, popover |
| `--shadow-lg` | 0 12px 40px rgba(0,0,0,0.5) | Modal, drawer |
| `--shadow-xl` | 0 20px 60px rgba(0,0,0,0.6) | Full-screen overlay |

---

## 🎬 Animation & Transitions

| Token | Value | Usage |
|---|---|---|
| `--duration-fast` | 150ms | Hover color change, focus ring, icon spin |
| `--duration-normal` | 250ms | Modal open/close, tab switch, card hover |
| `--duration-slow` | 400ms | Theme switch, progress bar fill, page transition |
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Default transition (decelerating) |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | Modal animation (symmetric) |
| `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | Bouncy micro-interaction (success checkmark) |

### Keyframe Animations

```css
@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp      { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideDown    { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn      { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes shimmer      { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes progressFill { from { width: 0%; } to { width: var(--progress-width); } }
```

---

## 🧩 Component Patterns

> **Usage:** Dev ใช้ section นี้เป็น pattern reference — ทุก component ต้อง implement ตาม spec นี้

---

### Button

| Variant | Background | Text Color | Border | Hover | Disabled |
|---|---|---|---|---|---|
| **Primary** | `--color-primary` | white | none | `--color-primary-hover` + `translateY(-1px)` | opacity 0.5, no hover |
| **Secondary** | `--color-surface` | `--color-text-primary` | `--color-border` | `--color-surface-hover` | opacity 0.5 |
| **Danger** | `--color-danger` | white | none | darken 10% | opacity 0.5 |
| **Ghost** | transparent | `--color-text-secondary` | none | `--color-surface-hover` | opacity 0.5 |
| **Icon** | transparent | `--color-text-secondary` | none | `--color-primary-bg` | opacity 0.5 |

**Size Scale:**

| Size | Padding | Font Size | Min Height |
|---|---|---|---|
| **sm** | 6px 12px | `--text-xs` | 32px |
| **md** (default) | 8px 16px | `--text-sm` | 40px |
| **lg** | 12px 24px | `--text-base` | 48px |

**States:** default, hover, focus-visible (ring 2px offset 2px), active (scale 0.98), disabled

**Rules:**
- Icon-only buttons: min-width = min-height (square)
- Focus ring: `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-primary)` — visible in both modes
- Touch target ≥ 44px (mobile)

---

### KpiCard

```
┌──────────────────────────────────────┐
│  💰  ภาษีที่ต้องยื่น (ประมาณการ)          │
│       ฿45,230.50                     │
│       จาก 3 รายการนำเข้า | อัปเดตล่าสุด: วันนี้  │
└──────────────────────────────────────┘
```

**Layout:**
- Flex row (icon + body)
- Icon: 32px, flex-shrink 0
- Padding: `--space-5` (20px)
- Gap between icon and body: `--space-3` (12px)

**Typography:**
- Title: `--text-xs`, uppercase, `--color-text-tertiary`, letter-spacing 0.05em
- Value: `--text-2xl`, `--font-mono`, `--color-text-primary`, font-weight 700
- Sub-value: `--text-xs`, `--color-text-tertiary`, margin-top 4px

**Variants:**
| Variant | Border | Background |
|---|---|---|
| **default** | `--color-border` | `--color-surface` |
| **positive** (gain > 0) | `--color-success` at 25% opacity | `--color-success-bg` gradient |
| **negative** (loss) | `--color-danger` at 25% opacity | `--color-danger-bg` gradient |
| **neutral** | `--color-border` | `--color-surface` |
| **highlight** | `--color-primary` at 25% opacity | `--color-primary-bg` gradient |

**States:**
| State | Display |
|---|---|
| **populated** | แสดงค่าจริง |
| **empty** | แสดง `฿0.00` หรือ `$0.00` — ไม่แสดง `--` |
| **loading** | Skeleton pulse — รูปทรงเดียวกับ card จริง |

**Hover:** `translateY(-2px)`, shadow เพิ่มขึ้น, border color เข้มขึ้น — transition 200ms

**Rules:**
- 1 KPI = 1 เรื่อง — ห้ามยัดหลายเรื่องใน card เดียว
- ต้องมี icon/emoji นำหน้าเพื่อให้ scan ง่าย
- Sub-value แสดง context: "จาก N รายการ", "เทียบกับปีก่อน +12%"

---

### TradeTable

**Container:** `--color-surface`, border `--color-border`, `--radius-md`, overflow hidden

**Header:**
- Title + count + เพิ่มรายการ button — flex space-between
- Padding: `--space-4` (16px) x `--space-5` (20px)
- Border-bottom: 1px `--color-border`

**Table:**
- Width: 100%, border-collapse: collapse
- Header bg: `--color-table-header-bg`
- Header text: `--text-xs`, uppercase, `--color-text-tertiary`, font-weight 600, letter-spacing 0.05em
- Header padding: `--space-3` (12px) x `--space-4` (16px)
- Cell padding: `--space-3` (12px) x `--space-4` (16px)
- Row border-bottom: 1px `--color-border-light`
- Row hover: `--color-surface-hover` — transition 150ms
- Zebra stripe: even rows `--color-table-row-alt` (subtle, optional)

**Columns (Desktop ≥768px):**

| # | Column | Width | Align | Sortable | Responsive |
|---|---|---|---|---|---|
| 1 | Date | 110px | left | ✅ | Always show |
| 2 | Symbol | 90px | left | ✅ | Always show |
| 3 | Provider | 120px | left | ❌ | Hide <480px |
| 4 | Type | 72px | center | ❌ | Always show |
| 5 | Qty | 72px | right | ❌ | Always show |
| 6 | Price (USD) | 110px | right | ❌ | Hide <640px |
| 7 | Fee (USD) | 100px | right | ❌ | Hide <768px |
| 8 | Total (USD) | 120px | right | ❌ | Always show |
| 9 | Gain (USD) | 110px | right | ❌ | Show as badge |
| 10 | Remitted | 130px | right | ❌ | Hide <768px |
| 11 | Taxable THB | 130px | right | ❌ | Always show |
| 12 | Actions | 72px | center | ❌ | Always show |

**Mobile Card View (<640px):** แปลงแต่ละ row เป็น card:
```
┌─────────────────────────────────┐
│ AAPL  🔵 BUY    Dime     ✏️ 🗑️  │
│ 2026-03-15                      │
│ 10 shares × $185.50             │
│ Fee: $1.50  |  Total: $1,856.50 │
└─────────────────────────────────┘
```

**Sort Indicators:** ▲/▼ หลัง column header ที่ sort อยู่ — สี `--color-primary`

**Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│         📊 (icon 64px)         │
│    ยังไม่มีรายการซื้อขายในปี 2026  │
│   กด "+ เพิ่มรายการ" เพื่อเริ่มต้น  │
│                                 │
│      [➕ เพิ่มรายการแรก]         │
└─────────────────────────────────┘
```

**Loading State:** 5 skeleton rows — แต่ละ row มี 12 cells เป็น shimmer animation

---

### TradeForm (Modal)

**Overlay:** fixed inset-0, `--color-overlay`, backdrop-filter blur(4px), z-index 1000

**Modal:**
- Width: 540px max, 94vw (mobile fallback)
- Max-height: 90vh, overflow-y auto
- Background: `--color-surface`, border `--color-border`, `--radius-lg`, `--shadow-lg`
- Animation: fadeIn overlay + scaleIn modal (250ms)

**Header:**
- Title + close button (×)
- Padding: `--space-5` (20px) x `--space-6` (24px)
- Border-bottom: 1px `--color-border`

**Form Body:**
- Padding: `--space-5` (20px) x `--space-6` (24px)
- Gap between fields: `--space-4` (16px)

**Field Groups (2-column grid → 1-column on mobile):**
```
Row 1: [Date ..............] [Symbol ............]
Row 2: [Trade Type ........] [Provider ..........]
Row 3: [Quantity ..........] [Price (USD) .......]
Row 4: [Commission (USD) ..] [...................]
Row 5: [Notes (optional) ..................]
```

**Input Styles:**
- Height: 42px (min)
- Padding: 10px 12px
- Background: `--color-input-bg`
- Border: 1px `--color-input-border`, radius `--radius-sm`
- Font: `--font-sans`, `--text-base`
- Focus: border-color `--color-primary`, box-shadow `0 0 0 3px var(--color-primary-bg)`
- Error: border-color `--color-danger`, error text below in `--text-xs` `--color-danger`
- Placeholder: `--color-text-tertiary`

**Form Actions:**
- Flex row, justify-end, gap `--space-2`
- Border-top: 1px `--color-border`, padding-top `--space-4`, margin-top `--space-4`

**Validation Error Banner:**
- Background: `--color-danger-bg`, border-left: 3px `--color-danger`
- Padding: `--space-3` `--space-4`, radius `--radius-sm`
- Text: `--text-sm`, `--color-danger`
- Icon: ⚠️ prefix

**States:** create (empty), edit (pre-filled), validating (field errors), submitting (button loading spinner)

---

### RemitForm (Modal)

เหมือน TradeForm ทุกประการ (ใช้ CSS class เดียวกัน) — เพิ่มเติม:

**Remit Preview Box:**
```
┌─────────────────────────────────────────┐
│ 💡 ภาษีที่ต้องจ่ายโดยประมาณ            │
│ $250.00 USD × 36.50 THB/USD            │
│ = ฿9,125.00                            │
│                                         │
│ ℹ️ เฉพาะส่วนกำไร (25.0%) ที่ต้องเสียภาษี │
│   เงินต้นที่นำกลับเข้าประเทศไม่ต้องเสียภาษี │
└─────────────────────────────────────────┘
```
- Background: `--color-primary-bg`, border-left: 3px `--color-primary`
- Padding: `--space-4`, radius `--radius-sm`
- แสดงเมื่อ: selected sell trade + amount USD + FX rate — ครบ 3 ค่า

---

### RemittanceLog

**Layout:** เหมือน TradeTable section

**Columns:**

| # | Column | Width | Align |
|---|---|---|---|
| 1 | Remit Date | 120px | left |
| 2 | Symbol | 80px | left |
| 3 | Provider | 100px | left |
| 4 | Amount (USD) | 110px | right |
| 5 | FX Rate | 90px | right |
| 6 | Gain % | 80px | right |
| 7 | Taxable (THB) | 130px | right |
| 8 | Notes | auto | left |

**Summary Footer Row:**
- Background: `--color-primary-bg`
- Font-weight: 600
- Border-top: 2px `--color-border`

**Year Filter:** Select dropdown — เหมือน year filter บน Dashboard

---

### Tabs

```
┌──────────────────────────────────────────┐
│  [📊 บันทึกการซื้อขาย]  [🏦 บันทึกนำเงินเข้า] │
│  ────────────                            │
└──────────────────────────────────────────┘
```

- Container: border-bottom 1px `--color-border`
- Tab button: padding `--space-3` `--space-5`, no border, `--text-sm`
- Active: color `--color-primary`, border-bottom 2px `--color-primary`, font-weight 600
- Inactive: color `--color-text-tertiary`
- Hover (inactive): color `--color-text-secondary`
- Transition: color 150ms, border-color 150ms

---

### Tooltip (ⓘ info icon)

- Trigger: `ⓘ` or `?` icon button — 18px, color `--color-text-tertiary`
- Tooltip box: `--color-surface-elevated`, border `--color-border`, `--shadow-md`, `--radius-sm`
- Padding: `--space-2` `--space-3`, max-width: 280px
- Font: `--text-xs`, `--color-text-secondary`
- Arrow: 6px, same color as tooltip bg
- Open: click (ไม่ใช้ hover — accessibility)
- Close: click outside, ESC key, or click trigger again
- Position: top/bottom/left/right — auto-flip เมื่อชนขอบจอ

---

### Year Filter

```
ภาษีปี: [2026 ▼]
```

- Label + select inline, gap `--space-2`
- Select: height 40px, padding `--space-2` `--space-3`, `--color-input-bg`, border `--color-border`, `--radius-sm`
- Focus: border-color `--color-primary`

---

### Badge / Tag

| Variant | Background | Text Color | Usage |
|---|---|---|---|
| **success** | `--color-success-bg` | `--color-success` | BUY, positive gain, completed |
| **danger** | `--color-danger-bg` | `--color-danger` | SELL, negative gain, error |
| **warning** | `--color-warning-bg` | `--color-warning` | Pending, partial |
| **neutral** | `--color-surface-hover` | `--color-text-secondary` | Provider, info |
| **primary** | `--color-primary-bg` | `--color-primary` | Active, selected |

**Style:** padding 2px 8px, `--radius-sm`, `--text-xs`, font-weight 600, uppercase

---

### Progress Bar (Remittance %)

```
┌──────────────────────────┐
│ ████████████░░░░░░░░░░░░ │  65%
│ $650 / $1,000            │
└──────────────────────────┘
```

- Track: height 6px, `--color-border-light`, `--radius-full`, width 100%
- Fill: height 100%, `--color-primary`, `--radius-full`, transition width 400ms `--ease-out`
- Label: `--text-xs`, `--font-mono`, right-aligned below bar
- Variants: complete (100%) → fill uses `--color-success`

---

### Skeleton Loading

```css
.skeleton {
  background: linear-gradient(90deg,
    var(--color-surface-hover) 25%,
    var(--color-border-light) 37%,
    var(--color-surface-hover) 63%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

- รักษารูปทรงเดียวกับ content จริง
- ไม่มีการกระพริบ — smooth shimmer เท่านั้น
- ใช้กับ: KPI cards (4 skeleton cards), Table (5 skeleton rows), Forms (ไม่ใช้ — โหลดเร็วพอ)

---

### Empty State

```
┌─────────────────────────────────┐
│                                 │
│         🏦 (icon 64px)          │
│                                 │
│     ยังไม่มีรายการนำเงินเข้า      │
│                                 │
│   เมื่อคุณขายหุ้นและนำเงินเข้า    │
│   ประเทศไทย มากดบันทึกที่นี่      │
│                                 │
│      [➕ บันทึกนำเงินเข้า]        │
└─────────────────────────────────┘
```

- Centered, padding `--space-12` top/bottom
- Icon: 64px, margin-bottom `--space-4`
- Title: `--text-lg`, `--color-text-primary`, margin-bottom `--space-2`
- Description: `--text-sm`, `--color-text-tertiary`, max-width 360px, text-align center
- CTA button: margin-top `--space-5`

---

### Language Switcher

```
[TH | EN]
```

- Position: header-right
- Two buttons: TH / EN — active = `--color-primary-bg` + `--color-primary`, inactive = ghost
- Size: sm (32px height), padding 6px 10px
- Font: `--text-xs`, font-weight 600
- Transition: background 150ms

---

### Theme Toggle

```
[☀️ / 🌙]
```

- Position: header-right, ข้างๆ language switcher
- Icon button: 36px × 36px, rounded, ghost style
- Light mode → show 🌙 icon (switch to dark)
- Dark mode → show ☀️ icon (switch to light)
- Transition: icon rotate 360° (400ms `--ease-spring`)

---

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Layout Strategy |
|---|---|---|
| **Mobile S** | 320px | 1-column KPI, card-view table, full-screen modal, 16px page padding |
| **Mobile L** | 480px | 2-column KPI, card-view table, 16px page padding |
| **Tablet** | 640px | 2-column KPI, table view (hide Fee column), 20px page padding |
| **Tablet L** | 768px | 2-column KPI, table view (hide Remitted column), side padding |
| **Desktop** | 1024px | 2-3 column KPI (auto-fill), full table, 24px page padding |
| **Desktop L** | 1280px | 3-4 column KPI, full table, max-width container centered |

### Responsive Rules:
1. **KPI Grid:** `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`
2. **Table → Cards:** ที่ <640px, ตารางซับซ้อนแปลงเป็น card layout
3. **Modal:** ที่ <640px, modal เต็มจอ (100vw × 100vh), ไม่มี border-radius
4. **Touch:** ที่ <768px (touch device), min touch target 44px
5. **Forms:** ที่ <640px, form-row เปลี่ยนจาก 2-column เป็น 1-column

---

## ♿ Accessibility

### Contrast Ratios
| Element | Requirement | Light Mode Check | Dark Mode Check |
|---|---|---|---|
| Body text (small) | ≥ 4.5:1 | `#0f172a` on `#f8fafc` = 15.2:1 ✅ | `#e8eaf0` on `#0f1117` = 13.8:1 ✅ |
| Body text (large) | ≥ 3:1 | ✅ | ✅ |
| Primary button text | ≥ 4.5:1 | white on `#4f46e5` = 6.3:1 ✅ | white on `#818cf8` = 3.8:1 ⚠️ (large text only) |
| Placeholder text | ≥ 4.5:1 | `#94a3b8` on white = 3.0:1 ⚠️ | `#6b7280` on `#252836` = 4.6:1 ✅ |
| Success green on bg | ≥ 3:1 (large) | `#059669` on `#ecfdf5` = 4.5:1 ✅ | `#34d399` on dark = 5.2:1 ✅ |
| Danger red on bg | ≥ 3:1 (large) | `#dc2626` on `#fef2f2` = 4.7:1 ✅ | `#f87171` on dark = 4.8:1 ✅ |

### Focus States
- ทุก interactive element ต้องมี visible focus ring
- Focus ring: `0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-primary)`
- ห้ามใช้ `outline: none` โดยไม่มี replacement
- Focus order ต้อง logical (tab ผ่าน form fields → buttons)

### Touch Targets
- ≥ 44px × 44px สำหรับทุก interactive element บน mobile
- Links ในเนื้อหา: sufficient padding หรือ line-height
- Icon buttons: min 36px × 36px, ideal 44px × 44px

### Screen Reader
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<table>`, `<form>`
- ARIA labels สำหรับ icon-only buttons
- `aria-label` สำหรับ inputs ที่ไม่มี visible label
- Table: proper `<thead>`, `<tbody>`, `<tfoot>` structure
- Modal: `role="dialog"`, `aria-modal="true"`, focus trap
- Loading states: `aria-busy="true"`, `role="status"` สำหรับ live regions

---

## 🚦 Design Principles (Designer's Checklist)

1. ✅ **Consistency First** — ใช้ tokens จาก design system เสมอ
2. ✅ **Mobile-First** — ออกแบบ mobile → tablet → desktop
3. ✅ **State Coverage** — ทุก component ≥ 4 states (empty, loading, error, populated)
4. ✅ **Progressive Disclosure** — สรุปก่อน รายละเอียดทีหลัง
5. ✅ **Plain Language + Tooltips** — คำไทยเข้าใจง่าย + `ⓘ` สำหรับศัพท์เทคนิค
6. ✅ **Context Everywhere** — ทุกตัวเลขต้องตอบ "แล้วไง?"
7. ✅ **Financial Number Rules** — mono font, จัดชิดขวา, tabular-nums, มีหน่วย
8. ✅ **Semantic Color** — เขียว=กำไร, แดง=ขาดทุน — ห้ามใช้สีเหล่านี้ในความหมายอื่น
9. ✅ **Accessibility** — contrast, focus, touch, screen reader
10. ✅ **Theme-Agnostic** — ทุก component ใช้ได้ทั้ง light และ dark mode

---

> **Next UX Task:** ออกแบบ screen specs สำหรับแต่ละหน้าจอ (Round 2: Dashboard Redesign)
