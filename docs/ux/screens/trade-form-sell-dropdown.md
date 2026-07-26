# 📐 Screen: TradeForm — Sell Symbol Dropdown

> **Created:** 2026-07-26 | **Updated:** 2026-07-26
> **UX Agent:** ux-design-sell-dropdown
> **Related Tasks:** TASK-SELL-DROPDOWN (Sell Trade Symbol Dropdown)

---

## 🗺️ User Flow Context

- **มาจากหน้า:** Dashboard (ปุ่ม "+ เพิ่มรายการ" หรือ click row ใน TradeTable)
- **ไปต่อหน้า:** Dashboard (หลังจาก submit หรือ cancel)
- **User Goal:** เมื่อผู้ใช้เลือก Trade Type = SELL — เลือก Symbol จาก dropdown ที่แสดงเฉพาะหุ้นที่ถืออยู่ พร้อมจำนวนที่ขายได้ และ Provider จะถูก auto-fill โดยอัตโนมัติ
- **Context:** ฟีเจอร์นี้แก้ไขเฉพาะภายใน TradeForm Modal — ไม่มีหน้าจอใหม่

---

## 📱 Layout — Desktop (≥1024px)

### SELL Mode (Symbol = dropdown, Provider = disabled auto-fill)

```
┌──────────────────────────────────────────────────────────┐
│  ✏️ แก้ไขรายการซื้อขาย                              [×]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Row 1: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ Date            │ │ Symbol                  │  │
│         │ [2026-06-20   ] │ │ [AAPL @ Dime — 50 shar…▼│  │
│         └─────────────────┘ └─────────────────────────┘  │
│                                                          │
│  Row 2: ┌─────────────────┐                              │
│         │ Trade Type      │                              │
│         │ [SELL         ▼]│                              │
│         └─────────────────┘                              │
│                                                          │
│  Row 3: ┌──────────────────────────────────────────────┐ │
│         │ Provider                      [🔒 auto-fill] │ │
│         │ [Dime (disabled, grayed)                  ▼] │ │
│         │ ⓘ Auto-filled from Symbol selection          │ │
│         └──────────────────────────────────────────────┘ │
│                                                          │
│  Row 4: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ Quantity        │ │ Price (USD)             │  │
│         │ [10           ] │ │ [200.00                ]│  │
│         └─────────────────┘ └─────────────────────────┘  │
│                                                          │
│  Row 5: ┌─────────────────┐                              │
│         │ Commission (USD)│                              │
│         │ [2.00         ] │                              │
│         └─────────────────┘                              │
│                                                          │
│  Row 6: ┌──────────────────────────────────────────────┐ │
│         │ Notes (optional)                             │ │
│         │ [                                           ]│ │
│         └──────────────────────────────────────────────┘ │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                              [ยกเลิก]  [💾 บันทึก]        │
└──────────────────────────────────────────────────────────┘
```

### BUY Mode (Symbol = text input, Provider = enabled dropdown — unchanged from original)

```
┌──────────────────────────────────────────────────────────┐
│  ➕ เพิ่มรายการซื้อขาย                                [×]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Row 1: ┌─────────────────┐ ┌─────────────────────────┐  │
│         │ Date            │ │ Symbol                  │  │
│         │ [2026-07-26   ] │ │ [e.g. AAPL            ] │  │
│         └─────────────────┘ └─────────────────────────┘  │
│                                                          │
│  Row 2: ┌─────────────────┐                              │
│         │ Trade Type      │                              │
│         │ [BUY          ▼]│                              │
│         └─────────────────┘                              │
│                                                          │
│  Row 3: ┌─────────────────┐                              │
│         │ Provider        │                              │
│         │ [Dime         ▼]│  ← enabled, user selects     │
│         └─────────────────┘                              │
│                                                          │
│  ... (same as above for remaining fields) ...            │
└──────────────────────────────────────────────────────────┘
```

### Layout Stability Requirement

The key design principle: **form layout MUST NOT jump or shift** when toggling between BUY and SELL. This requires:

