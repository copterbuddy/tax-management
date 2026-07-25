---
name: tax-management
description: Thai Tax Tracker — FIFO capital gains calculator for Thai investors (React 19 + TypeScript 6 + Redux Toolkit + Vite 8)
---

# 🏦 Thai Tax Tracker — Project Skill

> **Invoke:** `/tax-management`  
> **Purpose:** Teach Claude the project architecture, conventions, and how to add features correctly.

---

## 📋 Project Overview

**Thai Tax Tracker** helps Thai individual investors calculate capital gains tax on foreign stocks and cryptocurrency, following Revenue Department FIFO rules.

### Quick Facts

| Item | Detail |
|---|---|
| Framework | React 19.2 |
| Language | TypeScript 6.0 (strict) |
| Build | Vite 8.1 |
| State | Redux Toolkit 2.12 |
| Linter | Oxlint |
| Package Manager | npm |
| Entry | `src/main.tsx` → `src/App.tsx` → `Dashboard` |
| Port | Vite default (5173) |

---

## 🏗️ Architecture

```
src/
├── types/
│   └── trade.ts              ← ALL type definitions (single source of truth)
├── engine/
│   └── fifoEngine.ts          ← Pure functions: FIFO math, validation, formatting
├── store/
│   ├── index.ts               ← configureStore
│   ├── hooks.ts               ← useAppDispatch / useAppSelector
│   ├── tradeSlice.ts          ← Trade CRUD, localStorage persistence, recompute
│   └── taxSlice.ts            ← Income tax calculation (US brackets — to be replaced)
├── components/
│   ├── Dashboard.tsx          ← Main page: KPI cards + table + form orchestration
│   ├── TradeTable.tsx         ← Trade list table (sortable by date/symbol)
│   ├── TradeForm.tsx          ← Add/Edit trade modal form
│   └── KpiCard.tsx            ← Single KPI display card
├── App.tsx                    ← Root component
├── main.tsx                   ← Entry: Provider + StrictMode
├── App.css                    ← App-level styles
└── index.css                  ← Global styles (14KB)
```

### Data Flow

```
User Input (TradeForm)
  │
  ▼
dispatch(addTrade / updateTrade / deleteTrade)
  │
  ▼
tradeSlice reducer
  ├── Update trades[] in state
  ├── Save to localStorage
  └── Recompute:
        computeAllRealizedGains(trades) → gains[], remainingLots[]
        computeTaxSummary(trades, year)  → taxSummaries{}
  │
  ▼
Dashboard re-renders
  ├── KpiCard[] ← taxSummaries[selectedYear]
  └── TradeTable ← trades + gains
```

### Key Design Decisions

1. **Engine is pure** — No React/Redux imports in `fifoEngine.ts`. All functions are testable without DOM.
2. **localStorage for persistence** — Trades survive page refresh. No backend.
3. **Provider-aware FIFO** — Lots are keyed by `symbol|provider`. Selling Dime AAPL won't match Liberator AAPL lots.
4. **DIP via callbacks** — `TradeForm` doesn't import the engine directly. Validation is injected as `onValidate` prop.

---

## 🧩 Type System

```typescript
// ⚠️ Single source of truth: src/types/trade.ts

type AssetType     = 'FOREIGN_STOCK' | 'CRYPTO'
type TradeType     = 'BUY' | 'SELL'
type ProviderType  = 'Dime' | 'Liberator' | 'FinansiaSyrus'

interface TradeTransaction {
  id: string
  date: string           // YYYY-MM-DD
  symbol: string
  assetType: AssetType
  type: TradeType
  provider: ProviderType
  quantity: number
  priceUSD: number
  commissionUSD: number
  fxRateTHB: number
  notes?: string
}

interface FifoLot {
  tradeId: string
  date: string
  symbol: string
  provider: ProviderType
  unitCostTHB: number
  remainingQuantity: number
  originalQuantity: number
  fxRateTHB: number
}

interface RealizedGainResult {
  sellTradeId: string
  sellDate: string
  symbol: string
  assetType: AssetType
  provider: ProviderType
  quantity: number
  sellRevenueTHB: number
  buyCostBasisTHB: number
  realizedGainTHB: number
  matchedLots: FifoMatchDetail[]
}

interface TaxSummary {
  taxYear: number
  totalRevenueTHB: number
  totalCostBasisTHB: number
  netRealizedGainTHB: number
  totalTransactions: number
  totalBuyCount: number
  totalSellCount: number
  assetTypeBreakdown: { FOREIGN_STOCK: {...}, CRYPTO: {...} }
}
```

