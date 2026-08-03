---
name: tax-management
description: Thai Tax Tracker — Remittance-based FIFO capital gains calculator for Thai investors (React 19 + TypeScript 6 + Redux Toolkit + Vite 8)
---

# 🏦 Thai Tax Tracker — Project Skill

> **Invoke:** `/tax-management`  
> **Purpose:** Teach Claude the project architecture, conventions, and how to add features correctly.  
> **Last updated:** 2026-07-30 (TASK-026: Foreign Dividend Tracking — Types, Engine, Store, UI)

---

## 📋 Project Overview

**Thai Tax Tracker** helps Thai individual investors calculate capital gains tax on foreign stocks, following Revenue Department FIFO rules and **remittance-based taxation** (คำสั่งกรมสรรพากร ป.161/2566).

### Quick Facts

| Item | Detail |
|---|---|
| Framework | React 19.2 |
| Language | TypeScript 6.0 (strict) |
| Build | Vite 8.1 |
| State | Redux Toolkit 2.12 |
| i18n | `i18next` + `react-i18next` — namespaced JSON (EN/TH), localStorage persistence |
| Validation | `zod` — runtime schema validation for localStorage + form inputs |
| Forms | `react-hook-form` + `@hookform/resolvers` — type-safe, less boilerplate |
| Error Handling | `react-error-boundary` — graceful fallback UI on render errors |
| Linter | Oxlint |
| Package Manager | npm |
| Entry | `src/main.tsx` → `AppErrorBoundary` → `ThemeProvider` → `Provider` → `App` → `Dashboard` |

### Features

| Feature | Detail |
|---|---|
| Trade Tracking | BUY/SELL foreign stocks with provider (Dime/Liberator/FinansiaSyrus) |
| FIFO Engine | USD-based — lots matched by `symbol\|provider`, no cross-provider matching |
| Dividend Tracking | Record foreign dividend payments with WHT tracking, country config, remittance-based income |
| Remittance Tax | Taxable only when funds brought into Thailand (remittance-based) |
| Remittance Log | Dedicated tab with history, year filter, totals |
| Gain% Method | Only gain portion taxable; cost basis return is tax-free |
| Progress Bar | Visual indicator of remitted portion per trade |
| Loss Rules | Losses cannot offset gains (มาตรา 40(4)(g)) |
| Multi-Language | EN/TH with i18next — namespaced JSON, no inline `lang === 'th'` conditions |
| Theme | Light/Dark mode with CSS custom properties + localStorage persistence |
| UI Components | Tooltip (ⓘ), ConfirmDialog, KPI Cards (5 variants), responsive table→cards, ErrorBoundary |
| Data | localStorage persistence (trades + gains/remittances + dividends) — validated with Zod on load |
| 5-Year Limit | New trades limited to last 5 calendar years |
| Thai Tax | Progressive 0-35% brackets, ฿160k default deduction |

---

## 🏗️ Architecture

```
src/
├── types/
│   └── trade.ts              ← ALL type definitions (single source of truth)
├── engine/
│   ├── fifoEngine.ts          ← Pure functions: USD FIFO, remittance tax, validation
│   └── dividendEngine.ts      ← Pure functions: dividend THB calc, WHT credit, remittance, summary
├── i18n/
│   ├── index.ts               ← i18next setup + language detection + persistence
│   └── locales/
│       ├── th/ {common,trade,remittance,dividend}.json
│       └── en/ {common,trade,remittance,dividend}.json
├── validation/
│   └── schemas.ts             ← Zod schemas + safeParse for localStorage validation
├── context/
│   └── ThemeContext.tsx        ← Theme provider + useTheme hook (light/dark)
├── constants.ts               ← Centralized: STORAGE_KEYS, PROVIDER_OPTIONS, DATE_LIMITS, VALIDATION, THAI_TAX, COUNTRY_WHT_INFO, STORAGE_KEYS_DIVIDEND
├── store/
│   ├── index.ts               ← configureStore (trade + tax + dividend reducers)
│   ├── hooks.ts               ← useAppDispatch / useAppSelector
│   ├── tradeSlice.ts          ← Trade CRUD + remittance actions + gains persistence (zod-validated)
│   ├── dividendSlice.ts       ← Dividend CRUD + remittance + persistence (zod-validated)
│   └── taxSlice.ts            ← Thai progressive tax calculator (0-35%)
├── components/
│   ├── Dashboard.tsx          ← Main page: KPI + tabs + modals (i18next, no inline lang)
│   ├── TradeTable.tsx         ← Trade list (USD, progress bar, responsive cards, i18next)
│   ├── TradeForm.tsx          ← Add/Edit trade (react-hook-form + zodResolver, i18next)
│   ├── RemitForm.tsx          ← Record remittance (react-hook-form + zodResolver, i18next)
│   ├── RemittanceLog.tsx      ← Remittance history table + year filter (i18next)
│   ├── DividendTab.tsx        ← Dividend list: KPI cards + table + remittance history (i18next)
│   ├── DividendForm.tsx       ← Add/Edit dividend (react-hook-form pattern, i18next)
│   ├── DividendRemitForm.tsx  ← Record dividend remittance (i18next)
│   ├── KpiCard.tsx            ← Reusable KPI display card
│   ├── Tooltip.tsx            ← Info tooltip (click/ESC/click-outside)
│   ├── ConfirmDialog.tsx      ← Confirmation dialog (danger variant, ESC close)
│   └── ErrorBoundary.tsx      ← App-level error boundary with fallback UI
├── App.tsx                    ← Root component
├── main.tsx                   ← Entry: ErrorBoundary > ThemeProvider > Provider > StrictMode
├── App.css / index.css        ← Design system tokens (light + dark mode) + error boundary styles
└── assets/                    ← Static images
```