1. **Same grid structure** — Row 1 always has Date + Symbol (2 columns), Row 3 always has Provider
2. **Same field dimensions** — Symbol `<select>` and Symbol `<input>` occupy the exact same width and height
3. **Provider always visible** — Never hidden, only disabled. If hidden, the 2-column row layout would collapse
4. **No row insertion/removal** — No new rows appear or disappear on type change

---

## 🧩 Components

### Component: SellSymbolDropdown

| Property | Value |
|---|---|
| **Location** | TradeForm Row 1, right column — replaces text `<input id="trade-symbol">` |
| **When visible** | `watchedType === 'SELL'` |
| **Element type** | `<select>` dropdown |
| **Dimensions** | Height: 42px (matches `--input-height`), Width: 100% of form column |
| **Typography** | `--font-sans`, `--text-base` (15px) for selected value; `--font-mono` for quantity numbers inside options |
| **Background** | `--color-input-bg` |
| **Border** | 1px `--color-input-border`, radius `--radius-sm` (6px) |
| **Focus** | border-color `--color-primary`, box-shadow `0 0 0 3px var(--color-primary-bg)` |
| **Error state** | border-color `--color-danger` + error message below |

#### Option Format

Each `<option>` tag displays:

```
<SYMBOL> @ <Provider> — <X> shares available
```

| Part | Font | Style |
|---|---|---|
| `SYMBOL` | `--font-mono` | `--color-text-primary`, font-weight 600 |
| `@ Provider` | `--font-sans` | `--color-text-secondary` |
| `— X shares available` | `--font-mono` for number, `--font-sans` for label | `--color-text-secondary`, font-weight 500 |

**Example options rendered:**

```
AAPL @ Dime — 50 shares available
AAPL @ Liberator — 200 shares available
NVDA @ Dime — 75 shares available
```

**Option value (composite key):**

To handle the case where the same symbol appears with multiple providers, each `<option>` uses a composite value:

```
value = "sell|<SYMBOL>|<Provider>"
```

Example: `"sell|AAPL|Dime"`, `"sell|AAPL|Liberator"`

The selected value in the form state is still just the symbol string (`"AAPL"`). The composite value is only used by the DOM for disambiguation and parsed in the `onChange` handler.

**Options sorted:** Alphabetically by symbol, then by provider.

#### Option Selection Behavior

When user selects an option:

| Field | Action |
|---|---|
| `symbol` | Set to the symbol from the selected option (via `Controller.field.onChange`) |
| `provider` | Set to the provider from the selected option (via `setValue('provider', selected.provider)`) |

### Component: DisabledProvider

| Property | Value |
|---|---|
| **Location** | TradeForm Row 3 — existing Provider `<select>` |
| **When disabled** | `watchedType === 'SELL'` |
| **Element type** | `<select disabled>` |
| **Visual state** | Grayed-out background + reduced opacity text |

**Disabled styling:**

```css
select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--color-border-light); /* slightly darker than normal bg */
  border-color: var(--color-border-light);
}
```

**Auto-fill indicator:**

A small text label or tooltip adjacent to (or below) the Provider field to inform the user the value is auto-filled:

```
ⓘ Auto-filled from Symbol selection
```

This appears only when `watchedType === 'SELL'` AND a symbol has been selected (i.e., `watchedSymbol` is not empty).

If no symbol is selected yet, show:

```
ⓘ Select a Symbol above first
```

**Position:** Below the Provider `<select>`, `--text-xs`, `--color-text-tertiary`, margin-top `--space-1`.

### Component: TypeToggle (Trade Type dropdown)

| Property | Value |
|---|---|
| **Location** | TradeForm Row 2 — unchanged position |
| **Element type** | `<select>` (unchanged) |
| **Reset behavior** | When user changes type, symbol and provider reset |

**Reset logic:**

| From → To | Symbol | Provider |
|---|---|---|
| BUY → SELL | Reset to `""` (empty) | Reset to `"Dime"` (default), then disabled |
| SELL → BUY | Reset to `""` (empty) | Reset to `"Dime"` (default), then enabled |
| Same type (no change) | No reset | No reset |
| Edit mode (initial render) | Keep trade's original values | Keep trade's original values |

