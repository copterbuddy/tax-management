# Spec: Sell Trade Symbol Dropdown

> **Status:** Draft  
> **Created:** 2026-07-26  
> **Author:** BA  
> **Target:** `src/components/TradeForm.tsx`

---

## User Story

> As a Thai investor recording a SELL transaction, I want the Symbol field to be a dropdown showing only the stocks I currently hold (with their provider and available quantity), so that I cannot accidentally enter a symbol I do not own or sell more shares than I have.

---

## Current State Analysis

### What exists today

In `TradeForm.tsx` (lines 169-179), the Symbol field is always a plain text `<input>`:

```tsx
<input
  id="trade-symbol"
  type="text"
  placeholder="e.g. AAPL"
  {...register('symbol')}
  className={errors.symbol ? 'input-error' : ''}
/>
```

Meanwhile, the Provider dropdown (lines 199-228) already has logic that shows available quantity per provider for the typed symbol when `type === 'SELL'`. This works via the `getAvailableQty(symbol, provider)` helper (lines 134-140) which filters `remainingLots` by `symbol` + `provider`.

The problem: users can type any symbol they want (including ones they do not own), and must manually pick the correct provider. The provider dropdown shows availability only after the symbol is typed. This is backwards — the symbol should drive the provider, not the other way around.

### What data is available

- `remainingLots: FifoLot[]` — already computed in `tradeSlice` (line 183) and passed from `Dashboard` to `TradeForm` (Dashboard line 306)
- Each `FifoLot` has: `tradeId`, `date`, `symbol`, `provider`, `unitCostUSD`, `remainingQuantity`, `originalQuantity`
- The current helper `getAvailableQty(symbol, provider)` already filters `remainingLots` — we can reuse this

---

## Detailed Requirements

### R1: Conditional Symbol Field

When `type === 'SELL'`, the Symbol field must render as a `<select>` dropdown instead of a text `<input>`. When `type === 'BUY'`, it remains a text input.

The switch must be immediate — as soon as the user changes the Trade Type dropdown.

### R2: Dropdown Options

The dropdown options are derived from `remainingLots`:

1. Filter to only lots where `remainingQuantity > 0`
2. Group by unique `(symbol, provider)` pair — e.g., `AAPL@Dime` and `AAPL@Liberator` are two separate options
3. Sum `remainingQuantity` for each `(symbol, provider)` pair to get total available shares
4. Options sorted alphabetically by symbol, then by provider

Each `<option>` displays:
```
SYMBOL @ Provider — X shares available
```

Examples:
```
AAPL @ Dime — 50 shares available
AAPL @ Liberator — 200 shares available
NVDA @ Dime — 75 shares available
```

No placeholder text needed — first option is selectable.

### R3: Auto-Fill Provider on Selection

When the user selects an option from the Symbol dropdown, two fields must be set:

| Field | Set To |
|---|---|
| `symbol` | The symbol from the selected option |
| `provider` | The provider from the selected option |

Since the provider is auto-filled, the Provider dropdown should become **disabled** (grayed out) or **hidden** when `type === 'SELL'`. The recommendation is **disabled** — it is simpler and keeps the form layout stable (no layout shift when toggling type). The disabled provider field still shows the correct auto-filled value, providing visual confirmation to the user.

### R4: Provider Field Behavior

| Type | Provider Field State |
|---|---|
| BUY | Normal dropdown — user selects freely |
| SELL | Disabled (grayed-out) — value auto-filled from Symbol dropdown selection |

The "available shares" text per provider option (lines 210-215) becomes redundant when type is SELL because we are showing that information in the Symbol dropdown instead. However, since the provider dropdown is now disabled in SELL mode, the availQty rendering inside provider `<option>` tags still works harmlessly for the current-selected-value display. No change needed to that logic — just disable the `<select>`.

### R5: Type Toggle Reset

When the user switches from SELL to BUY:
- Symbol field resets to empty string
- Provider field resets to default (`'Dime'`) and becomes enabled

This prevents stale SELL-specific data from leaking into a BUY entry.

When the user switches from BUY to SELL:
- Symbol field resets to empty string
- Provider field resets to default (`'Dime'`) and becomes disabled
- User must explicitly pick from the dropdown

### R6: Empty State

If `remainingLots` contains no lots with `remainingQuantity > 0` (user has no positions at all, or all shares have been sold), the dropdown shows a single disabled option:

```
-- No shares available to sell. Add a BUY trade first. --
```

(Text must use i18n keys for EN and TH.)

---

## Acceptance Criteria