### Data Flow

```
User Input
  ├── TradeForm → dispatch(addTrade / updateTrade / deleteTrade)
  │     │
  │     ▼
  │   tradeSlice reducer
  │     ├── Save trades to localStorage
  │     ├── computeAllRealizedGains(trades) → gains[] in USD
  │     ├── Merge remittance history from existing gains
  │     ├── computeTaxSummary(trades, year, gains) → taxSummaries{}
  │     └── Save gains to localStorage (separate key)
  │
  ├── RemitForm → dispatch(addRemittance)
  │     │
  │     ▼
  │   tradeSlice reducer
  │     ├── applyRemittance(gain, remittance) → gain% × amount × FX = taxable THB
  │     ├── Recompute taxSummaries
  │     └── Save gains to localStorage
  │
  ▼
Dashboard re-renders
  ├── KPI: Taxable Gain (THB), Total Remitted (USD), Net Gain (USD), Not Yet Remitted (USD)
  └── TradeTable: USD columns + Remitted status + Taxable THB
```

### Key Design Decisions

1. **Engine is pure** — No React/Redux imports. All functions testable without DOM.
2. **USD-first** — FIFO computed in USD. THB conversion only at remittance.
3. **Remittance-based tax** — Per Thai law: taxable only when funds arrive in Thailand, using remittance-date FX.
4. **Gain% method** — `remitUSD × gainPercent × remitFX = taxableTHB`. Cost basis return is tax-free.
5. **Provider-aware FIFO** — Lots keyed by `symbol|provider`. No cross-provider matching.
6. **Losses not deductible** — Negative gains excluded from taxable income (มาตรา 40(4)(g)).
7. **DIP via callbacks** — `TradeForm` validation injected as `onValidate` prop.
8. **Gains persisted separately** — Remittance history survives trade edits via `localStorage` key `tax_tracker_gains`.
9. **i18next namespaced** — Translation keys in `common:`, `trade:`, `remittance:` namespaces — no `lang === 'th'` conditions.
10. **Zod runtime validation** — localStorage data validated on load; invalid/corrupt data → fallback to `[]`.
11. **react-hook-form + zod** — Form state managed declaratively; validation via `zodResolver`.
12. **Error Boundary** — Catches render errors, shows fallback UI — app doesn't white-screen.
13. **Constants centralized** — `src/constants.ts` is single source for storage keys, providers, validation limits, tax constants.
14. **Thai Tax Brackets** — Progressive 0-35%, personal allowance ฿60k + expense deduction ฿100k = ฿160k default.
15. **Dividend Engine** — Separate pure engine for dividend THB calc, WHT credit, remittance, summary — no impact on FIFO.
16. **Dividend Store** — Separate slice + localStorage key `tax_tracker_dividends`.
17. **Country WHT Config** — `COUNTRY_WHT_INFO` in constants.ts — extensible (add country by adding entry).
18. **Dividend Tax Year = Remittance Year** — Consistent with capital gains; remittance-date FX for reportable income + WHT credit.

---

## 🧩 Type System