**Important:** The reset fires only when the user actively changes the type dropdown. When the form opens in edit mode with `type='SELL'`, the existing symbol and provider values are pre-filled and NOT reset on initial render.

---

## 🎭 States

### State 1: Normal (Populated) — Dropdown has options

**When:** `remainingLots` has at least one lot with `remainingQuantity > 0`

**Display:** Dropdown renders with all sellable options. First option is not selected by default — user must choose.

```
Symbol:
┌────────────────────────────────────┐
│ AAPL @ Dime — 50 shares available ▾│
├────────────────────────────────────┤
│ AAPL @ Dime — 50 shares available  │
│ AAPL @ Liberator — 200 shares ava… │
│ NVDA @ Dime — 75 shares available  │
└────────────────────────────────────┘
```

**Behavior:** After selection, Provider auto-fills and disables. The selected option's text is shown in the closed dropdown.

### State 2: Empty — No sellable lots

**When:** `remainingLots` is empty OR all lots have `remainingQuantity === 0` (no remaining positions)

**Display:** Single disabled option with message text:

```
Symbol:
┌────────────────────────────────────────────────────────┐
│ -- No shares available to sell. Add a BUY trade first. —▾│
└────────────────────────────────────────────────────────┘
```

**Language variants:**

| Lang | Text |
|---|---|
| EN | `-- No shares available to sell. Add a BUY trade first. --` |
| TH | `-- ไม่มีหุ้นให้ขาย กรุณาเพิ่มรายการซื้อก่อน --` |

**Style:** `--color-text-tertiary`, italic, the `<select>` itself is disabled (`disabled` attribute). No other options shown.

**Provider field:** Also disabled. Shows default provider (Dime) grayed out. The auto-fill hint shows "No sellable positions available."

### State 3: Edit Mode — Existing SELL trade

**When:** `trade` prop is present AND `trade.type === 'SELL'`

**Sub-state 3a: Position still has remaining shares (normal edit)**

The dropdown shows all sellable options, with the trade's own `(symbol, provider)` pair pre-selected.

```
Symbol:
┌────────────────────────────────────┐
│ AAPL @ Dime — 50 shares available ▾│  ← pre-selected (matches trade)
└────────────────────────────────────┘
```

Provider shows the trade's original provider, disabled, with auto-fill indicator.

**Sub-state 3b: Position fully sold out (EC1 edge case)**

**When:** The trade's `(symbol, provider)` pair no longer exists in `remainingLots` (all shares of that specific position have been sold in subsequent SELL trades).

The dropdown must still show the trade's pair as an option, visually distinct:

```
Symbol:
┌──────────────────────────────────────────┐
│ AAPL @ Dime — 0 shares (sold out)       ▾│
├──────────────────────────────────────────┤
│ AAPL @ Dime — 0 shares (sold out)         │  ← the trade's pair, always first
│ AAPL @ Liberator — 200 shares available   │
└──────────────────────────────────────────┘
```

**Sold-out option styling:**

| Element | Style |
|---|---|
| Option background | No special background (standard option row) |
| `SYMBOL @ Provider` | `--color-text-secondary` (no longer primary) |
| `— 0 shares` | `--font-mono`, `--color-text-tertiary` |
| `(sold out)` label | `--text-xs`, `--color-danger` (red, to indicate unavailable) |

**Behavior:** The sold-out option is always placed first in the dropdown (via `unshift`). It is selectable — for viewing/editing historical trade data only. The submit button should still allow submission (the user is editing an existing trade, not creating a new one). Validation of quantity against available lots is a separate check already handled by the existing `onValidate` callback.

**Sold-out text per language:**

| Lang | Text |
|---|---|
| EN | `0 shares (sold out)` |
| TH | `0 หุ้น (ขายหมดแล้ว)` |

### State 4: Error — Validation error on Symbol

**When:** Symbol field value is empty (user tried to submit without selecting) OR zod validation fails.

**Display:** Same error pattern as all other TradeForm fields:

```
Symbol:
┌────────────────────────────────────┐
│ [dropdown with red border]        ▾│  ← border-color: --color-danger
└────────────────────────────────────┘
⚠️ Symbol is required                  ← --text-xs, --color-danger, margin-top 4px
```