| # | Condition | Priority |
|---|---|---|
| AC1 | When Trade Type = SELL, the Symbol field renders as a `<select>` dropdown instead of a text `<input>` | Must |
| AC2 | Dropdown options are derived from `remainingLots` — only lots with `remainingQuantity > 0` | Must |
| AC3 | Each option displays "{SYMBOL} @ {Provider} — {totalRemaining} shares available" | Must |
| AC4 | Options are sorted alphabetically by symbol, then by provider | Must |
| AC5 | Selecting an option auto-fills both `symbol` and `provider` fields | Must |
| AC6 | When type = SELL, the Provider dropdown is disabled (grayed out) — value comes from Symbol dropdown | Must |
| AC7 | When type = BUY, Symbol returns to text input and Provider returns to enabled dropdown | Must |
| AC8 | Switching type from SELL to BUY resets symbol to empty and provider to default | Must |
| AC9 | When `remainingLots` is empty or all lots have `remainingQuantity === 0`, the dropdown shows a single disabled "no shares available" message (in both EN and TH) | Must |
| AC10 | Editing an existing SELL trade shows the trade's current symbol+provider as the selected option, even if that specific position has since been fully sold | Must |
| AC11 | `tsc --noEmit` passes with zero errors | Must |
| AC12 | Existing BUY flow is not affected — no regressions | Must |

---

## Edge Cases

### EC1: Editing a historical SELL trade after all shares sold

**Scenario:** User recorded a SELL of 10 AAPL@Dime. Later, the remaining AAPL@Dime quantity became 0 (all sold). User opens the edit form for that SELL trade.

**Expected:** The dropdown must show the trade's symbol+provider as an option, even if that pair no longer exists in `remainingLots`. The option should display something like:

```
AAPL @ Dime — 0 shares (sold out)
```

**Implementation:** When `trade` prop is present (edit mode) and `trade.type === 'SELL'`, always include the trade's own `(symbol, provider)` pair in the dropdown options if it is not already in the filtered list. Mark it visually as "sold out" rather than "X shares available."

### EC2: Empty remainingLots

**Scenario:** User has only recorded BUY trades and all have been fully sold, or has no trades at all. User creates a new SELL.

**Expected:** Dropdown shows disabled option: (EN) `-- No shares available to sell. Add a BUY trade first. --` / (TH) `-- ไมมีหุนใหขาย กรุณาเพิ่มรายการซื้อก่อน --`

### EC3: Same symbol, multiple providers

**Scenario:** User bought AAPL on Dime (100 shares) and AAPL on Liberator (50 shares). Remaining: 50 Dime, 50 Liberator.

**Expected:** Two separate options:
```
AAPL @ Dime — 50 shares available
AAPL @ Liberator — 50 shares available
```

### EC4: Switching type SELL -> BUY -> SELL (rapid toggle)

**Scenario:** User picks SELL, sees dropdown, switches to BUY, then back to SELL.

**Expected:** Each toggle resets symbol to empty. Dropdown re-renders with current `remainingLots`. No stale data.

### EC5: Partial sell resulting in remainingQuantity = 0 for some lots but not others

**Scenario:** User has 10 AAPL@Dime and 20 AAPL@Liberator. Sells 10 AAPL@Dime.

**Expected:** `remainingLots` now has `AAPL@Dime` with `remainingQuantity = 0`. The dropdown MUST NOT include this pair (unless editing that specific sell trade — see EC1).

### EC6: Zod validation still applies

The Symbol dropdown value is a string (`"AAPL"`) and must still pass the existing zod schema: `.min(1).max(VALIDATION.SYMBOL_MAX_LENGTH)`. Since options are derived from actual symbol names that already passed this validation on BUY entry, no additional validation is needed. However, for the EC1 "sold out" fallback option, the symbol string still comes from the existing trade, so it also passes.

---

## Technical Implementation Notes

### Files to Modify

| File | Change |
|---|---|
| `src/components/TradeForm.tsx` | Main change — conditional Symbol field, disabled Provider, reset logic |
| `src/i18n/locales/en/trade.json` | 2 new keys |
| `src/i18n/locales/th/trade.json` | 2 new keys |

### No Changes Needed

- `src/types/trade.ts` — no new types needed; existing `FifoLot` is sufficient
- `src/engine/fifoEngine.ts` — no change; `remainingLots` already computed
- `src/store/tradeSlice.ts` — no change; `remainingLots` already in state
- `src/validation/schemas.ts` — no change; zod schema already valid
- `src/constants.ts` — no change needed
- `src/components/Dashboard.tsx` — already passes `remainingLots` to TradeForm

### Implementation Approach

#### Step 1: Compute `sellableOptions`

Add a `useMemo` that derives dropdown options from `remainingLots`:

```typescript
interface SellableOption {
  symbol: string;
  provider: ProviderType;
  totalRemaining: number;
}

const sellableOptions = useMemo<SellableOption[]>(() => {
  // Group remainingLots by (symbol, provider), sum remainingQuantity, filter > 0
  const map = new Map<string, SellableOption>();
  for (const lot of remainingLots) {
    const key = `${lot.symbol}|${lot.provider}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalRemaining += lot.remainingQuantity;
    } else {
      map.set(key, {
        symbol: lot.symbol,
        provider: lot.provider,
        totalRemaining: lot.remainingQuantity,
      });
    }
  }
  const options = Array.from(map.values())
    .filter(o => o.totalRemaining > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider));
  return options;
}, [remainingLots]);
```

#### Step 2: Handle Edit Mode (EC1)

When editing an existing SELL trade (`trade` prop is present and `trade.type === 'SELL'`), ensure the trade's own `(symbol, provider)` pair is in the options:

```typescript
const allSellableOptions = useMemo(() => {
  const options = [...sellableOptions];
  if (trade && trade.type === 'SELL') {
    const exists = options.some(o => o.symbol === trade.symbol && o.provider === trade.provider);
    if (!exists) {
      options.unshift({
        symbol: trade.symbol,
        provider: trade.provider as ProviderType,
        totalRemaining: 0,
      });
    }
  }
  return options;
}, [sellableOptions, trade]);
```

#### Step 3: Conditional Symbol Field Rendering

Replace the existing text input (lines 169-179) with a conditional block:

```tsx
{watchedType === 'SELL' ? (
  // Dropdown mode
  <Controller
    name="symbol"
    control={control}
    render={({ field }) => (
      allSellableOptions.length === 0 ? (
        <select disabled className="select-empty">
          <option>{t('trade:sellSymbolEmpty')}</option>
        </select>
      ) : (
        <select
          id="trade-symbol"
          value={field.value}
          onChange={(e) => {
            const selected = allSellableOptions.find(o => o.symbol === e.target.value);
            if (selected) {
              field.onChange(selected.symbol);
              // Auto-fill provider
              setValue('provider', selected.provider);
            }
          }}
          className={errors.symbol ? 'input-error' : ''}
        >
          {allSellableOptions.map(opt => (
            <option key={`${opt.symbol}|${opt.provider}`} value={opt.symbol}>
              {opt.symbol} @ {opt.provider} — {opt.totalRemaining} {t('trade:sharesAvailable')}
            </option>
          ))}
        </select>
      )
    )}
  />
) : (
  // Text input mode (BUY)
  <input
    id="trade-symbol"
    type="text"
    placeholder="e.g. AAPL"
    {...register('symbol')}
    className={errors.symbol ? 'input-error' : ''}
  />
)}
```

**Important nuance:** Since multiple options can map to the same `symbol` value (e.g., AAPL@Dime and AAPL@Liberator both have `value="AAPL"`), the `<select>` needs a way to differentiate. The recommended approach is to use a composite value like `"AAPL|Dime"` and parse it in the `onChange`.

**Revised approach — use a composite value key:**

```tsx
const optionValue = `${opt.symbol}|${opt.provider}`;
```

Then in `onChange`, split the value to extract symbol and provider.

The form's internal `symbol` field still stores just the symbol string (e.g., `"AAPL"`) — the split happens only in the dropdown's `onChange` handler. The dropdown's HTML `value` attribute uses the composite key only for DOM identification; the `field.value` used to select the active option is matched against the `opt.symbol`.

**Best approach — use `Controller` with a valueKey:**

Since multiple `<option>` elements can have the same `value` attribute in HTML (browsers handle it but it is semantically ambiguous), use a composite `key|symbol|provider` as the value:

```tsx
const optionValue = `sell|${opt.symbol}|${opt.provider}`;
```

On change, parse: `const [, symbol, provider] = e.target.value.split('|');`

#### Step 4: Disable Provider for SELL

Add `disabled={watchedType === 'SELL'}` to the Provider `<select>` element (around line 205).

The Provider `Controller` also needs a `useEffect` or `watch`-based mechanism so that when Symbol dropdown sets the provider, the watched provider updates reactively. Since we are calling `setValue('provider', ...)`, the form state updates correctly.

But — the user must not be able to change provider when type is SELL. The `disabled` attribute achieves this.

#### Step 5: Type Toggle Reset

Add a `useEffect` that watches `watchedType` and resets symbol/provider when switching types:

```typescript
useEffect(() => {
  if (watchedType !== previousType) {
    if (watchedType === 'BUY') {
      // Switching to BUY: reset symbol, reset provider to default
      setValue('symbol', '');
      setValue('provider', 'Dime');
    } else if (watchedType === 'SELL') {
      // Switching to SELL: reset symbol (user must pick from dropdown)
      setValue('symbol', '');
      setValue('provider', 'Dime');
    }
    previousType = watchedType;
  }
}, [watchedType]);
```

Use a `useRef` for `previousType` to avoid unnecessary resets on initial render.

**Refinement — do not reset when editing:** If `trade` prop is present (edit mode), the initial type is the trade's type. The reset should only fire when the user actively changes the type dropdown. Track this with a ref:

```typescript
const previousTypeRef = useRef(watchedType);