```typescript
// ⚠️ Single source of truth: src/types/trade.ts

type TradeType     = 'BUY' | 'SELL'
type ProviderType  = 'Dime' | 'Liberator' | 'FinansiaSyrus'

interface TradeTransaction {
  id: string
  date: string           // YYYY-MM-DD
  symbol: string
  type: TradeType
  provider: ProviderType
  quantity: number
  priceUSD: number       // Unit price in USD
  commissionUSD: number  // Total commission in USD
  exchangeFeeUSD: number // Exchange/market fee in USD
  tafFeeUSD: number      // TAF (Trading Activity Fee) in USD — SELL only
  commissionRebateUSD: number // Commission rebate/promotional discount in USD
  vatUSD: number         // VAT (Value Added Tax) in USD
  notes?: string
  // Note: NO fxRateTHB — FX only at remittance
}

interface RemittanceRecord {
  id: string
  sellTradeId: string
  amountUSD: number      // Amount remitted
  remitDate: string      // Date funds arrived in Thailand
  fxRateTHB: number      // Exchange rate on remittance date
  notes?: string
}

interface FifoLot {
  tradeId: string
  date: string
  symbol: string
  provider: ProviderType
  unitCostUSD: number    // Cost per unit in USD
  remainingQuantity: number
  originalQuantity: number
}

interface RealizedGainResult {
  sellTradeId: string
  sellDate: string
  symbol: string
  provider: ProviderType
  sellQuantity: number
  sellRevenueUSD: number        // Total USD revenue
  buyCostBasisUSD: number       // Total USD cost
  gainUSD: number               // Revenue - Cost
  gainPercent: number           // gainUSD / sellRevenueUSD (0-1)
  matchedLots: FifoMatchDetail[]
  // Remittance tracking:
  totalRemittedUSD: number
  remainingProceedsUSD: number
  remittances: RemittanceRecord[]
  taxableGainTHB: number        // Sum of (remitUSD × gain% × remitFX)
}

interface TaxSummary {
  taxYear: number
  totalRevenueUSD: number
  totalCostBasisUSD: number
  netGainUSD: number
  totalRemittedUSD: number
  taxableGainUSD: number        // Gain portion of remittances
  taxableGainTHB: number        // Converted at remittance FX rates
  excludedLossesUSD: number
  totalTransactions: number
  totalBuyCount: number
  totalSellCount: number
  totalRemittanceCount: number
}
```

---

## 🔧 Engine API (`src/engine/fifoEngine.ts`)

| Function | Purpose |
|---|---|
| `calculateBuyCostUSD(trade)` | `(qty × price + commission)` — USD cost |
| `calculateSellRevenueUSD(trade)` | `(qty × price - commission)` — USD revenue |
| `calculateUnitCostUSD(trade)` | Cost per unit in USD |
| `validateSellLots(sell, lots)` | Check sufficient lots for symbol+provider |
| `processSellTrade(sell, lots)` | FIFO matching in USD → `RealizedGainResult` |
| `computeAllRealizedGains(trades)` | Batch process all trades → `{gains, remainingLots}` |
| `applyRemittance(gain, remit)` | Apply remittance → gain% × FX → taxable THB |
| `computeTaxableGainsTHB(gains)` | Separate taxable vs excluded losses |
| `computeTaxSummary(trades, year, gains)` | Aggregate summary filtered by remittance year |
| `formatGainIndicator(gainTHB)` | Human-readable ±฿XXX.XX string |

---

## 🔧 Store API (`src/store/tradeSlice.ts`)

| Action | Purpose |
|---|---|
| `addTrade(trade)` | Add new trade → recompute + save |
| `updateTrade(trade)` | Edit trade → recompute + save |
| `deleteTrade(id)` | Delete trade → recompute + save |
| `addRemittance(remit)` | Record remittance → `applyRemittance()` + recompute |
| `importTrades(trades)` | Bulk import (replaces all) |
| `clearAllTrades()` | Wipe all data |
| `setSelectedTaxYear(year)` | Filter trade table by sell year |
| `setDisplayTaxYear(year)` | Filter KPI by remittance year |

**Persistence:** `localStorage` — trades (key: `tax_tracker_trades`), gains+remittances (key: `tax_tracker_gains`). Data validated with zod on load — invalid/corrupt data → fallback `[]`.

## 🔧 Store API (`src/store/taxSlice.ts`)

| Action | Purpose |
|---|---|
| `setAnnualIncome(amount)` | Set annual income (บาท) |
| `setDeductions(amount)` | Set deductions (default: ฿160,000) |
| `calculateTax()` | Compute Thai progressive tax (0-35%) |
| `saveCalculation()` | Save calculation to history |
| `deleteHistoryItem(id)` | Remove one history entry |
| `clearHistory()` | Clear all history |

---

## 🔧 How To: Add a New Provider

1. `src/types/trade.ts` — Add to `ProviderType` union
2. `src/constants.ts` — Add to `PROVIDER_OPTIONS` array
3. Done. TradeForm + zod schema auto-pick it up.

## 🔧 How To: Add a New Data Field