**Error styling:** Follows existing TradeForm field error pattern — same as current `input-error` class expanded to also match `<select>` elements.

### State 5: Disabled Provider with no Symbol selected yet

**When:** `watchedType === 'SELL'` but `watchedSymbol` is empty (user has not yet picked from Symbol dropdown)

**Provider field:**

```
Provider:                       ⓘ Select a Symbol above first
┌────────────────────────────────────┐
│ Dime (disabled, grayed)           ▾│
└────────────────────────────────────┘
```

### State 6: Disabled Provider with Symbol selected

**When:** `watchedType === 'SELL'` AND `watchedSymbol` is not empty

**Provider field:**

```
Provider:                       ⓘ Auto-filled from Symbol selection
┌────────────────────────────────────┐
│ Dime (disabled, grayed, shows auto-filled value) ▾│
└────────────────────────────────────┘
```

---

## 📱 Responsive

The TradeForm modal already has responsive behavior defined in the design system and the existing component. The sell dropdown changes are within the form — no additional responsive considerations needed beyond those already defined:

| Breakpoint | TradeForm Modal Behavior |
|---|---|
| Desktop (≥1024px) | Modal 540px wide, 2-column form rows, centered |
| Tablet L (768-1023px) | Modal 540px wide, 2-column form rows |
| Tablet (640-767px) | Modal 90vw, 2-column form rows |
| Mobile (<640px) | Modal 100vw × 100vh (full screen), 1-column form rows |

**Symbol dropdown on mobile:** Same as other `<select>` elements — full width in single-column layout. Touch target ≥ 44px (standard for all form controls per accessibility rules).

**Provider disabled field on mobile:** Same styling as desktop — grayed out, disabled, with hint text below.

---

## 🎯 Interaction Notes

1. **Dropdown open:** Standard browser `<select>` behavior — clicking the dropdown opens the native option list. No custom dropdown needed.

2. **Provider auto-fill is instant:** Selecting a Symbol option immediately sets the Provider value. No delay or animation. The Provider field reflects the change instantly (React re-render).

3. **Type toggle is instant but resets:** When user changes Type from BUY to SELL (or vice versa), Symbol resets to empty and Provider resets to `"Dime"`. The field type swap (input ↔ select) happens in the same render — no flicker.

4. **No layout shift:** The key interaction contract — switching type from BUY to SELL must NOT cause:
   - The form to change height beyond standard re-render
   - Fields to jump position
   - Scroll position to change
   - Any visible layout shift

   This is achieved by keeping the same grid structure and same field dimensions.

5. **Form validation interaction:** The existing quantity validation against `remainingLots` still runs. If user selects AAPL@Dime (50 shares) but enters quantity 100, the error appears on the Quantity field (unchanged behavior).

6. **Submit button disabled state:** The existing logic already disables submit when `currentAvailableQty === 0` for the selected provider. This remains unchanged. However, in Edit Mode with a sold-out position, the submit should remain enabled (user is editing/viewing historical data).

7. **Provider dropdown interaction when disabled:**
   - Cannot be focused via Tab navigation (standard `disabled` behavior)
   - Clicking does nothing
   - Visual: cursor is `not-allowed`
   - The auto-fill hint is for visual confirmation only, not interactive

---

## 🎨 Design Tokens Used

| Token | Where | Usage |
|---|---|---|
| `--color-input-bg` | Symbol `<select>`, Provider `<select>` | Background of dropdown fields |
| `--color-input-border` | Symbol `<select>`, Provider `<select>` | Default border |
| `--color-border-light` | Provider `<select>` when disabled | Disabled background tint |
| `--color-primary` | Symbol `<select>` on focus | Focus ring border |
| `--color-primary-bg` | Focus ring | `box-shadow` glow |
| `--color-danger` | Error border, sold-out label, error text | Validation error state |
| `--color-text-primary` | Symbol name in option text | Primary text |
| `--color-text-secondary` | Provider name, "shares available" in options | Secondary text |
| `--color-text-tertiary` | Empty state message, auto-fill hint text, sold-out qty | Muted/disabled text |
| `--font-sans` | All labels, provider names, hints | Body font |
| `--font-mono` | Symbol ticker in options, quantity numbers | Monospace for financial data |
| `--text-xs` | Auto-fill hint, sold-out label, error messages | Small text |
| `--text-base` | Selected option text, option text | Body text size |
| `--radius-sm` | Both `<select>` elements | Border radius (6px) |
| `--space-1` | Gap between Provider field and auto-fill hint | Tight spacing (4px) |
| `--space-4` | Between form rows | Standard gap (16px) |
| `--duration-fast` | Focus ring transition, border color change on error | Quick transition (150ms) |