useEffect(() => {
  if (watchedType !== previousTypeRef.current) {
    // User changed type — reset dependent fields
    setValue('symbol', '');
    setValue('provider', 'Dime');
    previousTypeRef.current = watchedType;
  }
}, [watchedType, setValue]);
```

Wait — there is a subtle issue: when the form first renders in edit mode with `type='SELL'`, `previousTypeRef` starts as `'SELL'` and the effect does not fire. Good. But on first render for a new trade with `type='BUY'`, same thing — no spurious reset. Good.

But when user changes from BUY to SELL, it fires and resets symbol+provider. When user changes from SELL to BUY, it fires and resets. This is the desired behavior.

#### Step 6: Ensure provider dropdown disabled state

The Provider dropdown currently renders provider options with availability text (lines 206-219). When disabled, it should still show the current value. No text change needed — just the `disabled` attribute:

```tsx
<select id="trade-provider" {...field} disabled={watchedType === 'SELL'}>
```

The existing error message for zero available lots (lines 223-227) should still display — it serves as an extra validation layer if somehow a user manages to submit with insufficient lots.

#### Step 7: CSS Styling

- Add a `.select-empty` class for the disabled "no shares" state (optional — browser default is acceptable)
- The disabled Provider dropdown inherits browser default disabled styling — acceptable

### i18n Keys to Add

**`src/i18n/locales/en/trade.json`:**

```json
{
  "sellSymbolEmpty": "-- No shares available to sell. Add a BUY trade first. --",
  "sharesAvailable": "shares available",
  "sharesSoldOut": "sold out"
}
```

**`src/i18n/locales/th/trade.json`:**

```json
{
  "sellSymbolEmpty": "-- ไมมีหุนใหขาย กรุณาเพิ่มรายการซื้อก่อน --",
  "sharesAvailable": "หุนที่เหลือ",
  "sharesSoldOut": "ขายหมดแล้ว"
}
```

### React Hook Form Considerations

- The Symbol field in SELL mode uses `Controller` (like the Type and Provider fields already do)
- `setValue` from `useForm` is used for the auto-fill behavior — it is already destructured; confirm it is in the `useForm` destructuring. Currently (line 56-63), only `register`, `handleSubmit`, `control`, `reset`, `watch`, `setError`, and `formState` are destructured. **Need to add `setValue` to the destructuring.**

---

## Verification Checklist

After implementation, verify:

- [ ] New SELL: Select type=SELL → Symbol becomes dropdown
- [ ] New SELL: Only owned symbols appear in dropdown
- [ ] New SELL: Each option shows "SYMBOL @ Provider — X shares available"
- [ ] New SELL: Selecting an option fills both symbol and provider
- [ ] New SELL: Provider dropdown is disabled
- [ ] New SELL: Submit works correctly with selected values
- [ ] New BUY: Symbol is text input, Provider is enabled dropdown
- [ ] Toggle SELL→BUY: Symbol resets to empty, Provider enables
- [ ] Edit existing SELL (shares still available): Shows current symbol+provider in dropdown
- [ ] Edit existing SELL (shares sold out): Shows current symbol+provider as "sold out"
- [ ] Empty remainingLots: Dropdown shows disabled empty message
- [ ] tsc --noEmit: Zero errors
- [ ] All existing tests/functionality: No regressions

---

## Out of Scope

- Changes to FIFO calculation engine
- Changes to validation logic (existing quantity validation against available lots remains unchanged)
- Changes to BUY form behavior
- Changes to TradeTable, Dashboard, or any other component
- Changes to Redux store or slice logic

---

## Summary

| Item | Detail |
|---|---|
| Files Modified | 3 (`TradeForm.tsx`, `en/trade.json`, `th/trade.json`) |
| New Types | 0 (reuse existing) |
| New i18n Keys | 3 per locale |
| Risk | Low — isolated to TradeForm, no engine/store changes |
| Regression Risk | Low — BUY path unchanged, SELL validation unchanged |