1. `src/types/trade.ts` — Add field to interface
2. `src/validation/schemas.ts` — Add field to zod schema
3. `src/store/tradeSlice.ts` — Add migration in `migrateTrade()`
4. `src/components/TradeForm.tsx` — Add field to `tradeFormSchema` + JSX input
5. `src/components/TradeTable.tsx` — Add column if visible
6. `npx tsc --noEmit` — Must pass

## 🔧 How To: Add a New Translation Key

1. Add key to relevant namespace JSON: `common.json`, `trade.json`, or `remittance.json` (both `th/` and `en/`)
2. Use in component: `const { t } = useTranslation(); t('namespace:key')`
3. No `lang === 'th' ? ... : ...` — use `t()` for all user-facing text

## 🔧 How To: Add a New Validation Rule

1. `src/validation/schemas.ts` — Add to relevant zod schema (`.min()`, `.max()`, `.refine()`, etc.)
2. `src/constants.ts` — Add constant if value is reusable (in `VALIDATION` object)
3. Existing forms auto-apply new rules via `zodResolver`

## 🔧 How To: Add a New Language

1. `src/i18n/locales/<lang>/` — Create `common.json`, `trade.json`, `remittance.json`
2. `src/i18n/index.ts` — Add to `resources`, update `SupportedLang` type
3. Done — language switcher auto-detects new locale

## 🔧 How To: Modify FIFO Engine

1. Read `fifoEngine.ts` — understand `lotKey()`, `processSellTrade()`, `computeAllRealizedGains()`, `applyRemittance()`
2. Add/modify **pure functions** — no side effects, no React/Redux
3. Follow SRP — one function = one responsibility
4. Update `tradeSlice.ts` if API changes

## 🔧 How To: Add Remittance Feature Extension

1. Remittance logic lives in `applyRemittance()` — gain% method
2. UI: `RemitForm.tsx` — select sell trade, amount, date, FX rate
3. Store: `addRemittance` action persists gains separately
4. Tax year = remittance year (filtered in `computeTaxSummary`)

---

## 🧪 Testing

No test framework (TASK-005 pending). Manual testing:

```typescript
// Engine functions (pure — testable in Node/console):
import { computeAllRealizedGains, applyRemittance } from './src/engine/fifoEngine'

const trades = [
  { id:'b1', date:'2026-01-10', symbol:'AAPL', type:'BUY', provider:'Dime', quantity:10, priceUSD:150, commissionUSD:1 },
  { id:'s1', date:'2026-06-15', symbol:'AAPL', type:'SELL', provider:'Dime', quantity:10, priceUSD:200, commissionUSD:2 },
]

const { gains } = computeAllRealizedGains(trades)
// gains[0].gainUSD = 497, gains[0].gainPercent = 0.2487...

const remit = { id:'r1', sellTradeId:'s1', amountUSD:500, remitDate:'2026-07-01', fxRateTHB:36.5 }
const updated = applyRemittance(gains[0], remit)
// updated.taxableGainTHB = 500 × 0.2487 × 36.5 ≈ 4,541
```

---

## 🚦 Rules & Conventions

1. **Types = contract** — `src/types/trade.ts` is single source of truth
2. **Engine = pure functions** — No React, no Redux, no DOM, no side effects
3. **USD-first** — All calculations in USD until remittance conversion
4. **FX only at remittance** — `fxRateTHB` exists ONLY in `RemittanceRecord`
5. **Remittance year = tax year** — Per Thai Revenue Code
6. **Gain% method** — Only gain portion of remittance is taxable
7. **Losses not deductible** — `computeTaxableGainsTHB()` filters them out
8. **Validation in engine** — `validateSellLots()` before `processSellTrade()`
9. **Migration in store** — `migrateTrade()` + `filterCrypto()` handle backward compat
10. **Type check before commit** — `npx tsc --noEmit` must pass
11. **Follow SOLID** — SRP, OCP, LSP, ISP, DIP
12. **Post-Task Checklist** — Dev must verify skills.md is up-to-date after every task
13. **i18n via `t()`** — NEVER use `lang === 'th' ? '...' : '...'` — always use `t('namespace:key')`
14. **Constants in `constants.ts`** — No magic strings for storage keys, providers, validation limits
15. **Forms via react-hook-form** — No manual `useState` for form fields; use `register()` + `zodResolver`
16. **Data validated on load** — localStorage → JSON.parse → zod schema → fallback `[]` on failure
17. **Thai tax only** — `taxSlice.ts` uses Thai progressive brackets (0-35%), ฿160k default deduction

---

## 📦 Scripts

```bash
npm run dev       # Start dev server
npm run build     # TypeScript check + Vite build
npm run preview   # Preview production build
npm run lint      # Oxlint
```