---

## ♿ Accessibility Notes

1. **Label association:** The `<label htmlFor="trade-symbol">` must still work — the `<select>` replaces the `<input>` but keeps the same `id="trade-symbol"`.

2. **Disabled select:** The browser announces `disabled` state to screen readers. The auto-fill hint (`ⓘ` prefix) should have `aria-label` describing the state.

3. **Empty state message:** The disabled `<option>` for empty state should use `aria-disabled="true"`.

4. **Focus order:** Tab flow is Date → Symbol → Type → Provider (skip if disabled) → Quantity → Price → Commission → Notes → Submit. When Provider is disabled, Tab should skip it — standard `<select disabled>` behavior.

5. **Contrast ratios:**
   - Symbol text (`--color-text-primary` on `--color-input-bg`) = adequate
   - Disabled Provider text (opacity 0.6 on `--color-border-light`) — lower contrast is acceptable for disabled elements per WCAG (no contrast requirement for disabled/inactive UI)
   - Error text (`--color-danger` on form background) = adequate
   - Auto-fill hint (`--color-text-tertiary`) — informational non-critical text, not required to meet 4.5:1

6. **Keyboard interaction:**
   - Tab to Symbol dropdown → Space/Enter to open → Arrow keys to navigate → Enter to select (standard browser `<select>` behavior)
   - Changing selection auto-fills Provider — no additional keyboard interaction needed
   - Provider is disabled → skipped in Tab order

7. **Screen reader announcement:** When Provider is auto-filled, use an `aria-live="polite"` region or `role="status"` to announce the change, e.g., "Provider set to Dime automatically."

---

## 🔗 Related Files

| File | Relationship |
|---|---|
| `docs/specs/sell-symbol-dropdown.md` | BA spec this design is based on |
| `docs/ux/design-system.md` | Design tokens and component patterns |
| `docs/ux/screens/dashboard.md` | Parent screen — TradeForm modal context |
| `src/components/TradeForm.tsx` | Component to modify |
| `src/i18n/locales/en/trade.json` | EN translation keys |
| `src/i18n/locales/th/trade.json` | TH translation keys |

---

## 📐 Implementation Checklist (for Dev reference)

- [ ] Symbol field conditionally renders as `<select>` when `watchedType === 'SELL'`
- [ ] `sellableOptions` computed from `remainingLots` (group by symbol+provider, filter `remainingQuantity > 0`)
- [ ] Each option uses composite value `"sell|<SYMBOL>|<Provider>"` for disambiguation
- [ ] `onChange` handler parses composite value and calls `setValue('provider', ...)` for auto-fill
- [ ] Edit mode: trade's own pair included even if sold out (EC1)
- [ ] Sold-out option shown as `"SYMBOL @ Provider — 0 shares (sold out)"` with distinct styling
- [ ] Provider `<select>` has `disabled={watchedType === 'SELL'}`
- [ ] Auto-fill hint text shown below Provider when SELL mode
- [ ] Type toggle: useRef to detect user-initiated changes, reset symbol + provider
- [ ] Form layout does not shift on type change (same grid, same field sizes)
- [ ] Empty state: single disabled option with message text (both EN/TH)
- [ ] i18n keys added: `sellSymbolEmpty`, `sharesAvailable`, `sharesSoldOut`
- [ ] Error state: red border + error message for Symbol field (same pattern as other fields)
- [ ] `tsc --noEmit` passes
- [ ] Existing BUY flow unaffected (no regressions)