---

## 🔧 How To: Add a New Provider

1. **`src/types/trade.ts`** — Add to `ProviderType` union:
   ```typescript
   export type ProviderType = 'Dime' | 'Liberator' | 'FinansiaSyrus' | 'NewBroker';
   ```

2. **`src/components/TradeForm.tsx`** — Add to `PROVIDER_OPTIONS` array:
   ```typescript
   const PROVIDER_OPTIONS: ProviderType[] = ['Dime', 'Liberator', 'FinansiaSyrus', 'NewBroker'];
   ```

3. Done. No other files need changes — OCP in action.

---

## 🔧 How To: Add a New Data Field to TradeTransaction

1. **`src/types/trade.ts`** — Add field to `TradeTransaction` interface
2. **`src/store/tradeSlice.ts`** — Add migration step in `migrateTrade()` for old data
3. **`src/components/TradeForm.tsx`** — Add input in form + state + validation
4. **`src/components/TradeTable.tsx`** — Add column if it should be visible
5. **Run `npx tsc --noEmit`** — Fix type errors in any affected file

---

## 🔧 How To: Modify the FIFO Engine

1. **Read `src/engine/fifoEngine.ts`** thoroughly first — understand `lotKey()`, `processSellTrade()`, `computeAllRealizedGains()`
2. **Add/modify pure functions** — no side effects, no imports from React/Redux
3. **Follow SRP** — one function = one responsibility. Extract helpers rather than growing existing functions.
4. **Add export** if new function is needed by store or components
5. **Update `src/store/tradeSlice.ts`** if engine API changes — it calls `computeAllRealizedGains()` and `computeTaxSummary()`

---

## 🧪 Testing Approach

No test framework is installed yet. Engine functions can be tested manually:

```typescript
// In browser console or Node:
import { validateSellLots, computeAllRealizedGains } from './src/engine/fifoEngine'

const sampleTrades = [
  { id: '1', date: '2026-01-10', symbol: 'AAPL', type: 'BUY', provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 1, fxRateTHB: 35, assetType: 'FOREIGN_STOCK' },
  { id: '2', date: '2026-05-20', symbol: 'AAPL', type: 'SELL', provider: 'Dime', quantity: 5, priceUSD: 200, commissionUSD: 2, fxRateTHB: 36, assetType: 'FOREIGN_STOCK' },
]

const { gains, remainingLots } = computeAllRealizedGains(sampleTrades)
console.log(gains[0].realizedGainTHB) // Should be positive
```

---

## 🚦 Rules & Conventions

1. **Never delete type files** — `src/types/trade.ts` is the contract
2. **Engine = pure functions** — No React, no Redux, no DOM, no side effects
3. **Components = presentational** — Business logic delegated to engine and store
4. **Validation in engine** — `validateSellLots()` before `processSellTrade()`
5. **Migration in store** — `migrateTrade()` handles backward compatibility
6. **Type check before commit** — `npx tsc --noEmit` must pass
7. **Follow SOLID** — SRP, OCP, LSP, ISP, DIP are enforced in code reviews

---

## 📦 Scripts

```bash
npm run dev       # Start dev server
npm run build     # TypeScript check + Vite build
npm run preview   # Preview production build
npm run lint      # Oxlint
```
